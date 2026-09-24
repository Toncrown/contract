import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, beginCell } from '@ton/core';
import { TonCrown } from '../build/TonCrown/TonCrown_TonCrown';
import '@ton/test-utils';

const DEPLOY_NONCE = 0n;
const COSTS = ['0', '1.25', '2.51', '3.77', '5.03'];
const DAY = 86400;

/**
 * What a matured USDT stake actually sends, and what it sends when the contract has nothing
 * to send with.
 *
 * On mainnet a 10 USDT stake matured, was marked inactive, and the staker received nothing.
 * The cause is not the payout code reading a balance wrongly — it is that the payout code
 * never reads a balance at all. There is no way for a TON contract to see its own jetton
 * wallet's balance synchronously, so the refund is posted blind: the contract emits a
 * JettonTransfer and closes the stake in the same transaction, and whether those tokens
 * exist is decided later, somewhere else, by a contract that cannot report back.
 *
 * These tests pin the two halves of that:
 *
 *   - the refund message is well formed and carries capital + reward, so funding the jetton
 *     wallet is sufficient for it to go through;
 *   - nothing in the contract used to object when it was unfunded, which is why the stake
 *     closed either way. The USDT reserve (UsdtReserve.spec.ts) now refuses that claim and
 *     keeps the stake open; the last test here pins the change.
 *
 * The sandbox stands in for the jetton wallet with a treasury, which accepts anything. That
 * is the point: it is what the real wallet does when funded, and the contract behaves
 * identically when it is not.
 */
describe('matured USDT stake refund', () => {
    let bc: Blockchain;
    let owner: SandboxContract<TreasuryContract>;
    let alice: SandboxContract<TreasuryContract>;
    let jettonWallet: SandboxContract<TreasuryContract>;
    let c: SandboxContract<TonCrown>;

    const STAKE = 100_000_000n;          // 100.000000 USDT, the live figure
    const DURATION = 14;                 // days, as on the live stake

    beforeEach(async () => {
        bc = await Blockchain.create();
        bc.now = Math.floor(Date.now() / 1000);
        owner = await bc.treasury('owner');
        alice = await bc.treasury('alice');
        jettonWallet = await bc.treasury('jettonWallet');

        c = bc.openContract(await TonCrown.fromInit(owner.address, DEPLOY_NONCE));
        await c.send(owner.getSender(), { value: toNano('0.5') }, { $$type: 'Deploy', queryId: 0n });
        await owner.send({ to: c.address, value: toNano('500'), bounce: false });

        await c.send(owner.getSender(), { value: toNano('0.05') },
            { $$type: 'SetUsdtJettonWallet', wallet: jettonWallet.address });

        // Level 4 unlocks VIP, which is what permits staking at all.
        for (let l = 1; l <= 4; l++) {
            await c.send(alice.getSender(), { value: toNano(COSTS[l]) + toNano('0.05') },
                { $$type: 'UpgradeLevel', targetLevel: BigInt(l), referrerAddress: null });
        }
    });

    const stakePayload = (days: number) =>
        beginCell().storeUint(days, 32).storeBit(false).storeAddress(null).endCell().asSlice();

    const stakeUsdt = () => c.send(jettonWallet.getSender(), { value: toNano('0.3') }, {
        $$type: 'JettonTransferNotification',
        queryId: 0n,
        amount: STAKE,
        sender: alice.address,
        forwardPayload: stakePayload(DURATION),
    });

    /** Every JettonTransfer the contract sent to its jetton wallet, with amount and payee. */
    const jettonTransfersOf = (res: Awaited<ReturnType<typeof stakeUsdt>>) => {
        const out: { amount: bigint; to: string }[] = [];
        for (const tx of res.transactions) {
            for (const m of tx.outMessages.values()) {
                if (m.info.type !== 'internal') continue;
                if (!m.info.dest.equals(jettonWallet.address)) continue;
                const s = m.body.beginParse();
                if (s.remainingBits < 32 || s.preloadUint(32) !== 0x0f8a7ea5) continue;
                s.loadUint(32);                       // op
                s.loadUint(64);                       // queryId
                out.push({ amount: s.loadCoins(), to: s.loadAddress().toString() });
            }
        }
        return out;
    };

    it('forwards the capital straight out at deposit, so the contract holds none of it', async () => {
        const res = await stakeUsdt();
        const forwarded = jettonTransfersOf(res);

        // This is the root cause. The policy defaults on, so the money leaves immediately
        // and the contract still records the full liability.
        expect(forwarded).toHaveLength(1);
        expect(forwarded[0]!.amount).toBe(STAKE);
        expect((await c.getGetTreasuryStatus()).totalStakedUsdt).toBe(STAKE);
    });

    it('sends capital and reward to the staker once matured', async () => {
        await stakeUsdt();
        bc.now = bc.now! + DURATION * DAY + 60;
        // Funded: the owner has put the capital back and accounted for it.
        await c.send(owner.getSender(), { value: toNano('0.05') },
            { $$type: 'SyncUsdtReserve', amount: STAKE * 2n });

        const res = await c.send(alice.getSender(), { value: toNano('0.2') },
            { $$type: 'ClaimStakingRewards', stakeId: 0n });

        const sent = jettonTransfersOf(res);
        const toAlice = sent.filter(t => t.to === alice.address.toString());

        // Two legs: the accrued reward, then the capital. Both addressed to the staker.
        expect(toAlice).toHaveLength(2);
        const total = toAlice.reduce((s, t) => s + t.amount, 0n);
        expect(total).toBeGreaterThan(STAKE);

        const capital = toAlice.find(t => t.amount === STAKE);
        expect(capital).toBeDefined();

        // What the jetton wallet must hold for this to succeed. Anything less and the
        // transfer fails downstream while the stake closes regardless.
        const reward = total - STAKE;
        console.log(`  needs funding of ${(Number(total) / 1e6).toFixed(6)} USDT`
            + ` (${(Number(STAKE) / 1e6).toFixed(6)} capital + ${(Number(reward) / 1e6).toFixed(6)} reward)`);
    });

    it('no longer closes the stake when the tokens are not there', async () => {
        await stakeUsdt();
        bc.now = bc.now! + DURATION * DAY + 60;

        const res = await c.send(alice.getSender(), { value: toNano('0.2') },
            { $$type: 'ClaimStakingRewards', stakeId: 0n });

        // This used to succeed and close the position with nothing behind the transfer —
        // precisely how the mainnet stake died silently. The contract still cannot see its
        // jetton balance, but it now counts what it holds, and with nothing counted it
        // refuses: the claim fails and the stake stays open to be claimed once funded.
        expect(res.transactions).toHaveTransaction({
            from: alice.address, to: c.address, success: false,
        });
        const details = await c.getGetStakeDetails(alice.address, 0n);
        expect(details!.isActive).toBe(true);
        expect((await c.getGetTreasuryStatus()).totalStakedUsdt).toBe(STAKE);
    });

    it('keeps the capital when the forwarding policy is turned off', async () => {
        // The mitigation available without a migration: stop the money leaving in the first
        // place, so the contract can pay its own refunds.
        await c.send(owner.getSender(), { value: toNano('0.05') },
            { $$type: 'SetStakeCapitalPolicy', forwardToTreasuryWallet: false });

        const res = await stakeUsdt();
        expect(jettonTransfersOf(res)).toHaveLength(0);
        expect((await c.getGetTreasuryStatus()).totalStakedUsdt).toBe(STAKE);
    });
});
