/**
 * Diagnostic: work out exactly which source is deployed, and what shape its
 * getUserInfo actually returns.
 *
 *   npx blueprint run identifyDeployed
 *
 * Read-only. Run this before trusting any parser against the live contract.
 */
import { Address, Cell, TupleBuilder, TupleItem } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { pinnedReader, accountCodeHash } from './lib/readClient';
import * as fs from 'fs';
import * as path from 'path';

// Candidate builds, in the order worth trying.
const CANDIDATES = [
    ['contracts/ton_crown.tact @78aa506 (legacy_v1)', 'build/CandV1/CandV1_TonCrown.pkg'],
    ['contracts/test.tact', 'build/CandT1/CandT1_TonCrown.pkg'],
    ['contracts/test2.tact', 'build/CandT2/CandT2_TonCrown.pkg'],
    ['contracts/test3.tact', 'build/CandT3/CandT3_TonCrown.pkg'],
    ['contracts/ton_crown.tact (current, fixed)', 'build/TonCrown/TonCrown_TonCrown.pkg'],
] as const;

function codeHashOf(pkgPath: string): string | null {
    const full = path.resolve(pkgPath);
    if (!fs.existsSync(full)) return null;
    const pkg = JSON.parse(fs.readFileSync(full, 'utf8'));
    return Cell.fromBase64(pkg.code).hash().toString('hex');
}

function describe(item: TupleItem | undefined, depth = 0): string {
    const pad = '  '.repeat(depth + 1);
    if (!item) return `${pad}<missing>`;
    switch (item.type) {
        case 'int': return `${pad}int    ${item.value}`;
        case 'nan': return `${pad}nan`;
        case 'null': return `${pad}null`;
        case 'cell': return `${pad}cell   (${item.cell.bits.length} bits, ${item.cell.refs.length} refs)`;
        case 'slice': {
            try {
                const s = item.cell.beginParse();
                const a = s.loadAddressAny();
                return `${pad}slice  address ${a ? a.toString() : 'none'}`;
            } catch { return `${pad}slice  (${item.cell.bits.length} bits)`; }
        }
        case 'builder': return `${pad}builder`;
        case 'tuple':
            return `${pad}tuple (${item.items.length} items)\n` +
                item.items.map((c) => describe(c, depth + 1)).join('\n');
        default: return `${pad}${(item as any).type}`;
    }
}

export async function run(provider: NetworkProvider) {
    const old = Address.parse(
        process.env.OLD_CONTRACT ?? (await provider.ui().input('Old contract address')),
    );

    const reader = await pinnedReader(provider);
    const onChain = await accountCodeHash(reader, old);
    if (!onChain) throw new Error('Contract is not active');

    console.log(`reading via ${reader.endpoint} at block ${reader.seqno}`);
    console.log(`on-chain code hash: ${onChain}\n`);

    let matched: string | null = null;
    for (const [label, pkg] of CANDIDATES) {
        const h = codeHashOf(pkg);
        if (h === null) { console.log(`   ?  ${label}  (not built)`); continue; }
        const hit = h === onChain;
        if (hit) matched = label;
        console.log(`   ${hit ? 'MATCH ' : '      '} ${h}  ${label}`);
    }

    console.log('');
    if (matched) console.log(`Deployed source is: ${matched}`);
    else console.log(`No local source matches the deployed code. The deployed contract was built\nfrom something not in this repo, or with a different compiler version.`);

    // Raw shape of getUserInfo for the first registered user.
    const idx = Number(process.env.INSPECT_INDEX ?? '0');
    const b0 = new TupleBuilder();
    b0.writeNumber(BigInt(idx));
    const addrRes = await reader.client.runMethod(reader.seqno, old, 'getUserAddressByIndex', b0.build());
    const userAddr = addrRes.reader.readAddressOpt();
    if (!userAddr) { console.log(`\nNo user at index ${idx}`); return; }

    console.log(`\ngetUserInfo raw stack for user[${idx}] ${userAddr.toString()}:`);
    const b1 = new TupleBuilder();
    b1.writeAddress(userAddr);
    const res = await reader.client.runMethod(reader.seqno, old, 'getUserInfo', b1.build());
    const items: TupleItem[] = (res.reader as any).items ?? [];
    console.log(`  stack has ${items.length} item(s)`);
    items.forEach((it, i) => console.log(`  [${i}]\n${describe(it, 1)}`));
}
