/**
 * Read-side client for the migration scripts.
 *
 * Everything here exists because of one concrete failure: TON API v2 (toncenter),
 * as parsed by @ton/ton, does not fully type the items of a *nested* tuple. Tact
 * splits any struct past 14 fields into a nested tuple, and `User` has 23 fields, so
 * getUserInfo comes back with the second half untyped. The generated wrapper then
 * throws "Not a cell", and hand-parsing silently yields zeros — which is exactly the
 * workaround the frontend carries in getUserInfoSafe/rawStackValue.
 *
 * API v4 parses the same response correctly, so all reads go through TonClient4.
 *
 * It also lets every read be pinned to a single block, which makes a migration
 * snapshot a consistent point-in-time view rather than a series of reads taken
 * across a moving chain.
 */
import { Address, Contract, OpenedContract } from '@ton/core';
import { TonClient4 } from '@ton/ton';
import { NetworkProvider } from '@ton/blueprint';

const DEFAULT_V4 = {
    mainnet: 'https://mainnet-v4.tonhubapi.com',
    testnet: 'https://testnet-v4.tonhubapi.com',
};

export function v4Endpoint(provider: NetworkProvider): string {
    if (process.env.TON_API_V4) return process.env.TON_API_V4;
    return provider.network() === 'testnet' ? DEFAULT_V4.testnet : DEFAULT_V4.mainnet;
}

export type PinnedReader = {
    seqno: number;
    endpoint: string;
    client: TonClient4;
    /** Opens a contract with every get-method pinned to `seqno`. */
    open<T extends Contract>(contract: T): OpenedContract<T>;
};

/** Pins reads to the current block so a long export is a single consistent view. */
export async function pinnedReader(provider: NetworkProvider): Promise<PinnedReader> {
    const endpoint = v4Endpoint(provider);
    const client = new TonClient4({ endpoint });

    let seqno: number;
    try {
        seqno = (await client.getLastBlock()).last.seqno;
    } catch (e) {
        throw new Error(
            `Could not reach TON API v4 at ${endpoint} (${(e as Error).message}). ` +
            `Set TON_API_V4 to a working v4 endpoint.`,
        );
    }

    return {
        seqno,
        endpoint,
        client,
        open: (contract) => client.openAt(seqno, contract),
    };
}

export async function accountCodeHash(reader: PinnedReader, address: Address): Promise<string | null> {
    const acc = await reader.client.getAccount(reader.seqno, address);
    if (acc.account.state.type !== 'active') return null;
    const code = acc.account.state.code;
    if (!code) return null;
    const { Cell } = await import('@ton/core');
    return Cell.fromBase64(code).hash().toString('hex');
}
