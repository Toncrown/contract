import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { TonCrown } from '../build/TonCrown/TonCrown_TonCrown';
import '@ton/test-utils';

const NONCE = 0n;
const COSTS = ['0', '1.25', '2.51', '3.77', '5.03'];
const DAY = 86400;

/**
 * How does a staker get their principal back?
 *
 * There is no automatic release. Capital is returned only inside processRewardPayout,
 * which is reached only by ClaimStakingRewards (the staker) or DistributeDailyRewards
 * (the distributor). Nothing in the contract pays out on a timer.
 *
 * NOTE: DistributeDailyRewards is not used in production. distributorAddress is set to
 * the contract's own address, and a contract cannot message itself, so that path cannot
 * fire. The tests below still cover it because the receiver exists, but in practice the
 * staker's own claim is the ONLY way capital comes back.
 *
 * That matters because processRewardPayout opens with `require(total > 0)`, and
 * calculatePendingStakeReward caps elapsed time at maturity and floors it to whole days.
 * So a stake whose lastClaim sits less than 24h before maturity can never produce a
 * positive reward again — and the principal rides on the same call.
 */
describe('getting the principal back', () => {
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
        await owner.send({ to: c.address, value: toNano('3000'), bounce: false });

        for (let l = 1; l <= 4; l++)
            await c.send(alice.getSender(), { value: toNano(COSTS[l]) + toNano('0.05') },
                { $$type: 'UpgradeLevel', targetLevel: BigInt(l), referrerAddress: null });
    });

    const stake = (days: bigint, autoRestake = false) =>
        c.send(alice.getSender(), { value: toNano('100') + toNano('0.03') },
            { $$type: 'StakeTON', duration: days, autoRestake, referrerAddress: null });

    const claim = () =>
        c.send(alice.getSender(), { value: toNano('0.05') },
            { $$type: 'ClaimStakingRewards', stakeId: 0n });

    it('does NOT release the principal on its own at maturity', async () => {
        await stake(30n);
        const balBefore = await alice.getBalance();

        // walk well past maturity without the staker doing anything
        bc.now! += 60 * DAY;

        const s = (await c.getGetStakeDetails(alice.address, 0n))!;
        expect(s.isActive).toBe(true);                       // still open
        expect(await alice.getBalance()).toBeLessThan(balBefore + toNano('1'));  // nothing arrived

        // it takes an explicit claim
        await claim();
        const after = (await c.getGetStakeDetails(alice.address, 0n))!;
        expect(after.isActive).toBe(false);
        expect(await alice.getBalance()).toBeGreaterThan(balBefore + toNano('100'));
    });

    it('the distributor can push it on the user\'s behalf', async () => {
        await stake(30n);
        await c.send(owner.getSender(), { value: toNano('0.05') },
            { $$type: 'SetDistributor', address: owner.address });
        bc.now! += 31 * DAY;

        const balBefore = await alice.getBalance();
        const res = await c.send(owner.getSender(), { value: toNano('0.1') },
            { $$type: 'DistributeDailyRewards', user: alice.address, stakeId: 0n });
        expect(res.transactions).toHaveTransaction({ from: owner.address, to: c.address, success: true });

        expect((await c.getGetStakeDetails(alice.address, 0n))!.isActive).toBe(false);
        expect(await alice.getBalance()).toBeGreaterThan(balBefore + toNano('100'));
    });

    // ---------------------------------------------------------------- the trap
    it('LOCKS the principal if the staker claims inside the final 24 hours', async () => {
        await stake(30n);

        // a perfectly reasonable thing to do: claim shortly before the term ends
        bc.now! += 29 * DAY + 12 * 3600;      // day 29.5
        const res = await claim();
        expect(res.transactions).toHaveTransaction({ to: c.address, success: true });

        const mid = (await c.getGetStakeDetails(alice.address, 0n))!;
        expect(mid.isActive).toBe(true);

        // now let it mature, and keep going for a year
        bc.now! += 365 * DAY;

        // maturity caps elapsed time at endTime, and endTime - lastClaim is 12h,
        // which floors to zero whole days
        const owed = (await c.getGetStakeDetails(alice.address, 0n))!.pendingReward;
        expect(owed).toBe(0n);

        const balBefore = await alice.getBalance();
        const fail = await claim();
        expect(fail.transactions).toHaveTransaction({ to: c.address, success: false });

        // stake still open, principal still in the contract, and no path to it
        const stuck = (await c.getGetStakeDetails(alice.address, 0n))!;
        expect(stuck.isActive).toBe(true);
        expect(stuck.amount).toBe(toNano('100'));
        expect(await alice.getBalance()).toBeLessThan(balBefore);   // only lost gas
    });

    it('the distributor cannot rescue a locked stake either', async () => {
        await stake(30n);
        await c.send(owner.getSender(), { value: toNano('0.05') },
            { $$type: 'SetDistributor', address: owner.address });

        bc.now! += 29 * DAY + 12 * 3600;
        await claim();
        bc.now! += 90 * DAY;

        const res = await c.send(owner.getSender(), { value: toNano('0.1') },
            { $$type: 'DistributeDailyRewards', user: alice.address, stakeId: 0n });
        expect(res.transactions).toHaveTransaction({ to: c.address, success: false });
        expect((await c.getGetStakeDetails(alice.address, 0n))!.isActive).toBe(true);
    });

    it('claiming a full day or more before maturity is fine', async () => {
        await stake(30n);
        bc.now! += 28 * DAY;                 // 2 days of headroom
        await claim();

        bc.now! += 5 * DAY;                  // past maturity
        const balBefore = await alice.getBalance();
        const res = await claim();
        expect(res.transactions).toHaveTransaction({ to: c.address, success: true });
        expect((await c.getGetStakeDetails(alice.address, 0n))!.isActive).toBe(false);
        expect(await alice.getBalance()).toBeGreaterThan(balBefore + toNano('100'));
    });
});
