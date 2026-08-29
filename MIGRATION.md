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

## Procedure

Run steps 1–3 against **testnet first** with a snapshot of real mainnet data.

### 1. Snapshot the live contract

Page through the old contract's getters and write the result to a file. Do this while the
old contract is paused-by-convention (announce a maintenance window; the old contract has
no `SetPaused`, so stop the frontend from sending upgrade/stake transactions).

```
getPlatformStats()                      -> totalUsers, totals
getUserAddressByIndex(i)  for i in 0..totalUsers-1
getUserInfo(addr)                       -> per user
getUserReferralInfo(addr)               -> downlines map
getUserStakeIds(addr) + getStakeDetails(addr, id)
getPlatformEarningsInfo()
```

Record the block/logical time of the snapshot. Any transaction the old contract accepts
after this point is lost, which is why the frontend must be stopped first.

### 2. Deploy the fixed contract

Deploy with the **same owner address**. `init(owner)` sets `importsLocked = false`, so the
owner can seed state, and `forwardStakeCapital = true`, which preserves the current money
flow until you decide otherwise.

### 3. Import, in this order

1. `ImportUser` for every user, **in the original registration order**. `userList` indexes
   and therefore spillover rotation depend on that order.
2. `ImportDownline` for every `(parent, slot, child)` pair. Both parties must already be
   imported, which the receiver enforces.
3. `ImportStake` for every stake, including inactive ones (`stakeCounter` is derived from
   the highest imported id).
4. `ImportPlatformTotals` once.

Batch these; each is a normal internal message costing ordinary gas.

### 4. Verify before locking

Compare old and new side by side:

- `getPlatformStats()` matches on every field.
- `getUserInfo` matches for a random sample plus every user holding a stake or a pending
  check-in balance.
- `getTreasuryLiabilities(0, 50)` summed across pages equals the sum of pending rewards
  computed from the snapshot.

`LockImports` is **one-way** — send it only after verification passes. After it, the owner
can no longer write user records.

### 5. Move the money

`OwnerWithdraw` from the old contract, then fund the new one. Fund it with at least the
`tonDueNow` figure from step 4 plus a working buffer (see below).

### 6. Cut over

Point the frontend and the `distr/` distributor service at the new address, and set
`SetDistributor` on the new contract.

> `distr/src/services/distributionService.ts` reads `getUserInfo` by tuple index
> (`tupleItems[1]` = level, etc.). `linkReferrer` was appended to the **end** of the `User`
> struct so existing indexes are unchanged, but re-verify before cutover. The service also
> discovers users by scraping transactions; switch it to `getUserListPaginated`.

### 7. Retire the old contract

Leave it deployed with a near-zero balance. Do not delete it — users' explorers will still
link to it, and its storage is the audit trail for the snapshot.

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
