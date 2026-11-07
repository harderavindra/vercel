import React, { useEffect, useState } from "react";
import Button from "../common/Button";
import StatusPill from "./StatusPill";
import { performAction, listAgencyUsers } from "../../api/campaignsV2Api";
import { getSettings } from "../../api/mastersApi";
import { STATUS, NEXT_STEP, userName, waitingOn } from "../../utils/campaignV2Flow";

// Workflow actions, ported from mh-camp components/ActionPanel.tsx.
// Shows only what the current user can do now (campaign.permissions.actions, worked out by the server);
// the server checks every action again.
const inputStyle = "border rounded-md border-gray-400 px-3 py-2 focus:border-blue-300 focus:outline-0 bg-white w-full";

const campaignStates = (c) => [...new Set(c.offers.map((o) => o.state))];

// Per-state approval list. decidable: Approve / Reject (+ remark) for states awaiting a decision.
const StateList = ({ campaign, kind, decidable, busy, onDecide }) => {
  const approvals = (kind === "offers" ? campaign.approvals : campaign.contentApprovals) || {};
  const [remarks, setRemarks] = useState({});
  const [bad, setBad] = useState("");
  const decide = (state, decision) => {
    const remark = (remarks[state] || "").trim();
    if (decision === "rejected" && !remark) { setBad(state); return; }
    onDecide(state, decision, remark);
  };
  return (
    <div className="flex flex-col divide-y divide-gray-200 border border-gray-200 rounded-md bg-white">
      {campaignStates(campaign).map((s) => {
        const a = approvals[s];
        const count = campaign.offers.filter((o) => o.state === s).length;
        return (
          <div key={s} className="p-3 flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span><strong>{s}</strong> <span className="text-gray-500 text-sm">· {count} offer{count === 1 ? "" : "s"}</span></span>
              {a ? <StatusPill decision={a.status} /> : <span className="text-xs text-gray-500 bg-gray-100 border border-gray-300 rounded-full px-2 py-0.5">Not submitted</span>}
            </div>
            {(a?.by || a?.remark) && (
              <div className="text-sm text-gray-600">
                {a.by && <span>by {userName(a.by)} </span>}
                {a.remark && <span className="italic">“{a.remark}”</span>}
              </div>
            )}
            {decidable && a?.status === "pending" && (
              <div className="flex flex-col gap-2">
                <input
                  className={`${inputStyle} ${bad === s ? "border-red-500" : ""}`}
                  placeholder="Remark (required to reject)"
                  value={remarks[s] || ""}
                  onChange={(e) => { setRemarks({ ...remarks, [s]: e.target.value }); setBad(""); }}
                />
                {bad === s && <p className="text-red-500 text-sm">A remark is required to reject {s}.</p>}
                <div className="flex gap-2">
                  <button type="button" disabled={busy} onClick={() => decide(s, "approved")} className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-md py-2 cursor-pointer disabled:opacity-50">Approve</button>
                  <button type="button" disabled={busy} onClick={() => decide(s, "rejected")} className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-md py-2 cursor-pointer disabled:opacity-50">Reject</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/**
 * campaign: full campaign from GET /:id. onChanged(message): reload after an action.
 * saveLinks(): saves link edits typed in the offers table first (returns false if that failed).
 */
const ActionPanel = ({ campaign: c, onChanged, saveLinks }) => {
  const can = (a) => c.permissions?.actions?.includes(a);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [agencies, setAgencies] = useState([]);
  const [agencyId, setAgencyId] = useState("");
  const [agencyStatuses, setAgencyStatuses] = useState([]);
  const [agStatus, setAgStatus] = useState(c.agencyStatus || "");
  const [handTo, setHandTo] = useState([]);
  const states = campaignStates(c);
  const st = STATUS[c.status] || {};

  const needAgencies = can("assign") || can("handOver");
  useEffect(() => {
    if (!needAgencies) return;
    listAgencyUsers().then((list) => {
      setAgencies(list);
      // Hand over: agencies other than the one that made the artwork are ticked to start with
      const agencyIdOf = c.agency?._id || c.agency;
      setHandTo(c.handedTo?.length ? c.handedTo.map((u) => u._id || u) : list.filter((u) => u._id !== agencyIdOf).map((u) => u._id));
    }).catch(() => setAgencies([]));
  }, [needAgencies, c.agency, c.handedTo]);

  useEffect(() => {
    if (!can("changeStatus")) return;
    getSettings().then((s) => {
      const list = s.agencyStatuses || [];
      setAgencyStatuses(list);
      setAgStatus((cur) => cur || list[0] || "");
    }).catch(() => setAgencyStatuses([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.status]);

  const run = async (action, body, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    setError("");
    try {
      const r = await performAction(c._id, action, body);
      await onChanged(r.message);
    } catch (err) {
      setError(err.response?.data?.message || "Could not do this. Reload the page and try again.");
    } finally {
      setBusy(false);
    }
  };
  const approvedCount = (kind) => states.filter((s) => ((kind === "offers" ? c.approvals : c.contentApprovals) || {})[s]?.status === "approved").length;

  let body;
  if (can("submit")) {
    const draft = c.status === "draft";
    body = <>
      <p>{draft
        ? "Add the offers for this campaign, then submit them to the Brand Manager. Offers are approved state by state."
        : "Some states were rejected. Edit their offers, then resubmit; approved states stay approved."}</p>
      {!draft && <StateList campaign={c} kind="offers" />}
      <Button type="button" disabled={busy || !c.offers.length} onClick={() => run("submit")}>
        {busy ? "Submitting..." : draft ? "Submit for approval" : "Resubmit rejected states"}
      </Button>
      {!c.offers.length && <p className="text-gray-500 text-sm">Add at least one offer first.</p>}
    </>;
  } else if (can("decideOffers")) {
    body = <>
      <p>Approve or reject each state&apos;s offers (see the offers table below). {approvedCount("offers")} of {states.length} states approved; the campaign moves on once every state is approved.</p>
      <StateList campaign={c} kind="offers" decidable busy={busy} onDecide={(state, decision, remark) => run("decideOffers", { state, decision, remark })} />
    </>;
  } else if (can("assign")) {
    body = <>
      <p>Offers are approved in every state. Assign this campaign to an agency.</p>
      <select className={inputStyle} value={agencyId} onChange={(e) => setAgencyId(e.target.value)} aria-label="Agency">
        <option value="">Select agency</option>
        {agencies.map((u) => <option key={u._id} value={u._id}>{userName(u)}</option>)}
      </select>
      {!agencies.length && <p className="text-gray-500 text-sm">No active users with the Agency role.</p>}
      <Button type="button" disabled={busy || !agencyId} onClick={() => run("assign", { agencyUserId: agencyId })}>{busy ? "Assigning..." : "Assign"}</Button>
    </>;
  } else if (can("changeStatus") || can("submitArtwork")) {
    const redo = c.status === "content_rejected";
    body = <>
      {redo && <>
        <p>The Zonal Marketing Manager rejected the artwork for some states. Replace the artwork of those states&apos; offers (see the comments on each artwork), then resubmit; approved states are locked.</p>
        <StateList campaign={c} kind="content" />
      </>}
      {!redo && <>
        <div className="flex gap-2">
          <select className={inputStyle} value={agStatus} onChange={(e) => setAgStatus(e.target.value)} aria-label="Agency status">
            {!agencyStatuses.length && <option value="">No statuses in Settings</option>}
            {agencyStatuses.map((s) => <option key={s}>{s}</option>)}
          </select>
          <Button type="button" width="auto" variant="outline" disabled={busy || !agStatus || !can("changeStatus")} onClick={() => run("changeStatus", { agencyStatus: agStatus })}>Change status</Button>
        </div>
        {c.agencyStatus && <p className="text-gray-500 text-sm">Current: {c.agencyStatus}</p>}
      </>}
      {can("submitArtwork") ? <>
        {!redo && <p>Upload the artwork (PNG or JPG) for each offer in the table below, then submit it. The Zonal Marketing Manager approves it state by state; the Creative Link comes after that.</p>}
        <Button type="button" disabled={busy} onClick={() => run("submitArtwork")}>{redo ? "Resubmit rejected states" : "Submit artwork"}</Button>
      </> : <p className="text-gray-500 text-sm">Change the status first; you can then upload the artwork.</p>}
    </>;
  } else if (can("decideContent")) {
    body = <>
      <p>Check the artwork of each state&apos;s offers in the table below (use Comments on an artwork to note changes), then approve or reject that state. {approvedCount("content")} of {states.length} states approved.</p>
      <StateList campaign={c} kind="content" decidable busy={busy} onDecide={(state, decision, remark) => run("decideContent", { state, decision, remark })} />
    </>;
  } else if (can("submitLinks")) {
    body = <>
      <p>The artwork is approved in every state. Enter the Creative Link for each offer in the table below, then share them.</p>
      <Button type="button" disabled={busy} onClick={async () => { if (await saveLinks()) run("submitLinks"); }}>Share creative links</Button>
    </>;
  } else if (can("handOver")) {
    const agencyIdOf = c.agency?._id || c.agency;
    body = <>
      <p>The agency has shared the creative links. Add the Landing Page link for each offer in the table below, tick the agencies to hand over to, then hand over.</p>
      <div className="flex flex-col gap-1 border border-gray-200 rounded-md bg-white p-3" role="group" aria-label="Hand over to agencies">
        {agencies.map((u) => (
          <label key={u._id} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={handTo.includes(u._id)} onChange={(e) => setHandTo((prev) => e.target.checked ? [...prev, u._id] : prev.filter((x) => x !== u._id))} />
            {userName(u)}{u._id === agencyIdOf && <span className="text-gray-500 text-sm">(made the artwork)</span>}
          </label>
        ))}
        {!agencies.length && <span className="text-gray-500 text-sm">No active users with the Agency role.</span>}
      </div>
      <Button type="button" disabled={busy || !handTo.length} onClick={async () => { if (await saveLinks()) run("handOver", { agencyUserIds: handTo }); }}>
        Hand over to {handTo.length} {handTo.length === 1 ? "agency" : "agencies"}
      </Button>
    </>;
  } else if (c.status === "completed") {
    body = <p><strong>Campaign completed.</strong> Artwork approved, creative links shared, landing pages added{c.handedTo?.length ? ` and handed to ${c.handedTo.map(userName).join(", ")}` : ""}.</p>;
  } else {
    const wait = waitingOn(c);
    body = <>
      {["pending_offer_approval", "offers_rejected"].includes(c.status) && <StateList campaign={c} kind="offers" />}
      {["content_uploaded", "content_rejected"].includes(c.status) && <StateList campaign={c} kind="content" />}
      <p>Nothing for you to do at this step. Waiting on <strong>{wait.join(", ")}</strong>{NEXT_STEP[c.status] ? ` to ${NEXT_STEP[c.status]}` : ""}.</p>
    </>;
  }

  const tone = c.status === "completed" ? "bg-green-50 border-green-200" : st.tone === "bad" ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200";
  return (
    <div className={`border rounded-md p-4 flex flex-col gap-3 ${tone}`}>
      <div><StatusPill status={c.status} /></div>
      {body}
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

export default ActionPanel;
