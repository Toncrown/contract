/**
 * Step 0 of the migration: prove you can sign as the owner before anything is sent.
 *
 *   npx blueprint run preflight
 *
 * Read-only. Checks the wallet your MNEMONIC derives, its balance, and whether it is
 * actually the owner of the contract in OLD_CONTRACT. Deriving the wrong wallet version
 * silently produces a different address, so this is worth running before every phase.
 */
import { Address, fromNano } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { TonCrown } from '../build/TonCrown/TonCrown_TonCrown';

export async function run(provider: NetworkProvider) {
    const signer = provider.sender().address;
    console.log(`network:           ${provider.network()}`);
    console.log(`wallet version:    ${process.env.WALLET_VERSION ?? 'v4 (default)'}`);

    if (!signer) throw new Error('No sender address — check MNEMONIC in .env');
    console.log(`signing as:        ${signer.toString()}`);

    const balance = await provider.provider(signer).getState();
    console.log(`wallet balance:    ${fromNano(balance.balance)} TON`);
    console.log(`wallet deployed:   ${balance.state.type === 'active'}`);

    if (balance.state.type !== 'active') {
        console.log(`\n   This wallet has never sent a transaction on ${provider.network()}.`);
        console.log(`   If you expected an existing wallet, WALLET_VERSION is probably wrong`);
        console.log(`   (try WALLET_VERSION=v5r1), or the mnemonic is for a different wallet.`);
    }

    const oldRaw = process.env.OLD_CONTRACT;
    if (!oldRaw) {
        console.log(`\nOLD_CONTRACT not set — skipping ownership check.`);
        return;
    }

    const old = Address.parse(oldRaw);
    console.log(`\nold contract:      ${old.toString()}`);

    const state = await provider.provider(old).getState();
    console.log(`   deployed:       ${state.state.type === 'active'}`);
    console.log(`   balance:        ${fromNano(state.balance)} TON`);
    if (state.state.type !== 'active') {
        console.log(`\n   Not an active contract on ${provider.network()}. Wrong address or wrong network.`);
        process.exitCode = 1;
        return;
    }

    // getOwner and getPlatformStats predate the new fields, so they read correctly
    // against the old contract even though getUserInfo would not.
    const c = provider.open(TonCrown.fromAddress(old));
    const owner = await c.getOwner();
    const stats = await c.getGetPlatformStats();

    console.log(`   owner:          ${owner.toString()}`);
    console.log(`   totalUsers:     ${stats.totalUsers}`);
    console.log(`   totalStakedTon: ${fromNano(stats.totalStakedTon)} TON`);
    console.log(`   activeStakes:   ${stats.activeStakes}`);

    console.log('');
    if (owner.equals(signer)) {
        console.log(`OWNER MATCH — this wallet can run the migration.`);
    } else {
        console.log(`NOT THE OWNER. Signing wallet is ${signer.toString()}`);
        console.log(`but the contract owner is ${owner.toString()}.`);
        console.log(`Fix MNEMONIC or WALLET_VERSION before going further.`);
        process.exitCode = 1;
    }
}
