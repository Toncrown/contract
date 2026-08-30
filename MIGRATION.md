# Migrating to the fixed TonCrown contract

## Why a migration is needed at all

The deployed contract has **no upgrade path**. `contracts/ton_crown.tact` at commit
`78aa506` declares `contract TonCrown with Deployable, OwnableTransferable` and contains
no `SETCODE` receiver, so its code cell is immutable for the lifetime of the account.

On TON a contract's address is `hash(code, initial_data)`. Changing a single line of the
contract changes the code cell, which changes the address. The fixed contract is therefore
a **new account at a new address**; it cannot inherit the old one's storage automatically.

The fixed version adds an owner-gated `UpgradeContract` receiver, so this is the last
migration that will be required for a code change.

## What is and is not at risk

Nothing in this process touches user wallets. Users hold no contract-issued tokens — all
balances, levels, referral matrix entries and stakes are rows in the old contract's
storage. The migration copies those rows into the new contract and moves the TON.

| Data | How it is preserved |
|---|---|
| Level, VIP class, activity, expiry | `ImportUser` |
| Referrer + link referrer | `ImportUser` |
| Referral matrix (`downlines`) | `ImportDownline`, copied slot for slot |
| Direct / total / other referral counts | `ImportUser` |
| Accrued and claimed check-in rewards | `ImportUser` |
| Earnings totals | `ImportUser` |
| Active and closed stakes | `ImportStake` |
| Platform counters | `ImportPlatformTotals` |
| Transaction history | **Not migrated** — cosmetic; export it and serve from the backend |

The old contract's TON balance is moved with `OwnerWithdraw`, which the old contract
already supports.

## The whole process at a glance

```
  OLD CONTRACT (frozen forever)              NEW CONTRACT (upgradeable)
  EQBbOI_x…                                  EQ… (new address)
        |                                            ^
   1. freeze frontend                                |
   2. exportState  ──> migration-snapshot.json ──> 4. importState
   3. deploy ─────────────────────────────────────> (same owner wallet)
                                                    5. verifyMigration
                                                    6. fund + LockImports
   7. OwnerWithdraw ──────── TON ─────────────────>  8. point frontend here
```

One move, once. From then on, fixes are shipped with `UpgradeContract` to the
**same address** — no snapshot, no import, no user action. See "After this migration"
below.

Budget roughly: 10 min freeze + snapshot, 5 min deploy, 20-30 min import, 10 min verify.

## The short version

```bash
# 0. one-off: .env in the repo root
#    MNEMONIC=...            owner wallet recovery phrase (24 words)
#    WALLET_VERSION=v5r1     omit for v4 wallets
#    OLD_CONTRACT=EQ...      the live contract
#    NEW_CONTRACT=EQ...      filled in after step 3
#    TONCENTER_API_KEY=...   used for sending; reads go through API v4

npx blueprint run preflight          # am I the owner? read-only
# --- freeze the frontend here ---
npx blueprint run exportState        # -> migration-snapshot.json
npx blueprint run deploy             # -> note the new address, put it in .env
npx blueprint run importState        # owner wallet; resumable
npx blueprint run verifyMigration    # read-only; prints the funding figure
# --- fund, then LockImports, then cut the frontend over ---
```

Rehearse the whole thing on **testnet** first, using a snapshot of real mainnet data.
Export reads mainnet; import writes testnet. Same commands, same snapshot, free coins.

## What each script does

**`preflight`** — read-only. Prints which wallet your MNEMONIC actually derives, whether
it has ever been deployed, the old contract's owner and user counts, and exits non-zero
if the signer is not the owner. Deriving the wrong wallet version silently produces a
different address, so run this before every phase, not just once.

**`exportState`** — reads every user, stake, matrix link and platform counter into
`migration-snapshot.json`.

Two things it does deliberately:

- It parses with the wrapper generated from `contracts/legacy_v1.tact`, which is the
  deployed source verbatim. Hand-parsing the `getUserInfo` tuple does not work: `User`
  has 23 fields and Tact splits a struct past 14 fields into a nested tuple.
- All reads go through **TON API v4**, pinned to one block. API v2 as parsed by
  `@ton/ton` does not type the items of a nested tuple, so the wrapper throws
  "Not a cell" and positional reads silently return zeros — the defect the frontend
  works around in `getUserInfoSafe`. Pinning to a block also makes a snapshot taken over
  several minutes one consistent view. The block seqno is recorded in the file.

`EXPORT_LIMIT=n` exports only the first n users as a smoke test; such snapshots are
marked partial and `importState` refuses them.

**`importState`** — sends `ImportUser` for every user **in original registration order**
(userList index order drives spillover rotation), then `ImportDownline`, `ImportStake`,
`ImportPlatformTotals`. Progress is checkpointed to `migration-progress.json` after every
message, so an interrupted run resumes instead of restarting. The matrix is copied slot
for slot from the snapshot, not inferred.

**`verifyMigration`** — read-only. Compares every user and stake against the snapshot,
exits non-zero on any mismatch, and prints the number you need:

```
claimable right now:   X TON   <- fund at least this
active staked TON:     Y TON   (comes due as stakes mature)
contract balance:      Z TON
```

**`identifyDeployed`** — diagnostic. Compares the on-chain code hash against every
candidate source in the repo and dumps the raw `getUserInfo` stack. Use it any time a
parser disagrees with reality.

## Step by step

### 1. Freeze

The old contract has no `SetPaused`, so stopping the frontend is the only way to stop new
registrations. Anything it accepts after the snapshot is lost. Users were still joining
during preparation (98 -> 105 in one session), so this is not theoretical.

### 2. Snapshot

`npx blueprint run exportState`. Keep `migration-snapshot.json` — it is the audit trail.

Sanity-check the summary: exported user count should equal `totalUsers`, and summed
active TON stakes should equal `totalStakedTon`. A shortfall there is the fingerprint of
the silent stake-capital-loss bug having fired.

### 3. Deploy

`npx blueprint run deploy`, from the **same owner wallet**. Record the new address in
`.env` as `NEW_CONTRACT`. `init(owner, nonce)` leaves `importsLocked = false` so state can
be seeded, and `forwardStakeCapital = true`, preserving the current money flow.

> **If an import goes wrong, redeploy with `DEPLOY_NONCE=1`.** `ImportUser` refuses to
> overwrite an existing record, and the address is otherwise determined by the owner
> address alone — so redeploying with the same nonce lands right back on the bad state.
> The nonce is the only way to get a clean instance to import into. It affects nothing
> but the address.

### 4. Fund the owner wallet first

The import is roughly `users + downline links + stakes + 1` messages at 0.05 TON each.
For ~105 users expect **~11 TON**, plus 0.5 to deploy. Most of it is not burned — it
lands in the new contract's balance, which it needs anyway — but it has to leave the
wallet upfront. Budget ~15 TON.

### 5. Import

`npx blueprint run importState`. Safe to re-run; it resumes from
`migration-progress.json`.

If a record lands wrong, do **not** try to patch it: bump `DEPLOY_NONCE`, redeploy,
delete `migration-progress.json`, and import again from the same snapshot.

### 6. Verify before locking

`npx blueprint run verifyMigration`. `LockImports` is **one-way** — send it only after
this passes clean. After it, even the owner cannot rewrite user records.

### 7. Move the money

`OwnerWithdraw` from the old contract, then fund the new one with at least the
"claimable right now" figure plus a working buffer.

### 8. Cut over

Point the frontend and the `distr/` service at the new address, and send
`SetDistributor` on the new contract.

> `distr/src/services/distributionService.ts` reads `getUserInfo` by tuple index.
> `linkReferrer` was appended to the **end** of `User`, so existing indexes are
> unchanged — but the service should move to API v4 for the nested-tuple reason above,
> and to `getUserListPaginated` instead of scraping transactions.
>
> The frontend's `getUserInfoSafe` / `rawStackValue` / `buildFallbackUserFromSafeGetters`
> machinery exists only to work around v2 tuple parsing. On v4 it can be replaced with
> the generated wrapper.

### 9. Retire the old contract

Leave it deployed with a near-zero balance. Do not delete it — explorers still link to
it, and its storage is the audit trail behind the snapshot.

## After this migration: upgrades without migration

The new contract has an owner-gated `UpgradeContract` receiver carrying `SETCODE`.

```
npx blueprint run <your upgrade script>   // sends UpgradeContract{ code: <new code cell> }
```

The address, every user record, every stake, the matrix and the balance all stay exactly
as they are. Only the code changes. This is covered by `tests/Upgradeability.spec.ts`,
which asserts that after an upgrade the address is unchanged, the stored code cell is the
new one, levels/stakes/check-in balances/platform counters are identical, new logic is
live, users keep transacting, and non-owners are rejected.

**The one rule: keep the storage layout compatible.** `SETCODE` swaps logic, not storage.
Contract state is serialised in declaration order, so the new code must still be able to
read the data already there.

- Safe: changing logic, constants, gas buffers, distribution percentages; adding or
  changing receivers; adding getters.
- Needs care: adding, removing or reordering **contract storage fields**, or fields
  inside a struct stored in state. Append rather than insert, and confirm the new code
  reads existing data before shipping.

A storage change still never needs a new address or a user migration — it needs the
upgrade written deliberately, and rehearsed on testnet against a copy of real state.

## Funding the new contract

Manual funding from the admin wallet works and is safe. Both routes are supported:

- `OwnerDeposit` (owner only), and
- a plain TON transfer to the contract address from any wallet, accepted by the empty
  `receive()`.

Funding was never the problem — it was the trigger. The old contract handed the buyer their
payment back whenever its standing balance could cover it, so topping it up made it leak.
With the mode-64 replies removed, a funded balance is inert.

To size a top-up, sum `tonDueNow` from `getTreasuryLiabilities(start, limit)` across pages.
That is the amount claimable *right now* (pending check-in rewards + accrued staking ROI +
matured capital awaiting refund). Keep a margin above it: `activeStakedTon` from the same
getter is the capital that will come due as stakes mature.

## Deciding on `forwardStakeCapital`

While it is `true` (the current and default behaviour) every TON staked is forwarded to
`creatorWallet3` while the contract keeps the obligation to pay ROI on it and return it at
maturity. The contract is then structurally short by the entire staked balance and stays
solvent only through manual top-ups.

`SetStakeCapitalPolicy{ forwardToTreasuryWallet: false }` keeps stake capital in the
contract, which makes stake refunds self-funding. It is a treasury decision, not a bug fix,
so the default is unchanged.
