import { mnemonicToWalletKey } from '@ton/crypto';
import { WalletContractV4 } from '@ton/ton';

const getNetwork = async (endpoint: string) => {
    const mnemonic = process.env.MNEMONIC?.split(' ');

    if (!mnemonic || mnemonic.length !== 12) {
        throw new Error(
            'Please set a valid 12-word MNEMONIC in your environment variables.'
        );
    }

    const key = await mnemonicToWalletKey(mnemonic);

    const wallet = WalletContractV4.create({
        workchain: 0,
        publicKey: key.publicKey,
    });

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