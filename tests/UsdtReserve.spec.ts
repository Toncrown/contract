import { Blockchain, SandboxContract, TreasuryContract, internal } from '@ton/sandbox';
import { toNano, beginCell, Cell } from '@ton/core';
import { TonCrown } from '../build/TonCrown/TonCrown_TonCrown';
import { TonCrown as MainnetSep24 } from '../build/MainnetSep24/MainnetSep24_TonCrown';
import '@ton/test-utils';

const NONCE = 0n;
const COSTS = ['0', '1.25', '2.51', '3.77', '5.03'];
const DAY = 86400;
const STAKE = 100_000_000n;     // 100 USDT, the live figure
const DURATION = 14;

/**
 * The USDT payout reserve.
 *
 * A contract cannot read its own jetton balance, so USDT payouts used to go out blind: the
 * stake closed in the same transaction whether or not the tokens existed, and two matured
 * mainnet stakes were closed and paid nothing. The contract now keeps a count of the USDT it
 * holds for payouts and refuses a claim that would overdraw it, leaving the stake open.
 *
 * The sandbox stands in for the jetton wallet with a treasury, which accepts anything — so
 * these tests pin what the contract *decides*, which is exactly the part that was missing.
 */

/** Getter results as plain data: addresses as raw strings, bigints as strings. */
const plain = (v: unknown) => JSON.parse(JSON.stringify(v, (_k, x) =>
    typeof x === 'bigint' ? x.toString() : x && typeof x.toRawString === 'function' ? x.toRawString() : x));

const stakePayload = (days: number) =>
    beginCell().storeUint(days, 32).storeBit(false).storeAddress(null).endCell().asSlice();

/** Every JettonTransfer a result asked the jetton wallet to make. */
function jettonTransfers(res: { transactions: any[] }, jettonWallet: TreasuryContract | SandboxContract<TreasuryContract>) {
    const out: { amount: bigint; to: string }[] = [];
    for (const tx of res.transactions) {
        for (const m of tx.outMessages.values()) {
            if (m.info.type !== 'internal' || !m.info.dest.equals(jettonWallet.address)) continue;
            const s = m.body.beginParse();
            if (s.remainingBits < 32 || s.preloadUint(32) !== 0x0f8a7ea5) continue;
            s.loadUint(32); s.loadUint(64);
            out.push({ amount: s.loadCoins(), to: s.loadAddress().toString() });
        }
    }
    return out;
}

async function setup(open: (bc: Blockchain, owner: SandboxContract<TreasuryContract>) => Promise<any>) {
    const bc = await Blockchain.create();
    bc.now = Math.floor(Date.now() / 1000);
    const owner = await bc.treasury('owner');
    const alice = await bc.treasury('alice');
    const keeper = await bc.treasury('keeper');
    const jettonWallet = await bc.treasury('jettonWallet');

    const c = await open(bc, owner);
    await c.send(owner.getSender(), { value: toNano('0.5') }, { $$type: 'Deploy', queryId: 0n });
    await owner.send({ to: c.address, value: toNano('500'), bounce: false });
    await c.send(owner.getSender(), { value: toNano('0.05') },
        { $$type: 'SetUsdtJettonWallet', wallet: jettonWallet.address });
    for (let l = 1; l <= 4; l++)
        await c.send(alice.getSender(), { value: toNano(COSTS[l]) + toNano('0.05') },
            { $$type: 'UpgradeLevel', targetLevel: BigInt(l), referrerAddress: null });

    const notify = (from: any, amount: bigint, payload = stakePayload(DURATION)) =>
        c.send(jettonWallet.getSender(), { value: toNano('0.3') }, {
            $$type: 'JettonTransferNotification', queryId: 0n, amount, sender: from, forwardPayload: payload,
        });

    return { bc, owner, alice, keeper, jettonWallet, c, notify };
}

describe('USDT payout reserve', () => {
    let t: Awaited<ReturnType<typeof setup>>;
    let c: SandboxContract<TonCrown>;

    beforeEach(async () => {
        t = await setup(async (bc, owner) => bc.openContract(await TonCrown.fromInit(owner.address, NONCE)));
        c = t.c;
    });

    const mature = () => { t.bc.now = t.bc.now! + DURATION * DAY + 60; };
    const claim = () => c.send(t.alice.getSender(), { value: toNano('0.2') },
        { $$type: 'ClaimStakingRewards', stakeId: 0n });
    const sync = (amount: bigint) => c.send(t.owner.getSender(), { value: toNano('0.05') },
        { $$type: 'SyncUsdtReserve', amount });

    it('starts at zero, so nothing is paid until the owner accounts for real tokens', async () => {
        expect(await c.getGetUsdtReserve()).toBe(0n);
    });

    it('refuses a matured claim it cannot fund, and leaves the stake open', async () => {
        await t.notify(t.alice.address, STAKE);          // forwarded out: policy defaults on
        mature();

        const res = await claim();
        expect(res.transactions).toHaveTransaction({ from: t.alice.address, to: c.address, success: false });
        expect(jettonTransfers(res, t.jettonWallet)).toHaveLength(0);

        // This is the whole fix: the position survives, so it can be claimed once funded.
        const d = await c.getGetStakeDetails(t.alice.address, 0n);
        expect(d!.isActive).toBe(true);
        expect((await c.getGetTreasuryStatus()).totalStakedUsdt).toBe(STAKE);
    });

    it('refuses the permissionless release too, so a sweeper cannot close it unfunded', async () => {
        await t.notify(t.alice.address, STAKE);
        mature();

        const res = await c.send(t.keeper.getSender(), { value: toNano('0.2') },
            { $$type: 'ReleaseMaturedStake', user: t.alice.address, stakeId: 0n });
        expect(res.transactions).toHaveTransaction({ from: t.keeper.address, to: c.address, success: false });
        expect((await c.getGetStakeDetails(t.alice.address, 0n))!.isActive).toBe(true);
    });

    it('refuses when the reserve covers the reward but not the capital', async () => {
        await t.notify(t.alice.address, STAKE);
        mature();
        const owed = (await c.getGetStakeDetails(t.alice.address, 0n))!.pendingReward;
        await sync(owed);                                // reward only

        const res = await claim();
        expect(res.transactions).toHaveTransaction({ from: t.alice.address, to: c.address, success: false });
        expect((await c.getGetStakeDetails(t.alice.address, 0n))!.isActive).toBe(true);
        expect(await c.getGetUsdtReserve()).toBe(owed); // untouched
    });

    it('pays reward and capital once funded, and draws the reserve down by exactly that', async () => {
        await t.notify(t.alice.address, STAKE);
        mature();
        const owed = (await c.getGetStakeDetails(t.alice.address, 0n))!.pendingReward;
        await sync(STAKE + owed + 5_000_000n);

        const res = await claim();
        expect(res.transactions).toHaveTransaction({ from: t.alice.address, to: c.address, success: true });
        const toAlice = jettonTransfers(res, t.jettonWallet).filter(x => x.to === t.alice.address.toString());
        expect(toAlice.map(x => x.amount).sort()).toEqual([owed, STAKE].sort());

        expect((await c.getGetStakeDetails(t.alice.address, 0n))!.isActive).toBe(false);
        expect(await c.getGetUsdtReserve()).toBe(5_000_000n);
    });

    it('pays an interim reward on its own without needing the capital', async () => {
        await t.notify(t.alice.address, STAKE);
        t.bc.now = t.bc.now! + 5 * DAY + 60;             // not matured
        const owed = (await c.getGetStakeDetails(t.alice.address, 0n))!.pendingReward;
        await sync(owed);

        const res = await claim();
        expect(res.transactions).toHaveTransaction({ from: t.alice.address, to: c.address, success: true });
        expect(await c.getGetUsdtReserve()).toBe(0n);
        expect((await c.getGetStakeDetails(t.alice.address, 0n))!.isActive).toBe(true);
    });

    it('counts USDT the owner or treasury sends as funding, instead of refunding it', async () => {
        const res = await t.notify(t.owner.address, 50_000_000n, beginCell().endCell().asSlice());
        expect(jettonTransfers(res, t.jettonWallet)).toHaveLength(0);   // nothing sent back
        expect(await c.getGetUsdtReserve()).toBe(50_000_000n);

        const cw3 = (await c.getGetContractConfig()).creatorWallet3;
        await t.notify(cw3, 20_000_000n, beginCell().endCell().asSlice());
        expect(await c.getGetUsdtReserve()).toBe(70_000_000n);
    });

    it('still refunds a malformed deposit from anyone else, without touching the reserve', async () => {
        const res = await t.notify(t.alice.address, 7_000_000n, beginCell().endCell().asSlice());
        const back = jettonTransfers(res, t.jettonWallet);
        expect(back).toEqual([{ amount: 7_000_000n, to: t.alice.address.toString() }]);
        expect(await c.getGetUsdtReserve()).toBe(0n);
    });

    it('counts retained capital when forwarding is off, so refunds fund themselves', async () => {
        await c.send(t.owner.getSender(), { value: toNano('0.05') },
            { $$type: 'SetStakeCapitalPolicy', forwardToTreasuryWallet: false });
        await t.notify(t.alice.address, STAKE);
        expect(await c.getGetUsdtReserve()).toBe(STAKE);

        // The capital alone covers its own return; the reward still has to be funded.
        mature();
        const owed = (await c.getGetStakeDetails(t.alice.address, 0n))!.pendingReward;
        await sync(STAKE + owed);
        const res = await claim();
        expect(res.transactions).toHaveTransaction({ from: t.alice.address, to: c.address, success: true });
    });

    it('puts a bounced transfer back into the reserve', async () => {
        await sync(10_000_000n);
        const bounce = beginCell()
            .storeUint(0xffffffff, 32)
            .storeUint(0x0f8a7ea5, 32).storeUint(0, 64).storeCoins(4_000_000n)
            .endCell();

        await t.bc.sendMessage(internal({
            from: t.jettonWallet.address, to: c.address, value: toNano('0.05'), body: bounce, bounced: true,
        }));
        expect(await c.getGetUsdtReserve()).toBe(14_000_000n);

        // A bounce claiming to be ours from anywhere else changes nothing.
        await t.bc.sendMessage(internal({
            from: t.alice.address, to: c.address, value: toNano('0.05'), body: bounce, bounced: true,
        }));
        expect(await c.getGetUsdtReserve()).toBe(14_000_000n);
    });

    it('holds owner withdrawals to the reserve, and draws it down', async () => {
        await sync(10_000_000n);
        const over = await c.send(t.owner.getSender(), { value: toNano('0.1') },
            { $$type: 'WithdrawJettons', to: t.owner.address, amount: 10_000_001n });
        expect(over.transactions).toHaveTransaction({ from: t.owner.address, to: c.address, success: false });

        await c.send(t.owner.getSender(), { value: toNano('0.1') },
            { $$type: 'WithdrawJettons', to: t.owner.address, amount: 4_000_000n });
        expect(await c.getGetUsdtReserve()).toBe(6_000_000n);
    });

    it('lets only the owner set the reserve', async () => {
        const res = await c.send(t.alice.getSender(), { value: toNano('0.05') },
            { $$type: 'SyncUsdtReserve', amount: 999_000_000n });
        expect(res.transactions).toHaveTransaction({ from: t.alice.address, to: c.address, success: false });
        expect(await c.getGetUsdtReserve()).toBe(0n);
    });

    it('leaves TON staking exactly as it was', async () => {
        await c.send(t.alice.getSender(), { value: toNano('3') + toNano('0.03') },
            { $$type: 'StakeTON', duration: 14n, autoRestake: false, referrerAddress: null });
        mature();
        const res = await claim();
        expect(res.transactions).toHaveTransaction({ from: t.alice.address, to: c.address, success: true });
        expect((await c.getGetStakeDetails(t.alice.address, 0n))!.isActive).toBe(false);
    });
});

/**
 * Shipping it. The reserve lives in an existing map rather than a new field, so a plain
 * SETCODE carries it. This starts from the exact source running on mainnet, builds up real
 * state, upgrades, and checks nothing moved.
 */
describe('upgrading mainnet to the reserve', () => {
    it('keeps every record, and the new rules apply from the next message', async () => {
        const t = await setup(async (bc, owner) => bc.openContract(await MainnetSep24.fromInit(owner.address, NONCE)));
        const live = t.c as SandboxContract<MainnetSep24>;
        const bob = await t.bc.treasury('bob');

        // State worth protecting: a USDT stake, a TON stake, spillover pointers in use.
        await t.notify(t.alice.address, STAKE);
        await live.send(t.alice.getSender(), { value: toNano('3') + toNano('0.03') },
            { $$type: 'StakeTON', duration: 30n, autoRestake: false, referrerAddress: null });
        for (let l = 1; l <= 2; l++)
            await live.send(bob.getSender(), { value: toNano(COSTS[l]) + toNano('0.05') },
                { $$type: 'UpgradeLevel', targetLevel: BigInt(l), referrerAddress: t.alice.address });

        const before = {
            alice: await live.getGetUserSummary(t.alice.address),
            bob: await live.getGetUserSummary(bob.address),
            usdt: await live.getGetStakeDetails(t.alice.address, 0n),
            ton: await live.getGetStakeDetails(t.alice.address, 1n),
            treasury: await live.getGetTreasuryStatus(),
            config: await live.getGetContractConfig(),
            rates: await live.getGetStakingRoiRates(),
        };

        const newCode: Cell = (await TonCrown.fromInit(t.owner.address, NONCE)).init!.code;
        const up = await live.send(t.owner.getSender(), { value: toNano('0.2') },
            { $$type: 'UpgradeContract', code: newCode });
        expect(up.transactions).toHaveTransaction({ from: t.owner.address, to: live.address, success: true });

        const c = t.bc.openContract(TonCrown.fromAddress(live.address));
        expect(plain(await c.getGetUserSummary(t.alice.address))).toEqual(plain(before.alice));
        expect(plain(await c.getGetUserSummary(bob.address))).toEqual(plain(before.bob));
        expect(plain(await c.getGetStakeDetails(t.alice.address, 0n))).toEqual(plain(before.usdt));
        expect(plain(await c.getGetStakeDetails(t.alice.address, 1n))).toEqual(plain(before.ton));
        expect(plain(await c.getGetContractConfig())).toEqual(plain(before.config));
        expect(plain(await c.getGetStakingRoiRates())).toEqual(plain(before.rates));
        const tr = await c.getGetTreasuryStatus();
        expect(plain({ ...tr, contractBalance: 0n })).toEqual(plain({ ...before.treasury, contractBalance: 0n }));
        expect(await c.getGetUsdtReserve()).toBe(0n);

        // Spillover still rotates with the reserve sitting in the same map.
        const carol = await t.bc.treasury('carol');
        for (let l = 1; l <= 2; l++) {
            const r = await c.send(carol.getSender(), { value: toNano(COSTS[l]) + toNano('0.05') },
                { $$type: 'UpgradeLevel', targetLevel: BigInt(l), referrerAddress: null });
            expect(r.transactions).toHaveTransaction({ from: carol.address, to: c.address, success: true });
        }
        expect(await c.getGetUsdtReserve()).toBe(0n);

        // And the stake that was already running is now protected rather than closed blind.
        t.bc.now = t.bc.now! + DURATION * DAY + 60;
        const res = await c.send(t.alice.getSender(), { value: toNano('0.2') },
            { $$type: 'ClaimStakingRewards', stakeId: 0n });
        expect(res.transactions).toHaveTransaction({ from: t.alice.address, to: c.address, success: false });
        expect((await c.getGetStakeDetails(t.alice.address, 0n))!.isActive).toBe(true);
    });
});
