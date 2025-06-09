import { toNano } from '@ton/core';
import { mnemonicToWalletKey } from '@ton/crypto';
import { WalletContractV4 } from '@ton/ton';

export const config = {
    contracts: [
        {
            name: 'TonCrown',
            path: './contracts/ton_crown.tact',
        }
    ],
    compiler: {
        tact: {
            version: 'latest',
        },
        func: {
            version: 'latest'
        }
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
        testnet: async () => {
            const mnemonic = process.env.MNEMONIC?.split(' ');
            if (!mnemonic || mnemonic.length !== 12) {
                throw new Error('❌ Please set a valid 12-word MNEMONIC in your environment variables.');
            }

            const key = await mnemonicToWalletKey(mnemonic);
            const wallet = WalletContractV4.create({ workchain: 0, publicKey: key.publicKey });

            return {
                endpoint: 'https://testnet.tonhubapi.com/jsonRPC',
                sender: {
                    address: wallet.address,
                    send: async (args: any) => {
                        // Get current seqno from the network
                        const seqno = await wallet.getSeqno(args.provider);
                        return await wallet.sendTransfer(args.provider, {
                            secretKey: key.secretKey,
                            seqno: seqno,
                            messages: args.messages || [],
                            sendMode: args.sendMode || 3,
                        });
                    },
                },
                key,
                wallet,
            };
        }
    }
};