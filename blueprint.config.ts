/**
 * Blueprint reads `contracts`, `compiler`, `build`, `test` and `scripts` from here.
 *
 * There used to be a `networks: { testnet, mainnet }` block that built its own wallet
 * from a mnemonic. Blueprint has no such config key, so none of it ever ran: the
 * network and signer come from blueprint's own interactive prompt, which reads
 * WALLET_MNEMONIC, WALLET_VERSION and optionally WALLET_ID / SUBWALLET_NUMBER from the
 * environment (see createMnemonicProvider in @ton/blueprint). Keeping dead code that
 * looks like the signing path is worse than not having it — it is what a merge
 * conflict was left unresolved inside.
 *
 * Reads in the migration scripts deliberately bypass blueprint's provider and use
 * TON API v4 instead; see scripts/lib/readClient.ts for why.
 */
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
};
