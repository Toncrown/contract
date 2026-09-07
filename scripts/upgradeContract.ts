/**
 * Ship new code to the live contract, keeping its address and all state.
 *
 *   npx blueprint run upgradeContract --mainnet --mnemonic
 *
 * SETCODE swaps logic, not storage. This refuses to run unless the new build declares
 * exactly the same contract storage fields as what is deployed, because a mismatch would
 * leave the contract unable to read its own data.
 */
import { Address, Cell } from '@ton/core';
import { NetworkProvider, sleep } from '@ton/blueprint';
import { TonCrown } from '../build/TonCrown/TonCrown_TonCrown';
import { pinnedReader, accountCodeHash } from './lib/readClient';
import * as fs from 'fs';

const NEW_PKG = 'build/TonCrown/TonCrown_TonCrown.pkg';
/** Source of the code currently deployed, compiled as its own project. */
const DEPLOYED_SRC = 'contracts/deployed_now.tact';
const NEW_SRC = 'contracts/ton_crown.tact';

const codeCell = (pkg: string) => Cell.fromBase64(JSON.parse(fs.readFileSync(pkg, 'utf8')).code);

/** Contract-level storage declarations, in order. */
function storageFields(src: string): string[] {
    const text = fs.readFileSync(src, 'utf8');
    const start = text.indexOf('contract TonCrown with');
    const end = text.indexOf('const DAILY_CHECKIN_REWARD', start);
    return text.slice(start, end).split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => /^[a-zA-Z][a-zA-Z0-9]*\s*:/.test(l))
        .map((l) => l.replace(/\s+/g, ' '));
}

export async function run(provider: NetworkProvider) {
    const addr = Address.parse(
        process.env.NEW_CONTRACT ?? (await provider.ui().input('Contract address')),
    );

    const newCode = codeCell(NEW_PKG);
    const newHash = newCode.hash().toString('hex');

    const reader = await pinnedReader(provider);
    const liveHash = await accountCodeHash(reader, addr);
    if (!liveHash) throw new Error('Contract is not active');

    console.log(`contract        : ${addr.toString()}`);
    console.log(`live code hash  : ${liveHash}`);
    console.log(`new code hash   : ${newHash}`);

    if (liveHash === newHash) {
        console.log('\nAlready running this code. Nothing to do.');
        return;
    }

    // The reference build must be the code that is actually live, or the storage
    // comparison below is meaningless.
    const refHash = codeCell('build/DeployedNow/DeployedNow_TonCrown.pkg').hash().toString('hex');
    if (refHash !== liveHash) {
        throw new Error(
            `${DEPLOYED_SRC} builds to ${refHash} but the chain is running ${liveHash}. ` +
            `Refresh it from the deployed commit before upgrading, so the storage check is real.`,
        );
    }

    const before = storageFields(DEPLOYED_SRC);
    const after = storageFields(NEW_SRC);
    const changed = before.length !== after.length || before.some((f, i) => f !== after[i]);
    console.log(`storage fields  : ${before.length} deployed, ${after.length} new`);
    if (changed) {
        console.log('\nSTORAGE LAYOUT DIFFERS:');
        for (let i = 0; i < Math.max(before.length, after.length); i++) {
            if (before[i] !== after[i]) console.log(`   [${i}] ${before[i] ?? '(none)'}  ->  ${after[i] ?? '(none)'}`);
        }
        throw new Error('Refusing to upgrade: the new code cannot read the existing storage as-is.');
    }
    console.log('                  identical — safe to SETCODE');

    const owner = await reader.open(TonCrown.fromAddress(addr)).getOwner();
    const signer = provider.sender().address;
    console.log(`owner           : ${owner.toString()}`);
    console.log(`signing as      : ${signer?.toString()}`);
    if (!signer || !owner.equals(signer)) throw new Error('Signer is not the contract owner');

    const statsBefore = await reader.open(TonCrown.fromAddress(addr)).getGetPlatformStats();
    console.log(`\nstate before    : ${statsBefore.totalUsers} users, ${statsBefore.activeStakes} active stakes`);

    console.log('\nSending UpgradeContract…');
    const c = provider.open(TonCrown.fromAddress(addr));
    await c.send(provider.sender(), { value: BigInt(1e8) }, { $$type: 'UpgradeContract', code: newCode });

    for (let attempt = 1; attempt <= 15; attempt++) {
        await sleep(5000);
        const check = await pinnedReader(provider);
        const nowHash = await accountCodeHash(check, addr);
        if (nowHash === newHash) {
            const statsAfter = await check.open(TonCrown.fromAddress(addr)).getGetPlatformStats();
            console.log(`\nUpgraded. code hash is now ${nowHash}`);
            console.log(`state after     : ${statsAfter.totalUsers} users, ${statsAfter.activeStakes} active stakes`);
            const intact = statsAfter.totalUsers === statsBefore.totalUsers
                && statsAfter.totalStakedTon === statsBefore.totalStakedTon
                && statsAfter.activeStakes === statsBefore.activeStakes;
            console.log(intact ? 'State preserved.' : 'STATE CHANGED — investigate before doing anything else.');
            if (!intact) process.exitCode = 1;
            return;
        }
        console.log(`   not applied yet (check ${attempt}/15)…`);
    }
    console.log('\nNot confirmed within the wait window. Re-run to check; the message may still land.');
}
