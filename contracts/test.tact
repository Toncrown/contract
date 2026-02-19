import "@stdlib/deploy";
import "@stdlib/ownable";

//------------------------------------------------------------------
// STRUCTS AND MESSAGES
//------------------------------------------------------------------

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

struct StakeDetails {
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
    pendingReward: Int as coins; 
}

struct UserReferralInfo {
    referrer: Address?;
    directReferrals: Int as uint16;
    totalReferrals: Int as uint32;
    downlines: map<Int, Address>;
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

// MESSAGES
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

message DistributeDailyRewards {
    user: Address;
    stakeId: Int as uint16;
}

message UpdateLevelCost {
    level: Int as uint8;
    cost: Int as coins;
}

message SetUsdtJettonWallet {
    wallet: Address;
}

message SetDistributor {
    address: Address;
}

message OwnerDeposit {}

message OwnerWithdraw {
    amount: Int as coins;
}

//------------------------------------------------------------------
// CONTRACT: TONCROWN
//------------------------------------------------------------------

contract TonCrown with Deployable, OwnableTransferable {

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

    const DAILY_CHECKIN_REWARD: Int = ton("0.01");
    const LEVEL1_DURATION: Int = 2592000;
    const MIN_STAKE_DURATION: Int = 14; 
    const MAX_STAKE_DURATION: Int = 730;
    const MAX_DIRECT_REFERRALS: Int = 6;
    const SECONDS_PER_DAY: Int = 86400;
    const ASSET_TON: Int = 0;
    const ASSET_USDT: Int = 1;
    const DISTRIBUTION_GAS_FEE: Int = ton("0.005");

    init(owner: Address) {
        self.owner = owner;
        self.creatorWallet1 = address("0QDz4oTAnjswERGHK1BNL9hlxcMn-nVLvvALLRCeYiwyZcTO");
        self.creatorWallet2 = address("0QAtYOHIpbdZL0_04aXSg5aZLT0LaQNOrl858DlUoKyqcMcm");
        self.creatorWallet3 = address("0QBLDTtYt33GAzKXLdLeDlTTTMKsIz7wAYpkq1eXq3E89Qzc");
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

    receive() {}

    receive(msg: UpgradeLevel) {
        self.requireNotPaused();
        let sender: Address = sender();
        let originalReferrer: Address? = msg.referrerAddress;
        
        // Use the fixed method that re-fetches the user after spillover assignment
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
        self.reply("Check-in successful".asComment());
    }

    receive(msg: StakeTON) {
        self.requireNotPaused();
        let sender: Address = sender();
        let user: User = self.getOrRegisterUser(sender, msg.referrerAddress);

        require(user.vipClass > 0, "VIP status required for staking");
        require(msg.duration >= self.MIN_STAKE_DURATION && msg.duration <= self.MAX_STAKE_DURATION, "Invalid staking duration");

        let stakeAmount: Int = context().value - ton("0.1");
        require(stakeAmount > 0, "Insufficient value for staking");

        let minStakeTon: Int = self.getMinStakeTon(user.vipClass);
        require(stakeAmount >= minStakeTon, "Stake amount below minimum");

        let stakeId: Int = user.stakeCounter;
        let newStake: StakeInfo = StakeInfo{
            stakeId: stakeId, amount: stakeAmount, startTime: now(),
            duration: msg.duration * self.SECONDS_PER_DAY, vipClass: user.vipClass,
            autoRestake: msg.autoRestake, lastClaim: now(), totalClaimed: 0,
            isActive: true, stakedAsset: self.ASSET_TON
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
        require(sender() == self.usdtJettonWalletAddress, "Unknown jetton wallet");

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
        require(payload.duration >= self.MIN_STAKE_DURATION && payload.duration <= self.MAX_STAKE_DURATION, "Invalid duration");

        let minStakeUsd6: Int = self.getMinStakeInUsd6Decimals(user.vipClass);
        require(usdtReceived >= minStakeUsd6, "Stake amount below minimum");

        let stakeId: Int = user.stakeCounter;
        let newStake: StakeInfo = StakeInfo{
            stakeId: stakeId, amount: usdtReceived, startTime: now(),
            duration: payload.duration * self.SECONDS_PER_DAY, vipClass: user.vipClass,
            autoRestake: payload.autoRestake, lastClaim: now(), totalClaimed: 0,
            isActive: true, stakedAsset: self.ASSET_USDT
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
                response_destination: self.owner, custom_payload: null, forward_ton_amount: ton("0.005"),
                forward_payload: "USDT Staking Capital".asComment().asSlice()
            }.toCell()
        });
    }

    receive(msg: ClaimStakingRewards) {
        self.requireNotPaused();
        self.processRewardPayout(sender(), msg.stakeId);
    }
    
    receive(msg: DistributeDailyRewards) {
        require(sender() == self.distributorAddress, "Not authorized");
        self.requireNotPaused();
        self.processRewardPayout(msg.user, msg.stakeId);
    }
    
    receive(msg: UpdateAutoRestake) {
        self.requireNotPaused();
        let user: User = self.requireUserExists(sender());
        let stake: StakeInfo? = user.stakes.get(msg.stakeId);
        require(stake != null && stake!!.isActive, "No active stake");
        let mutableStake: StakeInfo = stake!!;
        mutableStake.autoRestake = msg.autoRestake;
        user.stakes.set(msg.stakeId, mutableStake);
        self.users.set(sender(), user);
        self.reply("Auto-restake updated".asComment());
    }

    receive(msg: UpdateLevelCost) {
        self.requireOwner();
        self.levelCosts.set(msg.level, msg.cost);
    }

    receive(msg: SetUsdtJettonWallet) {
        self.requireOwner();
        self.usdtJettonWalletAddress = msg.wallet;
    }
    
    receive(msg: SetDistributor) {
        self.requireOwner();
        self.distributorAddress = msg.address;
    }
    
    receive(msg: OwnerDeposit) {
        self.requireOwner();
        self.reply("Deposit successful".asComment());
    }

    receive(msg: OwnerWithdraw) {
        self.requireOwner();
        require(myBalance() > msg.amount, "Insufficient balance");
        send(SendParameters{ to: self.owner, value: msg.amount, mode: SendPayGasSeparately, body: "Owner Withdrawal".asComment() });
    }

    //------------------------------------------------------------------
    // INTERNAL HELPER FUNCTIONS
    //------------------------------------------------------------------

    fun requireNotPaused() {
        require(!self.isPaused, "Contract is paused");
    }

    fun requireUserExists(user: Address): User {
        let userData: User? = self.users.get(user);
        require(userData != null, "User not registered");
        return userData!!;
    }

    fun calculateVipClass(level: Int): Int {
        if (level >= 4 && level <= 6) { return 1; }
        else if (level >= 7 && level <= 8) { return 2; }
        else if (level >= 9) { return 3; }
        return 0;
    }

    fun getMinStakeTon(vipClass: Int): Int {
        if (vipClass == 1) { return ton("2"); }
        if (vipClass == 2) { return ton("50"); }
        if (vipClass >= 3) { return ton("100"); }
        return 0;
    }

    fun getMinStakeInUsd6Decimals(vipClass: Int): Int {
        if (vipClass == 1) { return 10000000; }
        if (vipClass == 2) { return 50000000; }
        if (vipClass >= 3) { return 300000000; }
        return 0; 
    }
    
    fun getOrRegisterUser(userAddress: Address, referrerAddress: Address?): User {
        let userData: User? = self.users.get(userAddress);
        if (userData != null){
            return userData!!;
        }

        let newUser: User = User{
            referrer: referrerAddress, level: 0, vipClass: 0, directReferrals: 0,
            totalReferrals: 0, otherReferrals: 0, lastCheckIn: 0, levelExpiration: 0,
            totalEarned: 0, isActive: true, registrationTime: now(), stakeCounter: 0,
            stakes: emptyMap(), downlines: emptyMap(), spilloverIndex: 0
        };

        self.userList.set(self.totalUsers, userAddress);
        self.users.set(userAddress, newUser);
        self.totalUsers = self.totalUsers + 1;

        if (referrerAddress != null) {
            self.processReferralRegistration(userAddress, referrerAddress!!);
        }

        // FIX: We MUST re-fetch from storage because processReferralRegistration
        // might have updated the 'referrer' field via spillover logic.
        return self.users.get(userAddress)!!;
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
        
        // 1. Round Robin check of direct downlines
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
                    originalReferrerUser.totalReferrals += 1; 
                    originalReferrerUser.spilloverIndex = downlineNum;
                    self.users.set(originalReferrer, originalReferrerUser);
                    return;
                }
                i += 1;
            }
        }

        // 2. BFS Search for deeper levels
        let queue: map<Int, Address> = emptyMap();
        let visited: map<Address, Bool> = emptyMap();
        let queueHead: Int = 0;
        let queueTail: Int = 0;

        let k: Int = 1;
        while (k <= originalReferrerUser.directReferrals) {
            let addr: Address = originalReferrerUser.downlines.get(k)!!;
            queue.set(queueTail, addr);
            visited.set(addr, true);
            queueTail += 1;
            k += 1;
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
                originalReferrerUser.totalReferrals += 1;
                self.users.set(originalReferrer, originalReferrerUser);
                return;
            }

            let j: Int = 1;
            while (j <= currentUser.directReferrals) {
                let nextAddr: Address = currentUser.downlines.get(j)!!;
                if (visited.get(nextAddr) == null) {
                    visited.set(nextAddr, true);
                    queue.set(queueTail, nextAddr);
                    queueTail += 1;
                }
                j += 1;
            }
        }

        // Fallback
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
        let spilloverShare: Int = amount * 20 / 100;
        let splitShare: Int = (level == 1) ? (amount * 25 / 100) : (amount * 15 / 100);
        
        let unallocatedFunds: Int = amount;

        send(SendParameters{ to: self.creatorWallet1, value: creator1Share, mode: SendPayGasSeparately, body: "Creator Share 1".asComment() });
        send(SendParameters{ to: self.creatorWallet2, value: creator2Share, mode: SendPayGasSeparately, body: "Creator Share 2".asComment() });
        send(SendParameters{ to: self.creatorWallet3, value: creator3Share, mode: SendPayGasSeparately, body: "Creator Share 3".asComment() });
        unallocatedFunds = unallocatedFunds - creator1Share - creator2Share - creator3Share;

        // FIXED REFERRAL SPLIT LOGIC
        // Case A: Link Referrer and Slot Referrer are the same (Direct Referral)
        if (originalReferrer != null && actualReferrer != null && (originalReferrer!! == actualReferrer!!)) {
            let totalCommission: Int = splitShare * 2;
            let origUser: User? = self.users.get(originalReferrer!!);
            if (origUser != null && origUser!!.level >= level) {
                send(SendParameters{ to: originalReferrer!!, value: totalCommission, mode: SendPayGasSeparately, body: "Direct Referral Commission".asComment() });
            } else {
                send(SendParameters{ to: self.creatorWallet3, value: totalCommission, mode: SendPayGasSeparately, body: "Missed Direct Commission".asComment() });
            }
            unallocatedFunds = unallocatedFunds - totalCommission;
        } 
        // Case B: Link Referrer and Slot Referrer are different (Spillover)
        else {
            // 1. Process Link Referrer (originalReferrer)
            if (originalReferrer != null) {
                let origUser: User? = self.users.get(originalReferrer!!);
                if (origUser != null && origUser!!.level >= level) {
                    send(SendParameters{ to: originalReferrer!!, value: splitShare, mode: SendPayGasSeparately, body: "Link Referral Commission".asComment() });
                } else {
                    send(SendParameters{ to: self.creatorWallet3, value: splitShare, mode: SendPayGasSeparately, body: "Missed Link Commission".asComment() });
                }
            } else {
                send(SendParameters{ to: self.creatorWallet3, value: splitShare, mode: SendPayGasSeparately, body: "System Link Commission".asComment() });
            }

            // 2. Process Slot Referrer (actualReferrer / inherited downline)
            if (actualReferrer != null) {
                let actUser: User? = self.users.get(actualReferrer!!);
                if (actUser != null && actUser!!.level >= level) {
                    send(SendParameters{ to: actualReferrer!!, value: splitShare, mode: SendPayGasSeparately, body: "Slot Referral Commission".asComment() });
                } else {
                    send(SendParameters{ to: self.creatorWallet3, value: splitShare, mode: SendPayGasSeparately, body: "Missed Slot Commission".asComment() });
                }
            } else {
                send(SendParameters{ to: self.creatorWallet3, value: splitShare, mode: SendPayGasSeparately, body: "System Slot Commission".asComment() });
            }
            unallocatedFunds = unallocatedFunds - (splitShare * 2);
        }

        // Global Spillover Reward Pool
        if (spilloverShare > 0) {
            let recipientFound: Bool = false;
            if (self.totalUsers > 0) {
                let i: Int = 0;
                while (i < self.totalUsers && !recipientFound) {
                    let currentIndex: Int = (self.spilloverRecipientIndex + i) % self.totalUsers;
                    let pAddress: Address = self.userList.get(currentIndex)!!;
                    let pUser: User = self.users.get(pAddress)!!;
                    if (pUser.level >= level) {
                        let lastCycle: Int = 0;
                        let lastCycleOpt: Int? = self.userLastCycle.get(pAddress);
                        if (lastCycleOpt != null) { lastCycle = lastCycleOpt!!; }
                        if (lastCycle < self.spilloverCycle) {
                            send(SendParameters{ to: pAddress, value: spilloverShare, mode: SendPayGasSeparately, body: "Spillover Pool Reward".asComment() });
                            self.userLastCycle.set(pAddress, self.spilloverCycle);
                            self.spilloverRecipientIndex = (currentIndex + 1) % self.totalUsers;
                            recipientFound = true;
                        }
                    }
                    i = i + 1;
                }
            }
            if (!recipientFound) {
                send(SendParameters{ to: self.creatorWallet3, value: spilloverShare, mode: SendPayGasSeparately, body: "Unclaimed Spillover".asComment() });
            }
            unallocatedFunds = unallocatedFunds - spilloverShare;
        }

        if (unallocatedFunds > 0) {
            send(SendParameters{ to: self.creatorWallet3, value: unallocatedFunds, mode: SendPayGasSeparately, body: "Unallocated Balance".asComment() });
        }
    }

    fun processRewardPayout(userAddress: Address, stakeId: Int) {
        let user: User = self.requireUserExists(userAddress);
        let stake: StakeInfo? = user.stakes.get(stakeId);
        require(stake != null, "Stake not found");

        let currentStake: StakeInfo = stake!!;
        require(currentStake.isActive, "Stake inactive");

        let currentTime: Int = now();
        let days: Int = (currentTime - currentStake.lastClaim) / self.SECONDS_PER_DAY;
        require(days > 0, "No rewards yet");

        let vip: VipConfig = self.vipConfigs.get(currentStake.vipClass)!!;
        let daily: Int = currentStake.amount * vip.stakingRoi / 10000;
        let total: Int = daily * days;

        if (currentStake.stakedAsset == self.ASSET_TON) {
            let net: Int = total - self.DISTRIBUTION_GAS_FEE;
            if (net > 0) { send(SendParameters{ to: userAddress, value: net, mode: SendIgnoreErrors, body: "TON Rewards".asComment() }); }
        } else {
            if (total > 0) {
                send(SendParameters{
                    to: self.usdtJettonWalletAddress, value: ton("0.1"), mode: SendIgnoreErrors,
                    body: JettonTransfer{
                        queryId: 0, amount: total, destination: userAddress, response_destination: userAddress,
                        custom_payload: null, forward_ton_amount: ton("0.005"), forward_payload: "USDT Rewards".asComment().asSlice()
                    }.toCell()
                });
            }
        }
        
        if (currentTime >= currentStake.startTime + currentStake.duration) {
            if (currentStake.autoRestake) {
                currentStake.startTime = currentTime;
                currentStake.lastClaim = currentTime;
            } else {
                if (currentStake.stakedAsset == self.ASSET_TON) {
                    send(SendParameters{ to: userAddress, value: currentStake.amount, mode: SendIgnoreErrors, body: "TON Refund".asComment() });
                    self.totalStakedTon -= currentStake.amount;
                } else { 
                    send(SendParameters{
                        to: self.usdtJettonWalletAddress, value: ton("0.1"), mode: SendIgnoreErrors,
                        body: JettonTransfer{
                            queryId: 0, amount: currentStake.amount, destination: userAddress, response_destination: userAddress,
                            custom_payload: null, forward_ton_amount: ton("0.005"), forward_payload: "USDT Refund".asComment().asSlice()
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

        currentStake.totalClaimed += total;
        user.stakes.set(stakeId, currentStake);
        self.users.set(userAddress, user);
        self.totalDistributed += total;
    }

    //------------------------------------------------------------------
    // GETTER FUNCTIONS
    //------------------------------------------------------------------

    get fun getUserInfo(user: Address): User? {
        return self.users.get(user);
    }
    
    get fun getPlatformStats(): PlatformStats {
        return PlatformStats {
            totalUsers: self.totalUsers, totalStakedTon: self.totalStakedTon,
            totalStakedUsdt: self.totalStakedUsdt, totalDistributed: self.totalDistributed,
            activeStakes: self.activeStakes
        };
    }

    get fun getUserAddressByIndex(index: Int): Address? {
        return self.userList.get(index);
    }

    get fun getUserStakeIds(userAddress: Address): map<Int, Bool> {
        let user: User? = self.users.get(userAddress);
        if (user == null) { return emptyMap(); }
        let stakeIds: map<Int, Bool> = emptyMap();
        let i: Int = 0;
        while(i < user!!.stakeCounter) {
            if(user!!.stakes.get(i) != null) { stakeIds.set(i, true); }
            i = i + 1;
        }
        return stakeIds;
    }

    get fun getStakeDetails(userAddress: Address, stakeId: Int): StakeDetails? {
        let user: User? = self.users.get(userAddress);
        if (user == null) { return null; }
        let stake: StakeInfo? = user!!.stakes.get(stakeId);
        if (stake == null) { return null; }

        let cs: StakeInfo = stake!!;
        let pending: Int = 0;

        if (cs.isActive) {
            let ct: Int = now();
            let et: Int = (ct < cs.startTime + cs.duration) ? ct : cs.startTime + cs.duration;
            let days: Int = (et - cs.lastClaim) / self.SECONDS_PER_DAY;
            if (days > 0) {
                let v: VipConfig = self.vipConfigs.get(cs.vipClass)!!;
                pending = (cs.amount * v.stakingRoi / 10000) * days;
            }
        }

        return StakeDetails {
            stakeId: cs.stakeId, amount: cs.amount, startTime: cs.startTime,
            duration: cs.duration, vipClass: cs.vipClass, autoRestake: cs.autoRestake,
            lastClaim: cs.lastClaim, totalClaimed: cs.totalClaimed, isActive: cs.isActive,
            stakedAsset: cs.stakedAsset, pendingReward: pending
        };
    }

    get fun getUserReferralInfo(userAddress: Address): UserReferralInfo? {
        let user: User? = self.users.get(userAddress);
        if (user == null) { return null; }
        return UserReferralInfo {
            referrer: user!!.referrer, directReferrals: user!!.directReferrals,
            totalReferrals: user!!.totalReferrals, downlines: user!!.downlines
        };
    }
}