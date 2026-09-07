// Replaces fetchContractConfig and vipConfigDictValue in App.jsx.
//
// The old version fetched the raw account state and walked it by hand — loadBit, three
// addresses, loadRef, three more, loadRef, then dictionaries — because the contract had no
// getter for its own configuration. That hardcodes the storage layout into the frontend:
// adding or reordering a single contract field would have silently returned wrong
// addresses, with no error to notice.
//
// getContractConfig returns them directly.

import { Address, TupleBuilder } from '@ton/core';

const CONTRACT_ADDRESS = Address.parse('EQBHG-l-XAsYnMGMx8ecP7fU_AM8oSV-r6ZQtYBD4sEGVdPy');

export async function fetchContractConfig(client) {
  if (!client) return null;
  try {
    const { stack } = await client.runMethod(CONTRACT_ADDRESS, 'getContractConfig', new TupleBuilder().build());
    return {
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
    console.warn('[TonCrown] getContractConfig failed', e?.message);
    return null;
  }
}

/** Just the USDT jetton wallet, when that is all you need. */
export async function fetchUsdtJettonWallet(client) {
  try {
    const { stack } = await client.runMethod(CONTRACT_ADDRESS, 'getUsdtJettonWallet', new TupleBuilder().build());
    return stack.readAddress();
  } catch { return null; }
}

/**
 * Level costs and VIP configs still have no getter — they live in dictionaries the
 * contract does not expose. The admin panel reads them from raw state today; that part of
 * fetchContractConfig can stay, or be dropped if the panel does not need them.
 *
 * Account balance and state also still come from the account, not a getter:
 *
 *   const info = await fetch(`https://toncenter.com/api/v2/getAddressInformation?address=${CONTRACT_ADDRESS}`,
 *     { headers: { 'X-API-Key': TONCENTER_API_KEY } }).then(r => r.json());
 *   accountBalance: BigInt(info?.result?.balance || 0)
 *   accountState:   info?.result?.state
 *
 * getPlatformEarningsInfo already reports contractBalance, so prefer that where the
 * admin panel only needs the number.
 */
