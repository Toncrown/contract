// Admin panel section: edit the daily staking ROI per VIP class.
//
// Requires the upgrade that adds SetVipRoi (opcode 137466368) and getStakingRoiRates.
//
// TWO THINGS THIS SCREEN HAS TO COMMUNICATE, because neither is guessable:
//
//   1. A rate change is RETROACTIVE over unclaimed time. The contract looks the rate up
//      live at claim time and multiplies it by the days since each stake's lastClaim —
//      the rate is not snapshotted into the stake. Lowering a rate therefore reduces
//      balances users can already see on their dashboards, back to their last claim.
//
//   2. The way to avoid that is to let people claim first. A claim resets lastClaim
//      without ending the stake, which zeroes that user's exposure. Do NOT pause the
//      contract to do this: SetPaused blocks ClaimStakingRewards too, so pausing freezes
//      the very action you are waiting on.
//
// The panel shows the live pending-rewards figure so the owner can see exactly how much
// is about to be repriced before they send anything.

import React, { useEffect, useState } from 'react';
import { beginCell, toNano } from '@ton/core';
import { RiAlertLine, RiPercentLine, RiRefreshLine, RiCheckboxCircleLine } from 'react-icons/ri';
import { fetchStakingRoiRates, bpsToPct, pctToBps } from './roiRates';

const OPCODE_SET_VIP_ROI = 137466368;

// Class 4 is deliberately absent: it exists in contract storage but calculateVipClass
// only ever returns 0-3, so no user can hold it and no stake can reference it. Showing an
// editable rate for it would invite changing a number that can never pay anyone.
const CLASS_LABELS = {
  1: 'VIP 1 · levels 4–6',
  2: 'VIP 2 · levels 7–8',
  3: 'VIP 3 · levels 9–10',
};

export function AdminRoi({ client, contractAddress, tonConnectUI, addToast, loading, pendingStakingRewards, initialRates }) {
  // Seeded from the copy the app already fetched for its own ROI display, so the panel
  // paints immediately; it still refreshes on mount and after every change.
  const [rates, setRates] = useState(initialRates ?? null);
  const [drafts, setDrafts] = useState({});
  const [busy, setBusy] = useState(null);
  const [err, setErr] = useState(null);

  const refresh = async () => {
    if (!client || !contractAddress) return;
    try {
      const r = await fetchStakingRoiRates(client, contractAddress);
      setRates(r);
      setErr(null);
    } catch (e) {
      // Before the upgrade lands this getter does not exist, which is worth saying
      // plainly rather than rendering an empty panel.
      setErr(e?.message ?? 'getStakingRoiRates unavailable — is the upgrade deployed?');
    }
  };

  useEffect(() => { refresh(); }, [client, contractAddress]);

  const send = async (vipClass) => {
    const draft = drafts[vipClass];
    const bps = pctToBps(draft);

    if (!Number.isFinite(bps) || bps < 0) {
      addToast({ type: 'error', title: 'Bad rate', msg: 'Enter a percentage, e.g. 0.95' });
      return;
    }
    if (rates && bps > Number(rates.maxAllowed)) {
      addToast({
        type: 'error', title: 'Above the contract cap',
        msg: `The contract refuses anything above ${bpsToPct(rates.maxAllowed)}%/day.`,
      });
      return;
    }
    if (rates && BigInt(bps) === rates[vipClass]) {
      addToast({ type: 'error', title: 'No change', msg: 'That is already the current rate.' });
      return;
    }

    setBusy(vipClass);
    try {
      const body = beginCell()
        .storeUint(OPCODE_SET_VIP_ROI, 32)
        .storeUint(vipClass, 8)
        .storeUint(bps, 16)
        .endCell();
      await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 60,
        messages: [{
          address: contractAddress.toString(),
          amount: toNano('0.05').toString(),
          payload: body.toBoc().toString('base64'),
        }],
      });
      addToast({
        type: 'success', title: 'Rate change sent',
        msg: `VIP ${vipClass} → ${bpsToPct(BigInt(bps))}%/day paid.`,
      });
      setTimeout(refresh, 12000);
    } catch (e) {
      addToast({ type: 'error', title: 'Rate change failed', msg: e?.message });
    } finally {
      setBusy(null);
    }
  };

  const pending = pendingStakingRewards ?? null;

  return (
    <div className="card" style={{ border: '1px solid rgba(240,165,0,0.25)' }}>
      <div className="section-hdr">
        <div className="section-title">
          <RiPercentLine style={{ marginRight: 6, verticalAlign: 'middle' }} />Staking ROI
        </div>
        <button
          style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 14 }}
          onClick={refresh} title="Reload rates"><RiRefreshLine /></button>
      </div>

      {err && (
        <div className="note" style={{ borderColor: 'rgba(240,64,88,0.25)', color: 'rgba(240,100,120,0.85)' }}>
          <RiAlertLine style={{ marginRight: 5, verticalAlign: 'middle' }} />{err}
        </div>
      )}

      <div className="note mb-12" style={{ borderColor: 'rgba(240,64,88,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <RiAlertLine style={{ flexShrink: 0, fontSize: 16, marginTop: 1, color: 'rgba(240,100,120,0.9)' }} />
          <div>
            <strong>A change applies to time already accrued.</strong> The contract prices
            every unclaimed day at whatever the rate is when the user claims — not at the
            rate when they staked. Lowering a rate reduces balances users can already see.
            {pending !== null ? (
              <> Right now <strong>{(Number(pending) / 1e9).toFixed(4)} TON</strong> of
              rewards are accrued and unclaimed; that is what would be repriced.</>
            ) : (
              <> Scan pending rewards on the Overview tab to see exactly how much is
              accrued and would be repriced.</>
            )}
            <br /><br />
            To change a rate without repricing anyone: announce it, leave the contract
            running so people can claim — a claim resets their accrual clock without ending
            their stake — then apply it. <strong>Do not pause</strong>: pausing blocks
            claiming too.
          </div>
        </div>
      </div>

      {!rates ? (
        <div className="skeleton" style={{ height: 120 }} />
      ) : (
        <>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10 }}>
            Enter the rate <strong>paid</strong> to stakers. Users are shown{' '}
            {bpsToPct(rates.gasMargin)}% more than this — the retained margin covering gas
            and platform costs — so the contract derives the advertised figure itself.
            Contract cap: {bpsToPct(rates.maxAllowed)}%/day.
          </div>

          {[1, 2, 3].map(cls => {
            const current = rates[cls];
            const draft = drafts[cls] ?? bpsToPct(current);
            const changed = pctToBps(draft) !== Number(current);
            return (
              <div key={cls} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div className="row" style={{ marginBottom: 6 }}>
                  <span className="text-muted" style={{ fontSize: 11 }}>{CLASS_LABELS[cls]}</span>
                  <span className="fw-7" style={{ fontSize: 12 }}>
                    now {bpsToPct(current)}% paid
                    <span className="text-muted"> · {bpsToPct(current + rates.gasMargin)}% shown</span>
                  </span>
                </div>
                <div className="input-row">
                  <div className="input-wrap" style={{ flex: 1 }}>
                    <input className="input" type="number" step="0.01" min="0"
                      max={bpsToPct(rates.maxAllowed)}
                      value={draft}
                      onChange={e => setDrafts(d => ({ ...d, [cls]: e.target.value }))} />
                  </div>
                  <button className={`btn ${changed ? 'btn-red' : 'btn-secondary'}`}
                    disabled={!changed || busy !== null || loading}
                    onClick={() => send(cls)}>
                    {busy === cls
                      ? <><div className="spinner" />Sending…</>
                      : changed ? 'Apply' : <><RiCheckboxCircleLine /> Set</>}
                  </button>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
