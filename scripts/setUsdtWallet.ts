/**
 * Point the contract at its own USDT jetton wallet.
 *
 *   npx blueprint run setUsdtWallet --mainnet --mnemonic
 *
 * Until this is set, usdtJettonWalletAddress is the deploy default (the owner address),
 * so every USDT transfer notification fails the "Unknown jetton wallet" check and the
 * deposit strands in the contract's jetton wallet with nothing recorded against it.
 *
 * The address is derived from the USDT master rather than hardcoded, then compared with
 * USDT_JETTON_WALLET if that is set, so a typo cannot send USDT staking to a wallet the
 * contract does not own.
 */
import { Address, TupleBuilder, beginCell, Cell } from '@ton/core';
import { NetworkProvider, sleep } from '@ton/blueprint';
import { TonCrown } from '../build/TonCrown/TonCrown_TonCrown';
import { pinnedReader } from './lib/readClient';

const USDT_MASTER = Address.parse('EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs');

/** Reads usdtJettonWalletAddress out of raw account state; there is no getter for it
 *  on the deployed code. Field order mirrors the contract's declarations. */
async function readConfiguredWallet(reader: any, contract: Address): Promise<Address | null> {
    const acc = await reader.client.getAccount(reader.seqno, contract);
    if (acc.account.state.type !== 'active' || !acc.account.state.data) return null;
    const s0 = Cell.fromBase64(acc.account.state.data).beginParse();
    s0.loadBit();            // Tact state-initialised marker
    s0.loadAddress();        // owner
    s0.loadAddress();        // creatorWallet1
    s0.loadAddress();        // creatorWallet2
    const s1 = s0.loadRef().beginParse();
    s1.loadAddress();        // creatorWallet3
    s1.loadAddress();        // creatorWallet4
    return s1.loadAddress(); // usdtJettonWalletAddress
}

export async function run(provider: NetworkProvider) {
    const contractAddr = Address.parse(
        process.env.NEW_CONTRACT ?? (await provider.ui().input('Contract address')),
    );
    const reader = await pinnedReader(provider);

    // Ask the USDT master which wallet it assigns to this contract.
    const b = new TupleBuilder();
    b.writeSlice(beginCell().storeAddress(contractAddr).endCell());
    const res = await reader.client.runMethod(reader.seqno, USDT_MASTER, 'get_wallet_address', b.build());
    const derived = res.reader.readAddress();

    console.log(`contract          : ${contractAddr.toString()}`);
    console.log(`USDT master       : ${USDT_MASTER.toString()}`);
    console.log(`derived jetton wallet: ${derived.toString()}`);

    const expected = process.env.USDT_JETTON_WALLET;
    if (expected && !Address.parse(expected).equals(derived)) {
        throw new Error(
            `USDT_JETTON_WALLET is ${expected} but the master derives ${derived.toString()}. ` +
            `Refusing to set an address the contract does not own.`,
        );
    }

    const current = await readConfiguredWallet(reader, contractAddr);
    console.log(`currently set to  : ${current ? current.toString() : 'unreadable'}`);

    if (current && current.equals(derived)) {
        console.log('\nAlready pointing at the right wallet. Nothing to do.');
        return;
    }

    const signer = provider.sender().address;
    console.log(`signing as        : ${signer?.toString()}`);
    console.log('\nSending SetUsdtJettonWallet…');

    const c = provider.open(TonCrown.fromAddress(contractAddr));
    await c.send(provider.sender(), { value: BigInt(5e7) }, { $$type: 'SetUsdtJettonWallet', wallet: derived });

    // Confirm from chain rather than trusting the send.
    for (let attempt = 1; attempt <= 12; attempt++) {
        await sleep(5000);
        const check = await pinnedReader(provider);
        const now = await readConfiguredWallet(check, contractAddr);
        if (now && now.equals(derived)) {
            console.log(`\nConfirmed on-chain: usdtJettonWalletAddress = ${now.toString()}`);
            console.log('USDT staking will now be accepted.');
            return;
        }
        console.log(`   not applied yet (check ${attempt}/12)…`);
    }
    console.log('\nNot confirmed within the wait window. Re-run to check; the message may still land.');
}
