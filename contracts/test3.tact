import "@stdlib/deploy";
import "@stdlib/ownable";

// ================================================================= //
// ========================= STRUCTS & MESSAGES ==================== //
// ================================================================= //

// --- Core Data Structures ---

struct StakeInfo {
    stakeId: Int as uint16;
    amount: Int as coins;
    startTime: Int as uint32;
    duration: Int as uint32;
    vipClass: Int as uint8;
    autoRestake: Bool;
    lastClaim: Int as uint32;
    totalClaimed: Int as coins;
    isActive: Bool;
    stakedAsset: Int as uint8;
}

struct User {
    referrer: Address?;
    level: Int as uint8;
    vipClass: Int as uint8;
    directReferrals: Int as uint16;
    totalReferrals: Int as uint32;
    otherReferrals: Int as uint32;
    lastCheckIn: Int as uint32;
    levelExpiration: Int as uint32;
    totalEarned: Int as coins;
    isActive: Bool;
    registrationTime: Int as uint32;
    stakeCounter: Int as uint16;
    stakes: map<Int, StakeInfo>;
    downlines: map<Int, Address>;
    spilloverIndex: Int as uint16;
}

struct VipConfig {
    dailyRoi: Int as uint16;
    minLevel: Int as uint8;
    maxLevel: Int as uint8;
    stakingRoi: Int as uint16;
}

struct PlatformStats {
    totalUsers: Int as uint32;
    totalStakedTon: Int as coins;
    totalStakedUsdt: Int as coins;
    totalDistributed: Int as coins;
    activeStakes: Int as uint32;
}

// --- Incoming User Action Messages ---

message UpgradeLevel {
    targetLevel: Int as uint8;
    referrerAddress: Address?;
}

message CheckIn {}

message StakeTON {
    duration: Int as uint32;
    autoRestake: Bool;
    referrerAddress: Address?;
}

message ClaimStakingRewards {
    stakeId: Int as uint16;
}

message UpdateAutoRestake {
    stakeId: Int as uint16;
    autoRestake: Bool;
}

// --- Incoming Jetton Messages ---

struct StakeUsdtPayload {
    duration: Int as uint32;
    autoRestake: Bool;
    referrerAddress: Address?;
}

message(0x7362d09c) JettonTransferNotification {
    queryId: Int as uint64;
    amount: Int as coins;
    sender: Address;
    forwardPayload: Slice as remaining;
}

message(0x0f8a7ea5) JettonTransfer {
    queryId: Int as uint64;
    amount: Int as coins;
    destination: Address;
    response_destination: Address;
    custom_payload: Cell?;
    forward_ton_amount: Int as coins;
    forward_payload: Slice as remaining;
}

// --- Incoming Distributor Message ---
message DistributeDailyRewards {
    user: Address;
    stakeId: Int as uint16;
}

// --- Incoming Owner Action Messages ---
message UpdateLevelCost {
    level: Int as uint8;
    cost: Int as coins;
}

message SetUsdtJettonWallet {
    wallet: Address;
}

// New owner message for distributor management
message SetDistributor {
    address: Address;
}

// ================================================================= //
// ========================= CONTRACT: TonCrown ==================== //
// ================================================================= //

contract TonCrown with Deployable, OwnableTransferable {

    // --- State Variables ---
    owner: Address;
    creatorWallet1: Address;
    creatorWallet2: Address;
    creatorWallet3: Address;
    creatorWallet4: Address;
    usdtJettonWalletAddress: Address;
    distributorAddress: Address;

    users: map<Address, User>;
    levelCosts: map<Int, Int>;
    vipConfigs: map<Int, VipConfig>;

    totalUsers: Int as uint32;
    totalStakedTon: Int as coins;
    totalStakedUsdt: Int as coins;
    totalDistributed: Int as coins;
    activeStakes: Int as uint32;
    isPaused: Bool;

    userList: map<Int, Address>;
    spilloverRecipientIndex: Int as uint32;
    spilloverCycle: Int as uint64;
    userLastCycle: map<Address, Int as uint64>;

    // --- Constants ---
    const DAILY_CHECKIN_REWARD: Int = ton("0.01");
    const LEVEL1_DURATION: Int = 2592000;
    const MIN_STAKE_DURATION: Int = 14; 
    const MAX_STAKE_DURATION: Int = 730;
    const MAX_DIRECT_REFERRALS: Int = 6;
    const SECONDS_PER_DAY: Int = 86400;
    const ASSET_TON: Int = 0;
    const ASSET_USDT: Int = 1;
    const DISTRIBUTION_GAS_FEE: Int = ton("0.05");

    init(owner: Address) {
        self.owner = owner;
        self.creatorWallet1 = address("0QAzL_NTGF3Z1mgNIV6jf1qxEdXgxd67Zf6i7ZDm70Xqa7Ts");
        self.creatorWallet2 = address("0QAtYOHIpbdZL0_04aXSg5aZLT0LaQNOrl858DlUoKyqcMcm");
        self.creatorWallet3 = address("0QCtNZf0MCqmy558C2zgtzK7i69gg0ttOBWmZ-88ScJp4_Cz");
        self.creatorWallet4 = address("0QDMixPIWRosGle-BviB1ByuQbhOS2DLYzL6GWjg6NwvbdSR");

        self.usdtJettonWalletAddress = owner; 
        self.distributorAddress = owner;

        self.totalUsers = 0;
        self.totalStakedTon = 0;
        self.totalStakedUsdt = 0;
        self.totalDistributed = 0;
        self.activeStakes = 0;
        self.isPaused = false;

        self.spilloverRecipientIndex = 0;
        self.spilloverCycle = 1;
        self.userLastCycle = emptyMap();

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

        self.vipConfigs.set(1, VipConfig{ dailyRoi: 100, minLevel: 4, maxLevel: 6, stakingRoi: 95 });
        self.vipConfigs.set(2, VipConfig{ dailyRoi: 150, minLevel: 7, maxLevel: 8, stakingRoi: 145 });
        self.vipConfigs.set(3, VipConfig{ dailyRoi: 200, minLevel: 9, maxLevel: 10, stakingRoi: 195 });
        self.vipConfigs.set(4, VipConfig{ dailyRoi: 250, minLevel: 10, maxLevel: 10, stakingRoi: 250 });
    }

    // ----------------------------------------------------------------- //
    // ------------------------ RECEIVER FUNCTIONS ----------------------- //
    // ----------------------------------------------------------------- //

    receive(msg: UpgradeLevel) {
        self.requireNotPaused();
        let sender: Address = sender();

        let originalReferrer: Address? = msg.referrerAddress;
        let currentUser: User = self.getOrRegisterUser(sender, originalReferrer);

        require(msg.targetLevel == currentUser.level + 1, "Must upgrade sequentially");
        let levelCost: Int = self.levelCosts.get(msg.targetLevel)!!;
        require(context().value >= levelCost, "Insufficient payment");

        let oldLevel: Int = currentUser.level;
        currentUser.level = msg.targetLevel;
        currentUser.vipClass = self.calculateVipClass(msg.targetLevel);
        currentUser.isActive = true;
        if (msg.targetLevel == 1) {
            currentUser.levelExpiration = now() + self.LEVEL1_DURATION;
        }
        self.users.set(sender, currentUser);

        self.distributeFunds(levelCost, sender, oldLevel + 1, originalReferrer);
        self.reply("Level upgrade successful".asComment());
    }

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

        require(currentUser.level > 0 && currentUser.isActive, "Must have an active level to check in");

        currentUser.lastCheckIn = currentTime;
        let reward: Int = self.DAILY_CHECKIN_REWARD;
        
        currentUser.totalEarned = currentUser.totalEarned + reward;
        self.users.set(sender, currentUser);
        self.totalDistributed = self.totalDistributed + reward;

        send(SendParameters{
            to: sender,
            value: reward,
            mode: SendIgnoreErrors,
            body: "Daily Check-in Reward".asComment()
        });

        self.reply("Check-in successful. Your reward has been sent to your wallet.".asComment());
    }

    receive(msg: StakeTON) {
        self.requireNotPaused();
        let sender: Address = sender();
        let user: User = self.getOrRegisterUser(sender, msg.referrerAddress);

        require(user.vipClass > 0, "VIP status required for staking");
        require(msg.duration >= self.MIN_STAKE_DURATION && msg.duration <= self.MAX_STAKE_DURATION, "Invalid staking duration");
        
        let stakeAmount: Int = context().value - ton("0.1");
        require(stakeAmount > 0, "Insufficient value for staking");

        // Check minimum stake in raw TON
        let minStakeTon: Int = self.getMinStakeTon(user.vipClass);
        require(stakeAmount >= minStakeTon, "Stake amount is below the minimum for your VIP level");

        let stakeId: Int = user.stakeCounter;
        let newStake: StakeInfo = StakeInfo{
            stakeId: stakeId,
            amount: stakeAmount,
            startTime: now(),
            duration: msg.duration * self.SECONDS_PER_DAY,
            vipClass: user.vipClass,
            autoRestake: msg.autoRestake,
            lastClaim: now(),
            totalClaimed: 0,
            isActive: true,
            stakedAsset: self.ASSET_TON
        };

        user.stakes.set(stakeId, newStake);
        user.stakeCounter += 1;
        self.users.set(sender, user);

        self.totalStakedTon += stakeAmount;
        self.activeStakes += 1;

        send(SendParameters{ to: self.creatorWallet3, value: stakeAmount, mode: SendIgnoreErrors, body: "TON Staking Capital".asComment() });
        self.reply("Staking successful".asComment());
    }
    
    receive(msg: JettonTransferNotification) {
        self.requireNotPaused();
        require(sender() == self.usdtJettonWalletAddress, "Notification from unknown jetton wallet");

        let stakerAddress: Address = msg.sender;
        let usdtReceived: Int = msg.amount;
        
        let payloadSlice: Slice = msg.forwardPayload;
        let payload: StakeUsdtPayload = StakeUsdtPayload{
            duration: payloadSlice.loadUint(32),
            autoRestake: payloadSlice.loadBool(),
            referrerAddress: payloadSlice.loadAddress()
        };

        let user: User = self.getOrRegisterUser(stakerAddress, payload.referrerAddress);
        require(user.vipClass > 0, "VIP status required for staking");
        require(payload.duration >= self.MIN_STAKE_DURATION && payload.duration <= self.MAX_STAKE_DURATION, "Invalid staking duration");

        let minStakeUsd6: Int = self.getMinStakeInUsd6Decimals(user.vipClass);
        require(usdtReceived >= minStakeUsd6, "Stake amount is below the minimum for your VIP level");
        
        let stakeId: Int = user.stakeCounter;
        let newStake: StakeInfo = StakeInfo{
            stakeId: stakeId,
            amount: usdtReceived,
            startTime: now(),
            duration: payload.duration * self.SECONDS_PER_DAY,
            vipClass: user.vipClass,
            autoRestake: payload.autoRestake,
            lastClaim: now(),
            totalClaimed: 0,
            isActive: true,
            stakedAsset: self.ASSET_USDT
        };

        user.stakes.set(stakeId, newStake);
        user.stakeCounter += 1;
        self.users.set(stakerAddress, user);
        
        self.totalStakedUsdt += usdtReceived;
        self.activeStakes += 1;

        send(SendParameters{
            to: self.usdtJettonWalletAddress, value: ton("0.1"), mode: SendIgnoreErrors,
            body: JettonTransfer{
                queryId: 0, amount: usdtReceived, destination: self.creatorWallet3,
                response_destination: self.owner, custom_payload: null, forward_ton_amount: ton("0.05"),
                forward_payload: "USDT Staking Capital".asComment().asSlice()
            }.toCell()
        });
    }

    receive(msg: ClaimStakingRewards) {
        self.requireNotPaused();
        let sender: Address = sender();
        let user: User = self.requireUserExists(sender);
        let stake: StakeInfo? = user.stakes.get(msg.stakeId);
        require(stake != null, "No such stake found");

        let currentStake: StakeInfo = stake!!;
        require(currentStake.isActive, "Stake is not active");

        let currentTime: Int = now();
        let daysSinceLastClaim: Int = (currentTime - currentStake.lastClaim) / self.SECONDS_PER_DAY;
        require(daysSinceLastClaim > 0, "No rewards to claim yet");

        let vipConfig: VipConfig = self.vipConfigs.get(currentStake.vipClass)!!;
        let dailyReward: Int = currentStake.amount * vipConfig.stakingRoi / 10000;
        let totalReward: Int = dailyReward * daysSinceLastClaim;

        if (currentTime >= currentStake.startTime + currentStake.duration) {
            if (currentStake.autoRestake) {
                currentStake.startTime = currentTime;
                currentStake.lastClaim = currentTime;
            } else {
                if (currentStake.stakedAsset == self.ASSET_TON) {
                    send(SendParameters{ to: sender, value: currentStake.amount, mode: SendIgnoreErrors, body: "Staking Capital Refund".asComment() });
                    self.totalStakedTon -= currentStake.amount;
                } else { 
                    send(SendParameters{
                        to: self.usdtJettonWalletAddress, value: ton("0.1"), mode: SendIgnoreErrors,
                        body: JettonTransfer{
                            queryId: 0, amount: currentStake.amount, destination: sender,
                            response_destination: sender, custom_payload: null, forward_ton_amount: ton("0.05"),
                            forward_payload: "Staking Capital Refund".asComment().asSlice()
                        }.toCell()
                    });
                    self.totalStakedUsdt -= currentStake.amount;
                }
                currentStake.isActive = false;
                self.activeStakes -= 1;
            }
        } else {
            currentStake.lastClaim = currentTime;
        }

        currentStake.totalClaimed += totalReward;
        user.stakes.set(msg.stakeId, currentStake);
        self.users.set(sender, user);
        
        send(SendParameters{ to: sender, value: totalReward, mode: SendIgnoreErrors, body: "Staking Rewards".asComment() });
        self.totalDistributed += totalReward;
    }
    
    receive(msg: UpdateAutoRestake) {
        self.requireNotPaused();
        let sender: Address = sender();
        let user: User = self.requireUserExists(sender);
        let stake: StakeInfo? = user.stakes.get(msg.stakeId);
        require(stake != null && stake!!.isActive, "No active stake");

        let mutableStake: StakeInfo = stake!!;
        mutableStake.autoRestake = msg.autoRestake;
        user.stakes.set(msg.stakeId, mutableStake);
        self.users.set(sender, user);

        self.reply("Auto-restake preference updated".asComment());
    }

    receive(msg: UpdateLevelCost) {
        self.requireOwner();
        self.levelCosts.set(msg.level, msg.cost);
    }

    receive(msg: SetUsdtJettonWallet) {
        self.requireOwner();
        self.usdtJettonWalletAddress = msg.wallet;
    }

    // ----------------------------------------------------------------- //
    // ----------------------- INTERNAL FUNCTIONS ------------------------ //
    // ----------------------------------------------------------------- //

    fun requireNotPaused() {
        require(!self.isPaused, "Contract is paused");
    }

    fun requireUserExists(user: Address): User {
        let userData: User? = self.users.get(user);
        require(userData != null, "User not registered. Please upgrade a level or stake first.");
        return userData!!;
    }

    fun calculateVipClass(level: Int): Int {
        if (level >= 4 && level <= 6) { return 1; }
        else if (level >= 7 && level <= 8) { return 2; }
        else if (level >= 9) { return 3; }
        return 0;
    }

    fun getMinStakeTon(vipClass: Int): Int {
        if (vipClass == 1) { return ton("2"); }     // e.g., 2 TON
        if (vipClass == 2) { return ton("10"); }    // e.g., 10 TON
        if (vipClass >= 3) { return ton("50"); }    // e.g., 50 TON
        require(false, "Invalid VIP Class");
        return 0;
    }

    fun getMinStakeInUsd6Decimals(vipClass: Int): Int {
        if (vipClass == 1) { return 10 * 1000000; }   // $10
        if (vipClass == 2) { return 50 * 1000000; }   // $50
        if (vipClass >= 3) { return 300 * 1000000; } // $300
        require(false, "Invalid VIP Class");
        return 0; 
    }
    
    fun getOrRegisterUser(userAddress: Address, referrerAddress: Address?): User {
        let userData: User? = self.users.get(userAddress);
        if (userData != null) {
            return userData!!;
        }

        let now: Int = now();
        let newUser: User = User{
            referrer: referrerAddress,
            level: 0,
            vipClass: 0,
            directReferrals: 0,
            totalReferrals: 0,
            otherReferrals: 0,
            lastCheckIn: 0,
            levelExpiration: 0,
            totalEarned: 0,
            isActive: true,
            registrationTime: now,
            stakeCounter: 0,
            stakes: emptyMap(),
            downlines: emptyMap(),
            spilloverIndex: 0
        };

        self.userList.set(self.totalUsers, userAddress);
        self.users.set(userAddress, newUser);
        self.totalUsers = self.totalUsers + 1;

        if (referrerAddress != null) {
            self.processReferralRegistration(userAddress, referrerAddress!!);
        }

        return newUser;
    }

    fun processReferralRegistration(newUser: Address, referrer: Address) {
        let referrerUserOpt: User? = self.users.get(referrer);
        if (referrerUserOpt == null || !referrerUserOpt!!.isActive) {
            let user: User = self.users.get(newUser)!!;
            user.referrer = self.creatorWallet3;
            self.users.set(newUser, user);
            return;
        }

        let referrerUser: User = referrerUserOpt!!;

        if (referrerUser.directReferrals < self.MAX_DIRECT_REFERRALS) {
            referrerUser.directReferrals += 1;
            referrerUser.totalReferrals += 1;
            referrerUser.downlines.set(referrerUser.directReferrals, newUser);
            self.users.set(referrer, referrerUser);

            let newUserStruct: User = self.users.get(newUser)!!;
            newUserStruct.referrer = referrer;
            self.users.set(newUser, newUserStruct);
        } else {
            self.findAndAssignSpillover(referrer, newUser);
        }
    }

    fun findAndAssignSpillover(originalReferrer: Address, newUser: Address) {
        let originalReferrerUser: User = self.users.get(originalReferrer)!!;
        let numDirectDownlines: Int = originalReferrerUser.directReferrals;

        if (numDirectDownlines > 0) {
            let i: Int = 0;
            while (i < numDirectDownlines) {
                let downlineNum: Int = (originalReferrerUser.spilloverIndex + i) % numDirectDownlines + 1;
                let downlineAddress: Address = originalReferrerUser.downlines.get(downlineNum)!!;
                let downlineUser: User = self.users.get(downlineAddress)!!;

                if (downlineUser.directReferrals < self.MAX_DIRECT_REFERRALS) {
                    downlineUser.directReferrals += 1;
                    downlineUser.totalReferrals += 1;
                    downlineUser.downlines.set(downlineUser.directReferrals, newUser);
                    self.users.set(downlineAddress, downlineUser);

                    let newUserStruct: User = self.users.get(newUser)!!;
                    newUserStruct.referrer = downlineAddress;
                    self.users.set(newUser, newUserStruct);

                    originalReferrerUser.otherReferrals += 1;
                    originalReferrerUser.spilloverIndex = downlineNum;
                    self.users.set(originalReferrer, originalReferrerUser);
                    return;
                }
                i += 1;
            }
        }

        let queue: map<Int, Address> = emptyMap();
        let visited: map<Address, Bool> = emptyMap();
        let queueHead: Int = 0;
        let queueTail: Int = 0;

        let i: Int = 1;
        while (i <= originalReferrerUser.directReferrals) {
            let downlineAddress: Address = originalReferrerUser.downlines.get(i)!!;
            queue.set(queueTail, downlineAddress);
            visited.set(downlineAddress, true);
            queueTail += 1;
            i += 1;
        }

        while (queueHead < queueTail) {
            let currentAddress: Address = queue.get(queueHead)!!;
            queueHead += 1;

            let currentUser: User = self.users.get(currentAddress)!!;
            if (currentUser.directReferrals < self.MAX_DIRECT_REFERRALS) {
                currentUser.directReferrals += 1;
                currentUser.totalReferrals += 1;
                currentUser.downlines.set(currentUser.directReferrals, newUser);
                self.users.set(currentAddress, currentUser);

                let newUserStruct: User = self.users.get(newUser)!!;
                newUserStruct.referrer = currentAddress;
                self.users.set(newUser, newUserStruct);

                originalReferrerUser.otherReferrals += 1;
                self.users.set(originalReferrer, originalReferrerUser);
                return;
            }

            let j: Int = 1;
            while (j <= currentUser.directReferrals) {
                let nextDownlineAddress: Address = currentUser.downlines.get(j)!!;
                if (visited.get(nextDownlineAddress) == null) {
                    visited.set(nextDownlineAddress, true);
                    queue.set(queueTail, nextDownlineAddress);
                    queueTail += 1;
                }
                j += 1;
            }
        }

        let newUserStruct: User = self.users.get(newUser)!!;
        newUserStruct.referrer = self.creatorWallet3;
        self.users.set(newUser, newUserStruct);
    }

    fun distributeFunds(amount: Int, payer: Address, level: Int, originalReferrer: Address?) {
        let user: User = self.users.get(payer)!!;
        let actualReferrer: Address? = user.referrer;

        let creator1Share: Int = (level == 1) ? amount * 10 / 100 : amount * 20 / 100;
        let creator2Share: Int = (level == 1) ? amount * 10 / 100 : amount * 20 / 100;
        let creator3Share: Int = amount * 10 / 100;
        let referralUplineShare: Int = (level == 1) ? amount * 50 / 100 : amount * 30 / 100;
        let spilloverShare: Int = amount * 20 / 100;
        let unallocatedFunds: Int = amount - creator1Share - creator2Share - creator3Share;

        send(SendParameters{ to: self.creatorWallet1, value: creator1Share, mode: SendIgnoreErrors });
        send(SendParameters{ to: self.creatorWallet2, value: creator2Share, mode: SendIgnoreErrors });
        send(SendParameters{ to: self.creatorWallet3, value: creator3Share, mode: SendIgnoreErrors });

        if (level == 1) {
            if (originalReferrer != null && actualReferrer != null && originalReferrer != actualReferrer) {
                let splitShare: Int = referralUplineShare / 2;
                send(SendParameters{ to: originalReferrer!!, value: splitShare, mode: SendIgnoreErrors });
                send(SendParameters{ to: actualReferrer!!, value: splitShare, mode: SendIgnoreErrors });
            } else if (actualReferrer != null) {
                send(SendParameters{ to: actualReferrer!!, value: referralUplineShare, mode: SendIgnoreErrors });
            }
            unallocatedFunds -= referralUplineShare;
        } else {
            let isSpillover: Bool = originalReferrer != null && actualReferrer != null && originalReferrer != actualReferrer;

            if (isSpillover) {
                let splitShare: Int = referralUplineShare / 2;

                let originalReferrerUser: User = self.users.get(originalReferrer!!)!!;
                if (originalReferrerUser.level >= level) {
                    send(SendParameters{ to: originalReferrer!!, value: splitShare, mode: SendIgnoreErrors });
                } else {
                    send(SendParameters{ to: self.creatorWallet3, value: splitShare, mode: SendIgnoreErrors });
                }

                let actualReferrerUser: User = self.users.get(actualReferrer!!)!!;
                if (actualReferrerUser.level >= level) {
                    send(SendParameters{ to: actualReferrer!!, value: splitShare, mode: SendIgnoreErrors });
                } else {
                    send(SendParameters{ to: self.creatorWallet3, value: splitShare, mode: SendIgnoreErrors });
                }

            } else {
                if (actualReferrer != null && self.users.get(actualReferrer!!)!!.level >= level) {
                    send(SendParameters{ to: actualReferrer!!, value: referralUplineShare, mode: SendIgnoreErrors });
                } else {
                    send(SendParameters{ to: self.creatorWallet3, value: referralUplineShare, mode: SendIgnoreErrors });
                }
            }
            unallocatedFunds -= referralUplineShare;
        }

        if (spilloverShare > 0) {
            let recipientFound: Bool = false;

            if (self.totalUsers > 0) {
                let i: Int = 0;
                while (i < self.totalUsers && !recipientFound) {
                    let currentIndex: Int = (self.spilloverRecipientIndex + i) % self.totalUsers;
                    let potentialRecipientAddress: Address = self.userList.get(currentIndex)!!;
                    let potentialRecipient: User = self.users.get(potentialRecipientAddress)!!;

                    if (potentialRecipient.level >= level) {
                        let lastCycleOpt: Int? = self.userLastCycle.get(potentialRecipientAddress);
                        let lastCycle: Int = 0;
                        if (lastCycleOpt != null) {
                            lastCycle = lastCycleOpt!!;
                        }

                        if (lastCycle < self.spilloverCycle) {
                            send(SendParameters{ to: potentialRecipientAddress, value: spilloverShare, mode: SendIgnoreErrors, body: "Spillover Reward".asComment() });

                            self.userLastCycle.set(potentialRecipientAddress, self.spilloverCycle);
                            self.spilloverRecipientIndex = (currentIndex + 1) % self.totalUsers;
                            recipientFound = true;
                        }
                    }
                    i += 1;
                }
            }

            if (!recipientFound && self.totalUsers > 0) {
                self.spilloverCycle += 1;
                let i: Int = 0;
                while (i < self.totalUsers && !recipientFound) {
                    let currentIndex: Int = (self.spilloverRecipientIndex + i) % self.totalUsers;
                    let potentialRecipientAddress: Address = self.userList.get(currentIndex)!!;
                    let potentialRecipient: User = self.users.get(potentialRecipientAddress)!!;

                    if (potentialRecipient.level >= level) {
                        send(SendParameters{ to: potentialRecipientAddress, value: spilloverShare, mode: SendIgnoreErrors, body: "Spillover Reward".asComment() });

                        self.userLastCycle.set(potentialRecipientAddress, self.spilloverCycle);
                        self.spilloverRecipientIndex = (currentIndex + 1) % self.totalUsers;
                        recipientFound = true;
                    }
                    i += 1;
                }
            }

            if (!recipientFound) {
                send(SendParameters{ to: self.creatorWallet3, value: spilloverShare, mode: SendIgnoreErrors, body: "Spillover to Creator (No Eligible Users)".asComment() });
            }
            unallocatedFunds -= spilloverShare;
        }

        if (unallocatedFunds > 0) {
            send(SendParameters{ to: self.creatorWallet3, value: unallocatedFunds, mode: SendIgnoreErrors });
        }
    }

    // ----------------------------------------------------------------- //
    // ------------------------- GETTER FUNCTIONS ------------------------ //
    // ----------------------------------------------------------------- //

    get fun getUserInfo(user: Address): User? {
        return self.users.get(user);
    }
    
    get fun getPlatformStats(): PlatformStats {
        return PlatformStats {
            totalUsers: self.totalUsers,
            totalStakedTon: self.totalStakedTon,
            totalStakedUsdt: self.totalStakedUsdt,
            totalDistributed: self.totalDistributed,
            activeStakes: self.activeStakes
        };
    }

    get fun getUserAddressByIndex(index: Int): Address? {
        return self.userList.get(index);
    }
}