// Replaces the OPCODES map in App.jsx. Existing values are unchanged — verified against
// the deployed ABI — so nothing that works today breaks. The new entries are the admin
// messages added by the upgrade.
export const OPCODES = {
  // unchanged
  UpgradeLevel: 2984784977,
  CheckIn: 928085272,
  ClaimCheckInRewards: 1554172427,
  StakeTON: 4239787765,
  ClaimStakingRewards: 1698125262,
  UpdateAutoRestake: 3359594178,
  JettonTransfer: 260734629,
  UpdateLevelCost: 3820349697,
  SetUsdtJettonWallet: 2766193506,
  SetDistributor: 3179496197,
  OwnerDeposit: 3810681894,
  OwnerWithdraw: 4050357351,
  ChangeOwner: 2174598809,

  // new
  WithdrawJettons: 3768522461,       // move jettons out of the contract's jetton wallet
  UpgradeContract: 241131399,        // owner-only SETCODE
  SetPaused: 157817343,              // emergency stop
  SetStakeCapitalPolicy: 1901797867, // keep staking capital in-contract instead of forwarding
  LockImports: 1151426661,           // one-way: stops the owner writing user records
};
