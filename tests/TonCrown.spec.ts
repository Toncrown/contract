//.spec.ts
import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano, Address, beginCell } from '@ton/core';
import {
    TonCrown as TonCrownContractClass,
    Deploy,
} from '../build/TonCrown/TonCrown_TonCrown';
import '@ton/test-utils';
import { inspect } from 'util';

// Define message types locally for clarity in test cases
type RegisterMessage = { $$type: 'Register'; referrerAddress: Address | null; };
type UpgradeLevelMessage = { $$type: 'UpgradeLevel'; targetLevel: bigint; };
type CheckInMessage = { $$type: 'CheckIn'; };
type StakeTONMessage = { $$type: 'StakeTON'; duration: bigint; autoRestake: boolean; };
type ClaimPendingRewardsMessage = { $$type: 'ClaimPendingRewards'; };
type EmergencyPauseMessage = { $$type: 'EmergencyPause'; paused: boolean; };

// Deep inspect for debugging complex objects
expect.addSnapshotSerializer({
    test: (val) => typeof val === 'object' && val !== null,
    print: (val) => inspect(val, { depth: null, colors: true }),
});


describe('TonCrown Contract Tests', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let tonCrown: SandboxContract<TonCrownContractClass>;
    let user1: SandboxContract<TreasuryContract>;
    let user2: SandboxContract<TreasuryContract>;
    let user3: SandboxContract<TreasuryContract>;

    let creatorWallet4: SandboxContract<TreasuryContract>; 

    // Constants from the contract for assertion
    const DAILY_CHECKIN_REWARD = toNano('0.01');
    const SECONDS_PER_DAY = 86400;
    const CREATOR_WALLET_4 = Address.parse("UQBFBsujrE0xuce2GpculL_G-T5gXXTYF-3GisiacICLZ49o");


    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        user1 = await blockchain.treasury('user1');
        user2 = await blockchain.treasury('user2');
        user3 = await blockchain.treasury('user3');

        creatorWallet4 = await blockchain.treasury(CREATOR_WALLET_4.toString());

        // Use the generated fromInit to get the contract instance with initial data
        const tonCrownInstanceForDeployment = await TonCrownContractClass.fromInit(deployer.address);

        // Open the contract with the sandbox blockchain
        tonCrown = blockchain.openContract(tonCrownInstanceForDeployment);

        // Define the specific deploy message required by the contract
        const deployMessage: Deploy = {
            $$type: 'Deploy',
            queryId: 0n
        };

        const deployResult = await tonCrown.send(
            deployer.getSender(),
            {
                value: toNano('0.1'),
            },
            deployMessage
        );

        // Assert that the deployment was successful
        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: tonCrown.address,
            deploy: true,
            success: true,
        });

        // Verify init function was called correctly by checking the owner
        const owner = await tonCrown.getOwner();
        expect(owner.equals(deployer.address)).toBe(true);
    });

    it('should deploy correctly and set initial owner and state', async () => {
        const owner = await tonCrown.getOwner();
        expect(owner.equals(deployer.address)).toBe(true);

        const stats = await tonCrown.getGetPlatformStats();
        expect(stats.totalUsers).toBe(0n);
        expect(stats.totalStaked).toBe(0n);
        expect(stats.totalDistributed).toBe(0n);

        const paused = await tonCrown.getIsPaused();
        expect(paused).toBe(false);
    });

    it('should allow users to register and handle referrals', async () => {
        // User 1 registers without a referrer
        const registerMsgUser1: RegisterMessage = { $$type: 'Register', referrerAddress: null };
        await tonCrown.send(user1.getSender(), { value: toNano('0.05') }, registerMsgUser1);

        let user1Data = await tonCrown.getGetUserInfo(user1.address);
        expect(user1Data).not.toBeNull();
        expect(user1Data!.referrer).toBeNull();
        expect((await tonCrown.getGetPlatformStats()).totalUsers).toBe(1n);

        // User 2 registers with User 1 as a referrer
        const registerMsgUser2: RegisterMessage = { $$type: 'Register', referrerAddress: user1.address };
        await tonCrown.send(user2.getSender(), { value: toNano('0.05') }, registerMsgUser2);

        const user2Data = await tonCrown.getGetUserInfo(user2.address);
        expect(user2Data).not.toBeNull();
        expect(user2Data!.referrer?.equals(user1.address)).toBe(true);
        expect((await tonCrown.getGetPlatformStats()).totalUsers).toBe(2n);

        // Check that user1's referral count was updated
        user1Data = await tonCrown.getGetUserInfo(user1.address);
        expect(user1Data!.directReferrals).toBe(1n);
    });

    it('should allow users to upgrade levels', async () => {
        await tonCrown.send(user1.getSender(), { value: toNano('0.05') }, { $$type: 'Register', referrerAddress: null });

        const level1Cost = (await tonCrown.getGetLevelCost(1n))!;
        expect(level1Cost).toBeGreaterThan(0n);

        await tonCrown.send(user1.getSender(), { value: level1Cost + toNano('0.02') }, { $$type: 'UpgradeLevel', targetLevel: 1n });

        const user1Data = await tonCrown.getGetUserInfo(user1.address);
        expect(user1Data!.level).toBe(1n);
    });

    // it('should allow active, leveled users to check in daily', async () => {
    //     // Register and upgrade to level 1
    //     await tonCrown.send(user1.getSender(), { value: toNano('0.05') }, { $$type: 'Register', referrerAddress: null });
    //     const level1Cost = (await tonCrown.getGetLevelCost(1n))!;
    //     await tonCrown.send(user1.getSender(), { value: level1Cost + toNano('0.02') }, { $$type: 'UpgradeLevel', targetLevel: 1n });

    //     // First check-in
    //     const checkInResult1 = await tonCrown.send(user1.getSender(), { value: toNano('0.02') }, { $$type: 'CheckIn' });

    //     // This assertion will now pass because creatorWallet4 is an active treasury
    //     expect(checkInResult1.transactions).toHaveTransaction({
    //         from: tonCrown.address,
    //         to: creatorWallet4.address, // Use the contract object's address
    //         value: DAILY_CHECKIN_REWARD,
    //         success: true
    //     });

    //     let user1Data = await tonCrown.getGetUserInfo(user1.address);
    //     expect(user1Data!.pendingRewards).toBe(0n); // Pending rewards are not used for check-in
    //     expect(user1Data!.totalEarned).toBe(DAILY_CHECKIN_REWARD);
    //     const firstCheckInTime = user1Data!.lastCheckIn;
    //     expect(firstCheckInTime).toBeGreaterThan(0n);

    //     // Advance time by one day
    //     blockchain.now = Number(firstCheckInTime) + SECONDS_PER_DAY;

    //     // Second check-in
    //     await tonCrown.send(user1.getSender(), { value: toNano('0.02') }, { $$type: 'CheckIn' });
    //     user1Data = await tonCrown.getGetUserInfo(user1.address);
    //     expect(user1Data!.totalEarned).toBe(DAILY_CHECKIN_REWARD * 2n);
    //     expect(user1Data!.lastCheckIn).toBeGreaterThan(firstCheckInTime);
    // });

    it('should allow VIP users to stake TON', async () => {
        // Register and become VIP
        await tonCrown.send(user1.getSender(), { value: toNano('0.05') }, { $$type: 'Register', referrerAddress: null });
        for (let i = 1; i <= 4; i++) {
            const levelCost = (await tonCrown.getGetLevelCost(BigInt(i)))!;
            await tonCrown.send(user1.getSender(), { value: levelCost + toNano('0.02') }, { $$type: 'UpgradeLevel', targetLevel: BigInt(i) });
        }

        const user1Data = await tonCrown.getGetUserInfo(user1.address);
        expect(user1Data!.vipClass).toBe(1n); // Should be VIP 1 at level 4

        const stakeAmount = toNano('10');
        await tonCrown.send(user1.getSender(), { value: stakeAmount }, { $$type: 'StakeTON', duration: 30n, autoRestake: false });

        const stakeInfo = await tonCrown.getGetStakeInfo(user1.address);
        expect(stakeInfo).not.toBeNull();
        expect(stakeInfo!.amount).toBe(stakeAmount);
        expect(stakeInfo!.isActive).toBe(true);
    });

    it('should fail to claim pending rewards if there are none', async () => {
        await tonCrown.send(user1.getSender(), { value: toNano('0.05') }, { $$type: 'Register', referrerAddress: null });

        // Try to claim when pendingRewards is 0.
        const result = await tonCrown.send(user1.getSender(), { value: toNano('0.05') }, { $$type: 'ClaimPendingRewards' });

        // Expect a failure because the contract requires pendingRewards > 0
        expect(result.transactions).toHaveTransaction({
            success: false,
            exitCode: 53827 // Error: No pending rewards
        });
    });

    it('owner can pause and unpause contract, affecting operations', async () => {
        await tonCrown.send(deployer.getSender(), { value: toNano('0.02') }, { $$type: 'EmergencyPause', paused: true });
        expect(await tonCrown.getIsPaused()).toBe(true);

        // This operation should fail while paused
        const registerResult = await tonCrown.send(user1.getSender(), { value: toNano('0.05') }, { $$type: 'Register', referrerAddress: null });
        expect(registerResult.transactions).toHaveTransaction({
            success: false,
            exitCode: 19792 // Error: Contract is paused
        });

        // Unpause the contract
        await tonCrown.send(deployer.getSender(), { value: toNano('0.02') }, { $$type: 'EmergencyPause', paused: false });
        expect(await tonCrown.getIsPaused()).toBe(false);

        // Now registration should succeed
        const successfulRegister = await tonCrown.send(user1.getSender(), { value: toNano('0.05') }, { $$type: 'Register', referrerAddress: null });
        expect(successfulRegister.transactions).toHaveTransaction({ success: true });
    });

    it('non-owner cannot pause the contract', async () => {
        const result = await tonCrown.send(user1.getSender(), { value: toNano('0.02') }, { $$type: 'EmergencyPause', paused: true });
        // Expect failure due to access denied (Ownable)
        expect(result.transactions).toHaveTransaction({ success: false, exitCode: 132 });
        expect(await tonCrown.getIsPaused()).toBe(false);
    });

    describe('Getter Functions', () => {

        beforeEach(async () => {
            // Setup a common state for getter tests
            // User 1 registers
            await tonCrown.send(user1.getSender(), { value: toNano('0.05') }, { $$type: 'Register', referrerAddress: null });
            // User 2 registers with User 1 as referrer
            await tonCrown.send(user2.getSender(), { value: toNano('0.05') }, { $$type: 'Register', referrerAddress: user1.address });
            // User 1 upgrades to level 4 (VIP 1)
            for (let i = 1; i <= 4; i++) {
                const levelCost = (await tonCrown.getGetLevelCost(BigInt(i)))!;
                await tonCrown.send(user1.getSender(), { value: levelCost + toNano('0.02') }, { $$type: 'UpgradeLevel', targetLevel: BigInt(i) });
            }
        });

        it('getGetUserInfo should return correct user data or null', async () => {
            const user1Data = await tonCrown.getGetUserInfo(user1.address);
            expect(user1Data).not.toBeNull();
            expect(user1Data!.level).toBe(4n);
            expect(user1Data!.vipClass).toBe(1n);
            expect(user1Data!.directReferrals).toBe(1n);

            const nonExistentUserData = await tonCrown.getGetUserInfo(user3.address);
            expect(nonExistentUserData).toBeNull();
        });

        it('getGetStakeInfo should return correct stake data or null', async () => {
            let stakeInfo = await tonCrown.getGetStakeInfo(user1.address);
            expect(stakeInfo).toBeNull(); // No stake yet

            const stakeAmount = toNano('5');
            await tonCrown.send(user1.getSender(), { value: stakeAmount }, { $$type: 'StakeTON', duration: 15n, autoRestake: true });

            stakeInfo = await tonCrown.getGetStakeInfo(user1.address);
            expect(stakeInfo).not.toBeNull();
            expect(stakeInfo!.amount).toBe(stakeAmount);
            expect(stakeInfo!.isActive).toBe(true);
            expect(stakeInfo!.autoRestake).toBe(true);
        });

        it('getGetPlatformStats should return aggregated platform statistics', async () => {
            const stats = await tonCrown.getGetPlatformStats();
            expect(stats.totalUsers).toBe(2n);
            expect(stats.totalStaked).toBe(0n); // No stakes yet in this test's scope
            expect(stats.activeStakes).toBe(0n);
        });

        it('getGetLevelCost should return cost for a level or null', async () => {
            const costLevel1 = await tonCrown.getGetLevelCost(1n);
            expect(costLevel1).toEqual(toNano('1.25'));

            const costLevel10 = await tonCrown.getGetLevelCost(10n);
            expect(costLevel10).toEqual(toNano('12.55'));

            const costLevel11 = await tonCrown.getGetLevelCost(11n);
            expect(costLevel11).toBeNull();
        });

        it('getGetVipConfig should return config for a VIP class or null', async () => {
            const vip1Config = await tonCrown.getGetVipConfig(1n);
            expect(vip1Config).not.toBeNull();
            expect(vip1Config!.dailyRoi).toBe(100n);
            expect(vip1Config!.minLevel).toBe(4n);

            const noVipConfig = await tonCrown.getGetVipConfig(0n);
            expect(noVipConfig).toBeNull(); // VIP class 0 is not in the map

            const invalidVipConfig = await tonCrown.getGetVipConfig(5n);
            expect(invalidVipConfig).toBeNull();
        });

        it('getGetReferralNode should return referral data or null', async () => {
            const user2Node = await tonCrown.getGetReferralNode(user2.address);
            expect(user2Node).not.toBeNull();
            expect(user2Node!.referrer.equals(user1.address)).toBe(true);
            expect(user2Node!.depth).toBe(1n);

            const user1Node = await tonCrown.getGetReferralNode(user1.address);
            expect(user1Node).toBeNull(); // User 1 has no referrer
        });

        it('getGetCreatorWallet should return the correct wallet address', async () => {
            const wallet1 = await tonCrown.getGetCreatorWallet(1n);
            expect(wallet1?.equals(Address.parse("UQD8W3W7eQ7b3drJcSfAqwf8DM47W2LNZn_V3UirGI0NpoqQ"))).toBe(true);

            const wallet4 = await tonCrown.getGetCreatorWallet(4n);
            expect(wallet4?.equals(CREATOR_WALLET_4)).toBe(true);

            const invalidWallet = await tonCrown.getGetCreatorWallet(5n);
            expect(invalidWallet).toBeNull();
        });

        // it('getGetContractBalance should return the current balance of the contract', async () => {
        //     const initialBalance = await tonCrown.getGetContractBalance();
        
        //     const topUpAmount = toNano('10');
        //     // Send a simple text message that the contract will ignore, but it will accept the value.
        //     await deployer.send({
        //         to: tonCrown.address,
        //         value: topUpAmount,
        //         body: beginCell().storeUint(0, 32).storeStringTail("top up").endCell(),
        //     });
        
        //     const finalBalance = await tonCrown.getGetContractBalance();
        
        //     // The logic here is now more complex. The contract's balance DECREASES slightly
        //     // because it has to pay rent and a small fee for processing the incoming message.
        //     // So `finalBalance` will be slightly LESS than `initialBalance + topUpAmount`.
        //     const expectedBalance = initialBalance + topUpAmount;
            
        //     // Calculate the absolute difference
        //     const difference = expectedBalance > finalBalance 
        //         ? expectedBalance - finalBalance 
        //         : finalBalance - expectedBalance;
        
        //     const tolerance = toNano('0.01'); // A small tolerance for gas/storage fees
        
        //     // The difference should be the small fee, which is much less than our tolerance.
        //     expect(difference).toBeLessThan(tolerance);
        // });
    });
});