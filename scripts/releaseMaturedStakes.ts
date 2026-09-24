import { NetworkProvider } from '@ton/blueprint';
import { Address, TupleBuilder, Dictionary, beginCell, toNano } from '@ton/core';
import { pinnedReader } from './lib/readClient';

const CONTRACT = Address.parse('EQBHG-l-XAsYnMGMx8ecP7fU_AM8oSV-r6ZQtYBD4sEGVdPy');
const OP_RELEASE = 503038799;
const DAY = 86400;

/**
 * Closes every matured stake and returns the capital to its staker.
 *
 * TON has no scheduler, so nothing refunds itself — something has to send the message.
 * That is what this is. ReleaseMaturedStake is permissionless and pays only the staker,
 * so this can run from any funded wallet, on a timer, and stakers get their capital back
 * without doing anything themselves.
 *
 *   npx blueprint run releaseMaturedStakes            # report only
 *   RELEASE=1 npx blueprint run releaseMaturedStakes  # actually send
 *
 * Env:
 *   RELEASE=1        send transactions (default is a dry run)
 *   ONLY=<address>   restrict to a single staker
 *   PAUSE_MS=4000    delay between sends
 */
export async function run(provider: NetworkProvider) {
    // Pin every read to one block so the report is a consistent point-in-time view
    // rather than a series of reads taken across a moving chain.
    const pinned = await pinnedReader(provider);
    const read = (method: string, args: any[] = []) =>
        pinned.client.runMethod(pinned.seqno, CONTRACT, method, args);

    const send = process.env.RELEASE === '1';
    const only = process.env.ONLY ? Address.parse(process.env.ONLY) : null;
    const pause = Number(process.env.PAUSE_MS ?? 4000);
    const now = Math.floor(Date.now() / 1000);

    console.log(`contract : ${CONTRACT.toString()}`);
    console.log(`mode     : ${send ? 'RELEASE — transactions will be sent' : 'dry run'}\n`);

    const st = (await read('getTreasuryStatus')).reader;
    st.readBigNumber(); st.readBigNumber();
    const totalUsers = Number(st.readBigNumber());

    // enumerate stakers
    const users: Address[] = [];
    for (let i = 0; i < totalUsers; i += 50) {
        const b = new TupleBuilder(); b.writeNumber(BigInt(i)); b.writeNumber(50n);
        const cell = (await read('getUserListPaginated', b.build())).reader.readCellOpt();
        if (!cell) continue;
        const d = Dictionary.loadDirect(Dictionary.Keys.BigInt(257), Dictionary.Values.Address(), cell);
        for (const k of d.keys()) users.push(d.get(k)!);
    }

    type Due = { user: Address; stakeId: bigint; amount: bigint; asset: number; overdueDays: number; owed: bigint };
    const due: Due[] = [];
    let active = 0;

    for (const u of users) {
        if (only && !u.equals(only)) continue;
        const b = new TupleBuilder(); b.writeAddress(u);
        const idsCell = (await read('getUserStakeIds', b.build())).reader.readCellOpt();
        if (!idsCell) continue;
        const ids = Dictionary.loadDirect(Dictionary.Keys.BigInt(257), Dictionary.Values.Bool(), idsCell);

        for (const id of ids.keys()) {
            const t = new TupleBuilder(); t.writeAddress(u); t.writeNumber(id);
            const tup = (await read('getStakeDetails', t.build())).reader.readTupleOpt();
            if (!tup) continue;
            tup.readBigNumber();                       // stakeId
            const amount = tup.readBigNumber();
            const startTime = Number(tup.readBigNumber());
            const duration = Number(tup.readBigNumber());
            tup.readBigNumber();                       // vipClass
            const autoRestake = tup.readBoolean();
            tup.readBigNumber();                       // lastClaim
            tup.readBigNumber();                       // totalClaimed
            const isActive = tup.readBoolean();
            const asset = Number(tup.readBigNumber());
            const owed = tup.readBigNumber();          // pendingReward

            if (!isActive) continue;
            active++;
            const endTime = startTime + duration;
            // autoRestake stakes roll over by design and the contract refuses to close them
            if (autoRestake || now < endTime) continue;
            due.push({ user: u, stakeId: id, amount, asset, owed, overdueDays: (now - endTime) / DAY });
        }
    }

    console.log(`active stakes : ${active}`);
    console.log(`matured & due : ${due.length}\n`);
    if (due.length === 0) { console.log('Nothing to release.'); return; }

    let capital = 0n, interest = 0n;
    for (const d of due) {
        const unit = d.asset === 0 ? 'TON' : 'USDT';
        const div = d.asset === 0 ? 1e9 : 1e6;
        console.log(`  ${d.user.toString().slice(0, 14)}… #${d.stakeId}  ` +
            `${(Number(d.amount) / div).toFixed(2)} ${unit} capital + ` +
            `${(Number(d.owed) / div).toFixed(4)} interest   ` +
            `${d.overdueDays.toFixed(1)}d overdue`);
        if (d.asset === 0) { capital += d.amount; interest += d.owed; }
    }
    console.log(`\nTON to be returned: ${(Number(capital + interest) / 1e9).toFixed(4)} ` +
        `(${(Number(capital) / 1e9).toFixed(2)} capital + ${(Number(interest) / 1e9).toFixed(4)} interest)`);

    // USDT is paid only out of the reserve the contract has counted, since it cannot see its
    // jetton balance. A release the reserve cannot cover is refused on-chain, so sending it
    // only burns gas — budget them here and hold back what does not fit. On code that
    // predates the reserve the getter is missing, and there a USDT release closes the stake
    // blind whether or not the tokens exist: skip every one of them.
    let reserve: bigint | null = null;
    try {
        reserve = (await read('getUsdtReserve')).reader.readBigNumber();
    } catch {
        reserve = null;
    }
    const held: typeof due = [];
    let budget = reserve ?? 0n;
    for (const d of [...due]) {
        if (d.asset === 0) continue;
        const need = d.amount + d.owed;
        if (reserve !== null && need <= budget) { budget -= need; continue; }
        held.push(d);
        due.splice(due.indexOf(d), 1);
    }
    if (held.length) {
        console.log(reserve === null
            ? `\nHOLDING ${held.length} USDT release(s): this contract has no USDT reserve, so a release would close the stake without paying it.`
            : `\nHOLDING ${held.length} USDT release(s): reserve is ${(Number(reserve) / 1e6).toFixed(2)} USDT. Fund the contract and sync the reserve.`);
        for (const d of held)
            console.log(`  ${d.user.toString().slice(0, 14)}… #${d.stakeId}  needs ${(Number(d.amount + d.owed) / 1e6).toFixed(2)} USDT`);
        if (due.length === 0) { console.log('\nNothing else to release.'); return; }
    }

    if (!send) {
        console.log('\nDry run. Re-run with RELEASE=1 to send.');
        return;
    }

    // The contract pays capital out of its own balance, so check it can afford the batch
    // before sending anything — a mid-batch failure leaves some stakers paid and some not.
    const status = (await read('getTreasuryStatus')).reader;
    const balance = status.readBigNumber();
    if (balance < capital + interest + toNano('1')) {
        console.log(`\nABORT: contract holds ${(Number(balance) / 1e9).toFixed(2)} TON but ` +
            `${(Number(capital + interest) / 1e9).toFixed(2)} TON is due. Fund it first.`);
        return;
    }

    console.log('');
    let ok = 0, failed = 0;
    for (const [i, d] of due.entries()) {
        const body = beginCell()
            .storeUint(OP_RELEASE, 32)
            .storeAddress(d.user)
            .storeUint(d.stakeId, 16)
            .endCell();
        try {
            await provider.sender().send({ to: CONTRACT, value: toNano('0.15'), body });
            ok++;
            console.log(`  [${i + 1}/${due.length}] released ${d.user.toString().slice(0, 14)}… #${d.stakeId}`);
        } catch (e: any) {
            failed++;
            console.log(`  [${i + 1}/${due.length}] FAILED ${d.user.toString().slice(0, 14)}… #${d.stakeId}: ${e?.message}`);
        }
        if (i < due.length - 1) await new Promise(r => setTimeout(r, pause));
    }
    console.log(`\nSent ${ok}, failed ${failed}. Re-run the dry run in a minute to confirm they closed.`);
}
