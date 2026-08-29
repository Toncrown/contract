/**
 * Step 1 of the migration: read every user record out of the OLD contract.
 *
 *   npx blueprint run exportState
 *
 * Set OLD_CONTRACT in .env (or pass it when prompted). Writes migration-snapshot.json.
 *
 * This talks to the old contract through raw get-method calls and reads the result
 * tuples by position, because the old contract predates the `linkReferrer` field and
 * the generated wrapper from this build would mis-parse its User struct.
 */
import { Address, TupleReader, beginCell } from '@ton/core';
import { NetworkProvider, sleep } from '@ton/blueprint';
import * as fs from 'fs';

export const SNAPSHOT_FILE = 'migration-snapshot.json';

// Field order of the OLD contract's User struct, as returned by getUserInfo.
const U = {
    referrer: 0, level: 1, vipClass: 2, directReferrals: 3, totalReferrals: 4,
    otherReferrals: 5, lastCheckIn: 6, levelExpiration: 7, totalEarned: 8,
    isActive: 9, registrationTime: 10, stakeCounter: 11, /* 12 stakes, 13 downlines */
    spilloverIndex: 14, pendingCheckInRewards: 15, totalCheckInEarned: 16,
    totalCheckInClaimed: 17, totalStakingClaimed: 18, totalReferralEarned: 19,
    totalSpilloverEarned: 20, transactionCounter: 21,
};

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

// toncenter's free tier is roughly one request per second; back off and retry rather
// than dropping a user out of the snapshot.
async function call(provider: NetworkProvider, addr: Address, method: string, args: any[] = []): Promise<TupleReader> {
    for (let attempt = 0; ; attempt++) {
        try {
            const res = await provider.provider(addr).get(method as any, args as any);
            await sleep(1100);
            return res.stack;
        } catch (e) {
            if (attempt >= 5) throw new Error(`${method} failed after 6 attempts: ${e}`);
            const wait = 2000 * 2 ** attempt;
            console.log(`   ${method} failed (${e}); retrying in ${wait / 1000}s`);
            await sleep(wait);
        }
    }
}

const addrArg = (a: Address) => [{ type: 'slice' as const, cell: beginCell().storeAddress(a).endCell() }];

export async function run(provider: NetworkProvider) {
    const oldAddress = Address.parse(
        process.env.OLD_CONTRACT ?? (await provider.ui().input('Old contract address')),
    );

    console.log(`Reading ${oldAddress.toString()}\n`);

    const stats = await call(provider, oldAddress, 'getPlatformStats');
    const platform = {
        totalUsers: stats.readBigNumber().toString(),
        totalStakedTon: stats.readBigNumber().toString(),
        totalStakedUsdt: stats.readBigNumber().toString(),
        totalDistributed: stats.readBigNumber().toString(),
        activeStakes: stats.readBigNumber().toString(),
    };

    const earnings = await call(provider, oldAddress, 'getPlatformEarningsInfo');
    earnings.readBigNumber(); earnings.readBigNumber(); earnings.readBigNumber(); earnings.readBigNumber();
    const totalCheckInRewardsAccrued = earnings.readBigNumber().toString();
    const totalCheckInRewardsClaimed = earnings.readBigNumber().toString();
    const totalReferralRewardsPaid = earnings.readBigNumber().toString();
    const totalSpilloverRewardsPaid = earnings.readBigNumber().toString();
    const totalCreatorRewardsPaid = earnings.readBigNumber().toString();

    let totalUsers = Number(platform.totalUsers);
    const limit = process.env.EXPORT_LIMIT ? Number(process.env.EXPORT_LIMIT) : 0;
    if (limit > 0 && limit < totalUsers) {
        console.log(`EXPORT_LIMIT=${limit} — smoke test only, NOT a complete snapshot\n`);
        totalUsers = limit;
    }
    console.log(`${totalUsers} users to export\n`);

    const users: SnapshotUser[] = [];
    for (let i = 0; i < totalUsers; i++) {
        const addrStack = await call(provider, oldAddress, 'getUserAddressByIndex', [{ type: 'int', value: BigInt(i) }]);
        const address = addrStack.readAddressOpt();
        if (address === null) {
            console.log(`   [${i}] empty slot, skipping`);
            continue;
        }

        const info = (await call(provider, oldAddress, 'getUserInfo', addrArg(address))).readTupleOpt();
        if (info === null) {
            console.log(`   [${i}] ${address.toString().slice(0, 12)}… in userList but getUserInfo returned null — skipping`);
            continue;
        }
        const items: any[] = [];
        while (info.remaining > 0) items.push(info.pop());

        const num = (k: number) => (items[k]?.value ?? 0n).toString();
        const bool = (k: number) => (items[k]?.value ?? 0n) === -1n;
        const addr = (k: number) => {
            const it = items[k];
            if (!it || it.type === 'null') return null;
            try { return it.cell.beginParse().loadAddressAny()?.toString() ?? null; } catch { return null; }
        };

        // Stakes come from the dedicated getters rather than the raw map cell.
        const stakes: SnapshotStake[] = [];
        const stakeCounter = Number(num(U.stakeCounter));
        for (let sid = 0; sid < stakeCounter; sid++) {
            const st = await call(provider, oldAddress, 'getStakeDetails',
                [...addrArg(address), { type: 'int', value: BigInt(sid) }]);
            const t = st.readTupleOpt();
            if (t === null) continue;
            stakes.push({
                stakeId: t.readBigNumber().toString(),
                amount: t.readBigNumber().toString(),
                startTime: t.readBigNumber().toString(),
                duration: t.readBigNumber().toString(),
                vipClass: t.readBigNumber().toString(),
                autoRestake: t.readBoolean(),
                lastClaim: t.readBigNumber().toString(),
                totalClaimed: t.readBigNumber().toString(),
                isActive: t.readBoolean(),
                stakedAsset: t.readBigNumber().toString(),
            });
        }

        users.push({
            index: i,
            address: address.toString(),
            referrer: addr(U.referrer),
            level: num(U.level), vipClass: num(U.vipClass),
            directReferrals: num(U.directReferrals), totalReferrals: num(U.totalReferrals),
            otherReferrals: num(U.otherReferrals), lastCheckIn: num(U.lastCheckIn),
            levelExpiration: num(U.levelExpiration), totalEarned: num(U.totalEarned),
            isActive: bool(U.isActive), registrationTime: num(U.registrationTime),
            spilloverIndex: num(U.spilloverIndex),
            pendingCheckInRewards: num(U.pendingCheckInRewards),
            totalCheckInEarned: num(U.totalCheckInEarned),
            totalCheckInClaimed: num(U.totalCheckInClaimed),
            totalStakingClaimed: num(U.totalStakingClaimed),
            totalReferralEarned: num(U.totalReferralEarned),
            totalSpilloverEarned: num(U.totalSpilloverEarned),
            stakes,
        });

        console.log(`   [${i + 1}/${totalUsers}] ${address.toString().slice(0, 12)}…  level ${num(U.level)}  ${stakes.length} stake(s)`);
    }

    const snapshot: Snapshot = {
        takenAt: new Date().toISOString(),
        oldContract: oldAddress.toString(),
        partial: limit > 0,
        totalUsers: users.length,
        platform: {
            ...platform,
            totalCheckInRewardsAccrued, totalCheckInRewardsClaimed,
            totalReferralRewardsPaid, totalSpilloverRewardsPaid, totalCreatorRewardsPaid,
        },
        users,
    };

    fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2));

    const withStakes = users.filter((u) => u.stakes.length > 0).length;
    const pendingCheckIn = users.reduce((a, u) => a + BigInt(u.pendingCheckInRewards), 0n);
    console.log(`\nWrote ${SNAPSHOT_FILE}`);
    console.log(`   users: ${users.length}   with stakes: ${withStakes}`);
    console.log(`   unclaimed check-in rewards: ${Number(pendingCheckIn) / 1e9} TON`);
    if (users.length !== totalUsers) {
        console.log(`\n   WARNING: expected ${totalUsers} users but exported ${users.length}. Do not import until this is understood.`);
    }
    if (limit > 0) {
        console.log(`\n   PARTIAL SNAPSHOT (EXPORT_LIMIT=${limit}). Re-run without EXPORT_LIMIT before importing.`);
    }

    // Cheap sanity check that the tuple positions actually lined up.
    const odd = users.filter((u) => Number(u.level) < 0 || Number(u.level) > 10 || Number(u.registrationTime) <= 0);
    if (odd.length > 0) {
        console.log(`\n   ${odd.length} user(s) have an implausible level or registrationTime.`);
        console.log(`   That usually means the getUserInfo tuple layout differs from what this script assumes.`);
        odd.slice(0, 5).forEach((u) => console.log(`      ${u.address}  level=${u.level} regTime=${u.registrationTime}`));
    }
}
