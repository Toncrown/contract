// import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
// import { toNano, Address, beginCell } from '@ton/core';
// import { 
//     TonCrown, 
//     UpgradeLevel, 
//     StakeTON, 
//     ClaimStakingRewards, 
//     SetDistributor,
//     DistributeDailyRewards,
//     Deploy 
// } from '../build/TonCrown/TonCrown_TonCrown';
// import '@ton/test-utils';

// describe('TonCrown Contract Tests', () => {
//     let blockchain: Blockchain;
//     let owner: SandboxContract<TreasuryContract>;
//     let distributor: SandboxContract<TreasuryContract>;
//     let tonCrown: SandboxContract<TonCrown>;
//     let users: SandboxContract<TreasuryContract>[];
//     const MIN_GAS = toNano('0.1');

//     beforeEach(async () => {
//         blockchain = await Blockchain.create();
//         owner = await blockchain.treasury('owner');
//         distributor = await blockchain.treasury('distributor');
//         users = [];
//         for (let i = 0; i < 10; i++) {
//             users.push(await blockchain.treasury(`user${i}`));
//         }

//         tonCrown = blockchain.openContract(await TonCrown.fromInit(owner.address));
        
//         const deployMsg: Deploy = { $$type: 'Deploy', queryId: 0n };
//         const deployResult = await tonCrown.send(owner.getSender(), { value: toNano('0.5') }, deployMsg);
//         expect(deployResult.transactions).toHaveTransaction({ from: owner.address, to: tonCrown.address, deploy: true, success: true });

//         const setDistributorMsg: SetDistributor = { $$type: 'SetDistributor', address: distributor.address };
//         await tonCrown.send(owner.getSender(), { value: MIN_GAS }, setDistributorMsg);
//     });

//     // Helper to reliably upgrade a user to a specific level
//     async function upgradeUserToLevel(user: SandboxContract<TreasuryContract>, level: number, referrer: Address | null = null) {
//         for (let i = 1; i <= level; i++) {
//             const cost = toNano('5.5'); // Generous amount for any level
//             const upgradeMessage: UpgradeLevel = {$$type: 'UpgradeLevel', targetLevel: BigInt(i), referrerAddress: i === 1 ? referrer : null};
//             const result = await tonCrown.send(user.getSender(), { value: cost + MIN_GAS }, upgradeMessage);
//             expect(result.transactions).toHaveTransaction({ from: user.address, to: tonCrown.address, success: true });
//         }
//     }

//     it('should register a new user and handle check-in', async () => {
//         // Step 1: Register User
//         await upgradeUserToLevel(users[0], 1);
        
//         const userInfo = await tonCrown.getGetUserInfo(users[0].address);
//         expect(userInfo).not.toBeNull();
//         expect(userInfo!.level).toBe(1n);

//         // Step 2: Check-in
//         const dailyReward = TonCrown.DAILY_CHECKIN_REWARD;
//         const checkInResult = await tonCrown.send(users[0].getSender(), { value: MIN_GAS }, { $$type: 'CheckIn' });
//         expect(checkInResult.transactions).toHaveTransaction({ from: tonCrown.address, to: users[0].address, success: true, value: dailyReward });
//     });

//     it('should allow a VIP user to stake and have rewards distributed', async () => {
//         // Step 1: Upgrade to VIP
//         await upgradeUserToLevel(users[0], 4);

//         // Step 2: Stake TON
//         const stakeAmount = toNano('10');
//         await tonCrown.send(users[0].getSender(), { value: stakeAmount + MIN_GAS }, { $$type: 'StakeTON', duration: 14n, autoRestake: true, referrerAddress: null });
        
//         let userInfo = await tonCrown.getGetUserInfo(users[0].address);
//         expect(userInfo!.stakes.get(0n)).toBeDefined();

//         // Step 3: Advance time and distribute rewards
//         blockchain.now! += 86400; // 1 day
//         const dailyReward = (stakeAmount * 95n) / 10000n;
//         const netReward = dailyReward - TonCrown.DISTRIBUTION_GAS_FEE;
        
//         const distributeMsg: DistributeDailyRewards = { $$type: 'DistributeDailyRewards', user: users[0].address, stakeId: 0n };
//         const result = await tonCrown.send(distributor.getSender(), { value: MIN_GAS }, distributeMsg);
//         expect(result.transactions).toHaveTransaction({ from: tonCrown.address, to: users[0].address, success: true, value: netReward });
//     });

//     it('should finalize stake and return capital', async () => {
//         await upgradeUserToLevel(users[0], 4);
//         const stakeAmount = toNano('2');
//         const stakeDurationDays = 14n;
        
//         await tonCrown.send(users[0].getSender(), { value: stakeAmount + MIN_GAS }, { $$type: 'StakeTON', duration: stakeDurationDays, autoRestake: false, referrerAddress: null });

//         // Advance time past the end of the stake
//         blockchain.now! += Number(stakeDurationDays) * 86400 + 1;
        
//         const claimMsg: ClaimStakingRewards = { $$type: 'ClaimStakingRewards', stakeId: 0n };
//         const result = await tonCrown.send(users[0].getSender(), { value: MIN_GAS }, claimMsg);

//         const totalReward = ((stakeAmount * 95n) / 10000n) * stakeDurationDays;
//         const netReward = totalReward - TonCrown.DISTRIBUTION_GAS_FEE;
        
//         expect(result.transactions).toHaveTransaction({ from: tonCrown.address, to: users[0].address, value: stakeAmount });
//         expect(result.transactions).toHaveTransaction({ from: tonCrown.address, to: users[0].address, value: netReward });

//         const userInfo = await tonCrown.getGetUserInfo(users[0].address);
//         expect(userInfo!.stakes.get(0n)!.isActive).toBe(false);
//     });
// });