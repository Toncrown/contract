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

    // Check-in reward tracking
    pendingCheckInRewards: Int as coins;
    totalCheckInEarned: Int as coins;
    totalCheckInClaimed: Int as coins;

    // Earnings breakdown
    totalStakingClaimed: Int as coins;
    totalReferralEarned: Int as coins;
    totalSpilloverEarned: Int as coins;

    // Transaction history
    transactionCounter: Int as uint32;
    transactions: map<Int, UserTransaction>;

    // Referrer taken from the registration link. Captured once, at registration, and
    // never re-read from a later message — accepting it on every upgrade let a caller
    // point the referral share at any address they liked, their own included.
    linkReferrer: Address?;
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

message WithdrawJettons {
    to: Address;
    amount: Int as coins;
}

message SetDistributor {
    address: Address;
}

message OwnerDeposit {}

message OwnerWithdraw {
    amount: Int as coins;
}

message ClaimCheckInRewards {}

message SetPaused {
    paused: Bool;
}

message SetStakeCapitalPolicy {
    forwardToTreasuryWallet: Bool;
}

message UpgradeContract {
    code: Cell;
}

message ImportUser {
    userAddress: Address;
    referrer: Address?;
    linkReferrer: Address?;
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
    spilloverIndex: Int as uint16;
    pendingCheckInRewards: Int as coins;
    totalCheckInEarned: Int as coins;
    totalCheckInClaimed: Int as coins;
    totalStakingClaimed: Int as coins;
    totalReferralEarned: Int as coins;
    totalSpilloverEarned: Int as coins;
}

message ImportDownline {
    parent: Address;
    slot: Int as uint16;
    child: Address;
}

message ImportStake {
    userAddress: Address;
    stake: StakeInfo;
}

message ImportPlatformTotals {
    totalStakedTon: Int as coins;
    totalStakedUsdt: Int as coins;
    totalDistributed: Int as coins;
    activeStakes: Int as uint32;
    totalCheckInRewardsAccrued: Int as coins;
    totalCheckInRewardsClaimed: Int as coins;
    totalReferralRewardsPaid: Int as coins;
    totalSpilloverRewardsPaid: Int as coins;
    totalCreatorRewardsPaid: Int as coins;
}

message LockImports {}

struct UserTransaction {
    txId: Int as uint32;
    timestamp: Int as uint32;
    txType: Int as uint8;
    amount: Int as coins;
    level: Int as uint8;
    stakeId: Int as uint16;
    assetType: Int as uint8;
    counterparty: Address?;
    description: String;
}

struct UserEarningsInfo {
    totalEarned: Int as coins;
    pendingCheckInRewards: Int as coins;
    totalCheckInEarned: Int as coins;
    totalCheckInClaimed: Int as coins;
    totalStakingClaimed: Int as coins;
    pendingStakingRewards: Int as coins;
    totalReferralEarned: Int as coins;
    totalSpilloverEarned: Int as coins;
    totalClaimable: Int as coins;
}

struct PlatformEarningsInfo {
    totalUsers: Int as uint32;
    totalStakedTon: Int as coins;
    totalStakedUsdt: Int as coins;
    totalDistributed: Int as coins;
    totalCheckInRewardsAccrued: Int as coins;
    totalCheckInRewardsClaimed: Int as coins;
    totalReferralRewardsPaid: Int as coins;
    totalSpilloverRewardsPaid: Int as coins;
    totalCreatorRewardsPaid: Int as coins;
    totalUnclaimedCheckInRewards: Int as coins;
    activeStakes: Int as uint32;
    contractBalance: Int as coins;
}

// Deliberately flat and under fifteen fields. Tact splits a struct past its fourteenth
// field into a nested tuple, and TON API v2 does not type the items of a nested tuple —
// which is why reading `User` (23 fields) through v2 yields zeros or "Not a cell", and
// why the frontend carries getUserInfoSafe, rawStackValue and a level reconstructed from
// transaction history. Everything below stays flat so an ordinary v2 read just works.
struct UserSummary {
    referrer: Address?;
    linkReferrer: Address?;
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
}

// The contract exposed no getter for its own configuration, so the frontend read it out
// of raw account state, hardcoding the field layout. A storage change would have broken
// that silently.
struct ContractConfig {
    owner: Address;
    creatorWallet1: Address;
    creatorWallet2: Address;
    creatorWallet3: Address;
    creatorWallet4: Address;
    usdtJettonWalletAddress: Address;
    distributorAddress: Address;
    isPaused: Bool;
    importsLocked: Bool;
    forwardStakeCapital: Bool;
    deploymentNonce: Int as uint32;
}

struct AdminUserSnapshot {
    userAddress: Address;
    level: Int as uint8;
    vipClass: Int as uint8;
    isActive: Bool;
    pendingCheckInRewards: Int as coins;
    pendingStakingRewardsTon: Int as coins;
    pendingStakingRewardsUsdt: Int as coins;
    activeStakeCount: Int as uint16;
    activeStakedTon: Int as coins;
    activeStakedUsdt: Int as coins;
    maturedCapitalTon: Int as coins;
    maturedCapitalUsdt: Int as coins;
    tonDueNow: Int as coins;
}

struct TreasuryLiabilities {
    fromIndex: Int as uint32;
    toIndex: Int as uint32;
    usersScanned: Int as uint32;
    pendingCheckInRewards: Int as coins;
    pendingStakingRewardsTon: Int as coins;
    pendingStakingRewardsUsdt: Int as coins;
    maturedCapitalTon: Int as coins;
    maturedCapitalUsdt: Int as coins;
    activeStakedTon: Int as coins;
    activeStakedUsdt: Int as coins;
    activeStakeCount: Int as uint32;
    tonDueNow: Int as coins;
}

struct TreasuryStatus {
    contractBalance: Int as coins;
    minReserve: Int as coins;
    totalUsers: Int as uint32;
    unclaimedCheckInRewards: Int as coins;
    totalStakedTon: Int as coins;
    totalStakedUsdt: Int as coins;
    activeStakes: Int as uint32;
    isPaused: Bool;
    importsLocked: Bool;
    forwardStakeCapital: Bool;
    deploymentNonce: Int as uint32;
}

struct UserStakeSummary {
    totalStakes: Int as uint16;
    activeStakes: Int as uint16;
    inactiveStakes: Int as uint16;
    pendingStakingRewards: Int as coins;
}

//------------------------------------------------------------------
// CONTRACT: TONCROWN
//------------------------------------------------------------------

// TVM SETCODE. The previous deployment had no way to ship a fix, so a bug could only
// be resolved by redeploying to a new address and migrating every user across.
asm fun setContractCode(code: Cell) { SETCODE }

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
    spilloverNextIndexByBoughtLevel: map<Int, Int>;

    // Spillover eligibility registry. eligibleByLevel is a flat map keyed by
    // level * ELIGIBLE_KEY_STRIDE + position, which gives one append-only list per
    // level without needing nested maps. A user is appended to the list for level L
    // when they reach level L; because upgrades are sequential, a user at level N is
    // present in every list 1..N, which is exactly the eligibility rule.
    // This replaces scanning userList on every purchase.
    eligibleByLevel: map<Int, Address>;
    eligibleCountByLevel: map<Int, Int>;

    // Only affects the contract address, never the logic. ImportUser refuses to
    // overwrite an existing record, and init data is otherwise fixed by the owner
    // address alone — so without this, a mis-imported record could never be corrected:
    // redeploying with the same owner lands on the same address, on top of the bad
    // state. Bumping the nonce gives a clean instance to import into.
    deploymentNonce: Int as uint32;

    // Owner may seed state from a previous deployment until imports are locked.
    importsLocked: Bool;

    // Whether staking capital is forwarded out to creatorWallet3 on deposit. When true
    // the contract owes ROI and capital it does not hold, and has to be topped up
    // manually to stay solvent.
    forwardStakeCapital: Bool;

    // Platform-level earnings tracking
    totalCheckInRewardsAccrued: Int as coins;
    totalCheckInRewardsClaimed: Int as coins;
    totalReferralRewardsPaid: Int as coins;
    totalSpilloverRewardsPaid: Int as coins;
    totalCreatorRewardsPaid: Int as coins;

    const DAILY_CHECKIN_REWARD: Int = ton("0.02");
    const LEVEL1_DURATION: Int = 2592000;
    const MIN_STAKE_DURATION: Int = 14;
    const MAX_STAKE_DURATION: Int = 730;
    const MAX_DIRECT_REFERRALS: Int = 6;
    // Both of these bound loops that used to run over the whole user base. Unbounded,
    // gas grew linearly with user count and UpgradeLevel hit the 1,000,000 gas ceiling
    // (exit code -14) at roughly 200 users, permanently blocking registration.
    const MAX_PLACEMENT_SCAN: Int = 60;
    // Room for 100M members per level in the flat eligibility key space.
    const ELIGIBLE_KEY_STRIDE: Int = 100000000;
    // The registry only holds users who already meet the level requirement, so a
    // candidate is almost always accepted first try. These few retries only skip the
    // buyer themselves or an inactive account.
    const MAX_SPILLOVER_TRIES: Int = 8;
    const SECONDS_PER_DAY: Int = 86400;
    const ASSET_TON: Int = 0;
    const ASSET_USDT: Int = 1;

    // Hybrid gas policy:
    // - upgrades keep the original 0.05 TON buffer because distribution performs many internal sends;
    // - simple actions use smaller per-action buffers;
    // - buffers are not counted as business/reward/stake amounts.
    const DISTRIBUTION_GAS_FEE: Int = ton("0.005");
    const MIN_CONTRACT_RESERVE: Int = ton("0.05");
    const UPGRADE_GAS_BUFFER: Int = ton("0.05");
    const CHECKIN_GAS_BUFFER: Int = ton("0.01");
    const CLAIM_GAS_BUFFER: Int = ton("0.02");
    const STAKE_GAS_BUFFER: Int = ton("0.03");

    // Transaction type constants
    const TX_LEVEL_UPGRADE: Int = 1;
    const TX_CHECKIN_ACCRUED: Int = 2;
    const TX_CHECKIN_CLAIMED: Int = 3;
    const TX_STAKE_TON: Int = 4;
    const TX_STAKE_USDT: Int = 5;
    const TX_STAKING_REWARD_CLAIMED: Int = 6;
    const TX_REFERRAL_COMMISSION: Int = 7;
    const TX_SPILLOVER_REWARD: Int = 8;
    const TX_OWNER_WITHDRAW: Int = 9;
    const TX_REFUND: Int = 10;

    init(owner: Address, deploymentNonce: Int) {
        self.owner = owner;
        self.deploymentNonce = deploymentNonce;
        self.creatorWallet1 = address("UQCtNZf0MCqmy558C2zgtzK7i69gg0ttOBWmZ-88ScJp40s5");
        self.creatorWallet2 = address("UQDh7i8s3-wUTuEQ5c5umdpYr9ZG5hWs10LwV8ZIMflYezk8");
        self.creatorWallet3 = address("UQBsxkLE-YTsKmBvnJXe3iqiWEcXG2qgHAJO63fIlRgu87dI");
        self.creatorWallet4 = address("UQD8W3W7eQ7b3drJcSfAqwf8DM47W2LNZn_V3UirGI0NpoqQ");

        self.usdtJettonWalletAddress = owner;
        self.distributorAddress = owner;

        self.totalUsers = 0;
        self.totalStakedTon = 0;
        self.totalStakedUsdt = 0;
        self.totalDistributed = 0;
        self.activeStakes = 0;
        self.isPaused = false;

        self.spilloverNextIndexByBoughtLevel = emptyMap();
        self.eligibleByLevel = emptyMap();
        self.eligibleCountByLevel = emptyMap();
        self.importsLocked = false;
        self.forwardStakeCapital = true;

        self.totalCheckInRewardsAccrued = 0;
        self.totalCheckInRewardsClaimed = 0;
        self.totalReferralRewardsPaid = 0;
        self.totalSpilloverRewardsPaid = 0;
        self.totalCreatorRewardsPaid = 0;

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
        let senderAddress: Address = sender();

        require(msg.targetLevel >= 1 && msg.targetLevel <= 10, "Invalid level");

        // msg.referrerAddress is honoured only on the very first call, when the user is
        // created. From then on distributeFunds reads the referrers stored on the user.
        let currentUser: User = self.getOrRegisterUser(senderAddress, msg.referrerAddress);

        require(msg.targetLevel == currentUser.level + 1, "Must upgrade sequentially");
        let levelCost: Int = self.levelCosts.get(msg.targetLevel)!!;
        require(context().value >= levelCost + self.UPGRADE_GAS_BUFFER, "Insufficient payment for level and gas");

        let purchaseTime: Int = now();
        let oldLevel: Int = currentUser.level;
        currentUser.level = msg.targetLevel;
        currentUser.vipClass = self.calculateVipClass(msg.targetLevel);
        currentUser.isActive = true;

        if (msg.targetLevel == 1) {
            currentUser.levelExpiration = purchaseTime + self.LEVEL1_DURATION;
        }

        self.users.set(senderAddress, currentUser);

        // Only levelCost is distributed/recorded. The gas buffer remains available for internal sends/storage.
        self.distributeFunds(levelCost, senderAddress, oldLevel + 1, purchaseTime);

        // Registered after distribution so the buyer is never a candidate for the very
        // purchase that made them eligible.
        self.registerEligible(msg.targetLevel, senderAddress);

        self.recordUserTransaction(
            senderAddress,
            self.TX_LEVEL_UPGRADE,
            levelCost,
            msg.targetLevel,
            0,
            self.ASSET_TON,
            null,
            "Level Upgrade"
        );

        // Anything paid above the level price and the gas buffer goes straight back.
        let excess: Int = context().value - levelCost - self.UPGRADE_GAS_BUFFER;
        if (excess > 0) {
            send(SendParameters{
                to: senderAddress,
                value: excess,
                mode: SendIgnoreErrors,
                bounce: false,
                body: "Upgrade Change".asComment()
            });
        }

        // Deliberately not self.reply(): reply carries SendRemainingValue (mode 64), and
        // mode 64 attaches the inbound message value untouched by the payouts above —
        // those come out of the account balance, not out of the message. The result was
        // that the buyer got their entire payment refunded whenever the contract balance
        // happened to cover it, and silently did not whenever it did not.
        self.confirm(senderAddress, "Level upgrade successful");
    }

    receive(msg: CheckIn) {
        self.requireNotPaused();
        require(context().value >= self.CHECKIN_GAS_BUFFER, "Insufficient check-in gas");

        let senderAddress: Address = sender();
        let currentUser: User = self.requireUserExists(senderAddress);
        let currentTime: Int = now();

        require(currentUser.level > 0 && currentUser.isActive, "Must have an active level to check in");
        require(currentTime - currentUser.lastCheckIn >= self.SECONDS_PER_DAY, "Already checked in today");

        // Level 1 users lose check-in eligibility after 30 days but keep their level.
        if (currentUser.level == 1) {
            require(currentTime <= currentUser.levelExpiration, "Level 1 check-in period has ended");
        }

        let reward: Int = self.DAILY_CHECKIN_REWARD;

        // Accumulate reward — do NOT send TON here.
        currentUser.pendingCheckInRewards = currentUser.pendingCheckInRewards + reward;
        currentUser.totalCheckInEarned = currentUser.totalCheckInEarned + reward;
        currentUser.totalEarned = currentUser.totalEarned + reward;
        currentUser.lastCheckIn = currentTime;

        self.totalCheckInRewardsAccrued = self.totalCheckInRewardsAccrued + reward;
        self.totalDistributed = self.totalDistributed + reward;

        let txId: Int = currentUser.transactionCounter;
        currentUser.transactions.set(txId, UserTransaction{
            txId: txId,
            timestamp: currentTime,
            txType: self.TX_CHECKIN_ACCRUED,
            amount: reward,
            level: currentUser.level,
            stakeId: 0,
            assetType: self.ASSET_TON,
            counterparty: null,
            description: "Daily Check-in Accrued"
        });
        currentUser.transactionCounter = currentUser.transactionCounter + 1;

        self.users.set(senderAddress, currentUser);
        self.reply("Check-in successful. Reward added to claimable balance.".asComment());
    }

    receive(msg: ClaimCheckInRewards) {
        self.requireNotPaused();
        require(context().value >= self.CLAIM_GAS_BUFFER, "Insufficient claim gas");

        let senderAddress: Address = sender();
        let user: User = self.requireUserExists(senderAddress);

        let claimAmount: Int = user.pendingCheckInRewards;
        require(claimAmount > 0, "No check-in rewards to claim");
        require(self.availableBalance() >= claimAmount + self.MIN_CONTRACT_RESERVE, "Insufficient contract balance");

        // Zero out BEFORE sending — prevents double-claim.
        user.pendingCheckInRewards = 0;
        user.totalCheckInClaimed = user.totalCheckInClaimed + claimAmount;
        self.totalCheckInRewardsClaimed = self.totalCheckInRewardsClaimed + claimAmount;

        let txId: Int = user.transactionCounter;
        user.transactions.set(txId, UserTransaction{
            txId: txId,
            timestamp: now(),
            txType: self.TX_CHECKIN_CLAIMED,
            amount: claimAmount,
            level: user.level,
            stakeId: 0,
            assetType: self.ASSET_TON,
            counterparty: null,
            description: "Check-in Rewards Claimed"
        });
        user.transactionCounter = user.transactionCounter + 1;

        self.users.set(senderAddress, user);

        // SendPayGasSeparately so the user receives exactly what was credited against
        // their balance, and no SendIgnoreErrors: the pending balance has already been
        // zeroed above, so a dropped action here would destroy the reward instead of
        // reverting the whole transaction.
        send(SendParameters{
            to: senderAddress,
            value: claimAmount,
            mode: SendPayGasSeparately,
            body: "Check-in Rewards Claim".asComment()
        });

        self.reply("Check-in rewards claimed successfully.".asComment());
    }

    receive(msg: StakeTON) {
        self.requireNotPaused();
        let senderAddress: Address = sender();
        let user: User = self.getOrRegisterUser(senderAddress, msg.referrerAddress);
        user = self.refreshUserLevelStatus(senderAddress);

        require(user.vipClass > 0, "VIP status required for staking");
        require(msg.duration >= self.MIN_STAKE_DURATION && msg.duration <= self.MAX_STAKE_DURATION, "Invalid staking duration");

        require(context().value > self.STAKE_GAS_BUFFER, "Insufficient value for staking gas");
        let stakeAmount: Int = context().value - self.STAKE_GAS_BUFFER;

        let minStakeTon: Int = self.getMinStakeTon(user.vipClass);
        require(stakeAmount >= minStakeTon, "Stake amount below minimum");

        let stakeId: Int = user.stakeCounter;
        let currentTime: Int = now();
        let newStake: StakeInfo = StakeInfo{
            stakeId: stakeId,
            amount: stakeAmount,
            startTime: currentTime,
            duration: msg.duration * self.SECONDS_PER_DAY,
            vipClass: user.vipClass,
            autoRestake: msg.autoRestake,
            lastClaim: currentTime,
            totalClaimed: 0,
            isActive: true,
            stakedAsset: self.ASSET_TON
        };

        user.stakes.set(stakeId, newStake);
        user.stakeCounter += 1;

        let tonStakeTxId: Int = user.transactionCounter;
        user.transactions.set(tonStakeTxId, UserTransaction{
            txId: tonStakeTxId,
            timestamp: currentTime,
            txType: self.TX_STAKE_TON,
            amount: stakeAmount,
            level: user.level,
            stakeId: stakeId,
            assetType: self.ASSET_TON,
            counterparty: null,
            description: "TON Staking"
        });
        user.transactionCounter = user.transactionCounter + 1;

        self.users.set(senderAddress, user);

        self.totalStakedTon += stakeAmount;
        self.activeStakes += 1;

        // Staking capital is forwarded to creatorWallet3/treasury only while that policy
        // is switched on. While it is on, the contract owes ROI and capital it no longer
        // holds and has to be topped up manually to stay solvent.
        if (self.forwardStakeCapital) {
            send(SendParameters{
                to: self.creatorWallet3,
                value: stakeAmount,
                mode: SendPayGasSeparately,
                body: "TON Staking Capital".asComment()
            });
        }

        // Deliberately not self.reply() — see the note in UpgradeLevel. Here mode 64 sent
        // the staker their whole deposit back while the capital was also forwarded to the
        // treasury and a fully funded stake position was recorded against the contract.
        self.confirm(senderAddress, "Staking successful");
    }

    receive(msg: JettonTransferNotification) {
        require(sender() == self.usdtJettonWalletAddress, "Unknown jetton wallet");

        let stakerAddress: Address = msg.sender;
        let usdtReceived: Int = msg.amount;

        // Past this point every rejection returns the jettons instead of throwing.
        // Throwing fails the notification but does not undo the transfer, so the USDT
        // was left stranded in the contract's jetton wallet with nothing recorded
        // against it — a malformed payload or a non-VIP sender destroyed the deposit.
        if (self.isPaused) {
            self.refundJettons(stakerAddress, usdtReceived, "Contract is paused");
            return;
        }

        let payloadSlice: Slice = msg.forwardPayload;
        let duration: Int = 0;
        let autoRestake: Bool = false;
        let referrerAddress: Address? = null;
        let parsed: Bool = true;

        try {
            duration = payloadSlice.loadUint(32);
            autoRestake = payloadSlice.loadBool();
            referrerAddress = payloadSlice.loadAddress();
        } catch (e) {
            parsed = false;
        }

        if (!parsed) {
            self.refundJettons(stakerAddress, usdtReceived, "Invalid stake payload");
            return;
        }

        if (duration < self.MIN_STAKE_DURATION || duration > self.MAX_STAKE_DURATION) {
            self.refundJettons(stakerAddress, usdtReceived, "Invalid staking duration");
            return;
        }

        // USDT staking needs an existing VIP account (level 4+), so an unknown sender is
        // refunded rather than registered at level 0 and then rejected.
        let existingUser: User? = self.users.get(stakerAddress);
        if (existingUser == null || existingUser!!.vipClass == 0) {
            self.refundJettons(stakerAddress, usdtReceived, "VIP status required for staking");
            return;
        }
        let user: User = existingUser!!;

        let minStakeUsd6: Int = self.getMinStakeInUsd6Decimals(user.vipClass);
        if (usdtReceived < minStakeUsd6) {
            self.refundJettons(stakerAddress, usdtReceived, "Stake amount below minimum");
            return;
        }

        let stakeId: Int = user.stakeCounter;
        let currentTime: Int = now();
        let newStake: StakeInfo = StakeInfo{
            stakeId: stakeId,
            amount: usdtReceived,
            startTime: currentTime,
            duration: duration * self.SECONDS_PER_DAY,
            vipClass: user.vipClass,
            autoRestake: autoRestake,
            lastClaim: currentTime,
            totalClaimed: 0,
            isActive: true,
            stakedAsset: self.ASSET_USDT
        };

        user.stakes.set(stakeId, newStake);
        user.stakeCounter += 1;

        let usdtStakeTxId: Int = user.transactionCounter;
        user.transactions.set(usdtStakeTxId, UserTransaction{
            txId: usdtStakeTxId,
            timestamp: currentTime,
            txType: self.TX_STAKE_USDT,
            amount: usdtReceived,
            level: user.level,
            stakeId: stakeId,
            assetType: self.ASSET_USDT,
            counterparty: null,
            description: "USDT Staking"
        });
        user.transactionCounter = user.transactionCounter + 1;

        self.users.set(stakerAddress, user);
        self.totalStakedUsdt += usdtReceived;
        self.activeStakes += 1;

        if (self.forwardStakeCapital) {
            send(SendParameters{
                to: self.usdtJettonWalletAddress,
                value: ton("0.1"),
                mode: SendIgnoreErrors,
                body: JettonTransfer{
                    queryId: 0,
                    amount: usdtReceived,
                    destination: self.creatorWallet3,
                    response_destination: self.owner,
                    custom_payload: null,
                    forward_ton_amount: ton("0.005"),
                    forward_payload: "USDT Staking Capital".asComment().asSlice()
                }.toCell()
            });
        }
    }

    receive(msg: ClaimStakingRewards) {
        self.requireNotPaused();
        require(context().value >= self.CLAIM_GAS_BUFFER, "Insufficient claim gas");

        let senderAddress: Address = sender();
        self.processRewardPayout(senderAddress, msg.stakeId);
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
        require(msg.level >= 1 && msg.level <= 10, "Invalid level");
        require(msg.cost > 0, "Invalid cost");
        self.levelCosts.set(msg.level, msg.cost);
    }

    receive(msg: SetUsdtJettonWallet) {
        self.requireOwner();
        self.usdtJettonWalletAddress = msg.wallet;
    }

    // Jettons can reach this contract without any state being recorded against them.
    // A transfer whose notification is rejected — which is what happens for every
    // deposit made before SetUsdtJettonWallet was called, since the notification then
    // fails the "Unknown jetton wallet" check — still completes at the jetton level:
    // the tokens sit in the contract's jetton wallet with nothing owing them to anyone.
    // Every other JettonTransfer this contract sends is tied to a stake, so without
    // this there is no way to move them.
    //
    // Set usdtJettonWalletAddress first, or this sends into the void.
    receive(msg: WithdrawJettons) {
        self.requireOwner();
        require(msg.amount > 0, "Amount must be positive");
        send(SendParameters{
            to: self.usdtJettonWalletAddress,
            value: ton("0.05"),
            mode: SendPayGasSeparately,
            body: JettonTransfer{
                queryId: 0,
                amount: msg.amount,
                destination: msg.to,
                response_destination: self.owner,
                custom_payload: null,
                forward_ton_amount: ton("0.005"),
                forward_payload: "Jetton Withdrawal".asComment().asSlice()
            }.toCell()
        });
    }

    receive(msg: SetDistributor) {
        self.requireOwner();
        self.distributorAddress = msg.address;
    }

    // isPaused was read by requireNotPaused but nothing could ever set it, so the
    // contract had no emergency stop.
    receive(msg: SetPaused) {
        self.requireOwner();
        self.isPaused = msg.paused;
    }

    receive(msg: SetStakeCapitalPolicy) {
        self.requireOwner();
        self.forwardStakeCapital = msg.forwardToTreasuryWallet;
    }

    // The previous deployment had no way to ship a fix. Owner-gated, and no wider than
    // the withdrawal powers the owner already holds.
    receive(msg: UpgradeContract) {
        self.requireOwner();
        setContractCode(msg.code);
    }

    //------------------------------------------------------------------
    // MIGRATION (owner-only, until locked)
    //------------------------------------------------------------------

    receive(msg: ImportUser) {
        self.requireOwner();
        self.requireImportsOpen();
        require(self.users.get(msg.userAddress) == null, "User already imported");

        let imported: User = User{
            referrer: msg.referrer,
            level: msg.level,
            vipClass: msg.vipClass,
            directReferrals: msg.directReferrals,
            totalReferrals: msg.totalReferrals,
            otherReferrals: msg.otherReferrals,
            lastCheckIn: msg.lastCheckIn,
            levelExpiration: msg.levelExpiration,
            totalEarned: msg.totalEarned,
            isActive: msg.isActive,
            registrationTime: msg.registrationTime,
            stakeCounter: 0,
            stakes: emptyMap(),
            downlines: emptyMap(),
            spilloverIndex: msg.spilloverIndex,
            pendingCheckInRewards: msg.pendingCheckInRewards,
            totalCheckInEarned: msg.totalCheckInEarned,
            totalCheckInClaimed: msg.totalCheckInClaimed,
            totalStakingClaimed: msg.totalStakingClaimed,
            totalReferralEarned: msg.totalReferralEarned,
            totalSpilloverEarned: msg.totalSpilloverEarned,
            transactionCounter: 0,
            transactions: emptyMap(),
            linkReferrer: msg.linkReferrer
        };

        self.userList.set(self.totalUsers, msg.userAddress);
        self.users.set(msg.userAddress, imported);
        self.totalUsers = self.totalUsers + 1;

        // Rebuild spillover eligibility: a level-N user belongs in every pool 1..N.
        let lvl: Int = 1;
        while (lvl <= msg.level) {
            self.registerEligible(lvl, msg.userAddress);
            lvl = lvl + 1;
        }
    }

    // Downlines are restored verbatim rather than replayed through the placement logic,
    // so the imported matrix is identical to the one users already see.
    receive(msg: ImportDownline) {
        self.requireOwner();
        self.requireImportsOpen();
        let parentUser: User = self.requireUserExists(msg.parent);
        require(self.users.get(msg.child) != null, "Child not imported");
        parentUser.downlines.set(msg.slot, msg.child);
        self.users.set(msg.parent, parentUser);
    }

    receive(msg: ImportStake) {
        self.requireOwner();
        self.requireImportsOpen();
        let user: User = self.requireUserExists(msg.userAddress);
        user.stakes.set(msg.stake.stakeId, msg.stake);
        if (msg.stake.stakeId + 1 > user.stakeCounter) {
            user.stakeCounter = msg.stake.stakeId + 1;
        }
        self.users.set(msg.userAddress, user);
    }

    receive(msg: ImportPlatformTotals) {
        self.requireOwner();
        self.requireImportsOpen();
        self.totalStakedTon = msg.totalStakedTon;
        self.totalStakedUsdt = msg.totalStakedUsdt;
        self.totalDistributed = msg.totalDistributed;
        self.activeStakes = msg.activeStakes;
        self.totalCheckInRewardsAccrued = msg.totalCheckInRewardsAccrued;
        self.totalCheckInRewardsClaimed = msg.totalCheckInRewardsClaimed;
        self.totalReferralRewardsPaid = msg.totalReferralRewardsPaid;
        self.totalSpilloverRewardsPaid = msg.totalSpilloverRewardsPaid;
        self.totalCreatorRewardsPaid = msg.totalCreatorRewardsPaid;
    }

    // One-way. After this the owner can no longer rewrite user records.
    receive(msg: LockImports) {
        self.requireOwner();
        self.importsLocked = true;
    }

    receive(msg: OwnerDeposit) {
        self.requireOwner();
        send(
            SendParameters{
                to: sender(),
                value: 0,
                mode: SendIgnoreErrors,
                bounce: false,
                body: "Deposit successful".asComment()
            }
        )
    }

    receive(msg: OwnerWithdraw) {
        self.requireOwner();
        require(myBalance() >= msg.amount + self.MIN_CONTRACT_RESERVE, "Insufficient balance after reserve");
        send(SendParameters{
            to: self.owner,
            value: msg.amount,
            mode: SendPayGasSeparately,
            body: "Owner Withdrawal".asComment()
        });
        // self.recordUserTransaction(
        //     self.owner,
        //     self.TX_OWNER_WITHDRAW,
        //     msg.amount,
        //     0,
        //     0,
        //     self.ASSET_TON,
        //     null,
        //     "Owner Withdrawal"
        // );
    }

    //------------------------------------------------------------------
    // INTERNAL HELPER FUNCTIONS
    //------------------------------------------------------------------

    fun calculatePendingStakeReward(stake: StakeInfo, currentTime: Int): Int {
        if (!stake.isActive) {
            return 0;
        }

        let effectiveTime: Int = currentTime;
        let endTime: Int = stake.startTime + stake.duration;
        if (effectiveTime > endTime) {
            effectiveTime = endTime;
        }

        if (effectiveTime <= stake.lastClaim) {
            return 0;
        }

        let elapsedDays: Int = (effectiveTime - stake.lastClaim) / self.SECONDS_PER_DAY;

        if (elapsedDays <= 0) {
            return 0;
        }

        let vip: VipConfig = self.vipConfigs.get(stake.vipClass)!!;
        return stake.amount * vip.stakingRoi * elapsedDays / 10000;
    }

    fun requireNotPaused() {
        require(!self.isPaused, "Contract is paused");
    }

    // myBalance() already includes the value of the message being handled, so using it
    // raw to decide whether a payout is affordable overstates the treasury by the gas
    // the caller just attached.
    fun availableBalance(): Int {
        return myBalance() - context().value;
    }

    // Acknowledgement carrying no value. self.reply() must never be used from a receiver
    // that has already spent the inbound value: reply is SendRemainingValue (mode 64),
    // which re-attaches the full inbound message value regardless of what was sent.
    fun confirm(to: Address, text: String) {
        send(SendParameters{
            to: to,
            value: 0,
            mode: SendIgnoreErrors,
            bounce: false,
            body: text.asComment()
        });
    }

    fun requireImportsOpen() {
        require(!self.importsLocked, "Imports are locked");
    }

    fun refundJettons(to: Address, amount: Int, reason: String) {
        send(SendParameters{
            to: self.usdtJettonWalletAddress,
            value: ton("0.05"),
            mode: SendIgnoreErrors,
            body: JettonTransfer{
                queryId: 0,
                amount: amount,
                destination: to,
                response_destination: to,
                custom_payload: null,
                forward_ton_amount: ton("0.005"),
                forward_payload: reason.asComment().asSlice()
            }.toCell()
        });
    }

    fun requireUserExists(userAddress: Address): User {
        let userData: User? = self.users.get(userAddress);
        require(userData != null, "User not registered");
        return userData!!;
    }

    fun refreshUserLevelStatus(userAddress: Address): User {
        let user: User = self.requireUserExists(userAddress);
        // Level 1 expiration no longer downgrades the user — check-in eligibility is enforced inside CheckIn.
        return user;
    }

    fun calculateVipClass(level: Int): Int {
        if (level >= 4 && level <= 6) {
            return 1;
        } else if (level >= 7 && level <= 8) {
            return 2;
        } else if (level >= 9) {
            return 3;
        }
        return 0;
    }

    fun getMinStakeTon(vipClass: Int): Int {
        if (vipClass == 1) {
            return ton("2");
        }
        if (vipClass == 2) {
            return ton("50");
        }
        if (vipClass >= 3) {
            return ton("100");
        }
        return 0;
    }

    fun getMinStakeInUsd6Decimals(vipClass: Int): Int {
        if (vipClass == 1) {
            return 10000000;
        }
        if (vipClass == 2) {
            return 50000000;
        }
        if (vipClass >= 3) {
            return 300000000;
        }
        return 0;
    }

    fun eligibleCount(level: Int): Int {
        let c: Int? = self.eligibleCountByLevel.get(level);
        if (c == null) { return 0; }
        return c!!;
    }

    // Called once, when a user reaches `level`.
    fun registerEligible(level: Int, user: Address) {
        let count: Int = self.eligibleCount(level);
        self.eligibleByLevel.set(level * self.ELIGIBLE_KEY_STRIDE + count, user);
        self.eligibleCountByLevel.set(level, count + 1);
    }

    fun distributeSpilloverReward(spilloverShare: Int, boughtLevel: Int, payer: Address, purchaseTime: Int) {
        let minEligibleLevel: Int = boughtLevel;

        // Level 1 purchases cannot reward Level 1 users.
        if (boughtLevel == 1) {
            minEligibleLevel = 2;
        }

        let poolSize: Int = self.eligibleCount(minEligibleLevel);
        let recipientFound: Bool = false;

        if (poolSize > 0) {
            let startIndexOpt: Int? = self.spilloverNextIndexByBoughtLevel.get(boughtLevel);
            let startIndex: Int = 0;
            if (startIndexOpt != null) {
                startIndex = startIndexOpt!!;
            }

            // Constant-gas pick. Every address in this pool already satisfies the level
            // requirement, so no search over the user base is needed: the pointer just
            // advances one place per purchase, round robin.
            let tries: Int = self.MAX_SPILLOVER_TRIES;
            if (tries > poolSize) {
                tries = poolSize;
            }

            let i: Int = 0;
            while (i < tries && !recipientFound) {
                let currentIndex: Int = (startIndex + i) % poolSize;
                let receiver: Address = self.eligibleByLevel.get(minEligibleLevel * self.ELIGIBLE_KEY_STRIDE + currentIndex)!!;

                // Buyer can never receive their own spillover.
                if (receiver != payer) {
                    let receiverUser: User = self.users.get(receiver)!!;

                    if (receiverUser.isActive && receiverUser.registrationTime < purchaseTime) {
                        send(SendParameters{
                            to: receiver,
                            value: spilloverShare,
                            mode: SendPayGasSeparately,
                            body: "Spillover Pool Reward".asComment()
                        });

                        self.totalSpilloverRewardsPaid = self.totalSpilloverRewardsPaid + spilloverShare;
                        self.creditSpilloverEarning(receiver, spilloverShare, payer, boughtLevel);

                        self.spilloverNextIndexByBoughtLevel.set(boughtLevel, (currentIndex + 1) % poolSize);
                        recipientFound = true;
                    }
                }

                i = i + 1;
            }

            if (!recipientFound) {
                self.spilloverNextIndexByBoughtLevel.set(boughtLevel, (startIndex + tries) % poolSize);
            }
        }

        // Fallback if nobody qualifies.
        if (!recipientFound) {
            send(SendParameters{
                to: self.creatorWallet3,
                value: spilloverShare,
                mode: SendPayGasSeparately,
                body: "Unclaimed Spillover".asComment()
            });
            self.totalCreatorRewardsPaid = self.totalCreatorRewardsPaid + spilloverShare;
        }
    }

    fun getOrRegisterUser(userAddress: Address, referrerAddress: Address?): User {
        let userData: User? = self.users.get(userAddress);
        if (userData != null) {
            return userData!!;
        }

        // A user naming themselves used to be accepted, which made them their own upline
        // and paid them the full referral split back on every upgrade forever.
        let linkReferrer: Address? = referrerAddress;
        if (linkReferrer != null && linkReferrer!! == userAddress) {
            linkReferrer = null;
        }

        let newUser: User = User{
            referrer: linkReferrer,
            level: 0,
            vipClass: 0,
            directReferrals: 0,
            totalReferrals: 0,
            otherReferrals: 0,
            lastCheckIn: 0,
            levelExpiration: 0,
            totalEarned: 0,
            isActive: true,
            registrationTime: now(),
            stakeCounter: 0,
            stakes: emptyMap(),
            downlines: emptyMap(),
            spilloverIndex: 0,
            pendingCheckInRewards: 0,
            totalCheckInEarned: 0,
            totalCheckInClaimed: 0,
            totalStakingClaimed: 0,
            totalReferralEarned: 0,
            totalSpilloverEarned: 0,
            transactionCounter: 0,
            transactions: emptyMap(),
            linkReferrer: linkReferrer
        };

        self.userList.set(self.totalUsers, userAddress);
        self.users.set(userAddress, newUser);
        self.totalUsers = self.totalUsers + 1;

        if (linkReferrer != null) {
            self.processReferralRegistration(userAddress, linkReferrer!!);
        }

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

        // Bounded breadth-first placement. An unbounded walk of the downline tree is
        // another way for a registration to run out of gas as the matrix grows.
        let queue: map<Int, Address> = emptyMap();
        let visited: map<Address, Bool> = emptyMap();
        let queueHead: Int = 0;
        let queueTail: Int = 0;
        let visitedCount: Int = 0;

        let k: Int = 1;
        while (k <= originalReferrerUser.directReferrals && queueTail < self.MAX_PLACEMENT_SCAN) {
            let addr: Address = originalReferrerUser.downlines.get(k)!!;
            queue.set(queueTail, addr);
            visited.set(addr, true);
            queueTail += 1;
            k += 1;
        }

        while (queueHead < queueTail && visitedCount < self.MAX_PLACEMENT_SCAN) {
            let currentAddress: Address = queue.get(queueHead)!!;
            queueHead += 1;
            visitedCount += 1;
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
            while (j <= currentUser.directReferrals && queueTail < self.MAX_PLACEMENT_SCAN) {
                let nextAddr: Address = currentUser.downlines.get(j)!!;
                if (visited.get(nextAddr) == null) {
                    visited.set(nextAddr, true);
                    queue.set(queueTail, nextAddr);
                    queueTail += 1;
                }
                j += 1;
            }
        }

        let newUserStruct: User = self.users.get(newUser)!!;
        newUserStruct.referrer = self.creatorWallet3;
        self.users.set(newUser, newUserStruct);
    }

    fun distributeFunds(amount: Int, payer: Address, level: Int, purchaseTime: Int) {
        let user: User = self.users.get(payer)!!;

        // Both referrers come from stored state. They used to be taken from the incoming
        // message, so any caller could name an arbitrary address — their own included —
        // and redirect the referral split to it on every upgrade.
        let actualReferrer: Address? = user.referrer;
        let originalReferrer: Address? = user.linkReferrer;

        if (actualReferrer != null && actualReferrer!! == payer) {
            actualReferrer = null;
        }
        if (originalReferrer != null && originalReferrer!! == payer) {
            originalReferrer = null;
        }

        let creator1Share: Int = 0;
        let creator2Share: Int = 0;
        let creator3Share: Int = amount * 10 / 100;
        let spilloverShare: Int = amount * 20 / 100;
        let splitShare: Int = 0;

        if (level == 1) {
            creator1Share = amount * 10 / 100;
            creator2Share = amount * 10 / 100;
            splitShare = amount * 25 / 100;
        } else {
            creator1Share = amount * 20 / 100;
            creator2Share = amount * 20 / 100;
            splitShare = amount * 15 / 100;
        }

        let unallocatedFunds: Int = amount;

        send(SendParameters{ to: self.creatorWallet1, value: creator1Share, mode: SendPayGasSeparately, body: "Creator Share 1".asComment() });
        send(SendParameters{ to: self.creatorWallet2, value: creator2Share, mode: SendPayGasSeparately, body: "Creator Share 2".asComment() });
        send(SendParameters{ to: self.creatorWallet3, value: creator3Share, mode: SendPayGasSeparately, body: "Creator Share 3".asComment() });
        self.totalCreatorRewardsPaid = self.totalCreatorRewardsPaid + creator1Share + creator2Share + creator3Share;
        unallocatedFunds = unallocatedFunds - creator1Share - creator2Share - creator3Share;

        if (originalReferrer != null && actualReferrer != null && (originalReferrer!! == actualReferrer!!)) {
            let totalCommission: Int = splitShare * 2;
            let origUser: User? = self.users.get(originalReferrer!!);

            if (origUser != null && origUser!!.level >= level) {
                send(SendParameters{
                    to: originalReferrer!!,
                    value: totalCommission,
                    mode: SendPayGasSeparately,
                    body: "Direct Referral Commission".asComment()
                });
                self.totalReferralRewardsPaid = self.totalReferralRewardsPaid + totalCommission;
                self.creditReferralEarning(originalReferrer!!, totalCommission, payer, level);
            } else {
                send(SendParameters{
                    to: self.creatorWallet3,
                    value: totalCommission,
                    mode: SendPayGasSeparately,
                    body: "Missed Direct Commission".asComment()
                });
                self.totalCreatorRewardsPaid = self.totalCreatorRewardsPaid + totalCommission;
            }

            unallocatedFunds = unallocatedFunds - totalCommission;
        } else {
            if (originalReferrer != null) {
                let origUser: User? = self.users.get(originalReferrer!!);
                if (origUser != null && origUser!!.level >= level) {
                    send(SendParameters{
                        to: originalReferrer!!,
                        value: splitShare,
                        mode: SendPayGasSeparately,
                        body: "Link Referral Commission".asComment()
                    });
                    self.totalReferralRewardsPaid = self.totalReferralRewardsPaid + splitShare;
                    self.creditReferralEarning(originalReferrer!!, splitShare, payer, level);
                } else {
                    send(SendParameters{
                        to: self.creatorWallet3,
                        value: splitShare,
                        mode: SendPayGasSeparately,
                        body: "Missed Link Commission".asComment()
                    });
                    self.totalCreatorRewardsPaid = self.totalCreatorRewardsPaid + splitShare;
                }
            } else {
                send(SendParameters{
                    to: self.creatorWallet3,
                    value: splitShare,
                    mode: SendPayGasSeparately,
                    body: "System Link Commission".asComment()
                });
                self.totalCreatorRewardsPaid = self.totalCreatorRewardsPaid + splitShare;
            }

            if (actualReferrer != null) {
                let actUser: User? = self.users.get(actualReferrer!!);
                if (actUser != null && actUser!!.level >= level) {
                    send(SendParameters{
                        to: actualReferrer!!,
                        value: splitShare,
                        mode: SendPayGasSeparately,
                        body: "Slot Referral Commission".asComment()
                    });
                    self.totalReferralRewardsPaid = self.totalReferralRewardsPaid + splitShare;
                    self.creditReferralEarning(actualReferrer!!, splitShare, payer, level);
                } else {
                    send(SendParameters{
                        to: self.creatorWallet3,
                        value: splitShare,
                        mode: SendPayGasSeparately,
                        body: "Missed Slot Commission".asComment()
                    });
                    self.totalCreatorRewardsPaid = self.totalCreatorRewardsPaid + splitShare;
                }
            } else {
                send(SendParameters{
                    to: self.creatorWallet3,
                    value: splitShare,
                    mode: SendPayGasSeparately,
                    body: "System Slot Commission".asComment()
                });
                self.totalCreatorRewardsPaid = self.totalCreatorRewardsPaid + splitShare;
            }

            unallocatedFunds = unallocatedFunds - (splitShare * 2);
        }

        if (spilloverShare > 0) {
            self.distributeSpilloverReward(spilloverShare, level, payer, purchaseTime);
            unallocatedFunds = unallocatedFunds - spilloverShare;
        }

        if (unallocatedFunds > 0) {
            send(SendParameters{
                to: self.creatorWallet3,
                value: unallocatedFunds,
                mode: SendPayGasSeparately,
                body: "Unallocated Balance".asComment()
            });
            self.totalCreatorRewardsPaid = self.totalCreatorRewardsPaid + unallocatedFunds;
        }
    }

    fun processRewardPayout(userAddress: Address, stakeId: Int) {
        let user: User = self.requireUserExists(userAddress);
        let stake: StakeInfo? = user.stakes.get(stakeId);
        require(stake != null, "Stake not found");

        let currentStake: StakeInfo = stake!!;
        require(currentStake.isActive, "Stake inactive");

        let currentTime: Int = now();
        let total: Int = self.calculatePendingStakeReward(currentStake, currentTime);
        require(total > 0, "No rewards yet");

        // Reward and returned capital are paid inside one transaction, so affordability
        // has to be judged against both at once. Checking them one at a time let the
        // action phase silently drop the capital transfer (SendIgnoreErrors) after the
        // stake had already been closed and totalStakedTon decremented — the staker's
        // principal was destroyed.
        let matured: Bool = currentTime >= currentStake.startTime + currentStake.duration;
        let closingWithCapital: Bool = matured && !currentStake.autoRestake;

        if (currentStake.stakedAsset == self.ASSET_TON) {
            require(total > self.DISTRIBUTION_GAS_FEE, "Reward below distribution fee");
            let net: Int = total - self.DISTRIBUTION_GAS_FEE;

            let tonRequired: Int = net;
            if (closingWithCapital) {
                tonRequired = tonRequired + currentStake.amount;
            }
            require(self.availableBalance() >= tonRequired + self.MIN_CONTRACT_RESERVE, "Insufficient contract balance");

            send(SendParameters{
                to: userAddress,
                value: net,
                mode: SendPayGasSeparately,
                body: "TON Staking Reward".asComment()
            });
            user.totalStakingClaimed = user.totalStakingClaimed + net;
            user.totalEarned = user.totalEarned + net;
        } else {
            send(SendParameters{
                to: self.usdtJettonWalletAddress,
                value: ton("0.1"),
                mode: SendIgnoreErrors,
                body: JettonTransfer{
                    queryId: 0,
                    amount: total,
                    destination: userAddress,
                    response_destination: userAddress,
                    custom_payload: null,
                    forward_ton_amount: ton("0.005"),
                    forward_payload: "USDT Staking Reward".asComment().asSlice()
                }.toCell()
            });
            user.totalStakingClaimed = user.totalStakingClaimed + total;
            user.totalEarned = user.totalEarned + total;
        }

        let rewardTxId: Int = user.transactionCounter;
        user.transactions.set(rewardTxId, UserTransaction{
            txId: rewardTxId,
            timestamp: currentTime,
            txType: self.TX_STAKING_REWARD_CLAIMED,
            amount: total,
            level: user.level,
            stakeId: stakeId,
            assetType: currentStake.stakedAsset,
            counterparty: null,
            description: "Staking Reward Claimed"
        });
        user.transactionCounter = user.transactionCounter + 1;

        if (matured) {
            if (currentStake.autoRestake) {
                currentStake.startTime = currentTime;
                currentStake.lastClaim = currentTime;
            } else {
                if (currentStake.stakedAsset == self.ASSET_TON) {
                    // Affordability was already established above against reward + capital.
                    // No SendIgnoreErrors here: the stake is closed in the same transaction,
                    // so a dropped action would close the position without paying it out.
                    send(SendParameters{
                        to: userAddress,
                        value: currentStake.amount,
                        mode: SendPayGasSeparately,
                        body: "TON Stake Refund".asComment()
                    });
                    self.totalStakedTon -= currentStake.amount;
                } else {
                    send(SendParameters{
                        to: self.usdtJettonWalletAddress,
                        value: ton("0.1"),
                        mode: SendIgnoreErrors,
                        body: JettonTransfer{
                            queryId: 0,
                            amount: currentStake.amount,
                            destination: userAddress,
                            response_destination: userAddress,
                            custom_payload: null,
                            forward_ton_amount: ton("0.005"),
                            forward_payload: "USDT Stake Refund".asComment().asSlice()
                        }.toCell()
                    });
                    self.totalStakedUsdt -= currentStake.amount;
                }

                let refundTxId: Int = user.transactionCounter;
                user.transactions.set(refundTxId, UserTransaction{
                    txId: refundTxId,
                    timestamp: currentTime,
                    txType: self.TX_REFUND,
                    amount: currentStake.amount,
                    level: user.level,
                    stakeId: stakeId,
                    assetType: currentStake.stakedAsset,
                    counterparty: null,
                    description: "Stake Capital Refunded"
                });
                user.transactionCounter = user.transactionCounter + 1;

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

    fun recordUserTransaction(
        userAddress: Address,
        txType: Int,
        amount: Int,
        level: Int,
        stakeId: Int,
        assetType: Int,
        counterparty: Address?,
        description: String
    ) {
        let userData: User? = self.users.get(userAddress);
        if (userData == null) { return; }
        let user: User = userData!!;
        let txId: Int = user.transactionCounter;
        user.transactions.set(txId, UserTransaction{
            txId: txId,
            timestamp: now(),
            txType: txType,
            amount: amount,
            level: level,
            stakeId: stakeId,
            assetType: assetType,
            counterparty: counterparty,
            description: description
        });
        user.transactionCounter = user.transactionCounter + 1;
        self.users.set(userAddress, user);
    }

    fun creditReferralEarning(recipient: Address, amount: Int, payer: Address, level: Int) {
        let userData: User? = self.users.get(recipient);
        if (userData == null) { return; }
        let user: User = userData!!;
        user.totalReferralEarned = user.totalReferralEarned + amount;
        user.totalEarned = user.totalEarned + amount;
        let txId: Int = user.transactionCounter;
        user.transactions.set(txId, UserTransaction{
            txId: txId,
            timestamp: now(),
            txType: self.TX_REFERRAL_COMMISSION,
            amount: amount,
            level: level,
            stakeId: 0,
            assetType: self.ASSET_TON,
            counterparty: payer,
            description: "Referral Commission"
        });
        user.transactionCounter = user.transactionCounter + 1;
        self.users.set(recipient, user);
    }

    fun creditSpilloverEarning(recipient: Address, amount: Int, payer: Address, level: Int) {
        let userData: User? = self.users.get(recipient);
        if (userData == null) { return; }
        let user: User = userData!!;
        user.totalSpilloverEarned = user.totalSpilloverEarned + amount;
        user.totalEarned = user.totalEarned + amount;
        let txId: Int = user.transactionCounter;
        user.transactions.set(txId, UserTransaction{
            txId: txId,
            timestamp: now(),
            txType: self.TX_SPILLOVER_REWARD,
            amount: amount,
            level: level,
            stakeId: 0,
            assetType: self.ASSET_TON,
            counterparty: payer,
            description: "Spillover Pool Reward"
        });
        user.transactionCounter = user.transactionCounter + 1;
        self.users.set(recipient, user);
    }

    //------------------------------------------------------------------
    // GETTER FUNCTIONS
    //------------------------------------------------------------------

    get fun getContractVersion(): Int {
        return 2;
    }

    get fun getUserInfo(userAddress: Address): User? {
        return self.users.get(userAddress);
    }

    get fun getPlatformStats(): PlatformStats {
        return PlatformStats{
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

    get fun getUserStakeIds(userAddress: Address): map<Int, Bool> {
        let user: User? = self.users.get(userAddress);
        if (user == null) {
            return emptyMap();
        }

        let stakeIds: map<Int, Bool> = emptyMap();
        let i: Int = 0;
        while (i < user!!.stakeCounter) {
            if (user!!.stakes.get(i) != null) {
                stakeIds.set(i, true);
            }
            i += 1;
        }

        return stakeIds;
    }

    get fun getStakeDetails(userAddress: Address, stakeId: Int): StakeDetails? {
        let user: User? = self.users.get(userAddress);
        if (user == null) {
            return null;
        }

        let stake: StakeInfo? = user!!.stakes.get(stakeId);
        if (stake == null) {
            return null;
        }

        let cs: StakeInfo = stake!!;
        let pending: Int = self.calculatePendingStakeReward(cs, now());

        return StakeDetails{
            stakeId: cs.stakeId,
            amount: cs.amount,
            startTime: cs.startTime,
            duration: cs.duration,
            vipClass: cs.vipClass,
            autoRestake: cs.autoRestake,
            lastClaim: cs.lastClaim,
            totalClaimed: cs.totalClaimed,
            isActive: cs.isActive,
            stakedAsset: cs.stakedAsset,
            pendingReward: pending
        };
    }

    get fun getUserReferralInfo(userAddress: Address): UserReferralInfo? {
        let user: User? = self.users.get(userAddress);
        if (user == null) {
            return null;
        }

        return UserReferralInfo{
            referrer: user!!.referrer,
            directReferrals: user!!.directReferrals,
            totalReferrals: user!!.totalReferrals,
            downlines: user!!.downlines
        };
    }

    get fun getUserEarningsInfo(userAddress: Address): UserEarningsInfo? {
        let user: User? = self.users.get(userAddress);
        if (user == null) {
            return null;
        }
        let u: User = user!!;

        let pendingStaking: Int = 0;
        let i: Int = 0;
        let currentTime: Int = now();
        while (i < u.stakeCounter) {
            let stakeOpt: StakeInfo? = u.stakes.get(i);
            if (stakeOpt != null) {
                pendingStaking = pendingStaking + self.calculatePendingStakeReward(stakeOpt!!, currentTime);
            }
            i = i + 1;
        }

        let totalClaimable: Int = u.pendingCheckInRewards + pendingStaking;

        return UserEarningsInfo{
            totalEarned: u.totalEarned,
            pendingCheckInRewards: u.pendingCheckInRewards,
            totalCheckInEarned: u.totalCheckInEarned,
            totalCheckInClaimed: u.totalCheckInClaimed,
            totalStakingClaimed: u.totalStakingClaimed,
            pendingStakingRewards: pendingStaking,
            totalReferralEarned: u.totalReferralEarned,
            totalSpilloverEarned: u.totalSpilloverEarned,
            totalClaimable: totalClaimable
        };
    }

    get fun getUserStakeSummary(userAddress: Address): UserStakeSummary {
        let userOpt: User? = self.users.get(userAddress);

        if (userOpt == null) {
            return UserStakeSummary{
                totalStakes: 0,
                activeStakes: 0,
                inactiveStakes: 0,
                pendingStakingRewards: 0
            };
        }

        let user: User = userOpt!!;
        let total: Int = user.stakeCounter;
        let active: Int = 0;
        let inactive: Int = 0;
        let pending: Int = 0;
        let i: Int = 0;
        let currentTime: Int = now();

        while (i < user.stakeCounter) {
            let stakeOpt: StakeInfo? = user.stakes.get(i);

            if (stakeOpt != null) {
                let stake: StakeInfo = stakeOpt!!;

                if (stake.isActive) {
                    active = active + 1;
                    pending = pending + self.calculatePendingStakeReward(stake, currentTime);
                } else {
                    inactive = inactive + 1;
                }
            }

            i = i + 1;
        }

        return UserStakeSummary{
            totalStakes: total,
            activeStakes: active,
            inactiveStakes: inactive,
            pendingStakingRewards: pending
        };
    }

    get fun getPlatformEarningsInfo(): PlatformEarningsInfo {
        let unclaimed: Int = self.totalCheckInRewardsAccrued - self.totalCheckInRewardsClaimed;
        return PlatformEarningsInfo{
            totalUsers: self.totalUsers,
            totalStakedTon: self.totalStakedTon,
            totalStakedUsdt: self.totalStakedUsdt,
            totalDistributed: self.totalDistributed,
            totalCheckInRewardsAccrued: self.totalCheckInRewardsAccrued,
            totalCheckInRewardsClaimed: self.totalCheckInRewardsClaimed,
            totalReferralRewardsPaid: self.totalReferralRewardsPaid,
            totalSpilloverRewardsPaid: self.totalSpilloverRewardsPaid,
            totalCreatorRewardsPaid: self.totalCreatorRewardsPaid,
            totalUnclaimedCheckInRewards: unclaimed,
            activeStakes: self.activeStakes,
            contractBalance: myBalance()
        };
    }

    //------------------------------------------------------------------
    // ADMIN / TREASURY GETTERS
    //
    // These answer "how much TON does the contract need, and when". They are paginated
    // on purpose: a getter that walked every user would grow past the get-method gas
    // limit the same way the spillover scan did.
    //------------------------------------------------------------------

    fun buildUserSnapshot(userAddress: Address, u: User, currentTime: Int): AdminUserSnapshot {
        let pendingTon: Int = 0;
        let pendingUsdt: Int = 0;
        let activeCount: Int = 0;
        let stakedTon: Int = 0;
        let stakedUsdt: Int = 0;
        let maturedTon: Int = 0;
        let maturedUsdt: Int = 0;

        let i: Int = 0;
        while (i < u.stakeCounter) {
            let stakeOpt: StakeInfo? = u.stakes.get(i);
            if (stakeOpt != null) {
                let st: StakeInfo = stakeOpt!!;
                if (st.isActive) {
                    activeCount = activeCount + 1;
                    let pending: Int = self.calculatePendingStakeReward(st, currentTime);
                    let isMatured: Bool = currentTime >= st.startTime + st.duration;

                    if (st.stakedAsset == self.ASSET_TON) {
                        stakedTon = stakedTon + st.amount;
                        pendingTon = pendingTon + pending;
                        if (isMatured && !st.autoRestake) {
                            maturedTon = maturedTon + st.amount;
                        }
                    } else {
                        stakedUsdt = stakedUsdt + st.amount;
                        pendingUsdt = pendingUsdt + pending;
                        if (isMatured && !st.autoRestake) {
                            maturedUsdt = maturedUsdt + st.amount;
                        }
                    }
                }
            }
            i = i + 1;
        }

        return AdminUserSnapshot{
            userAddress: userAddress,
            level: u.level,
            vipClass: u.vipClass,
            isActive: u.isActive,
            pendingCheckInRewards: u.pendingCheckInRewards,
            pendingStakingRewardsTon: pendingTon,
            pendingStakingRewardsUsdt: pendingUsdt,
            activeStakeCount: activeCount,
            activeStakedTon: stakedTon,
            activeStakedUsdt: stakedUsdt,
            maturedCapitalTon: maturedTon,
            maturedCapitalUsdt: maturedUsdt,
            tonDueNow: u.pendingCheckInRewards + pendingTon + maturedTon
        };
    }

    get fun getAdminUserSnapshot(userAddress: Address): AdminUserSnapshot? {
        let userOpt: User? = self.users.get(userAddress);
        if (userOpt == null) { return null; }
        return self.buildUserSnapshot(userAddress, userOpt!!, now());
    }

    // Page through with start = 0, limit = 50 and keep going while toIndex < totalUsers.
    get fun getAdminUserSnapshotsPaginated(start: Int, limit: Int): map<Int, AdminUserSnapshot> {
        let result: map<Int, AdminUserSnapshot> = emptyMap();
        let currentTime: Int = now();
        let end: Int = start + limit;
        if (end > self.totalUsers) { end = self.totalUsers; }

        let i: Int = start;
        while (i < end) {
            let addrOpt: Address? = self.userList.get(i);
            if (addrOpt != null) {
                let userOpt: User? = self.users.get(addrOpt!!);
                if (userOpt != null) {
                    result.set(i, self.buildUserSnapshot(addrOpt!!, userOpt!!, currentTime));
                }
            }
            i = i + 1;
        }
        return result;
    }

    // Same page window, aggregated. Sum tonDueNow across pages to get the amount the
    // contract must hold right now to satisfy every claim that is already claimable.
    //
    // Cost per page scales with how many stakes the users in that page hold, and get
    // methods have their own gas ceiling. Measured against 105 real users: a page of 25
    // succeeds, 30 exits -14. Callers should start around 20 and halve on failure rather
    // than assume a fixed page size keeps working as stakes accumulate.
    get fun getTreasuryLiabilities(start: Int, limit: Int): TreasuryLiabilities {
        let currentTime: Int = now();
        let end: Int = start + limit;
        if (end > self.totalUsers) { end = self.totalUsers; }

        let scanned: Int = 0;
        let checkIn: Int = 0;
        let pendingTon: Int = 0;
        let pendingUsdt: Int = 0;
        let maturedTon: Int = 0;
        let maturedUsdt: Int = 0;
        let stakedTon: Int = 0;
        let stakedUsdt: Int = 0;
        let activeCount: Int = 0;

        let i: Int = start;
        while (i < end) {
            let addrOpt: Address? = self.userList.get(i);
            if (addrOpt != null) {
                let userOpt: User? = self.users.get(addrOpt!!);
                if (userOpt != null) {
                    let snap: AdminUserSnapshot = self.buildUserSnapshot(addrOpt!!, userOpt!!, currentTime);
                    scanned = scanned + 1;
                    checkIn = checkIn + snap.pendingCheckInRewards;
                    pendingTon = pendingTon + snap.pendingStakingRewardsTon;
                    pendingUsdt = pendingUsdt + snap.pendingStakingRewardsUsdt;
                    maturedTon = maturedTon + snap.maturedCapitalTon;
                    maturedUsdt = maturedUsdt + snap.maturedCapitalUsdt;
                    stakedTon = stakedTon + snap.activeStakedTon;
                    stakedUsdt = stakedUsdt + snap.activeStakedUsdt;
                    activeCount = activeCount + snap.activeStakeCount;
                }
            }
            i = i + 1;
        }

        return TreasuryLiabilities{
            fromIndex: start,
            toIndex: end,
            usersScanned: scanned,
            pendingCheckInRewards: checkIn,
            pendingStakingRewardsTon: pendingTon,
            pendingStakingRewardsUsdt: pendingUsdt,
            maturedCapitalTon: maturedTon,
            maturedCapitalUsdt: maturedUsdt,
            activeStakedTon: stakedTon,
            activeStakedUsdt: stakedUsdt,
            activeStakeCount: activeCount,
            tonDueNow: checkIn + pendingTon + maturedTon
        };
    }

    // The contract's own jetton wallet. Read it before a USDT deposit: while this is
    // still the deploy default (the owner address) every USDT transfer notification is
    // rejected and the tokens strand in the jetton wallet.
    get fun getUsdtJettonWallet(): Address {
        return self.usdtJettonWalletAddress;
    }

    // Flat alternative to getUserInfo for clients on TON API v2. Same values, no nesting.
    get fun getUserSummary(userAddress: Address): UserSummary? {
        let u: User? = self.users.get(userAddress);
        if (u == null) { return null; }
        let user: User = u!!;
        return UserSummary{
            referrer: user.referrer,
            linkReferrer: user.linkReferrer,
            level: user.level,
            vipClass: user.vipClass,
            directReferrals: user.directReferrals,
            totalReferrals: user.totalReferrals,
            otherReferrals: user.otherReferrals,
            lastCheckIn: user.lastCheckIn,
            levelExpiration: user.levelExpiration,
            totalEarned: user.totalEarned,
            isActive: user.isActive,
            registrationTime: user.registrationTime,
            stakeCounter: user.stakeCounter
        };
    }

    get fun getContractConfig(): ContractConfig {
        return ContractConfig{
            owner: self.owner,
            creatorWallet1: self.creatorWallet1,
            creatorWallet2: self.creatorWallet2,
            creatorWallet3: self.creatorWallet3,
            creatorWallet4: self.creatorWallet4,
            usdtJettonWalletAddress: self.usdtJettonWalletAddress,
            distributorAddress: self.distributorAddress,
            isPaused: self.isPaused,
            importsLocked: self.importsLocked,
            forwardStakeCapital: self.forwardStakeCapital,
            deploymentNonce: self.deploymentNonce
        };
    }

    get fun getTreasuryStatus(): TreasuryStatus {
        return TreasuryStatus{
            contractBalance: myBalance(),
            minReserve: self.MIN_CONTRACT_RESERVE,
            totalUsers: self.totalUsers,
            unclaimedCheckInRewards: self.totalCheckInRewardsAccrued - self.totalCheckInRewardsClaimed,
            totalStakedTon: self.totalStakedTon,
            totalStakedUsdt: self.totalStakedUsdt,
            activeStakes: self.activeStakes,
            isPaused: self.isPaused,
            importsLocked: self.importsLocked,
            forwardStakeCapital: self.forwardStakeCapital,
            deploymentNonce: self.deploymentNonce
        };
    }

    get fun getUserListPaginated(start: Int, limit: Int): map<Int, Address> {
        let result: map<Int, Address> = emptyMap();
        let end: Int = start + limit;
        if (end > self.totalUsers) { end = self.totalUsers; }
        let i: Int = start;
        while (i < end) {
            let addrOpt: Address? = self.userList.get(i);
            if (addrOpt != null) { result.set(i, addrOpt!!); }
            i = i + 1;
        }
        return result;
    }

    get fun getUserTransaction(userAddress: Address, txId: Int): UserTransaction? {
        let user: User? = self.users.get(userAddress);
        if (user == null) { return null; }
        return user!!.transactions.get(txId);
    }

    get fun getUserTransactionCount(userAddress: Address): Int {
        let user: User? = self.users.get(userAddress);
        if (user == null) { return 0; }
        return user!!.transactionCounter;
    }

    get fun getUserTransactionsPaginated(userAddress: Address, start: Int, limit: Int): map<Int, UserTransaction> {
        let result: map<Int, UserTransaction> = emptyMap();
        let user: User? = self.users.get(userAddress);
        if (user == null) { return result; }
        let u: User = user!!;
        let end: Int = start + limit;
        if (end > u.transactionCounter) {
            end = u.transactionCounter;
        }
        let i: Int = start;
        while (i < end) {
            let tx: UserTransaction? = u.transactions.get(i);
            if (tx != null) {
                result.set(i, tx!!);
            }
            i = i + 1;
        }
        return result;
    }
}