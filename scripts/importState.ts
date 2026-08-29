/**
 * Step 3 of the migration: replay the snapshot into the NEW contract.
 *
 *   npx blueprint run importState
 *
 * Set NEW_CONTRACT in .env. Must be run from the owner wallet.
 *
 * Safe to re-run: progress is written to migration-progress.json after every message,
 * and completed items are skipped. If it dies halfway, run it again.
 */
import { Address, toNano } from '@ton/core';
import { NetworkProvider, sleep } from '@ton/blueprint';
import { TonCrown } from '../build/TonCrown/TonCrown_TonCrown';
import { Snapshot, SnapshotUser, SNAPSHOT_FILE } from './exportState';
import * as fs from 'fs';

const PROGRESS_FILE = 'migration-progress.json';
const GAS = toNano('0.05');
const PAUSE_MS = 2500;

type Progress = { users: string[]; downlines: string[]; stakes: string[]; totals: boolean };

const loadProgress = (): Progress =>
    fs.existsSync(PROGRESS_FILE)
        ? JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'))
        : { users: [], downlines: [], stakes: [], totals: false };

const saveProgress = (p: Progress) => fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2));

/**
 * The old contract stored a single `referrer` — the matrix parent. The new contract
 * also tracks `linkReferrer`, the wallet named on the registration link, which the old
 * one never persisted. Setting linkReferrer = referrer pays the user's actual upline
 * the full referral split, which is what happened for directly-placed users anyway.
 * Set MIGRATE_LINK_REFERRER=none to leave it null instead (that share then goes to
 * creatorWallet3 as "System Link Commission").
 */
const linkReferrerFor = (u: SnapshotUser) =>
    process.env.MIGRATE_LINK_REFERRER === 'none' ? null : u.referrer;

/**
 * Downlines are rebuilt from each user's `referrer`, in registration order. The old
 * contract assigned slots by incrementing directReferrals as children attached, so
 * registration order reproduces the original slot numbering exactly.
 */
function rebuildDownlines(users: SnapshotUser[]) {
    const known = new Set(users.map((u) => u.address));
    const bySlot: { parent: string; slot: number; child: string }[] = [];
    const nextSlot = new Map<string, number>();

    for (const u of [...users].sort((a, b) => a.index - b.index)) {
        if (!u.referrer || !known.has(u.referrer)) continue;   // creatorWallet3 fallback, or unregistered
        const slot = (nextSlot.get(u.referrer) ?? 0) + 1;
        nextSlot.set(u.referrer, slot);
        bySlot.push({ parent: u.referrer, slot, child: u.address });
    }
    return bySlot;
}

export async function run(provider: NetworkProvider) {
    if (!fs.existsSync(SNAPSHOT_FILE)) throw new Error(`${SNAPSHOT_FILE} not found — run exportState first`);
    const snap: Snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf8'));

    const newAddress = Address.parse(
        process.env.NEW_CONTRACT ?? (await provider.ui().input('New contract address')),
    );
    const c = provider.open(TonCrown.fromAddress(newAddress));

    const status = await c.getGetTreasuryStatus();
    if (status.importsLocked) throw new Error('Imports are locked on this contract — nothing can be written');

    const progress = loadProgress();
    const users = [...snap.users].sort((a, b) => a.index - b.index);
    const downlines = rebuildDownlines(users);
    const stakes = users.flatMap((u) => u.stakes.map((s) => ({ user: u.address, stake: s })));

    console.log(`Importing into ${newAddress.toString()}`);
    console.log(`   ${users.length} users, ${downlines.length} downline links, ${stakes.length} stakes`);
    console.log(`   already done: ${progress.users.length} / ${progress.downlines.length} / ${progress.stakes.length}\n`);

    const send = async (body: any, label: string, mark: () => void) => {
        await c.send(provider.sender(), { value: GAS }, body);
        mark();
        saveProgress(progress);
        console.log(`   ${label}`);
        await sleep(PAUSE_MS);
    };

    // 1. Users, in original registration order — userList index order drives spillover.
    for (const u of users) {
        if (progress.users.includes(u.address)) continue;
        await send({
            $$type: 'ImportUser',
            userAddress: Address.parse(u.address),
            referrer: u.referrer ? Address.parse(u.referrer) : null,
            linkReferrer: linkReferrerFor(u) ? Address.parse(linkReferrerFor(u)!) : null,
            level: BigInt(u.level), vipClass: BigInt(u.vipClass),
            directReferrals: BigInt(u.directReferrals), totalReferrals: BigInt(u.totalReferrals),
            otherReferrals: BigInt(u.otherReferrals), lastCheckIn: BigInt(u.lastCheckIn),
            levelExpiration: BigInt(u.levelExpiration), totalEarned: BigInt(u.totalEarned),
            isActive: u.isActive, registrationTime: BigInt(u.registrationTime),
            spilloverIndex: BigInt(u.spilloverIndex),
            pendingCheckInRewards: BigInt(u.pendingCheckInRewards),
            totalCheckInEarned: BigInt(u.totalCheckInEarned),
            totalCheckInClaimed: BigInt(u.totalCheckInClaimed),
            totalStakingClaimed: BigInt(u.totalStakingClaimed),
            totalReferralEarned: BigInt(u.totalReferralEarned),
            totalSpilloverEarned: BigInt(u.totalSpilloverEarned),
        }, `user ${progress.users.length + 1}/${users.length}  ${u.address.slice(0, 12)}…`,
            () => progress.users.push(u.address));
    }

    // 2. Matrix links — both sides must already exist, which the contract enforces.
    for (const d of downlines) {
        const key = `${d.parent}:${d.slot}`;
        if (progress.downlines.includes(key)) continue;
        await send({
            $$type: 'ImportDownline',
            parent: Address.parse(d.parent),
            slot: BigInt(d.slot),
            child: Address.parse(d.child),
        }, `downline ${progress.downlines.length + 1}/${downlines.length}  ${d.parent.slice(0, 10)}…[${d.slot}]`,
            () => progress.downlines.push(key));
    }

    // 3. Stakes, including closed ones — stakeCounter is derived from the highest id.
    for (const s of stakes) {
        const key = `${s.user}:${s.stake.stakeId}`;
        if (progress.stakes.includes(key)) continue;
        await send({
            $$type: 'ImportStake',
            userAddress: Address.parse(s.user),
            stake: {
                $$type: 'StakeInfo',
                stakeId: BigInt(s.stake.stakeId), amount: BigInt(s.stake.amount),
                startTime: BigInt(s.stake.startTime), duration: BigInt(s.stake.duration),
                vipClass: BigInt(s.stake.vipClass), autoRestake: s.stake.autoRestake,
                lastClaim: BigInt(s.stake.lastClaim), totalClaimed: BigInt(s.stake.totalClaimed),
                isActive: s.stake.isActive, stakedAsset: BigInt(s.stake.stakedAsset),
            },
        }, `stake ${progress.stakes.length + 1}/${stakes.length}  ${s.user.slice(0, 10)}…#${s.stake.stakeId}`,
            () => progress.stakes.push(key));
    }

    // 4. Platform counters.
    if (!progress.totals) {
        const p = snap.platform;
        await send({
            $$type: 'ImportPlatformTotals',
            totalStakedTon: BigInt(p.totalStakedTon), totalStakedUsdt: BigInt(p.totalStakedUsdt),
            totalDistributed: BigInt(p.totalDistributed), activeStakes: BigInt(p.activeStakes),
            totalCheckInRewardsAccrued: BigInt(p.totalCheckInRewardsAccrued),
            totalCheckInRewardsClaimed: BigInt(p.totalCheckInRewardsClaimed),
            totalReferralRewardsPaid: BigInt(p.totalReferralRewardsPaid),
            totalSpilloverRewardsPaid: BigInt(p.totalSpilloverRewardsPaid),
            totalCreatorRewardsPaid: BigInt(p.totalCreatorRewardsPaid),
        }, 'platform totals', () => { progress.totals = true; });
    }

    console.log(`\nImport complete. Run verifyMigration next.`);
    console.log(`Do NOT send LockImports until verification passes.`);
}
