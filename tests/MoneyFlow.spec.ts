import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, fromNano, Address } from '@ton/core';
import { TonCrown } from '../build/TonCrown/TonCrown_TonCrown';
import '@ton/test-utils';

const DEPLOY_NONCE = 0n;
const COSTS = ['0', '1.25', '2.51', '3.77', '5.03', '6.27'];

/**
 * The reported bug was "the contract hands the buyer their money back". This suite
 * exists to answer the general form of that question: for every user-facing action, how
 * much TON does the contract send back to the caller, and is it what it should be?
 *
 * Run against a deliberately over-funded contract, because the original bug was
 * invisible until the balance could cover the refund.
 */
describe('money flows back to users', () => {
    let bc: Blockchain;
    let owner: SandboxContract<TreasuryContract>;
    let c: SandboxContract<TonCrown>;

    /** Total TON the contract sent to `who` during this transaction. */
    function backTo(res: any, who: Address) {
        let total = 0n;
        const lines: string[] = [];
        for (const tx of res.transactions)
            for (const m of (tx.outMessages?.values?.() ?? [])) {
                if (m.info.type !== 'internal') continue;
                if ((m.info as any).src?.toString() !== c.address.toString()) continue;
                if ((m.info as any).dest?.toString() !== who.toString()) continue;
                total += (m.info as any).value.coins;
                let body = '';
                try { const s = m.body.beginParse(); if (s.remainingBits >= 32 && s.loadUint(32) === 0) body = s.loadStringTail(); } catch { }
                lines.push(`${fromNano((m.info as any).value.coins)} "${body}"`);
            }
        return { total, lines };
    }

    beforeEach(async () => {
        bc = await Blockchain.create();
        bc.now = Math.floor(Date.now() / 1000);
        owner = await bc.treasury('owner');
        c = bc.openContract(await TonCrown.fromInit(owner.address, DEPLOY_NONCE));
        await c.send(owner.getSender(), { value: toNano('0.5') }, { $$type: 'Deploy', queryId: 0n });
        await owner.send({ to: c.address, value: toNano('5000'), bounce: false });  // deliberately rich
    });

    const upgrade = (u: SandboxContract<TreasuryContract>, l: number, extra = 0n) =>
        c.send(u.getSender(), { value: toNano(COSTS[l]) + toNano('0.05') + extra },
            { $$type: 'UpgradeLevel', targetLevel: BigInt(l), referrerAddress: null });

    it('upgrade returns nothing when the exact price is paid', async () => {
        const u = await bc.treasury('u1');
        for (let l = 1; l <= 5; l++) {
            const res = await upgrade(u, l);
            const { total, lines } = backTo(res, u.address);
            expect(lines.filter((s) => !s.startsWith('0 '))).toEqual([]);   // only zero-value acks
            expect(total).toBe(0n);
        }
    });

    it('upgrade returns exactly the overpayment and no more', async () => {
        const u = await bc.treasury('u2');
        const res = await upgrade(u, 1, toNano('7'));
        const { total } = backTo(res, u.address);
        expect(total).toBeLessThanOrEqual(toNano('7'));
        expect(total).toBeGreaterThan(toNano('6.99'));       // overpayment, less its own fwd fee
    });

    it('staking returns nothing to the staker', async () => {
        const u = await bc.treasury('u3');
        for (let l = 1; l <= 4; l++) await upgrade(u, l);
        const res = await c.send(u.getSender(), { value: toNano('40') + toNano('0.03') },
            { $$type: 'StakeTON', duration: 60n, autoRestake: false, referrerAddress: null });
        expect(backTo(res, u.address).total).toBe(0n);
    });

    it('check-in returns only unspent gas, never a reward', async () => {
        const u = await bc.treasury('u4');
        await upgrade(u, 1);
        const res = await c.send(u.getSender(), { value: toNano('0.5') }, { $$type: 'CheckIn' });
        const { total } = backTo(res, u.address);
        expect(total).toBeLessThan(toNano('0.5'));            // change only
        // the reward is accrued, not paid
        expect((await c.getGetUserInfo(u.address))!.pendingCheckInRewards).toBe(toNano('0.01'));
    });

    it('claiming check-in pays the accrued amount exactly, plus gas change', async () => {
        const u = await bc.treasury('u5');
        await upgrade(u, 1);
        for (let d = 0; d < 3; d++) { await c.send(u.getSender(), { value: toNano('0.05') }, { $$type: 'CheckIn' }); bc.now! += 86401; }
        const accrued = (await c.getGetUserInfo(u.address))!.pendingCheckInRewards;
        expect(accrued).toBe(toNano('0.03'));

        const gas = toNano('0.05');
        const res = await c.send(u.getSender(), { value: gas }, { $$type: 'ClaimCheckInRewards' });
        const { total, lines } = backTo(res, u.address);
        console.log('  claim payouts:', lines.join(' | '));
        // reward is paid in full (PayGasSeparately), and mode-64 change is bounded by gas sent
        expect(total).toBeGreaterThanOrEqual(accrued);
        expect(total).toBeLessThanOrEqual(accrued + gas);
        expect((await c.getGetUserInfo(u.address))!.pendingCheckInRewards).toBe(0n);
    });

    it('a matured stake returns principal plus reward, and not the gas-inflated amount', async () => {
        const u = await bc.treasury('u6');
        for (let l = 1; l <= 4; l++) await upgrade(u, l);
        const principal = toNano('40');
        await c.send(u.getSender(), { value: principal + toNano('0.03') },
            { $$type: 'StakeTON', duration: 30n, autoRestake: false, referrerAddress: null });

        bc.now! += 30 * 86400 + 10;
        const expectedReward = principal * 95n / 10000n * 30n;      // VIP1 0.95%/day
        const gas = toNano('0.05');
        const res = await c.send(u.getSender(), { value: gas }, { $$type: 'ClaimStakingRewards', stakeId: 0n });
        const { total, lines } = backTo(res, u.address);
        console.log('  matured payouts:', lines.join(' | '));
        expect(total).toBeGreaterThan(principal);
        expect(total).toBeLessThanOrEqual(principal + expectedReward + gas);
        expect((await c.getGetStakeDetails(u.address, 0n))!.isActive).toBe(false);
    });

    it('a rich contract never makes an upgrade profitable for the buyer', async () => {
        // the original bug in its purest form
        const u = await bc.treasury('u7');
        const before = await u.getBalance();
        for (let l = 1; l <= 5; l++) await upgrade(u, l);
        const spent = before - (await u.getBalance());
        const listPrice = toNano('1.25') + toNano('2.51') + toNano('3.77') + toNano('5.03') + toNano('6.27');
        console.log(`  paid ${fromNano(spent)} TON for a list price of ${fromNano(listPrice)} TON`);
        expect(spent).toBeGreaterThan(listPrice);
    });
});
