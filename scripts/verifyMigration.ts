/**
 * Step 4 of the migration: prove the new contract matches the snapshot.
 *
 *   npx blueprint run verifyMigration
 *
 * Read-only. Exits non-zero on any mismatch. Do not send LockImports until this is clean.
 */
import { Address, fromNano } from '@ton/core';
import { NetworkProvider, sleep } from '@ton/blueprint';
import { TonCrown } from '../build/TonCrown/TonCrown_TonCrown';
import { pinnedReader } from './lib/readClient';
import { Snapshot, SNAPSHOT_FILE } from './exportState';
import * as fs from 'fs';

export async function run(provider: NetworkProvider) {
    const snap: Snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf8'));
    const newAddress = Address.parse(
        process.env.NEW_CONTRACT ?? (await provider.ui().input('New contract address')),
    );
    // Same nested-tuple problem applies to the new contract's User, which is larger still.
    const reader = await pinnedReader(provider);
    const c = reader.open(TonCrown.fromAddress(newAddress));

    const problems: string[] = [];
    const check = (ok: boolean, msg: string) => { if (!ok) problems.push(msg); };

    console.log(`Verifying ${newAddress.toString()} against ${SNAPSHOT_FILE}`);
    console.log(`   via ${reader.endpoint} pinned at block ${reader.seqno}\n`);

    const stats = await c.getGetPlatformStats();
    check(Number(stats.totalUsers) === snap.users.length,
        `totalUsers: contract ${stats.totalUsers}, snapshot ${snap.users.length}`);
    check(stats.totalStakedTon === BigInt(snap.platform.totalStakedTon),
        `totalStakedTon: contract ${stats.totalStakedTon}, snapshot ${snap.platform.totalStakedTon}`);
    check(stats.totalStakedUsdt === BigInt(snap.platform.totalStakedUsdt),
        `totalStakedUsdt: contract ${stats.totalStakedUsdt}, snapshot ${snap.platform.totalStakedUsdt}`);
    check(Number(stats.activeStakes) === Number(snap.platform.activeStakes),
        `activeStakes: contract ${stats.activeStakes}, snapshot ${snap.platform.activeStakes}`);

    console.log('Checking every user record…');
    for (const [n, u] of snap.users.entries()) {
        const addr = Address.parse(u.address);
        const info = await c.getGetUserInfo(addr);
        await sleep(Number(process.env.VERIFY_PACE_MS ?? '120'));

        if (info === null) { problems.push(`${u.address}: missing from new contract`); continue; }

        const at = (field: string, got: bigint | boolean | string | null, want: bigint | boolean | string | null) =>
            check(String(got) === String(want), `${u.address} ${field}: got ${got}, want ${want}`);

        at('level', info.level, BigInt(u.level));
        at('vipClass', info.vipClass, BigInt(u.vipClass));
        at('referrer', info.referrer?.toString() ?? null, u.referrer);
        at('directReferrals', info.directReferrals, BigInt(u.directReferrals));
        at('totalReferrals', info.totalReferrals, BigInt(u.totalReferrals));
        at('isActive', info.isActive, u.isActive);
        at('registrationTime', info.registrationTime, BigInt(u.registrationTime));
        at('pendingCheckInRewards', info.pendingCheckInRewards, BigInt(u.pendingCheckInRewards));
        at('totalEarned', info.totalEarned, BigInt(u.totalEarned));
        at('stakeCounter', info.stakeCounter, BigInt(u.stakes.length));

        for (const s of u.stakes) {
            const sd = await c.getGetStakeDetails(addr, BigInt(s.stakeId));
            await sleep(Number(process.env.VERIFY_PACE_MS ?? '120'));
            if (sd === null) { problems.push(`${u.address} stake ${s.stakeId}: missing`); continue; }
            at(`stake ${s.stakeId} amount`, sd.amount, BigInt(s.amount));
            at(`stake ${s.stakeId} isActive`, sd.isActive, s.isActive);
            at(`stake ${s.stakeId} startTime`, sd.startTime, BigInt(s.startTime));
            at(`stake ${s.stakeId} duration`, sd.duration, BigInt(s.duration));
            at(`stake ${s.stakeId} lastClaim`, sd.lastClaim, BigInt(s.lastClaim));
        }

        if ((n + 1) % 25 === 0) console.log(`   ${n + 1}/${snap.users.length}`);
    }

    // What the treasury has to cover before going live.
    //
    // getTreasuryLiabilities walks each user's stakes, so its gas cost per page depends
    // on how many stakes those users hold. Get methods have their own gas ceiling: with
    // 105 real users a page of 50 exits -14 (out of gas), 25 succeeds. Rather than bake
    // in a number that silently stops working as stakes accumulate, back off on failure.
    let dueNow = 0n, stakedTon = 0n, scanned = 0;
    let page = Number(process.env.LIABILITY_PAGE ?? '20');
    let start = 0;
    while (start < snap.users.length) {
        try {
            const p = await c.getGetTreasuryLiabilities(BigInt(start), BigInt(page));
            dueNow += p.tonDueNow;
            stakedTon += p.activeStakedTon;
            scanned += Number(p.usersScanned);
            start = Number(p.toIndex);
            await sleep(Number(process.env.VERIFY_PACE_MS ?? '120'));
        } catch (e) {
            if (page <= 1) throw new Error(`getTreasuryLiabilities failed even at page size 1 from index ${start}: ${(e as Error).message}`);
            page = Math.max(1, Math.floor(page / 2));
            console.log(`   liabilities page too large at index ${start}, retrying with page ${page}`);
        }
    }
    console.log(`   (liabilities read in pages of ${page})`);

    const status = await c.getGetTreasuryStatus();

    console.log(`\n---`);
    console.log(`users verified:        ${scanned}`);
    console.log(`claimable right now:   ${fromNano(dueNow)} TON   <- fund at least this`);
    console.log(`active staked TON:     ${fromNano(stakedTon)} TON  (comes due as stakes mature)`);
    console.log(`contract balance:      ${fromNano(status.contractBalance)} TON`);
    console.log(`imports locked:        ${status.importsLocked}`);
    console.log(`paused:                ${status.isPaused}`);

    if (problems.length > 0) {
        console.log(`\n${problems.length} MISMATCH(ES) — do NOT lock imports:\n`);
        problems.slice(0, 40).forEach((p) => console.log(`   ${p}`));
        if (problems.length > 40) console.log(`   … and ${problems.length - 40} more`);
        process.exitCode = 1;
        return;
    }

    console.log(`\nAll records match. Safe to fund, then send LockImports.`);
    if (status.contractBalance < dueNow) {
        console.log(`Balance is below what is already claimable — top up before going live.`);
    }
}
