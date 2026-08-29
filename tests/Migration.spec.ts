import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, Address } from '@ton/core';
import { TonCrown } from '../build/TonCrown/TonCrown_TonCrown';
import '@ton/test-utils';

const COSTS = ['0', '1.25', '2.51', '3.77', '5.03', '6.27', '7.53', '8.78', '10.04', '11.29', '12.55'];

describe('migration', () => {
    let bc: Blockchain;
    let owner: SandboxContract<TreasuryContract>;

    async function fresh() {
        const c = bc.openContract(await TonCrown.fromInit(owner.address));
        await c.send(owner.getSender(), { value: toNano('0.5') }, { $$type: 'Deploy', queryId: 0n });
        await owner.send({ to: c.address, value: toNano('2000'), bounce: false });
        return c;
    }

    beforeEach(async () => {
        bc = await Blockchain.create();
        bc.now = Math.floor(Date.now() / 1000);
        owner = await bc.treasury('owner');
    });

    it('carries every user, matrix link and stake across to a new contract', async () => {
        // ---- build a source contract with a real referral tree and stakes
        const src = await fresh();
        const upgrade = (c: SandboxContract<TonCrown>, u: SandboxContract<TreasuryContract>, l: number, ref: Address | null = null) =>
            c.send(u.getSender(), { value: toNano(COSTS[l]) + toNano('0.05') },
                { $$type: 'UpgradeLevel', targetLevel: BigInt(l), referrerAddress: ref });

        const root = await bc.treasury('root');
        for (let l = 1; l <= 5; l++) await upgrade(src, root, l);

        const members: SandboxContract<TreasuryContract>[] = [root];
        for (let i = 0; i < 8; i++) {
            const u = await bc.treasury('m' + i);
            bc.now! += 5;
            const sponsor = members[i % members.length];
            for (let l = 1; l <= (i % 4) + 1; l++) await upgrade(src, u, l, l === 1 ? sponsor.address : null);
            members.push(u);
        }
        // root is VIP (level 5) so it can stake
        await src.send(root.getSender(), { value: toNano('12') + toNano('0.03') },
            { $$type: 'StakeTON', duration: 30n, autoRestake: false, referrerAddress: null });
        await src.send(root.getSender(), { value: toNano('0.05') }, { $$type: 'CheckIn' });

        // ---- export (mirrors scripts/exportState.ts)
        const stats = await src.getGetPlatformStats();
        const total = Number(stats.totalUsers);
        const exported: any[] = [];
        for (let i = 0; i < total; i++) {
            const addr = (await src.getGetUserAddressByIndex(BigInt(i)))!;
            const info = (await src.getGetUserInfo(addr))!;
            const stakes: any[] = [];
            for (let sid = 0; sid < Number(info.stakeCounter); sid++) {
                const sd = await src.getGetStakeDetails(addr, BigInt(sid));
                if (sd) stakes.push(sd);
            }
            exported.push({ index: i, addr, info, stakes });
        }
        expect(exported.length).toBe(9);

        // ---- import into a brand new contract
        const dst = await fresh();
        for (const e of exported) {
            await dst.send(owner.getSender(), { value: toNano('0.05') }, {
                $$type: 'ImportUser',
                userAddress: e.addr,
                referrer: e.info.referrer,
                linkReferrer: e.info.referrer,       // scripts default: linkReferrer = referrer
                level: e.info.level, vipClass: e.info.vipClass,
                directReferrals: e.info.directReferrals, totalReferrals: e.info.totalReferrals,
                otherReferrals: e.info.otherReferrals, lastCheckIn: e.info.lastCheckIn,
                levelExpiration: e.info.levelExpiration, totalEarned: e.info.totalEarned,
                isActive: e.info.isActive, registrationTime: e.info.registrationTime,
                spilloverIndex: e.info.spilloverIndex,
                pendingCheckInRewards: e.info.pendingCheckInRewards,
                totalCheckInEarned: e.info.totalCheckInEarned,
                totalCheckInClaimed: e.info.totalCheckInClaimed,
                totalStakingClaimed: e.info.totalStakingClaimed,
                totalReferralEarned: e.info.totalReferralEarned,
                totalSpilloverEarned: e.info.totalSpilloverEarned,
            });
        }

        // downlines rebuilt from referrer in registration order (mirrors the script)
        const known = new Set(exported.map((e) => e.addr.toString()));
        const nextSlot = new Map<string, number>();
        let links = 0;
        for (const e of exported) {
            const ref = e.info.referrer?.toString();
            if (!ref || !known.has(ref)) continue;
            const slot = (nextSlot.get(ref) ?? 0) + 1;
            nextSlot.set(ref, slot);
            await dst.send(owner.getSender(), { value: toNano('0.05') },
                { $$type: 'ImportDownline', parent: Address.parse(ref), slot: BigInt(slot), child: e.addr });
            links++;
        }
        expect(links).toBeGreaterThan(0);

        for (const e of exported) {
            for (const s of e.stakes) {
                await dst.send(owner.getSender(), { value: toNano('0.05') }, {
                    $$type: 'ImportStake', userAddress: e.addr,
                    stake: {
                        $$type: 'StakeInfo', stakeId: s.stakeId, amount: s.amount,
                        startTime: s.startTime, duration: s.duration, vipClass: s.vipClass,
                        autoRestake: s.autoRestake, lastClaim: s.lastClaim,
                        totalClaimed: s.totalClaimed, isActive: s.isActive, stakedAsset: s.stakedAsset,
                    },
                });
            }
        }

        await dst.send(owner.getSender(), { value: toNano('0.05') }, {
            $$type: 'ImportPlatformTotals',
            totalStakedTon: stats.totalStakedTon, totalStakedUsdt: stats.totalStakedUsdt,
            totalDistributed: stats.totalDistributed, activeStakes: stats.activeStakes,
            totalCheckInRewardsAccrued: 0n, totalCheckInRewardsClaimed: 0n,
            totalReferralRewardsPaid: 0n, totalSpilloverRewardsPaid: 0n, totalCreatorRewardsPaid: 0n,
        });

        // ---- verify (mirrors scripts/verifyMigration.ts)
        const after = await dst.getGetPlatformStats();
        expect(after.totalUsers).toBe(stats.totalUsers);
        expect(after.totalStakedTon).toBe(stats.totalStakedTon);
        expect(after.activeStakes).toBe(stats.activeStakes);

        for (const e of exported) {
            const got = (await dst.getGetUserInfo(e.addr))!;
            expect(got.level).toBe(e.info.level);
            expect(got.vipClass).toBe(e.info.vipClass);
            expect(got.referrer?.toString() ?? null).toBe(e.info.referrer?.toString() ?? null);
            expect(got.directReferrals).toBe(e.info.directReferrals);
            expect(got.totalReferrals).toBe(e.info.totalReferrals);
            expect(got.registrationTime).toBe(e.info.registrationTime);
            expect(got.pendingCheckInRewards).toBe(e.info.pendingCheckInRewards);
            expect(got.totalEarned).toBe(e.info.totalEarned);
            for (const s of e.stakes) {
                const sd = (await dst.getGetStakeDetails(e.addr, s.stakeId))!;
                expect(sd.amount).toBe(s.amount);
                expect(sd.isActive).toBe(s.isActive);
                expect(sd.startTime).toBe(s.startTime);
                expect(sd.lastClaim).toBe(s.lastClaim);
            }
        }

        // matrix survived: every parent's slot list matches
        for (const e of exported) {
            const ri = (await dst.getGetUserReferralInfo(e.addr))!;
            const srcRi = (await src.getGetUserReferralInfo(e.addr))!;
            for (let slot = 1n; slot <= srcRi.directReferrals; slot++) {
                expect(ri.downlines.get(slot)?.toString()).toBe(srcRi.downlines.get(slot)?.toString());
            }
        }
    }, 300000);

    it('imported users are eligible for spillover on the new contract', async () => {
        const dst = await fresh();
        const veteran = await bc.treasury('veteran');
        await dst.send(owner.getSender(), { value: toNano('0.05') }, {
            $$type: 'ImportUser', userAddress: veteran.address,
            referrer: null, linkReferrer: null,
            level: 5n, vipClass: 1n, directReferrals: 0n, totalReferrals: 0n, otherReferrals: 0n,
            lastCheckIn: 0n, levelExpiration: 0n, totalEarned: 0n, isActive: true,
            registrationTime: BigInt(bc.now! - 1000), spilloverIndex: 0n,
            pendingCheckInRewards: 0n, totalCheckInEarned: 0n, totalCheckInClaimed: 0n,
            totalStakingClaimed: 0n, totalReferralEarned: 0n, totalSpilloverEarned: 0n,
        });

        const buyer = await bc.treasury('newbuyer');
        bc.now! += 10;
        const res = await dst.send(buyer.getSender(), { value: toNano(COSTS[1]) + toNano('0.05') },
            { $$type: 'UpgradeLevel', targetLevel: 1n, referrerAddress: null });

        let paid = 0n;
        for (const tx of res.transactions)
            for (const m of (tx.outMessages?.values?.() ?? [])) {
                if (m.info.type !== 'internal') continue;
                if ((m.info as any).dest.toString() === veteran.address.toString()) paid += (m.info as any).value.coins;
            }
        expect(paid).toBeGreaterThan(0n);   // registry rebuilt on import
    });

    it('LockImports is one-way and blocks further writes', async () => {
        const dst = await fresh();
        await dst.send(owner.getSender(), { value: toNano('0.05') }, { $$type: 'LockImports' });
        expect((await dst.getGetTreasuryStatus()).importsLocked).toBe(true);

        const late = await bc.treasury('late');
        const res = await dst.send(owner.getSender(), { value: toNano('0.05') }, {
            $$type: 'ImportUser', userAddress: late.address, referrer: null, linkReferrer: null,
            level: 3n, vipClass: 0n, directReferrals: 0n, totalReferrals: 0n, otherReferrals: 0n,
            lastCheckIn: 0n, levelExpiration: 0n, totalEarned: 0n, isActive: true,
            registrationTime: 1n, spilloverIndex: 0n, pendingCheckInRewards: 0n,
            totalCheckInEarned: 0n, totalCheckInClaimed: 0n, totalStakingClaimed: 0n,
            totalReferralEarned: 0n, totalSpilloverEarned: 0n,
        });
        expect(res.transactions).toHaveTransaction({ from: owner.address, to: dst.address, success: false });
        expect(await dst.getGetUserInfo(late.address)).toBeNull();
    });

    it('only the owner can import', async () => {
        const dst = await fresh();
        const attacker = await bc.treasury('attacker');
        const res = await dst.send(attacker.getSender(), { value: toNano('0.05') }, {
            $$type: 'ImportUser', userAddress: attacker.address, referrer: null, linkReferrer: null,
            level: 10n, vipClass: 3n, directReferrals: 0n, totalReferrals: 0n, otherReferrals: 0n,
            lastCheckIn: 0n, levelExpiration: 0n, totalEarned: 0n, isActive: true,
            registrationTime: 1n, spilloverIndex: 0n, pendingCheckInRewards: toNano('1000'),
            totalCheckInEarned: 0n, totalCheckInClaimed: 0n, totalStakingClaimed: 0n,
            totalReferralEarned: 0n, totalSpilloverEarned: 0n,
        });
        expect(res.transactions).toHaveTransaction({ from: attacker.address, to: dst.address, success: false });
        expect(await dst.getGetUserInfo(attacker.address)).toBeNull();
    });
});
