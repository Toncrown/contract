import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano, fromNano, Address } from '@ton/core';
import { TonCrown } from '../build/TonCrown/TonCrown_TonCrown';
import '@ton/test-utils';

const DEPLOY_NONCE = 0n;
const COSTS = ['0', '1.25', '2.51', '3.77', '5.03', '6.27'];

/**
 * MAX_DIRECT_REFERRALS is 6. Up to and including the 6th referral a sponsor is both the
 * link referrer and the matrix parent, so the whole referral share goes to them. From the
 * 7th on, the new user is placed under someone else in the sponsor's tree: the sponsor
 * stays the link referrer, the placement parent becomes the slot referrer, and the share
 * splits between them.
 */
describe('link vs slot referral split', () => {
    let bc: Blockchain;
    let owner: SandboxContract<TreasuryContract>;
    let c: SandboxContract<TonCrown>;

    /** Sum payments to `who`, optionally only those whose comment matches `body`. */
    const paidTo = (res: any, who: Address, body?: string) => {
        let t = 0n; const lines: string[] = [];
        for (const tx of res.transactions)
            for (const m of (tx.outMessages?.values?.() ?? [])) {
                if (m.info.type !== 'internal') continue;
                if ((m.info as any).src?.toString() !== c.address.toString()) continue;
                if ((m.info as any).dest?.toString() !== who.toString()) continue;
                let comment = '';
                try { const s = m.body.beginParse(); if (s.remainingBits >= 32 && s.loadUint(32) === 0) comment = s.loadStringTail(); } catch { }
                if (body !== undefined && comment !== body) continue;
                t += (m.info as any).value.coins;
                lines.push(comment);
            }
        return { total: t, lines };
    };

    const upgrade = (u: SandboxContract<TreasuryContract>, l: number, ref: Address | null = null) =>
        c.send(u.getSender(), { value: toNano(COSTS[l]) + toNano('0.05') },
            { $$type: 'UpgradeLevel', targetLevel: BigInt(l), referrerAddress: ref });

    beforeEach(async () => {
        bc = await Blockchain.create();
        bc.now = Math.floor(Date.now() / 1000);
        owner = await bc.treasury('owner');
        c = bc.openContract(await TonCrown.fromInit(owner.address, DEPLOY_NONCE));
        await c.send(owner.getSender(), { value: toNano('0.5') }, { $$type: 'Deploy', queryId: 0n });
        await owner.send({ to: c.address, value: toNano('3000'), bounce: false });
    });

    it('referrals 1-6 go wholly to the sponsor; the 7th splits link vs slot', async () => {
        const sponsor = await bc.treasury('sponsor');
        for (let l = 1; l <= 5; l++) await upgrade(sponsor, l);

        // fill all six direct slots
        const kids: SandboxContract<TreasuryContract>[] = [];
        for (let i = 0; i < 6; i++) {
            const k = await bc.treasury('kid' + i);
            bc.now! += 5;
            await upgrade(k, 1, sponsor.address);
            kids.push(k);
        }
        const si = (await c.getGetUserInfo(sponsor.address))!;
        expect(si.directReferrals).toBe(6n);

        // a 6th-slot child upgrading: sponsor is BOTH link and slot -> single combined payment
        const sixth = kids[5];
        const s6 = (await c.getGetUserInfo(sixth.address))!;
        expect(s6.referrer!.toString()).toBe(sponsor.address.toString());
        expect(s6.linkReferrer!.toString()).toBe(sponsor.address.toString());
        const rDirect = await upgrade(sixth, 2);
        console.log('  6th referral upgrade -> sponsor got:', paidTo(rDirect, sponsor.address).lines.join(', '));
        expect(paidTo(rDirect, sponsor.address).lines).toContain('Direct Referral Commission');

        // the 7th signs up with the same link but must be placed elsewhere
        const seventh = await bc.treasury('seventh');
        bc.now! += 5;
        await upgrade(seventh, 1, sponsor.address);
        const s7 = (await c.getGetUserInfo(seventh.address))!;

        expect(s7.linkReferrer!.toString()).toBe(sponsor.address.toString());   // link kept
        expect(s7.referrer!.toString()).not.toBe(sponsor.address.toString());   // placed elsewhere
        const slotParent = s7.referrer!;
        console.log(`  7th: link=sponsor  slot=${slotParent.toString().slice(0, 12)}…`);

        // that placement parent needs a level high enough to be paid
        const slotOwner = kids.find((k) => k.address.toString() === slotParent.toString())!;
        expect(slotOwner).toBeDefined();
        await upgrade(slotOwner, 2);

        // now the 7th upgrades: the share must split between sponsor and slot parent
        const res = await upgrade(seventh, 2);
        const toSponsor = paidTo(res, sponsor.address);
        const toSlot = paidTo(res, slotParent);
        console.log(`  7th upgrade -> sponsor ${fromNano(toSponsor.total)} (${toSponsor.lines.join(',')})`);
        console.log(`               -> slot    ${fromNano(toSlot.total)} (${toSlot.lines.join(',')})`);

        expect(toSponsor.lines).toContain('Link Referral Commission');
        expect(toSlot.lines).toContain('Slot Referral Commission');

        // level 2+: splitShare is 15% each, so both get the same amount
        const expected = toNano(COSTS[2]) * 15n / 100n;
        expect(paidTo(res, sponsor.address, 'Link Referral Commission').total).toBe(expected);
        expect(paidTo(res, slotParent, 'Slot Referral Commission').total).toBe(expected);
    });

    it('a migrated user (linkReferrer = referrer) gets the combined payment', async () => {
        // mirrors what importState writes for existing users
        const upline = await bc.treasury('upline');
        for (let l = 1; l <= 3; l++) await upgrade(upline, l);
        const migrated = await bc.treasury('migrated');
        await c.send(owner.getSender(), { value: toNano('0.05') }, {
            $$type: 'ImportUser', userAddress: migrated.address,
            referrer: upline.address, linkReferrer: upline.address,   // the import default
            level: 1n, vipClass: 0n, directReferrals: 0n, totalReferrals: 0n, otherReferrals: 0n,
            lastCheckIn: 0n, levelExpiration: 0n, totalEarned: 0n, isActive: true,
            registrationTime: BigInt(bc.now! - 100), spilloverIndex: 0n,
            pendingCheckInRewards: 0n, totalCheckInEarned: 0n, totalCheckInClaimed: 0n,
            totalStakingClaimed: 0n, totalReferralEarned: 0n, totalSpilloverEarned: 0n,
        });
        bc.now! += 5;
        const res = await upgrade(migrated, 2);
        const got = paidTo(res, upline.address);
        console.log('  migrated user upgrade -> upline:', fromNano(got.total), got.lines.join(','));
        expect(got.lines).toContain('Direct Referral Commission');
        // isolate the commission: the upline may also win that round's spillover
        expect(paidTo(res, upline.address, 'Direct Referral Commission').total)
            .toBe(toNano(COSTS[2]) * 30n / 100n);   // both halves to one person
    });
});
