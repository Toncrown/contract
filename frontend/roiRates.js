// Reading the on-chain staking rates.
//
// Kept out of adminRoi.jsx because that file exports a component, and the project's
// react-refresh lint rule forbids a module from exporting both a component and
// non-component values.
//
// The contract stores the rate it PAYS (95 = 0.95%/day). The rate advertised to users is
// that plus gasMargin — the retained slice covering gas and platform costs — which is why
// the classes were seeded 95/100, 145/150, 195/200. getStakingRoiRates returns both the
// paid rates and the margin, so nothing downstream has to hardcode the gap.

import { TupleBuilder } from '@ton/core';

/** basis points -> display percent, e.g. 95n -> "0.95" */
export const bpsToPct = (bps) => (Number(bps ?? 0n) / 100).toFixed(2);

/** display percent -> basis points, e.g. "0.95" -> 95 */
export const pctToBps = (pct) => Math.round(parseFloat(pct) * 100);

/**
 * Paid rates for all four VIP classes, plus the contract's own cap and gas margin.
 * Throws if the getter is missing, which is the case until the SetVipRoi upgrade is
 * deployed — callers should fall back to their bundled table rather than blocking.
 */
export async function fetchStakingRoiRates(client, contractAddress) {
  const { stack } = await client.runMethod(contractAddress, 'getStakingRoiRates', new TupleBuilder().build());
  return {
    1: stack.readBigNumber(),
    2: stack.readBigNumber(),
    3: stack.readBigNumber(),
    4: stack.readBigNumber(),
    maxAllowed: stack.readBigNumber(),
    gasMargin: stack.readBigNumber(),
  };
}
