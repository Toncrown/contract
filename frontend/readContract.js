// Replaces getUserInfoSafe + buildFallbackUserFromSafeGetters + the tuple-unwrapping
// helpers (unwrapTupleItems, rawStackValue, bigIntFromAny, readItemNumber/Bool/AddressOpt).
//
// Those existed because getUserInfo returns `User`, a 23-field struct. Tact nests
// everything past the 14th field into a sub-tuple, and TON API v2 does not type the items
// of a nested tuple — so the generated wrapper throws "Not a cell" and positional reads
// silently return zeros. getUserSummary returns the same scalars flat, so an ordinary v2
// read just works.
//
// getUserInfo is still used as a fallback, which is why the client below prefers API v4:
// v4 parses nested tuples correctly, so both paths work there.

import { Address, TupleBuilder } from '@ton/core';

const CONTRACT_ADDRESS = Address.parse('EQBHG-l-XAsYnMGMx8ecP7fU_AM8oSV-r6ZQtYBD4sEGVdPy');

const addrArg = (address) => {
  const b = new TupleBuilder();
  b.writeAddress(address);
  return b.build();
};

const readAddressOpt = (stack) => {
  try { return stack.readAddressOpt(); } catch { return null; }
};

/**
 * Flat user scalars. Returns null when the address is not registered — which is a real
 * answer, not an error, so callers can show the register prompt with confidence rather
 * than guessing from a zeroed record.
 */
export async function getUserSummary(client, userAddress) {
  if (!client || !userAddress) return null;
  try {
    const { stack } = await client.runMethod(CONTRACT_ADDRESS, 'getUserSummary', addrArg(userAddress));

    // Optional struct: one stack item that is either null or the field tuple.
    const inner = stack.readTupleOpt();
    if (inner === null) return null;

    return {
      referrer: readAddressOpt(inner),
      linkReferrer: readAddressOpt(inner),
      level: inner.readBigNumber(),
      vipClass: inner.readBigNumber(),
      directReferrals: inner.readBigNumber(),
      totalReferrals: inner.readBigNumber(),
      otherReferrals: inner.readBigNumber(),
      lastCheckIn: inner.readBigNumber(),
      levelExpiration: inner.readBigNumber(),
      totalEarned: inner.readBigNumber(),
      isActive: inner.readBoolean(),
      registrationTime: inner.readBigNumber(),
      stakeCounter: inner.readBigNumber(),
    };
  } catch (e) {
    console.warn('[TonCrown] getUserSummary failed', e?.message);
    return undefined;   // distinct from null: unknown, not "not registered"
  }
}

/**
 * Shape the rest of the app already expects, assembled from getUserSummary plus the
 * earnings getter. The maps stay empty because stakes and downlines have their own
 * getters; nothing in the UI reads them off the user object.
 */
export async function getUserInfo(client, userAddress, earnings, stakeSummary) {
  const summary = await getUserSummary(client, userAddress);
  if (summary === null) return null;        // definitively not registered
  if (summary === undefined) return null;   // read failed; caller can retry

  return {
    $$type: 'User',
    ...summary,
    stakeCounter: stakeSummary?.totalStakes ?? summary.stakeCounter,
    stakes: new Map(),
    downlines: new Map(),
    spilloverIndex: 0n,
    pendingCheckInRewards: earnings?.pendingCheckInRewards ?? 0n,
    totalCheckInEarned: earnings?.totalCheckInEarned ?? 0n,
    totalCheckInClaimed: earnings?.totalCheckInClaimed ?? 0n,
    totalStakingClaimed: earnings?.totalStakingClaimed ?? 0n,
    totalReferralEarned: earnings?.totalReferralEarned ?? 0n,
    totalSpilloverEarned: earnings?.totalSpilloverEarned ?? 0n,
    transactionCounter: 0n,
    transactions: new Map(),
  };
}

/**
 * Recommended client. API v4 parses nested tuples correctly, so every getter works,
 * including the ones v2 cannot read. Swap this in for the TonClient built on
 * TONCENTER_ENDPOINT and the whole class of parsing failure disappears.
 *
 *   import { TonClient4 } from '@ton/ton';
 *   const client = new TonClient4({ endpoint: 'https://mainnet-v4.tonhubapi.com' });
 *
 * TonClient4 exposes runMethod(seqno, address, name, args), so pin a block first:
 *
 *   const { last } = await client.getLastBlock();
 *   const res = await client.runMethod(last.seqno, CONTRACT_ADDRESS, 'getUserSummary', args);
 *
 * Pinning also means a screen full of reads reflects one consistent block rather than a
 * moving chain.
 */
export const RECOMMENDED_V4_ENDPOINT = 'https://mainnet-v4.tonhubapi.com';
