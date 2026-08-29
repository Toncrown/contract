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

## The short version

Four commands, in order. Steps 2–4 are scripts in `scripts/`.

```bash
# 0. one-off: put these in .env
#    OLD_CONTRACT=EQ...     the live contract
#    NEW_CONTRACT=EQ...     filled in after step 1

# 1. stop the frontend, then deploy the fixed contract with the SAME owner wallet
npx blueprint run deploy

# 2. read every user record out of the old contract -> migration-snapshot.json
npx blueprint run exportState

# 3. replay them into the new contract (owner wallet; safe to re-run if interrupted)
npx blueprint run importState

# 4. prove the new contract matches the snapshot, and print the funding number
npx blueprint run verifyMigration
```

Then fund the new contract, send `LockImports`, and point the frontend and the `distr/`
service at the new address.

Run the whole thing on **testnet first**, against a snapshot of real mainnet data.

## What each script does

**`exportState`** reads `getPlatformStats`, then walks `getUserAddressByIndex` →
`getUserInfo` → `getStakeDetails` for every user, and writes `migration-snapshot.json`.
It talks to the old contract through raw get-method calls and reads result tuples by
position, because the old contract predates the `linkReferrer` field and this build's
generated wrapper would mis-parse its `User` struct. It paces itself for toncenter's
free tier and retries with backoff, so a dropped request never silently loses a user.
It warns loudly if the exported count does not match `totalUsers`.

**`importState`** sends `ImportUser` for every user **in original registration order**
(userList index order drives spillover rotation), then `ImportDownline`, `ImportStake`,
`ImportPlatformTotals`. Progress is written to `migration-progress.json` after every
message and completed items are skipped, so if it dies at user 700 of 1000 you just run
it again.

Downlines are rebuilt from each user's `referrer`, in registration order. The old
contract assigned slots by incrementing `directReferrals` as children attached, so
registration order reproduces the original slot numbering exactly — no map parsing
needed.

**`verifyMigration`** is read-only. It compares every user's level, VIP class, referrer,
referral counts, registration time, pending check-in balance, earnings and every stake
against the snapshot, and exits non-zero on any mismatch. It finishes by printing the
number you need:

```
claimable right now:   142.31 TON   <- fund at least this
active staked TON:     8,400.00 TON  (comes due as stakes mature)
contract balance:      0.50 TON
```

## One judgement call the import makes for you

The old contract stored a single `referrer` — the matrix parent. The new contract also
tracks `linkReferrer`, the wallet named on the registration link, which the old contract
never persisted, so it cannot be recovered.

The scripts default to `linkReferrer = referrer`. That pays the user's actual upline the
full referral split, which is what already happened for directly-placed users. For
users who were placed by spillover, the original inviter is unknowable, and this hands
that share to their matrix parent instead.

Set `MIGRATE_LINK_REFERRER=none` to leave it null instead — that share then goes to
`creatorWallet3` as "System Link Commission". The default is the one that favours users.

## Step by step, in full

### 1. Stop the frontend

The old contract has no `SetPaused`, so this is the only way to stop new transactions.
Anything it accepts after the snapshot in step 2 is lost.

### 2. Snapshot

`npx blueprint run exportState`. Keep `migration-snapshot.json` — it is your audit trail.

### 3. Deploy the fixed contract

Same owner address. `init(owner)` sets `importsLocked = false` so state can be seeded,
and `forwardStakeCapital = true`, preserving the current money flow.

### 4. Import

`npx blueprint run importState`, from the owner wallet.

### 5. Verify before locking

`npx blueprint run verifyMigration`. `LockImports` is **one-way** — send it only after
this passes clean. After it, the owner can no longer write user records.

### 6. Move the money

`OwnerWithdraw` from the old contract, then fund the new one with at least the
"claimable right now" figure plus a working buffer.

### 7. Cut over

Point the frontend and the `distr/` distributor service at the new address, and send
`SetDistributor` on the new contract.

> `distr/src/services/distributionService.ts` reads `getUserInfo` by tuple index
> (`tupleItems[1]` = level, etc.). `linkReferrer` was appended to the **end** of the
> `User` struct so existing indexes are unchanged, but re-verify before cutover. The
> service also discovers users by scraping transactions; switch it to
> `getUserListPaginated`.

### 8. Retire the old contract

Leave it deployed with a near-zero balance. Do not delete it — explorers still link to
it, and its storage is the audit trail behind your snapshot.

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
