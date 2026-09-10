import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { TonCrown } from '../build/TonCrown/TonCrown_TonCrown';
import { TonCrown as DeployedNow } from '../build/DeployedNow/DeployedNow_TonCrown';
import '@ton/test-utils';

const NONCE = 0n;
const COSTS = ['0', '1.25', '2.51', '3.77', '5.03'];
const DAY = 86400;

async function toLevel4(c: any, u: SandboxContract<TreasuryContract>) {
    for (let l = 1; l <= 4; l++)
        await c.send(u.getSender(), { value: toNano(COSTS[l]) + toNano('0.05') },
            { $$type: 'UpgradeLevel', targetLevel: BigInt(l), referrerAddress: null });
}

describe('maturity release', () => {
    let bc: Blockchain;
    let owner: SandboxContract<TreasuryContract>;
    let c: SandboxContract<TonCrown>;
    let alice: SandboxContract<TreasuryContract>;
    let keeper: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        bc = await Blockchain.create();
        bc.now = Math.floor(Date.now() / 1000);
        owner = await bc.treasury('owner');
        alice = await bc.treasury('alice');
        keeper = await bc.treasury('keeper');

        c = bc.openContract(await TonCrown.fromInit(owner.address, NONCE));
        await c.send(owner.getSender(), { value: toNano('0.5') }, { $$type: 'Deploy', queryId: 0n });
        await owner.send({ to: c.address, value: toNano('3000'), bounce: false });
        await toLevel4(c, alice);
    });

    const stake = (days: bigint, autoRestake = false) =>
        c.send(alice.getSender(), { value: toNano('100') + toNano('0.03') },
            { $$type: 'StakeTON', duration: days, autoRestake, referrerAddress: null });

    const claim = () =>
        c.send(alice.getSender(), { value: toNano('0.05') },
            { $$type: 'ClaimStakingRewards', stakeId: 0n });

    const release = (from: SandboxContract<TreasuryContract>, stakeId = 0n) =>
        c.send(from.getSender(), { value: toNano('0.15') },
            { $$type: 'ReleaseMaturedStake', user: alice.address, stakeId });

    // --------------------------------------------------- still not a timer
    // Worth pinning: the fix does NOT make refunds happen by themselves. TON runs no code
    // without an incoming message, so a matured stake sits untouched until somebody sends
    // one. What changed is that anybody can now send it — see the permissionless tests
    // below — which is what lets a keeper make it look automatic to the staker.
    it('does not pay out on its own, however long it sits past maturity', async () => {
        await stake(30n);
        const before = await alice.getBalance();
        bc.now! += 200 * DAY;

        const s = (await c.getGetStakeDetails(alice.address, 0n))!;
        expect(s.isActive).toBe(true);
        expect(await alice.getBalance()).toBeLessThan(before + toNano('1'));
    });

    // ------------------------------------------------------- the lock is gone
    it('a stake claimed inside its final 24 hours can still be closed', async () => {
        await stake(30n);
        bc.now! += 29 * DAY + 12 * 3600;      // claim at day 29.5 — the trap
        await claim();

        bc.now! += 2 * DAY;                   // matured
        expect((await c.getGetStakeDetails(alice.address, 0n))!.pendingReward).toBe(0n);

        // owed nothing further, but the capital must still come back
        const before = await alice.getBalance();
        const res = await claim();
        expect(res.transactions).toHaveTransaction({ to: c.address, success: true });

        const after = (await c.getGetStakeDetails(alice.address, 0n))!;
        expect(after.isActive).toBe(false);
        expect(await alice.getBalance()).toBeGreaterThan(before + toNano('99'));
    });

    it('still refuses a claim that is neither owed interest nor matured', async () => {
        await stake(30n);
        bc.now! += 3600;                       // under a day, nothing accrued
        const res = await claim();
        expect(res.transactions).toHaveTransaction({ to: c.address, success: false });
        expect((await c.getGetStakeDetails(alice.address, 0n))!.isActive).toBe(true);
    });

    // ------------------------------------------------- permissionless release
    it('anyone can close a matured stake, and the money goes to the staker', async () => {
        await stake(30n);
        bc.now! += 31 * DAY;

        const aliceBefore = await alice.getBalance();
        const keeperBefore = await keeper.getBalance();

        const res = await release(keeper);
        expect(res.transactions).toHaveTransaction({ from: keeper.address, to: c.address, success: true });

        expect((await c.getGetStakeDetails(alice.address, 0n))!.isActive).toBe(false);
        // capital plus interest reaches the staker, never the caller
        expect(await alice.getBalance()).toBeGreaterThan(aliceBefore + toNano('100'));
        expect(await keeper.getBalance()).toBeLessThan(keeperBefore);   // keeper only pays gas
    });

    it('rescues a stake that was already locked before the fix', async () => {
        await stake(30n);
        bc.now! += 29 * DAY + 12 * 3600;
        await claim();                         // strands it under the old rules
        bc.now! += 60 * DAY;

        expect((await c.getGetStakeDetails(alice.address, 0n))!.pendingReward).toBe(0n);

        const before = await alice.getBalance();
        const res = await release(keeper);
        expect(res.transactions).toHaveTransaction({ to: c.address, success: true });
        expect((await c.getGetStakeDetails(alice.address, 0n))!.isActive).toBe(false);
        expect(await alice.getBalance()).toBeGreaterThan(before + toNano('99'));
    });

    // --------------------------------------------------------------- refusals
    it('will not release before maturity', async () => {
        await stake(30n);
        bc.now! += 20 * DAY;
        const res = await release(keeper);
        expect(res.transactions).toHaveTransaction({ to: c.address, success: false });
        expect((await c.getGetStakeDetails(alice.address, 0n))!.isActive).toBe(true);
    });

    it('will not release an auto-restaking stake', async () => {
        await stake(30n, true);
        bc.now! += 31 * DAY;
        const res = await release(keeper);
        expect(res.transactions).toHaveTransaction({ to: c.address, success: false });
        expect((await c.getGetStakeDetails(alice.address, 0n))!.isActive).toBe(true);
    });

    it('will not release the same stake twice', async () => {
        await stake(30n);
        bc.now! += 31 * DAY;
        await release(keeper);
        const again = await release(keeper);
        expect(again.transactions).toHaveTransaction({ to: c.address, success: false });
    });

    it('will not release an unknown stake or unknown user', async () => {
        await stake(30n);
        bc.now! += 31 * DAY;
        const badId = await release(keeper, 7n);
        expect(badId.transactions).toHaveTransaction({ to: c.address, success: false });

        const stranger = await bc.treasury('stranger');
        const badUser = await c.send(keeper.getSender(), { value: toNano('0.15') },
            { $$type: 'ReleaseMaturedStake', user: stranger.address, stakeId: 0n });
        expect(badUser.transactions).toHaveTransaction({ to: c.address, success: false });
    });

    it('interest still accrues normally when the term is left to run', async () => {
        await stake(30n);
        bc.now! += 31 * DAY;
        const before = await alice.getBalance();
        await release(keeper);
        // 30 days of interest at 0.95%/day on 100 TON, plus the 100 TON principal
        const interest = toNano('100') * 95n * 30n / 10000n;
        expect(await alice.getBalance()).toBeGreaterThan(before + toNano('100') + interest - toNano('0.1'));
    });
});

/**
 * The fix has to reach the live contract by SETCODE, with no migration. DeployedNow is the
 * source currently running on mainnet, so this is the real upgrade path.
 */
describe('shipping the maturity fix', () => {
    let bc: Blockchain;
    let owner: SandboxContract<TreasuryContract>;
    let live: SandboxContract<DeployedNow>;
    let alice: SandboxContract<TreasuryContract>;
    let keeper: SandboxContract<TreasuryContract>;

    beforeEach(async () => {
        bc = await Blockchain.create();
        bc.now = Math.floor(Date.now() / 1000);
        owner = await bc.treasury('owner');
        alice = await bc.treasury('alice');
        keeper = await bc.treasury('keeper');

        live = bc.openContract(await DeployedNow.fromInit(owner.address, NONCE));
        await live.send(owner.getSender(), { value: toNano('0.5') }, { $$type: 'Deploy', queryId: 0n });
        await owner.send({ to: live.address, value: toNano('3000'), bounce: false });
        await toLevel4(live, alice);
    });

    it('unsticks a stake stranded by the deployed code, without touching other state', async () => {
        // reproduce the mainnet situation on the code that is actually running
        await live.send(alice.getSender(), { value: toNano('100') + toNano('0.03') },
            { $$type: 'StakeTON', duration: 30n, autoRestake: false, referrerAddress: null });
        bc.now! += 29 * DAY + 12 * 3600;
        await live.send(alice.getSender(), { value: toNano('0.05') },
            { $$type: 'ClaimStakingRewards', stakeId: 0n });
        bc.now! += 30 * DAY;

        // stuck under the deployed rules
        const stuck = await live.send(alice.getSender(), { value: toNano('0.05') },
            { $$type: 'ClaimStakingRewards', stakeId: 0n });
        expect(stuck.transactions).toHaveTransaction({ to: live.address, success: false });
        expect((await live.getGetStakeDetails(alice.address, 0n))!.isActive).toBe(true);

        const userBefore = (await live.getGetUserInfo(alice.address))!;
        const statsBefore = await live.getGetPlatformStats();

        // upgrade
        const newCode = (await TonCrown.fromInit(owner.address, NONCE)).init!.code;
        const up = await live.send(owner.getSender(), { value: toNano('0.1') },
            { $$type: 'UpgradeContract', code: newCode });
        expect(up.transactions).toHaveTransaction({ from: owner.address, to: live.address, success: true });

        const upgraded = bc.openContract(TonCrown.fromAddress(live.address));

        // state intact
        const userAfter = (await upgraded.getGetUserInfo(alice.address))!;
        expect(userAfter.level).toBe(userBefore.level);
        expect(userAfter.registrationTime).toBe(userBefore.registrationTime);
        expect(await upgraded.getGetPlatformStats()).toEqual(statsBefore);

        // and the stranded capital comes back
        const before = await alice.getBalance();
        const res = await upgraded.send(keeper.getSender(), { value: toNano('0.15') },
            { $$type: 'ReleaseMaturedStake', user: alice.address, stakeId: 0n });
        expect(res.transactions).toHaveTransaction({ to: live.address, success: true });
        expect((await upgraded.getGetStakeDetails(alice.address, 0n))!.isActive).toBe(false);
        expect(await alice.getBalance()).toBeGreaterThan(before + toNano('99'));
    });
});
