import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import * as fs from 'fs';
import { TonCrown } from '../build/TonCrown/TonCrown_TonCrown';
import { TonCrown as DeployedNow } from '../build/DeployedNow/DeployedNow_TonCrown';
import '@ton/test-utils';

const NONCE = 0n;
const COSTS = ['0', '1.25', '2.51', '3.77', '5.03'];
const DAY = 86400;

/** Reach level 4, the first level that unlocks staking. */
async function toLevel4(c: any, u: SandboxContract<TreasuryContract>) {
    for (let l = 1; l <= 4; l++)
        await c.send(u.getSender(), { value: toNano(COSTS[l]) + toNano('0.05') },
            { $$type: 'UpgradeLevel', targetLevel: BigInt(l), referrerAddress: null });
}

describe('editable staking ROI', () => {
    let bc: Blockchain;
    let owner: SandboxContract<TreasuryContract>;
    let c: SandboxContract<TonCrown>;
    let alice: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        bc = await Blockchain.create();
        bc.now = Math.floor(Date.now() / 1000);
        owner = await bc.treasury('owner');
        alice = await bc.treasury('alice');

        c = bc.openContract(await TonCrown.fromInit(owner.address, NONCE));
        await c.send(owner.getSender(), { value: toNano('0.5') }, { $$type: 'Deploy', queryId: 0n });
        await owner.send({ to: c.address, value: toNano('2000'), bounce: false });
    });

    const setRoi = (vipClass: bigint, stakingRoi: bigint, from?: SandboxContract<TreasuryContract>) =>
        c.send((from ?? owner).getSender(), { value: toNano('0.05') },
            { $$type: 'SetVipRoi', vipClass, stakingRoi });

    // ---------------------------------------------------------------- access
    it('is owner-only', async () => {
        const res = await setRoi(1n, 50n, alice);
        expect(res.transactions).toHaveTransaction({ from: alice.address, to: c.address, success: false });
        expect((await c.getGetStakingRoiRates()).class1).toBe(95n);
    });

    it('caps the rate, so a slipped digit cannot commit the contract to 95%/day', async () => {
        const { maxAllowed } = await c.getGetStakingRoiRates();
        expect(maxAllowed).toBe(500n);

        const res = await setRoi(1n, 9500n);   // meant 95, typed 9500
        expect(res.transactions).toHaveTransaction({ to: c.address, success: false });
        expect((await c.getGetStakingRoiRates()).class1).toBe(95n);

        // the boundary itself is allowed
        await setRoi(1n, 500n);
        expect((await c.getGetStakingRoiRates()).class1).toBe(500n);
    });

    it('rejects classes that no stake can reference', async () => {
        for (const bad of [0n, 5n, 255n]) {
            const res = await setRoi(bad, 100n);
            expect(res.transactions).toHaveTransaction({ to: c.address, success: false });
        }
    });

    // ------------------------------------------------------- the gas margin
    it('keeps the advertised rate 0.05%/day above the paid rate', async () => {
        const { gasMargin } = await c.getGetStakingRoiRates();
        expect(gasMargin).toBe(5n);

        await setRoi(1n, 120n);
        const rates = await c.getGetStakingRoiRates();
        expect(rates.class1).toBe(120n);              // what actually gets paid
        expect(rates.class1 + rates.gasMargin).toBe(125n);   // what is advertised
    });

    // ------------------------------------------------------- what it pays
    it('changes what a stake actually accrues', async () => {
        await toLevel4(c, alice);
        await c.send(alice.getSender(), { value: toNano('100') + toNano('0.03') },
            { $$type: 'StakeTON', duration: 30n, autoRestake: false, referrerAddress: null });

        bc.now! += 10 * DAY + 10;
        const at95 = (await c.getGetStakeDetails(alice.address, 0n))!.pendingReward;
        expect(at95).toBe(toNano('100') * 95n * 10n / 10000n);

        await setRoi(1n, 190n);
        const at190 = (await c.getGetStakeDetails(alice.address, 0n))!.pendingReward;
        expect(at190).toBe(toNano('100') * 190n * 10n / 10000n);
    });

    // ------------------------------------- the retroactive behaviour, pinned
    it('REPRICES days already accrued but not yet claimed', async () => {
        await toLevel4(c, alice);
        await c.send(alice.getSender(), { value: toNano('100') + toNano('0.03') },
            { $$type: 'StakeTON', duration: 90n, autoRestake: false, referrerAddress: null });

        bc.now! += 20 * DAY + 10;
        const owedBefore = (await c.getGetStakeDetails(alice.address, 0n))!.pendingReward;
        expect(owedBefore).toBe(toNano('100') * 95n * 20n / 10000n);

        await setRoi(1n, 45n);   // roughly halved

        // all 20 elapsed days are repriced, not just the days from here on
        const owedAfter = (await c.getGetStakeDetails(alice.address, 0n))!.pendingReward;
        expect(owedAfter).toBe(toNano('100') * 45n * 20n / 10000n);
        expect(owedAfter).toBeLessThan(owedBefore);
    });

    it('but a claim first confines the change to future days', async () => {
        await toLevel4(c, alice);
        await c.send(alice.getSender(), { value: toNano('100') + toNano('0.03') },
            { $$type: 'StakeTON', duration: 90n, autoRestake: false, referrerAddress: null });

        // 20 days at the old rate, then claim — which resets lastClaim without ending the stake
        bc.now! += 20 * DAY + 10;
        const paidOut = (await c.getGetStakeDetails(alice.address, 0n))!.pendingReward;
        expect(paidOut).toBe(toNano('100') * 95n * 20n / 10000n);
        await c.send(alice.getSender(), { value: toNano('0.05') },
            { $$type: 'ClaimStakingRewards', stakeId: 0n });

        const afterClaim = (await c.getGetStakeDetails(alice.address, 0n))!;
        expect(afterClaim.totalClaimed).toBe(paidOut);
        expect(afterClaim.isActive).toBe(true);          // still staking

        // now cut the rate and run 10 more days
        await setRoi(1n, 45n);
        bc.now! += 10 * DAY;

        // only the new 10 days price at the new rate; the 20 paid days are untouched
        const after = (await c.getGetStakeDetails(alice.address, 0n))!;
        expect(after.pendingReward).toBe(toNano('100') * 45n * 10n / 10000n);
        expect(after.totalClaimed).toBe(paidOut);
    });

    it('each class moves independently', async () => {
        await setRoi(2n, 300n);
        const r = await c.getGetStakingRoiRates();
        expect([r.class1, r.class2, r.class3, r.class4]).toEqual([95n, 300n, 195n, 250n]);
    });
});

/**
 * The point of the whole exercise: this ships as a SETCODE upgrade, with no migration.
 * DeployedNow is the exact source now running on mainnet — its build hash matches the
 * live code hash — so this is the real upgrade, not an approximation of it.
 */
describe('shipping SetVipRoi to the live contract', () => {
    let bc: Blockchain;
    let owner: SandboxContract<TreasuryContract>;
    let live: SandboxContract<DeployedNow>;
    let alice: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        bc = await Blockchain.create();
        bc.now = Math.floor(Date.now() / 1000);
        owner = await bc.treasury('owner');
        alice = await bc.treasury('alice');

        live = bc.openContract(await DeployedNow.fromInit(owner.address, NONCE));
        await live.send(owner.getSender(), { value: toNano('0.5') }, { $$type: 'Deploy', queryId: 0n });
        await owner.send({ to: live.address, value: toNano('2000'), bounce: false });

        await toLevel4(live, alice);
        await live.send(alice.getSender(), { value: toNano('100') + toNano('0.03') },
            { $$type: 'StakeTON', duration: 90n, autoRestake: false, referrerAddress: null });
        await live.send(alice.getSender(), { value: toNano('0.05') }, { $$type: 'CheckIn' });
    });

    it('has no way to change ROI before the upgrade', () => {
        const deployedWrapper = fs.readFileSync('build/DeployedNow/DeployedNow_TonCrown.ts', 'utf8');
        expect(deployedWrapper).not.toContain('SetVipRoi');
        expect(deployedWrapper).not.toContain('getStakingRoiRates');
    });

    it('upgrades in place, keeps every record, and the rate becomes editable', async () => {
        const addressBefore = live.address.toString();
        const userBefore = (await live.getGetUserInfo(alice.address))!;
        const stakeBefore = (await live.getGetStakeDetails(alice.address, 0n))!;
        const statsBefore = await live.getGetPlatformStats();
        const balanceBefore = (await bc.getContract(live.address)).balance;

        const newCode = (await TonCrown.fromInit(owner.address, NONCE)).init!.code;
        const res = await live.send(owner.getSender(), { value: toNano('0.1') },
            { $$type: 'UpgradeContract', code: newCode });
        expect(res.transactions).toHaveTransaction({ from: owner.address, to: live.address, success: true });

        const upgraded = bc.openContract(TonCrown.fromAddress(live.address));

        // same account, same money, same state. The balance RISES by the value attached
        // to the upgrade message less gas, so the property worth asserting is that the
        // swap consumes none of the treasury backing user stakes.
        expect(upgraded.address.toString()).toBe(addressBefore);
        const balanceAfter = (await bc.getContract(live.address)).balance;
        expect(balanceAfter).toBeGreaterThanOrEqual(balanceBefore);
        expect(balanceAfter - balanceBefore).toBeLessThanOrEqual(toNano('0.1'));

        const userAfter = (await upgraded.getGetUserInfo(alice.address))!;
        expect(userAfter.level).toBe(userBefore.level);
        expect(userAfter.registrationTime).toBe(userBefore.registrationTime);
        expect(userAfter.totalEarned).toBe(userBefore.totalEarned);
        expect(userAfter.pendingCheckInRewards).toBe(userBefore.pendingCheckInRewards);

        const stakeAfter = (await upgraded.getGetStakeDetails(alice.address, 0n))!;
        expect(stakeAfter.amount).toBe(stakeBefore.amount);
        expect(stakeAfter.startTime).toBe(stakeBefore.startTime);
        expect(stakeAfter.lastClaim).toBe(stakeBefore.lastClaim);
        expect(await upgraded.getGetPlatformStats()).toEqual(statsBefore);

        // rates carried over untouched by the upgrade itself
        const rates = await upgraded.getGetStakingRoiRates();
        expect([rates.class1, rates.class2, rates.class3]).toEqual([95n, 145n, 195n]);

        // and now the knob exists
        await upgraded.send(owner.getSender(), { value: toNano('0.05') },
            { $$type: 'SetVipRoi', vipClass: 1n, stakingRoi: 150n });
        expect((await upgraded.getGetStakingRoiRates()).class1).toBe(150n);

        // the existing stake keeps running and pays out at the new rate
        bc.now! += 5 * DAY + 10;
        const owed = (await upgraded.getGetStakeDetails(alice.address, 0n))!.pendingReward;
        expect(owed).toBe(toNano('100') * 150n * 5n / 10000n);
        const claim = await upgraded.send(alice.getSender(), { value: toNano('0.05') },
            { $$type: 'ClaimStakingRewards', stakeId: 0n });
        expect(claim.transactions).toHaveTransaction({ to: live.address, success: true });
    });
});
