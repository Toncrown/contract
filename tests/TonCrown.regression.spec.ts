import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, fromNano, Address } from '@ton/core';
import { TonCrown } from '../build/TonCrown/TonCrown_TonCrown';
import '@ton/test-utils';

const DEPLOY_NONCE = 0n;

const COSTS = ['0', '1.25', '2.51', '3.77', '5.03', '6.27', '7.53', '8.78', '10.04', '11.29', '12.55'];
const BUFFER = toNano('0.05');

describe('TonCrown regressions', () => {
    let bc: Blockchain;
    let owner: SandboxContract<TreasuryContract>;
    let c: SandboxContract<TonCrown>;

    const balanceOf = async () => (await bc.getContract(c.address)).balance;

    async function deploy(prefund = '500') {
        bc = await Blockchain.create();
        bc.now = Math.floor(Date.now() / 1000);
        owner = await bc.treasury('owner');
        c = bc.openContract(await TonCrown.fromInit(owner.address, DEPLOY_NONCE));
        await c.send(owner.getSender(), { value: toNano('0.5') }, { $$type: 'Deploy', queryId: 0n });
        if (prefund !== '0') await owner.send({ to: c.address, value: toNano(prefund), bounce: false });
    }

    const upgrade = (u: SandboxContract<TreasuryContract>, lvl: number, ref: Address | null = null, extra = 0n) =>
        c.send(u.getSender(), { value: toNano(COSTS[lvl]) + BUFFER + extra },
            { $$type: 'UpgradeLevel', targetLevel: BigInt(lvl), referrerAddress: ref });

    function hasBody(res: any, text: string) {
        for (const tx of res.transactions)
            for (const m of (tx.outMessages?.values?.() ?? [])) {
                if (m.info.type !== 'internal') continue;
                if ((m.info as any).src.toString() !== c.address.toString()) continue;
                try {
                    const sl = m.body.beginParse();
                    if (sl.remainingBits >= 32 && sl.loadUint(32) === 0 && sl.loadStringTail() === text) return true;
                } catch { }
            }
        return false;
    }

    function paidTo(res: any, to: Address) {
        let total = 0n;
        for (const tx of res.transactions)
            for (const m of (tx.outMessages?.values?.() ?? [])) {
                if (m.info.type !== 'internal') continue;
                if ((m.info as any).src.toString() !== c.address.toString()) continue;
                if ((m.info as any).dest.toString() !== to.toString()) continue;
                total += (m.info as any).value.coins;
            }
        return total;
    }

    // ---------------------------------------------------------------- the refund bug
    it('does not refund the upgrade payment, at any contract balance', async () => {
        for (const prefund of ['0', '2', '50', '500']) {
            await deploy(prefund);
            const u = await bc.treasury('buyer');
            const before = await u.getBalance();
            const res = await upgrade(u, 1);
            const spent = before - (await u.getBalance());

            expect(paidTo(res, u.address)).toBe(0n);
            // paid the level price, not merely gas
            expect(spent).toBeGreaterThan(toNano('1.25'));
            expect((await c.getGetUserInfo(u.address))!.level).toBe(1n);
        }
    });

    it('a funded contract does not lose money on an upgrade', async () => {
        await deploy('500');
        const u = await bc.treasury('buyer');
        const before = await balanceOf();
        await upgrade(u, 1);
        // creator wallets are uninitialised in the sandbox so their shares bounce back;
        // what matters is that the contract is not drained by the sale.
        expect(await balanceOf()).toBeGreaterThanOrEqual(before);
    });

    it('staking does not hand the stake back to the staker', async () => {
        await deploy('500');
        const u = await bc.treasury('staker');
        for (let l = 1; l <= 4; l++) await upgrade(u, l);
        const before = await u.getBalance();
        const res = await c.send(u.getSender(), { value: toNano('5') + toNano('0.03') },
            { $$type: 'StakeTON', duration: 30n, autoRestake: false, referrerAddress: null });
        expect(paidTo(res, u.address)).toBe(0n);
        expect(before - (await u.getBalance())).toBeGreaterThan(toNano('5'));
        expect((await c.getGetStakeDetails(u.address, 0n))!.amount).toBe(toNano('5'));
    });

    it('overpayment above price + buffer is returned', async () => {
        await deploy('500');
        const u = await bc.treasury('buyer');
        const res = await upgrade(u, 1, null, toNano('3'));
        // returned less the forward fee of the refund message itself
        const back = paidTo(res, u.address);
        expect(back).toBeGreaterThan(toNano('2.99'));
        expect(back).toBeLessThanOrEqual(toNano('3'));
    });

    // ---------------------------------------------------------------- referral abuse
    it('a user cannot refer themselves', async () => {
        await deploy('500');
        const u = await bc.treasury('selfref');
        const r1 = await upgrade(u, 1, u.address);
        expect(paidTo(r1, u.address)).toBe(0n);
        expect((await c.getGetUserInfo(u.address))!.referrer).toBeNull();
        const r2 = await upgrade(u, 2, u.address);
        expect(paidTo(r2, u.address)).toBe(0n);
    });

    it('the referrer cannot be changed after registration', async () => {
        await deploy('500');
        const a = await bc.treasury('a');
        const b = await bc.treasury('b');
        for (let l = 1; l <= 3; l++) await upgrade(b, l);
        await upgrade(a, 1);                        // registers with no referrer
        const res = await upgrade(a, 2, b.address); // tries to name b afterwards
        expect(paidTo(res, b.address)).toBe(0n);
        expect((await c.getGetUserInfo(a.address))!.referrer).toBeNull();
    });

    it('a genuine referrer named at registration is still paid on later upgrades', async () => {
        await deploy('500');
        const a = await bc.treasury('a2');
        const b = await bc.treasury('b2');
        for (let l = 1; l <= 3; l++) await upgrade(b, l);
        await upgrade(a, 1, b.address);
        const res = await upgrade(a, 2);
        expect(paidTo(res, b.address)).toBeGreaterThan(0n);
        expect((await c.getGetUserInfo(a.address))!.referrer!.toString()).toBe(b.address.toString());
    });

    // ---------------------------------------------------------------- stake capital
    it('never closes a matured stake it cannot pay out', async () => {
        await deploy('500');
        const u = await bc.treasury('staker2');
        for (let l = 1; l <= 4; l++) await upgrade(u, l);
        await c.send(u.getSender(), { value: toNano('20') + toNano('0.03') },
            { $$type: 'StakeTON', duration: 14n, autoRestake: false, referrerAddress: null });

        // leave enough for the capital but not for capital + reward
        const wd = (await balanceOf()) - (toNano('20') + toNano('0.06'));
        if (wd > 0n) await c.send(owner.getSender(), { value: toNano('0.05') }, { $$type: 'OwnerWithdraw', amount: wd });

        bc.now! += 14 * 86400 + 10;
        const res: any = await c.send(u.getSender(), { value: toNano('0.05') }, { $$type: 'ClaimStakingRewards', stakeId: 0n });

        expect(res.transactions).toHaveTransaction({ from: u.address, to: c.address, success: false });
        const sd = await c.getGetStakeDetails(u.address, 0n);
        expect(sd!.isActive).toBe(true);                       // not closed
        expect((await c.getGetPlatformStats()).totalStakedTon).toBe(toNano('20'));
    });

    it('pays reward and capital together once the contract can afford both', async () => {
        await deploy('500');
        const u = await bc.treasury('staker3');
        for (let l = 1; l <= 4; l++) await upgrade(u, l);
        await c.send(u.getSender(), { value: toNano('20') + toNano('0.03') },
            { $$type: 'StakeTON', duration: 14n, autoRestake: false, referrerAddress: null });
        await owner.send({ to: c.address, value: toNano('100'), bounce: false });

        bc.now! += 14 * 86400 + 10;
        const res = await c.send(u.getSender(), { value: toNano('0.05') }, { $$type: 'ClaimStakingRewards', stakeId: 0n });
        expect(paidTo(res, u.address)).toBeGreaterThan(toNano('20'));
        expect((await c.getGetStakeDetails(u.address, 0n))!.isActive).toBe(false);
    });

    // ---------------------------------------------------------------- owner controls
    it('can be paused and unpaused', async () => {
        await deploy('500');
        const u = await bc.treasury('paused');
        await c.send(owner.getSender(), { value: toNano('0.05') }, { $$type: 'SetPaused', paused: true });
        expect((await c.getGetTreasuryStatus()).isPaused).toBe(true);
        const blocked = await upgrade(u, 1);
        expect(blocked.transactions).toHaveTransaction({ from: u.address, to: c.address, success: false });
        await c.send(owner.getSender(), { value: toNano('0.05') }, { $$type: 'SetPaused', paused: false });
        await upgrade(u, 1);
        expect((await c.getGetUserInfo(u.address))!.level).toBe(1n);
    });

    it('only the owner can pause', async () => {
        await deploy('500');
        const u = await bc.treasury('rando');
        const res = await c.send(u.getSender(), { value: toNano('0.05') }, { $$type: 'SetPaused', paused: true });
        expect(res.transactions).toHaveTransaction({ from: u.address, to: c.address, success: false });
    });

    it('stake capital can be retained instead of forwarded', async () => {
        await deploy('500');
        const u = await bc.treasury('staker4');
        for (let l = 1; l <= 4; l++) await upgrade(u, l);
        await c.send(owner.getSender(), { value: toNano('0.05') }, { $$type: 'SetStakeCapitalPolicy', forwardToTreasuryWallet: false });
        const before = await balanceOf();
        await c.send(u.getSender(), { value: toNano('10') + toNano('0.03') },
            { $$type: 'StakeTON', duration: 30n, autoRestake: false, referrerAddress: null });
        expect(await balanceOf()).toBeGreaterThan(before + toNano('9.9'));
    });

    // ---------------------------------------------------------------- admin visibility
    it('reports what the treasury owes', async () => {
        await deploy('500');
        const u = await bc.treasury('liab');
        for (let l = 1; l <= 4; l++) await upgrade(u, l);
        await c.send(u.getSender(), { value: toNano('20') + toNano('0.03') },
            { $$type: 'StakeTON', duration: 14n, autoRestake: false, referrerAddress: null });
        await c.send(u.getSender(), { value: toNano('0.05') }, { $$type: 'CheckIn' });
        bc.now! += 14 * 86400 + 10;

        const snap = await c.getGetAdminUserSnapshot(u.address);
        expect(snap!.maturedCapitalTon).toBe(toNano('20'));
        expect(snap!.pendingCheckInRewards).toBe(toNano('0.01'));
        expect(snap!.pendingStakingRewardsTon).toBeGreaterThan(0n);
        expect(snap!.tonDueNow).toBe(snap!.pendingCheckInRewards + snap!.pendingStakingRewardsTon + snap!.maturedCapitalTon);

        const liab = await c.getGetTreasuryLiabilities(0n, 50n);
        expect(liab.tonDueNow).toBe(snap!.tonDueNow);
        expect(liab.activeStakedTon).toBe(toNano('20'));
        console.log(`  treasury owes now: ${fromNano(liab.tonDueNow)} TON across ${liab.usersScanned} users`);

        const page = await c.getGetAdminUserSnapshotsPaginated(0n, 50n);
        expect(page.size).toBe(1);
        const status = await c.getGetTreasuryStatus();
        expect(status.totalUsers).toBe(1n);
    });

    // ---------------------------------------------------------------- spillover
    it('rotates spillover across eligible users instead of paying the creator wallet', async () => {
        await deploy('500');
        // three level-2 users are eligible for level-1 spillover
        const pool: SandboxContract<TreasuryContract>[] = [];
        for (let i = 0; i < 3; i++) {
            const p = await bc.treasury('pool' + i);
            await upgrade(p, 1);
            await upgrade(p, 2);
            pool.push(p);
        }
        bc.now! += 10;

        const hits = [0, 0, 0];
        let creatorFallbacks = 0;
        for (let i = 0; i < 6; i++) {
            const buyer = await bc.treasury('sbuyer' + i);
            const res = await upgrade(buyer, 1);
            pool.forEach((p, idx) => { if (paidTo(res, p.address) > 0n) hits[idx]++; });
            if (hasBody(res, 'Unclaimed Spillover')) creatorFallbacks++;
        }
        console.log(`  spillover hits per eligible user: ${hits.join(' / ')}`);
        // every purchase found a real recipient, spread evenly
        expect(hits.reduce((a, b) => a + b, 0)).toBe(6);
        expect(Math.max(...hits) - Math.min(...hits)).toBeLessThanOrEqual(1);
        expect(creatorFallbacks).toBe(0);
    });

    it('never pays spillover to the buyer of that purchase', async () => {
        await deploy('500');
        const solo = await bc.treasury('solo');
        await upgrade(solo, 1);
        bc.now! += 10;
        const res = await upgrade(solo, 2);   // only eligible level-2 user is the buyer
        expect(paidTo(res, solo.address)).toBe(0n);
        expect(hasBody(res, 'Unclaimed Spillover')).toBe(true);   // falls back instead
    });

    // ---------------------------------------------------------------- gas ceiling
    it('upgrade gas stays flat as the user base grows', async () => {
        await deploy('60000');
        const sampled: string[] = [];
        let peak = 0n;
        for (let n = 0; n < 1000; n++) {
            const u = await bc.treasury('u' + n);
            const r: any = await upgrade(u, 1);
            let thisUpgrade = 0n;
            for (const tx of r.transactions) {
                const d: any = tx.description;
                if (d.type !== 'generic') continue;
                if (tx.inMessage?.info?.dest?.toString?.() !== c.address.toString()) continue;
                if (tx.inMessage?.info?.src?.toString?.() !== u.address.toString()) continue;
                expect(d.computePhase.exitCode).toBe(0);
                thisUpgrade = d.computePhase.gasUsed;
            }
            if (thisUpgrade > peak) peak = thisUpgrade;
            if (n === 0 || n === 249 || n === 499 || n === 999) sampled.push(`${n + 1}:${thisUpgrade}`);
        }
        console.log(`  UpgradeLevel gas at users ${sampled.join('  ')}   peak=${peak}`);
        // the unbounded scan hit the 1,000,000 ceiling (exit -14) at ~200 users
        expect(peak).toBeLessThan(120000n);
    }, 1800000);
});
