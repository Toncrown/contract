// New admin panel section. Drop into AdminDashboard, e.g. under the Treasury tab.
//
// Jettons can reach the contract with nothing recorded against them: a transfer whose
// notification is rejected still completes at the jetton level. That is how 72.41 USDT
// ended up stranded — deposits made while usdtJettonWalletAddress was still the deploy
// default, so every notification failed the "Unknown jetton wallet" check.
//
// Two things this surfaces:
//   1. whether usdtJettonWalletAddress is set correctly (if not, USDT staking is dead
//      and every deposit strands)
//   2. the contract's actual USDT balance, and a way to move it out
//
// Requires the upgraded contract: WithdrawJettons (opcode 3768522461) and
// getUsdtJettonWallet.

import React, { useEffect, useState } from 'react';
import { Address, beginCell, toNano, TupleBuilder } from '@ton/core';
import { RiAlertLine, RiCoinsLine, RiDownloadLine, RiCheckboxCircleLine, RiFileCopyLine } from 'react-icons/ri';

const USDT_MASTER = Address.parse('EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs');
const OPCODE_WITHDRAW_JETTONS = 3768522461;

const fmtUsdt = (raw) => (Number(raw ?? 0n) / 1_000_000).toFixed(6);

/** The jetton wallet the USDT master assigns to `owner`. */
async function deriveJettonWallet(client, owner) {
  const b = new TupleBuilder();
  b.writeAddress(owner);
  const { stack } = await client.runMethod(USDT_MASTER, 'get_wallet_address', b.build());
  return stack.readAddress();
}

async function jettonBalance(client, jettonWallet) {
  try {
    const { stack } = await client.runMethod(jettonWallet, 'get_wallet_data', new TupleBuilder().build());
    return stack.readBigNumber();
  } catch {
    return null;   // wallet not deployed yet — no USDT has ever arrived
  }
}

export function AdminJettons({ client, contractAddress, contractConfig, tonConnectUI, addToast, loading }) {
  const [derived, setDerived] = useState(null);
  const [balance, setBalance] = useState(null);
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');

  const configured = contractConfig?.usdtJettonWalletAddress ?? null;
  // While this is the owner address the contract rejects every USDT notification.
  const isUnset = configured && contractConfig?.owner && configured.equals(contractConfig.owner);
  const mismatched = configured && derived && !configured.equals(derived);

  const refresh = async () => {
    if (!client || !contractAddress) return;
    const jw = await deriveJettonWallet(client, contractAddress);
    setDerived(jw);
    setBalance(await jettonBalance(client, jw));
  };

  useEffect(() => { refresh(); }, [client, contractAddress]);
  useEffect(() => {
    if (contractConfig?.owner && !destination) setDestination(contractConfig.owner.toString());
  }, [contractConfig]);

  const copy = (v) => {
    navigator.clipboard.writeText(v).catch(() => {});
    addToast({ type: 'success', title: 'Copied!', msg: 'Address copied' });
  };

  const withdraw = async () => {
    let to, raw;
    try {
      to = Address.parse(destination.trim());
    } catch {
      addToast({ type: 'error', title: 'Bad destination', msg: 'That is not a valid TON address.' });
      return;
    }
    const parsed = parseFloat(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      addToast({ type: 'error', title: 'Bad amount', msg: 'Enter an amount greater than zero.' });
      return;
    }
    raw = BigInt(Math.round(parsed * 1_000_000));
    if (balance !== null && raw > balance) {
      addToast({ type: 'error', title: 'Too much', msg: `The contract holds ${fmtUsdt(balance)} USDT.` });
      return;
    }

    setBusy(true);
    try {
      const body = beginCell()
        .storeUint(OPCODE_WITHDRAW_JETTONS, 32)
        .storeAddress(to)
        .storeCoins(raw)
        .endCell();
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 60,
        messages: [{
          address: contractAddress.toString(),
          amount: toNano('0.2').toString(),
          payload: body.toBoc().toString('base64'),
        }],
      });
      addToast({ type: 'success', title: 'Withdrawal sent', msg: `${fmtUsdt(raw)} USDT to ${to.toString().slice(0, 10)}…` });
      setTimeout(refresh, 12000);
    } catch (e) {
      addToast({ type: 'error', title: 'Withdrawal failed', msg: e?.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card" style={{ border: '1px solid rgba(38,161,123,0.25)' }}>
      <div className="section-hdr">
        <div className="section-title">
          <RiCoinsLine style={{ marginRight: 6, verticalAlign: 'middle' }} />Contract USDT
        </div>
        {balance === null
          ? <span className="badge">No wallet yet</span>
          : balance > 0n
            ? <span className="badge gold">{fmtUsdt(balance)} USDT held</span>
            : <span className="badge green">Empty</span>}
      </div>

      {isUnset && (
        <div className="note" style={{ borderColor: 'rgba(240,64,88,0.25)', color: 'rgba(240,100,120,0.85)' }}>
          <RiAlertLine style={{ marginRight: 5, verticalAlign: 'middle' }} />
          The USDT jetton wallet is still the deploy default. Every USDT deposit is rejected
          and strands in the contract&apos;s jetton wallet. Set it below before anyone stakes USDT.
        </div>
      )}
      {mismatched && !isUnset && (
        <div className="note" style={{ borderColor: 'rgba(240,165,0,0.25)', color: 'var(--gold)' }}>
          <RiAlertLine style={{ marginRight: 5, verticalAlign: 'middle' }} />
          The configured wallet is not the one the USDT master assigns to this contract.
          Deposits will be rejected.
        </div>
      )}
      {!isUnset && !mismatched && configured && (
        <div style={{ fontSize: 11, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
          <RiCheckboxCircleLine style={{ flexShrink: 0 }} />
          <span>Correctly set — USDT staking is accepted.</span>
        </div>
      )}

      {[['Configured', configured], ['Derived from USDT master', derived]].map(([label, addr]) => (
        <div key={label} className="row" style={{ padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
          <span className="text-muted" style={{ fontSize: 11 }}>{label}</span>
          {addr ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="fw-7" style={{ fontSize: 12, fontFamily: 'var(--font-display)' }}>
                {`${addr.toString().slice(0, 6)}…${addr.toString().slice(-4)}`}
              </span>
              <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0, fontSize: 13 }}
                onClick={() => copy(addr.toString())}><RiFileCopyLine /></button>
            </div>
          ) : <div className="skeleton" style={{ height: 13, width: 96 }} />}
        </div>
      ))}

      <div className="row" style={{ padding: '9px 0', borderBottom: '1px solid var(--border)', marginBottom: 12 }}>
        <span className="text-muted" style={{ fontSize: 11 }}>Balance in contract</span>
        <span className="fw-8 text-sm" style={{ color: balance > 0n ? 'var(--gold)' : 'var(--muted)' }}>
          {balance === null ? 'no wallet' : `${fmtUsdt(balance)} USDT`}
        </span>
      </div>

      {balance !== null && balance > 0n && (
        <>
          <div className="note mb-12">
            USDT backing active stakes is owed to users. Only withdraw what is genuinely
            stranded — deposits whose notification was rejected.
          </div>
          <div className="input-wrap">
            <label className="input-label">Destination</label>
            <input className="input" placeholder="EQ..." value={destination} onChange={e => setDestination(e.target.value)} />
          </div>
          <div className="input-row">
            <div className="input-wrap">
              <label className="input-label">Amount (USDT)</label>
              <input className="input" type="number" step="0.000001" min="0"
                placeholder={fmtUsdt(balance)} value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <button className="btn btn-secondary" onClick={() => setAmount(fmtUsdt(balance))}>Max</button>
          </div>
          <button className="btn btn-red btn-full mt-8" onClick={withdraw} disabled={busy || loading}>
            {busy ? <><div className="spinner" />Sending…</> : <><RiDownloadLine /> Withdraw USDT</>}
          </button>
        </>
      )}
    </div>
  );
}
