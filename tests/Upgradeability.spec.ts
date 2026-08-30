import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, Cell } from '@ton/core';
import { TonCrown } from '../build/TonCrown/TonCrown_TonCrown';
import { TonCrown as UpgradeProbe } from '../build/UpgradeProbe/UpgradeProbe_TonCrown';
import '@ton/test-utils';

const COSTS = ['0', '1.25', '2.51', '3.77', '5.03', '6.27'];

/**
 * The whole point of the migration is that it is the last one. These tests prove
 * UpgradeContract actually swaps the running code at the same address while every
 * user record, stake and balance stays put.
 */
describe('upgradeability', () => {
    let bc: Blockchain;
    let owner: SandboxContract<TreasuryContract>;
    let c: SandboxContract<TonCrown>;
    let alice: SandboxContract<TreasuryContract>;
    let newCode: Cell;

    beforeEach(async () => {
        bc = await Blockchain.create();
        bc.now = Math.floor(Date.now() / 1000);
        owner = await bc.treasury('owner');
        alice = await bc.treasury('alice');

        c = bc.openContract(await TonCrown.fromInit(owner.address));
        await c.send(owner.getSender(), { value: toNano('0.5') }, { $$type: 'Deploy', queryId: 0n });
        await owner.send({ to: c.address, value: toNano('500'), bounce: false });

        // real state to protect: levels, a stake, an accrued check-in balance
        for (let l = 1; l <= 4; l++)
            await c.send(alice.getSender(), { value: toNano(COSTS[l]) + toNano('0.05') },
                { $$type: 'UpgradeLevel', targetLevel: BigInt(l), referrerAddress: null });
        await c.send(alice.getSender(), { value: toNano('9') + toNano('0.03') },
            { $$type: 'StakeTON', duration: 30n, autoRestake: false, referrerAddress: null });
        await c.send(alice.getSender(), { value: toNano('0.05') }, { $$type: 'CheckIn' });

        // the "next version": same storage layout, changed logic, extra getter
        newCode = (await UpgradeProbe.fromInit(owner.address)).init!.code;
    });

    it('swaps code at the same address and keeps every user record', async () => {
        const addressBefore = c.address.toString();
        const before = (await c.getGetUserInfo(alice.address))!;
        const statsBefore = await c.getGetPlatformStats();
        const balanceBefore = (await bc.getContract(c.address)).balance;

        const res = await c.send(owner.getSender(), { value: toNano('0.1') },
            { $$type: 'UpgradeContract', code: newCode });
        expect(res.transactions).toHaveTransaction({ from: owner.address, to: c.address, success: true });

        // same account, new code
        expect(c.address.toString()).toBe(addressBefore);
        const stored = (await bc.getContract(c.address)).account!.account!.storage.state;
        expect((stored as any).state.code!.equals(newCode)).toBe(true);

        // state survived verbatim
        const probe = bc.openContract(UpgradeProbe.fromAddress(c.address));
        const after = (await probe.getGetUserInfo(alice.address))!;
        expect(after.level).toBe(before.level);
        expect(after.vipClass).toBe(before.vipClass);
        expect(after.registrationTime).toBe(before.registrationTime);
        expect(after.pendingCheckInRewards).toBe(before.pendingCheckInRewards);
        expect(after.stakes.get(0n)!.amount).toBe(before.stakes.get(0n)!.amount);

        const statsAfter = await probe.getGetPlatformStats();
        expect(statsAfter.totalUsers).toBe(statsBefore.totalUsers);
        expect(statsAfter.totalStakedTon).toBe(statsBefore.totalStakedTon);

        // funds untouched (minus the gas for the upgrade message itself)
        expect((await bc.getContract(c.address)).balance).toBeGreaterThan(balanceBefore - toNano('0.2'));

        // the NEW logic is live: a getter that did not exist before
        expect(await probe.getGetContractVersion()).toBe(2n);
    });

    it('the new logic actually takes effect', async () => {
        // v1 reward is 0.01; the probe raises it to 0.02
        const before = (await c.getGetUserInfo(alice.address))!.pendingCheckInRewards;

        await c.send(owner.getSender(), { value: toNano('0.1') },
            { $$type: 'UpgradeContract', code: newCode });

        bc.now! += 86401;
        const probe = bc.openContract(UpgradeProbe.fromAddress(c.address));
        await probe.send(alice.getSender(), { value: toNano('0.05') }, { $$type: 'CheckIn' });

        const after = (await probe.getGetUserInfo(alice.address))!.pendingCheckInRewards;
        expect(after - before).toBe(toNano('0.02'));   // new constant, not the old 0.01
    });

    it('users keep transacting normally after the upgrade', async () => {
        await c.send(owner.getSender(), { value: toNano('0.1') },
            { $$type: 'UpgradeContract', code: newCode });

        const probe = bc.openContract(UpgradeProbe.fromAddress(c.address));
        await probe.send(alice.getSender(), { value: toNano(COSTS[5]) + toNano('0.05') },
            { $$type: 'UpgradeLevel', targetLevel: 5n, referrerAddress: null });
        expect((await probe.getGetUserInfo(alice.address))!.level).toBe(5n);

        // and a brand new user can still register
        const bob = await bc.treasury('bob');
        bc.now! += 5;
        await probe.send(bob.getSender(), { value: toNano(COSTS[1]) + toNano('0.05') },
            { $$type: 'UpgradeLevel', targetLevel: 1n, referrerAddress: alice.address });
        expect((await probe.getGetUserInfo(bob.address))!.level).toBe(1n);
    });

    it('only the owner can upgrade the code', async () => {
        const attacker = await bc.treasury('attacker');
        const res = await c.send(attacker.getSender(), { value: toNano('0.1') },
            { $$type: 'UpgradeContract', code: newCode });
        expect(res.transactions).toHaveTransaction({ from: attacker.address, to: c.address, success: false });
        expect(await c.getGetUserInfo(alice.address)).not.toBeNull();   // untouched
    });
});
