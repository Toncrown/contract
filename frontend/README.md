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

## New contract capabilities

```
getUserSummary(address)   -> flat user scalars, or null
getContractConfig()       -> owner, 4 creator wallets, USDT jetton wallet,
                             distributor, isPaused, importsLocked,
                             forwardStakeCapital, deploymentNonce
getUsdtJettonWallet()     -> the address the contract accepts USDT notifications from
WithdrawJettons{to,amount}-> owner-only, moves jettons out of the contract's jetton wallet
```

## Contract address

The live contract is `EQBHG-l-XAsYnMGMx8ecP7fU_AM8oSV-r6ZQtYBD4sEGVdPy`, which the app
already points at.
