# Wiring AdminJettons into App.jsx

**Status: applied** to `TON CROWN/frontend/src/App.jsx` on 7 Sep 2026. All three edits
below are in the file; `npx vite build` succeeds, and the two `no-undef` errors ESLint
reported (`'client' is not defined` at the old line 2887, `'tonConnectUI' is not defined`
at 2890) are gone. Kept here as a record of what changed and why.

Without the first two edits the Treasury tab threw `ReferenceError: client is not defined`
as soon as it rendered, because `AdminJettons` is called inside `AdminDashboard`, which
never received `client` or `tonConnectUI`.

Already correct before these edits: the import, and `WithdrawJettons: 3768522461` in
`OPCODES` (verified against the deployed ABI).

---

## 1. Pass `client` and `tonConnectUI` through `adminProps` — done

In `App()`, find `const adminProps = {` and add the two values. They already exist in that
scope; they were simply never forwarded.

```diff
   const adminProps = {
-    platformStats, platformEarnings, contractConfig, adminLoading, tonPrice,
+    client, tonConnectUI,
+    platformStats, platformEarnings, contractConfig, adminLoading, tonPrice,
     stakeLiabilities, liabilityScan, onScanLiabilities: runLiabilityScan,
     walletBalance, balanceLoading, loading,
```

## 2. Destructure them in `AdminDashboard` — done

```diff
 function AdminDashboard({
+  client, tonConnectUI,
   platformStats, platformEarnings, contractConfig, adminLoading, tonPrice,
   stakeLiabilities, liabilityScan, onScanLiabilities,
   walletBalance, balanceLoading, loading,
```

## 3. Move the panel out of the Treasury Position card — done

`AdminJettons` renders its own `<div className="card">`, so nesting it inside another card
double-borders it. Move it to a sibling, after that card closes.

```diff
   {activeSection === 'treasury' && (
     <>
       <div className="card">
         <div className="section-title mb-12"><RiCoinsLine style={{ marginRight: 6, verticalAlign: 'middle' }} />Treasury Position</div>
-        <AdminJettons
-            client={client}
-            contractAddress={CONTRACT_ADDRESS}
-            contractConfig={contractConfig}
-            tonConnectUI={tonConnectUI}
-            addToast={addToast}
-            loading={loading}
-          />
         <div className="stats-2">
           {[
             ...
           ))}
         </div>
       </div>

+      <AdminJettons
+        client={client}
+        contractAddress={CONTRACT_ADDRESS}
+        contractConfig={contractConfig}
+        tonConnectUI={tonConnectUI}
+        addToast={addToast}
+        loading={loading}
+      />
+
       <div className="card" style={{ border: `1px solid ${schedule && ...
```

---

## Optional, NOT applied: read the config from the getter instead of raw state

`fetchContractConfig` still walks the raw account state. That happens to work — the fields
added by the migration all sit *after* `isPaused`, so the prefix it reads is unchanged —
but it hardcodes the storage layout, and the next contract field added in the wrong place
would return wrong addresses silently, with no error.

`getContractConfig` returns the addresses and flags directly. Level costs and VIP configs
have no getter, so keep the raw parse for those:

```js
async function fetchContractConfig(client) {
  // addresses + flags straight from the contract
  let cfg = null;
  try {
    const { stack } = await client.runMethod(CONTRACT_ADDRESS, 'getContractConfig', new TupleBuilder().build());
    cfg = {
      owner: stack.readAddress(),
      creatorWallet1: stack.readAddress(),
      creatorWallet2: stack.readAddress(),
      creatorWallet3: stack.readAddress(),
      creatorWallet4: stack.readAddress(),
      usdtJettonWalletAddress: stack.readAddress(),
      distributorAddress: stack.readAddress(),
      isPaused: stack.readBoolean(),
      importsLocked: stack.readBoolean(),
      forwardStakeCapital: stack.readBoolean(),
      deploymentNonce: stack.readBigNumber(),
    };
  } catch (e) {
    tcWarn('getContractConfig failed', { message: e?.message });
  }

  // ... keep the existing raw-state block ONLY for levelCosts / vipConfigs /
  //     accountBalance / accountState, then merge:
  return { ...rawParsed, ...cfg };
}
```

`fetchContractConfig` currently takes no arguments, so pass `client` at the call site in
`fetchAdminData`.

---

## Also worth knowing

**`getUserSummary` can replace the whole safe-parser stack.** `getUserInfoSafe`,
`buildFallbackUserFromSafeGetters`, `unwrapTupleItems`, `rawStackValue`, `bigIntFromAny`
and the `readItem*` helpers exist because `getUserInfo` returns a 23-field struct, which
Tact nests past the 14th field, which TON API v2 cannot type. `getUserSummary` returns the
same scalars flat. See `readContract.js` in this directory.

**Your distributor is set to the contract's own address**, not a wallet:

```
distributorAddress : EQBHG-l-XAsYnMGMx8ecP7fU_AM8oSV-r6ZQtYBD4sEGVdPy
```

`DistributeDailyRewards` requires `sender() == distributorAddress`, and the contract cannot
message itself, so automated distribution cannot run. Users can still claim manually. One
`SetDistributor` fixes it. Note the existing "distributor is still the owner wallet"
warning in the Contract tab will not fire for this case, since the address is neither the
owner nor a valid distributor.
