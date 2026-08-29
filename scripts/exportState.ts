/**
 * Step 1 of the migration: read every user record out of the OLD contract.
 *
 *   npx blueprint run exportState
 *
 * Set OLD_CONTRACT in .env. Writes migration-snapshot.json. Read-only.
 * EXPORT_LIMIT=n exports only the first n users as a smoke test; snapshots taken
 * that way are marked partial and importState refuses them.
 *
 * Parsing is done by the wrapper generated from contracts/legacy_v1.tact, which is
 * the deployed source verbatim. Hand-parsing the getUserInfo tuple by position does
 * not work: User has 23 fields, and Tact splits a struct past 14 fields into a
 * nested tuple, so everything from spilloverIndex onward sits one level down.
 */
import { Address, Dictionary } from '@ton/core';
import { NetworkProvider, sleep } from '@ton/blueprint';
import { TonCrown as TonCrownV1 } from '../build/TonCrownV1/TonCrownV1_TonCrown';
import * as fs from 'fs';

export const SNAPSHOT_FILE = 'migration-snapshot.json';

export type SnapshotStake = {
    stakeId: string; amount: string; startTime: string; duration: string;
    vipClass: string; autoRestake: boolean; lastClaim: string; totalClaimed: string;
    isActive: boolean; stakedAsset: string;
};

export type SnapshotUser = {
    index: number;
    address: string;
    referrer: string | null;
    level: string; vipClass: string;
    directReferrals: string; totalReferrals: string; otherReferrals: string;
    lastCheckIn: string; levelExpiration: string; totalEarned: string;
    isActive: boolean; registrationTime: string; spilloverIndex: string;
    pendingCheckInRewards: string; totalCheckInEarned: string; totalCheckInClaimed: string;
    totalStakingClaimed: string; totalReferralEarned: string; totalSpilloverEarned: string;
    /** slot -> child address, exactly as the old contract stored it */
    downlines: Record<string, string>;
    stakes: SnapshotStake[];
};

export type Snapshot = {
    takenAt: string;
    oldContract: string;
    /** true when EXPORT_LIMIT was set — a smoke test, never import this. */
    partial?: boolean;
    totalUsers: number;
    platform: Record<string, string>;
    users: SnapshotUser[];
};

// toncenter's free tier is roughly one request per second, and times out under load.
// Back off and retry rather than dropping a user out of the snapshot.
async function retry<T>(label: string, fn: () => Promise<T>): Promise<T> {
    for (let attempt = 0; ; attempt++) {
        try {
            const out = await fn();
            await sleep(1100);
            return out;
        } catch (e) {
            if (attempt >= 5) throw new Error(`${label} failed after 6 attempts: ${e}`);
            const wait = 2000 * 2 ** attempt;
            console.log(`   ${label} failed (${(e as Error).message ?? e}); retrying in ${wait / 1000}s`);
            await sleep(wait);
        }
    }
}

export async function run(provider: NetworkProvider) {
    const oldAddress = Address.parse(
        process.env.OLD_CONTRACT ?? (await provider.ui().input('Old contract address')),
    );
    const c = provider.open(TonCrownV1.fromAddress(oldAddress));

    console.log(`Reading ${oldAddress.toString()}\n`);

    const stats = await retry('getPlatformStats', () => c.getGetPlatformStats());
    const earnings = await retry('getPlatformEarningsInfo', () => c.getGetPlatformEarningsInfo());

    let totalUsers = Number(stats.totalUsers);
    const limit = process.env.EXPORT_LIMIT ? Number(process.env.EXPORT_LIMIT) : 0;
    if (limit > 0 && limit < totalUsers) {
        console.log(`EXPORT_LIMIT=${limit} — smoke test only, NOT a complete snapshot\n`);
        totalUsers = limit;
    }
    console.log(`${totalUsers} users to export\n`);

    const users: SnapshotUser[] = [];
    for (let i = 0; i < totalUsers; i++) {
        const address = await retry(`getUserAddressByIndex(${i})`, () => c.getGetUserAddressByIndex(BigInt(i)));
        if (address === null) {
            console.log(`   [${i}] empty slot, skipping`);
            continue;
        }

        const u = await retry(`getUserInfo(${i})`, () => c.getGetUserInfo(address));
        if (u === null) {
            console.log(`   [${i}] ${address.toString().slice(0, 12)}… in userList but getUserInfo is null — skipping`);
            continue;
        }

        // stakes and downlines come back as parsed dictionaries, so no extra calls.
        const stakes: SnapshotStake[] = [];
        for (const [id, s] of u.stakes) {
            stakes.push({
                stakeId: id.toString(), amount: s.amount.toString(),
                startTime: s.startTime.toString(), duration: s.duration.toString(),
                vipClass: s.vipClass.toString(), autoRestake: s.autoRestake,
                lastClaim: s.lastClaim.toString(), totalClaimed: s.totalClaimed.toString(),
                isActive: s.isActive, stakedAsset: s.stakedAsset.toString(),
            });
        }
        stakes.sort((a, b) => Number(a.stakeId) - Number(b.stakeId));

        const downlines: Record<string, string> = {};
        for (const [slot, child] of u.downlines) downlines[slot.toString()] = child.toString();

        users.push({
            index: i,
            address: address.toString(),
            referrer: u.referrer ? u.referrer.toString() : null,
            level: u.level.toString(), vipClass: u.vipClass.toString(),
            directReferrals: u.directReferrals.toString(), totalReferrals: u.totalReferrals.toString(),
            otherReferrals: u.otherReferrals.toString(), lastCheckIn: u.lastCheckIn.toString(),
            levelExpiration: u.levelExpiration.toString(), totalEarned: u.totalEarned.toString(),
            isActive: u.isActive, registrationTime: u.registrationTime.toString(),
            spilloverIndex: u.spilloverIndex.toString(),
            pendingCheckInRewards: u.pendingCheckInRewards.toString(),
            totalCheckInEarned: u.totalCheckInEarned.toString(),
            totalCheckInClaimed: u.totalCheckInClaimed.toString(),
            totalStakingClaimed: u.totalStakingClaimed.toString(),
            totalReferralEarned: u.totalReferralEarned.toString(),
            totalSpilloverEarned: u.totalSpilloverEarned.toString(),
            downlines, stakes,
        });

        console.log(`   [${i + 1}/${totalUsers}] ${address.toString().slice(0, 12)}…  level ${u.level}  ${stakes.length} stake(s)  ${Object.keys(downlines).length} downline(s)`);
    }

    const snapshot: Snapshot = {
        takenAt: new Date().toISOString(),
        oldContract: oldAddress.toString(),
        partial: limit > 0,
        totalUsers: users.length,
        platform: {
            totalUsers: stats.totalUsers.toString(),
            totalStakedTon: stats.totalStakedTon.toString(),
            totalStakedUsdt: stats.totalStakedUsdt.toString(),
            totalDistributed: stats.totalDistributed.toString(),
            activeStakes: stats.activeStakes.toString(),
            totalCheckInRewardsAccrued: earnings.totalCheckInRewardsAccrued.toString(),
            totalCheckInRewardsClaimed: earnings.totalCheckInRewardsClaimed.toString(),
            totalReferralRewardsPaid: earnings.totalReferralRewardsPaid.toString(),
            totalSpilloverRewardsPaid: earnings.totalSpilloverRewardsPaid.toString(),
            totalCreatorRewardsPaid: earnings.totalCreatorRewardsPaid.toString(),
        },
        users,
    };

    fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2));

    const withStakes = users.filter((u) => u.stakes.length > 0).length;
    const pendingCheckIn = users.reduce((a, u) => a + BigInt(u.pendingCheckInRewards), 0n);
    const stakedTon = users.reduce((a, u) =>
        a + u.stakes.filter((s) => s.isActive && s.stakedAsset === '0').reduce((b, s) => b + BigInt(s.amount), 0n), 0n);

    console.log(`\nWrote ${SNAPSHOT_FILE}`);
    console.log(`   users:                       ${users.length}`);
    console.log(`   with stakes:                 ${withStakes}`);
    console.log(`   active staked TON (summed):  ${Number(stakedTon) / 1e9}`);
    console.log(`   contract totalStakedTon:     ${Number(stats.totalStakedTon) / 1e9}`);
    console.log(`   unclaimed check-in rewards:  ${Number(pendingCheckIn) / 1e9} TON`);

    if (limit > 0) {
        console.log(`\n   PARTIAL SNAPSHOT (EXPORT_LIMIT=${limit}). Re-run without EXPORT_LIMIT before importing.`);
    } else {
        if (users.length !== Number(stats.totalUsers)) {
            console.log(`\n   WARNING: contract reports ${stats.totalUsers} users, exported ${users.length}.`);
        }
        if (stakedTon !== stats.totalStakedTon) {
            console.log(`\n   NOTE: summed active TON stakes (${Number(stakedTon) / 1e9}) != totalStakedTon (${Number(stats.totalStakedTon) / 1e9}).`);
            console.log(`   Expected if any stake was closed without the counter being decremented; worth understanding before cutover.`);
        }
    }

    const odd = users.filter((u) => Number(u.registrationTime) <= 0);
    if (odd.length > 0) {
        console.log(`\n   ${odd.length} user(s) have registrationTime 0:`);
        odd.slice(0, 5).forEach((u) => console.log(`      ${u.address}  level=${u.level}`));
    }
}
