import { mnemonicToWalletKey } from '@ton/crypto';
<<<<<<< Updated upstream
import { WalletContractV4, WalletContractV5R1 } from '@ton/ton';

const getNetwork = async (endpoint: string) => {
    const mnemonic = process.env.MNEMONIC?.trim().split(/\s+/);

    // TON's standard mnemonic is 24 words; 12-word phrases exist but are the exception.
    // Rejecting anything but 12 meant a normal Tonkeeper/Tonhub phrase was refused.
    if (!mnemonic || (mnemonic.length !== 24 && mnemonic.length !== 12)) {
=======
import { WalletContractV5R1 } from '@ton/ton';

const getNetwork = async (endpoint: string) => {
    const mnemonic = process.env.WALLET_MNEMONIC?.split(' ');

    if (!mnemonic || mnemonic.length !== 12 && mnemonic.length !== 24) {
>>>>>>> Stashed changes
        throw new Error(
            `Set MNEMONIC to your wallet's 24-word (or 12-word) recovery phrase. ` +
            `Got ${mnemonic ? mnemonic.length : 0} word(s).`
        );
    }

    const key = await mnemonicToWalletKey(mnemonic);

<<<<<<< Updated upstream
    // The wallet version decides the derived address. Deriving v4 for a wallet that is
    // actually v5R1 silently produces a different address, which for this project means
    // signing as something other than the contract owner. Run `blueprint run preflight`
    // to confirm the derived address before sending anything.
    const version = (process.env.WALLET_VERSION ?? 'v4').toLowerCase();
    const wallet =
        version === 'v5' || version === 'v5r1'
            ? WalletContractV5R1.create({ workchain: 0, publicKey: key.publicKey })
            : WalletContractV4.create({ workchain: 0, publicKey: key.publicKey });
=======
    const wallet = WalletContractV5R1.create({
        workchain: 0,
        publicKey: key.publicKey,
    });
>>>>>>> Stashed changes

    return {
        endpoint,
        apiKey: process.env.TONCENTER_API_KEY,

        sender: {
            address: wallet.address,

            send: async (args: any) => {
                const seqno = await wallet.getSeqno(args.provider);

                return await wallet.sendTransfer(args.provider, {
                    secretKey: key.secretKey,
                    seqno,
                    messages: args.messages || [],
                    sendMode: args.sendMode || 3,
                });
            },
        },

        key,
        wallet,
    };
};

export const config = {
    contracts: [
        {
            name: 'TonCrown',
            path: './contracts/ton_crown.tact',
        },
    ],

    compiler: {
        tact: {
            version: 'latest',
        },
        func: {
            version: 'latest',
        },
    },

    build: {
        outDir: './build',
        bindings: true,
    },

    test: {
        testDir: './tests',
        timeout: 60000,
    },

    scripts: {
        scriptDir: './scripts',
    },

    networks: {
        testnet: async () =>
            getNetwork('https://testnet.toncenter.com/api/v2/jsonRPC'),

        mainnet: async () =>
            getNetwork('https://toncenter.com/api/v2/jsonRPC'),
    },
};