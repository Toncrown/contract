import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, beginCell, Cell } from '@ton/core';
import { TonCrown as Live } from '../build/DeployedNow/DeployedNow_TonCrown';
import { TonCrown as Fixed } from '../build/TonCrown/TonCrown_TonCrown';
import '@ton/test-utils';

const DEPLOY_NONCE = 0n;
const COSTS = ['0', '1.25', '2.51', '3.77', '5.03', '6.27'];

/**
 * Jettons can arrive with nothing recorded against them: a transfer whose notification is
 * rejected still completes at the jetton level. That is what stranded 72.41 USDT on
 * mainnet — deposits made while usdtJettonWalletAddress was still the deploy default, so
 * every notification failed the "Unknown jetton wallet" check.
 *
 * The live code has no way to move them: every JettonTransfer it sends is tied to a stake.
 * These tests run the real recovery, upgrading the exact bytecode running on mainnet
 * (build/DeployedNow, hash-matched against the chain) to a version with an owner-only
 * withdrawal, then using it.
 */
describe('stranded jetton recovery via UpgradeContract', () => {
    let bc: Blockchain;
    let owner: SandboxContract<TreasuryContract>;
    let live: SandboxContract<Live>;
    let jettonWallet: SandboxContract<TreasuryContract>;   // stands in for the contract's jetton wallet
    let alice: SandboxContract<TreasuryContract>;

    const STRANDED = 72410517n;   // 72.410517 USDT, the real mainnet figure

    beforeEach(async () => {
        bc = await Blockchain.create();
        bc.now = Math.floor(Date.now() / 1000);
        owner = await bc.treasury('owner');
        alice = await bc.treasury('alice');
        jettonWallet = await bc.treasury('jettonWallet');

        live = bc.openContract(await Live.fromInit(owner.address, DEPLOY_NONCE));
        await live.send(owner.getSender(), { value: toNano('0.5') }, { $$type: 'Deploy', queryId: 0n });
        await owner.send({ to: live.address, value: toNano('300'), bounce: false });

        // real state that must survive the upgrade
        for (let l = 1; l <= 4; l++) {
            await live.send(alice.getSender(), { value: toNano(COSTS[l]) + toNano('0.05') },
                { $$type: 'UpgradeLevel', targetLevel: BigInt(l), referrerAddress: null });
        }
        await live.send(alice.getSender(), { value: toNano('8') + toNano('0.03') },
            { $$type: 'StakeTON', duration: 30n, autoRestake: false, referrerAddress: null });
        await live.send(alice.getSender(), { value: toNano('0.05') }, { $$type: 'CheckIn' });
    });

    const stakePayload = () =>
        beginCell().storeUint(30, 32).storeBit(false).storeAddress(null).endCell().asSlice();

    const upgradeToFixed = async () => {
        const newCode: Cell = (await Fixed.fromInit(owner.address, DEPLOY_NONCE)).init!.code;
        await live.send(owner.getSender(), { value: toNano('0.1') },
            { $$type: 'UpgradeContract', code: newCode });
        return bc.openContract(Fixed.fromAddress(live.address));
    };

    it('reproduces the bug: a deposit before the wallet is set is rejected', async () => {
        // usdtJettonWalletAddress is still the deploy default (the owner address), so a
        // notification from the real jetton wallet fails the sender check.
        const res = await live.send(jettonWallet.getSender(), { value: toNano('0.2') }, {
            $$type: 'JettonTransferNotification',
            queryId: 0n,
            amount: STRANDED,
            sender: alice.address,
            forwardPayload: stakePayload(),
        });
        expect(res.transactions).toHaveTransaction({ from: jettonWallet.address, to: live.address, success: false });
        // On-chain the tokens have already moved; nothing is recorded against them here.
        expect((await live.getGetPlatformStats()).totalStakedUsdt).toBe(0n);
    });

    it('the live code has no way to move stranded jettons', async () => {
        // WithdrawJettons is not in the deployed ABI, so the message is unparseable.
        const body = beginCell().storeUint(0x1234abcd, 32).storeAddress(owner.address).storeCoins(STRANDED).endCell();
        const res = await owner.send({ to: live.address, value: toNano('0.1'), body });
        expect(res.transactions).toHaveTransaction({ from: owner.address, to: live.address, success: false });
    });

    it('upgrades from the live bytecode and recovers the jettons', async () => {
        const before = (await live.getGetUserInfo(alice.address))!;
        const statsBefore = await live.getGetPlatformStats();
        const addressBefore = live.address.toString();

        const fixed = await upgradeToFixed();

        // same address, state intact
        expect(fixed.address.toString()).toBe(addressBefore);
        const after = (await fixed.getGetUserInfo(alice.address))!;
        expect(after.level).toBe(before.level);
        expect(after.registrationTime).toBe(before.registrationTime);
        expect(after.pendingCheckInRewards).toBe(before.pendingCheckInRewards);
        expect(after.stakes.get(0n)!.amount).toBe(before.stakes.get(0n)!.amount);

        const statsAfter = await fixed.getGetPlatformStats();
        expect(statsAfter.totalUsers).toBe(statsBefore.totalUsers);
        expect(statsAfter.totalStakedTon).toBe(statsBefore.totalStakedTon);

        // the new getter answers, and still reports the broken default
        expect((await fixed.getGetUsdtJettonWallet()).toString()).toBe(owner.address.toString());

        // point it at the real jetton wallet
        await fixed.send(owner.getSender(), { value: toNano('0.05') },
            { $$type: 'SetUsdtJettonWallet', wallet: jettonWallet.address });
        expect((await fixed.getGetUsdtJettonWallet()).toString()).toBe(jettonWallet.address.toString());

        // withdraw: a JettonTransfer must reach the jetton wallet naming the owner
        const res = await fixed.send(owner.getSender(), { value: toNano('0.2') },
            { $$type: 'WithdrawJettons', to: owner.address, amount: STRANDED });
        expect(res.transactions).toHaveTransaction({ from: fixed.address, to: jettonWallet.address, success: true });

        let found = false;
        for (const tx of res.transactions) {
            for (const m of (tx.outMessages?.values?.() ?? [])) {
                if (m.info.type !== 'internal') continue;
                if ((m.info as any).dest?.toString() !== jettonWallet.address.toString()) continue;
                const s = m.body.beginParse();
                if (s.remainingBits < 32) continue;
                expect(s.loadUint(32)).toBe(0x0f8a7ea5);                              // JettonTransfer op
                s.loadUint(64);                                                        // queryId
                expect(s.loadCoins()).toBe(STRANDED);                                  // amount
                expect(s.loadAddress().toString()).toBe(owner.address.toString());     // destination
                found = true;
            }
        }
        expect(found).toBe(true);
    });

    it('once the wallet is set, USDT deposits are accepted again', async () => {
        const fixed = await upgradeToFixed();
        await fixed.send(owner.getSender(), { value: toNano('0.05') },
            { $$type: 'SetUsdtJettonWallet', wallet: jettonWallet.address });

        bc.now! += 10;
        const res = await fixed.send(jettonWallet.getSender(), { value: toNano('0.3') }, {
            $$type: 'JettonTransferNotification',
            queryId: 0n,
            amount: 50000000n,                       // 50 USDT, above the VIP1 floor
            sender: alice.address,
            forwardPayload: stakePayload(),
        });
        expect(res.transactions).toHaveTransaction({ from: jettonWallet.address, to: fixed.address, success: true });
        expect((await fixed.getGetPlatformStats()).totalStakedUsdt).toBe(50000000n);
    });

    it('the flat getters return the same values as getUserInfo, without nesting', async () => {
        const fixed = await upgradeToFixed();
        const full = (await fixed.getGetUserInfo(alice.address))!;
        const summary = await fixed.getGetUserSummary(alice.address);

        // every field the frontend reconstructs today
        expect(summary.exists).toBe(true);
        expect(summary.level).toBe(full.level);
        expect(summary.vipClass).toBe(full.vipClass);
        expect(summary.directReferrals).toBe(full.directReferrals);
        expect(summary.totalReferrals).toBe(full.totalReferrals);
        expect(summary.otherReferrals).toBe(full.otherReferrals);
        expect(summary.lastCheckIn).toBe(full.lastCheckIn);
        expect(summary.levelExpiration).toBe(full.levelExpiration);
        expect(summary.totalEarned).toBe(full.totalEarned);
        expect(summary.isActive).toBe(full.isActive);
        expect(summary.registrationTime).toBe(full.registrationTime);
        expect(summary.stakeCounter).toBe(full.stakeCounter);
        expect(summary.referrer?.toString() ?? null).toBe(full.referrer?.toString() ?? null);

        // An unknown address returns exists:false rather than null. The struct is
        // deliberately not optional: Tact wraps an optional return in a tuple, and a
        // wrapping tuple is the nesting that TON API v2 cannot type.
        const stranger = await bc.treasury('stranger');
        const none = await fixed.getGetUserSummary(stranger.address);
        expect(none.exists).toBe(false);
        expect(none.level).toBe(0n);
        expect(none.referrer).toBeNull();
    });

    it('getContractConfig replaces the frontend raw-state parser', async () => {
        const fixed = await upgradeToFixed();
        await fixed.send(owner.getSender(), { value: toNano('0.05') },
            { $$type: 'SetUsdtJettonWallet', wallet: jettonWallet.address });

        const cfg = await fixed.getGetContractConfig();
        expect(cfg.owner.toString()).toBe(owner.address.toString());
        expect(cfg.usdtJettonWalletAddress.toString()).toBe(jettonWallet.address.toString());
        expect(cfg.distributorAddress.toString()).toBe(owner.address.toString());   // deploy default
        expect(cfg.isPaused).toBe(false);
        expect(cfg.importsLocked).toBe(false);
        expect(cfg.forwardStakeCapital).toBe(true);
        expect(cfg.deploymentNonce).toBe(DEPLOY_NONCE);
        // matches the dedicated getter
        expect((await fixed.getGetUsdtJettonWallet()).toString()).toBe(cfg.usdtJettonWalletAddress.toString());
    });

    it('only the owner can withdraw jettons', async () => {
        const fixed = await upgradeToFixed();
        await fixed.send(owner.getSender(), { value: toNano('0.05') },
            { $$type: 'SetUsdtJettonWallet', wallet: jettonWallet.address });

        const res = await fixed.send(alice.getSender(), { value: toNano('0.2') },
            { $$type: 'WithdrawJettons', to: alice.address, amount: STRANDED });
        expect(res.transactions).toHaveTransaction({ from: alice.address, to: fixed.address, success: false });
    });
});
