import React from "react";
import { STATUS, TONE_CLASSES } from "../../utils/campaignV2Flow";

// Campaign status (or a per-state decision) as a small coloured pill.
const DECISIONS = {
  approved: { label: "Approved", tone: "ok" },
  rejected: { label: "Rejected", tone: "bad" },
  pending: { label: "Awaiting", tone: "wait" },
};

// Pass `status` for a campaign status, or `decision` (may be undefined = not submitted yet) for a state's decision.
const StatusPill = (props) => {
  const { status, decision, className = "" } = props;
  const s = "decision" in props
    ? DECISIONS[decision] || { label: "Not submitted", tone: "draft" }
    : STATUS[status] || { label: status, tone: "draft" };
  return (
    <span className={`inline-block whitespace-nowrap text-xs font-semibold px-2 py-1 rounded-full border ${TONE_CLASSES[s.tone]} ${className}`}>
      {s.label}
    </span>
  );
};

export default StatusPill;
