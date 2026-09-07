/**
 * Move jettons out of the contract's jetton wallet.
 *
 *   npx blueprint run withdrawJettons --mainnet --mnemonic
 *
 * Env:
 *   JETTON_TO      destination (defaults to the contract owner)
 *   JETTON_AMOUNT  human units, e.g. "72.410517" (defaults to the whole balance)
 *
 * This exists because a jetton transfer whose notification is rejected still completes:
 * the tokens land in the contract's jetton wallet with nothing recorded against them,
 * and every other JettonTransfer the contract sends is tied to a stake.
 */
import { Address, TupleBuilder, beginCell } from '@ton/core';
import { NetworkProvider, sleep } from '@ton/blueprint';
import { TonCrown } from '../build/TonCrown/TonCrown_TonCrown';
import { pinnedReader } from './lib/readClient';

const DECIMALS = 1_000_000n;   // USDT is 6-decimal
const fmt = (raw: bigint) => (Number(raw) / Number(DECIMALS)).toFixed(6);

async function jettonBalance(reader: any, jettonWallet: Address): Promise<bigint | null> {
    try {
        const r = await reader.client.runMethod(reader.seqno, jettonWallet, 'get_wallet_data', new TupleBuilder().build());
        if (r.exitCode !== 0) return null;
        return r.reader.readBigNumber();
    } catch { return null; }
}

export async function run(provider: NetworkProvider) {
    const addr = Address.parse(
        process.env.NEW_CONTRACT ?? (await provider.ui().input('Contract address')),
    );
    const reader = await pinnedReader(provider);
    const c = reader.open(TonCrown.fromAddress(addr));

    // Needs the upgraded code: neither getter nor receiver exists before it.
    let jettonWallet: Address;
    try {
        jettonWallet = await c.getGetUsdtJettonWallet();
    } catch {
        throw new Error('getUsdtJettonWallet is missing — run upgradeContract first.');
    }

    const owner = await c.getOwner();
    const signer = provider.sender().address;
    if (!signer || !owner.equals(signer)) throw new Error(`Signer is not the owner (${owner.toString()})`);

    if (jettonWallet.equals(owner)) {
        throw new Error(
            'usdtJettonWalletAddress is still the deploy default. Run setUsdtWallet first, ' +
            'or this withdrawal would send a jetton message to your own wallet address.',
        );
    }

    const balance = await jettonBalance(reader, jettonWallet);
    if (balance === null) throw new Error(`Could not read ${jettonWallet.toString()} — jetton wallet not deployed?`);

    const to = Address.parse(process.env.JETTON_TO ?? owner.toString());
    const amount = process.env.JETTON_AMOUNT
        ? BigInt(Math.round(parseFloat(process.env.JETTON_AMOUNT) * Number(DECIMALS)))
        : balance;

    console.log(`contract       : ${addr.toString()}`);
    console.log(`jetton wallet  : ${jettonWallet.toString()}`);
    console.log(`balance        : ${fmt(balance)}`);
    console.log(`withdrawing    : ${fmt(amount)}`);
    console.log(`destination    : ${to.toString()}`);

    if (amount <= 0n) { console.log('\nNothing to withdraw.'); return; }
    if (amount > balance) throw new Error(`Asked for ${fmt(amount)} but the wallet holds ${fmt(balance)}`);

    // Jettons backing live USDT stakes are not free to move.
    const stats = await c.getGetPlatformStats();
    if (stats.totalStakedUsdt > 0n) {
        const free = balance > stats.totalStakedUsdt ? balance - stats.totalStakedUsdt : 0n;
        console.log(`\nNOTE: ${fmt(stats.totalStakedUsdt)} is owed to active USDT stakes; ${fmt(free)} is unencumbered.`);
        if (amount > free) throw new Error(`Withdrawing ${fmt(amount)} would dip into staked USDT. Cap it at ${fmt(free)}.`);
    }

    console.log('\nSending WithdrawJettons…');
    const w = provider.open(TonCrown.fromAddress(addr));
    await w.send(provider.sender(), { value: BigInt(2e8) }, { $$type: 'WithdrawJettons', to, amount });

    for (let attempt = 1; attempt <= 15; attempt++) {
        await sleep(5000);
        const check = await pinnedReader(provider);
        const now = await jettonBalance(check, jettonWallet);
        if (now !== null && now < balance) {
            console.log(`\nBalance moved: ${fmt(balance)} -> ${fmt(now)} (sent ${fmt(balance - now)})`);
            const dest = await jettonBalance(check, await destinationWallet(check, to));
            if (dest !== null) console.log(`destination now holds: ${fmt(dest)}`);
            return;
        }
        console.log(`   not settled yet (check ${attempt}/15)…`);
    }
    console.log('\nNot confirmed within the wait window. Check the destination wallet directly.');
}

/** The jetton wallet the master assigns to `owner`, so the arrival can be confirmed. */
async function destinationWallet(reader: any, owner: Address): Promise<Address> {
    const USDT_MASTER = Address.parse('EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs');
    const b = new TupleBuilder();
    b.writeSlice(beginCell().storeAddress(owner).endCell());
    const r = await reader.client.runMethod(reader.seqno, USDT_MASTER, 'get_wallet_address', b.build());
    return r.reader.readAddress();
}
