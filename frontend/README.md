# Frontend changes for the upgraded contract

Drop-in replacements for parts of `src/App.jsx`. Nothing here is required — the app keeps
working as-is — but each change deletes a workaround that only existed because the
contract lacked a getter.

| File | Replaces | Why |
|---|---|---|
| `readContract.js` | `getUserInfoSafe`, `buildFallbackUserFromSafeGetters`, `unwrapTupleItems`, `rawStackValue`, `bigIntFromAny`, `readItem*` | The contract now has a flat `getUserSummary`, so none of the tuple-unwrapping guesswork is needed |
| `contractConfig.js` | `fetchContractConfig`, `vipConfigDictValue` | `getContractConfig` returns the addresses directly instead of parsing raw account state |
| `opcodes.js` | the `OPCODES` map | Adds the new admin messages |
| `adminJettons.jsx` | — | New admin panel section: shows the contract's USDT jetton wallet and withdraws stranded jettons |
| `adminRoi.jsx` | — | New admin panel section: edits the daily staking ROI per VIP class |
| `roiRates.js` | — | Reads `getStakingRoiRates`; kept separate so `adminRoi.jsx` only exports a component |
| `App.integration.md` | — | Exact edits to wire `adminJettons.jsx` into `App.jsx` |

`App.integration.md` records the wiring, now applied. `AdminJettons` is called
inside `AdminDashboard`, which did not receive `client` or `tonConnectUI`, so the Treasury
tab threw `ReferenceError` until those were forwarded.

## The bug all of this worked around

`getUserInfo` returns `User`, which has 23 fields. Tact splits any struct past its
**14th field** into a nested tuple, and TON API v2 as parsed by `@ton/ton` does not type
the items of a nested tuple. So reading `User` over v2 gives `Not a cell` from the
generated wrapper, or silent zeros from positional parsing — which is exactly what
`getUserInfoSafe` compensates for, right down to reconstructing a user's level from their
transaction history.

There are two independent fixes, and you can take either or both:

1. **`getUserSummary`** (in this upgrade) returns the same scalars in a flat 13-field
   struct. No nesting, so plain v2 reads it correctly.
2. **Switch the client to `TonClient4`** (`https://mainnet-v4.tonhubapi.com`). v4 parses
   nested tuples correctly, so even `getUserInfo` works. This needs no contract change and
   is the more general fix — it is what the migration scripts in `scripts/` use.

`readContract.js` uses (1) and falls back to `getUserInfo` so it works either way.

### One gotcha worth knowing

`getUserSummary` is returned **non-optional**, carrying an `exists: Bool` flag, rather
than as `UserSummary?`. Tact wraps an optional struct return in a tuple, and a wrapping
tuple is exactly the nesting API v2 cannot type — the optional version shipped once and
failed against mainnet with "Not a cell" while passing every unit test, because the
sandbox types nested tuples correctly.

Live state on mainnet, read over API v2:

```
exists        true
level         1
regTime       1784007865
```

Previously that same read returned zeros, which is what
`buildFallbackUserFromSafeGetters` was reconstructing a level from.

## New contract capabilities

```
getUserSummary(address)   -> flat user scalars, with an `exists` flag
getContractConfig()       -> owner, 4 creator wallets, USDT jetton wallet,
                             distributor, isPaused, importsLocked,
                             forwardStakeCapital, deploymentNonce
getUsdtJettonWallet()     -> the address the contract accepts USDT notifications from
WithdrawJettons{to,amount}-> owner-only, moves jettons out of the contract's jetton wallet
getStakingRoiRates()      -> paid rate per VIP class, plus the cap and the gas margin
SetVipRoi{vipClass,roi}   -> owner-only, sets the daily staking rate for one class
```

## Editable staking ROI

Before this upgrade the staking rate was **immutable**: `vipConfigs` was written only in
`init`, and `init` does not re-run on a SETCODE upgrade, so no transaction from any sender
could change it.

Three things about the frontend side of it:

**The rate you set is the rate PAID.** The advertised rate is that plus `gasMargin`
(0.05%/day), the retained slice covering gas and platform costs — which is why the classes
were seeded 95/100, 145/150, 195/200. The contract derives the advertised figure itself so
the two cannot drift.

**Every user-facing ROI figure now reads from the chain.** `VIP_CONFIGS` in `App.jsx` had
the rates hardcoded as `'1'`, `'1.50'`, `'2.00'`, and `contractConfig` — which also carries
them — is only fetched for the owner. So without a change, editing a rate on-chain would
have left the whole app quoting the old number while paying the new one. `App.jsx` now
fetches `getStakingRoiRates` for every visitor and routes all displays through
`advertisedRoi(vipClass)`, falling back to the bundled table.

That fallback matters for ordering: on the live contract today the getter returns exit
code 11 (no such method), which is caught, logged, and ignored. The frontend can therefore
ship before or after the contract upgrade.

**A change is retroactive over unclaimed time**, because the contract looks the rate up at
claim time rather than snapshotting it into the stake. The admin panel says so, and shows
the live unclaimed total that a change would reprice. The way to avoid repricing anyone is
to announce the change and let people claim first — a claim resets the accrual clock
without ending the stake. Do **not** pause to do this: `SetPaused` blocks
`ClaimStakingRewards` too.

## Contract address

The live contract is `EQBHG-l-XAsYnMGMx8ecP7fU_AM8oSV-r6ZQtYBD4sEGVdPy`, which the app
already points at.
