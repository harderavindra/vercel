import React from "react";
import { FiX } from "react-icons/fi";
import Avatar from "../common/Avatar";
import { FLOW, STATUS, STEP_EVENTS, userName } from "../../utils/campaignV2Flow";

// Chevron timeline in the style of the artwork job page: a red "Timeline" tag, then the 9 workflow steps.
// As on the job page the latest completed step is red; earlier done steps are white with who did them,
// the next step has a dashed red outline (solid red text + ✕ when it was rejected), later steps are faded.
const Arrow = ({ color }) => (
  <span className={`absolute -right-2 top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-b-8 border-l-8 border-transparent ${color} z-10`} />
);

// Short timeline labels (same order as FLOW); the full FLOW label is the tooltip
const SHORT = ["Created", "Offers Approved", "Assigned", "In Progress", "Artwork Uploaded", "Artwork Approved", "Links Shared", "Handed Over", "Completed"];
// Steps decided state by state: show "approved of total" while waiting on them
const DECISION_STEPS = { 1: ["approvals", "pending_offer_approval"], 5: ["contentApprovals", "content_uploaded"] };

const ProgressTracker = ({ campaign }) => {
  const st = STATUS[campaign.status] || { step: 0 };
  const done = st.step;
  const history = campaign.history || [];
  const states = [...new Set((campaign.offers || []).map((o) => o.state))];
  const progress = (i) => {
    const [key, status] = DECISION_STEPS[i] || [];
    if (!key || campaign.status !== status) return "";
    const n = states.filter((s) => campaign[key]?.[s]?.status === "approved").length;
    return ` · ${n}/${states.length}`;
  };
  const doneBy = (i) => [...history].reverse().find((h) => STEP_EVENTS[i]?.includes(h.event))?.by;

  return (
    <div className="flex gap-2 mb-5 overflow-x-auto whitespace-nowrap pb-2 pr-3">
      <div className="shrink-0 flex gap-2 items-center border border-red-500 bg-red-500 text-white font-bold px-3 py-1 text-xs rounded-md relative">
        Timeline
        <Arrow color="border-l-red-500" />
      </div>
      {FLOW.map((f, i) => {
        const isDone = i < done;
        const isLatest = i === done - 1;
        const isNext = i === done;
        const isBad = isNext && st.tone === "bad";
        const by = isDone ? doneBy(i) : null;
        const pill = isLatest
          ? "bg-red-500 border-red-500 text-white"
          : isDone
            ? "border-gray-300 bg-white"
            : isNext
              ? `bg-white border-red-400 border-dashed ${isBad ? "text-red-600 font-semibold" : "text-red-500"}`
              : "border-gray-200 bg-white text-gray-400 border-dashed";
        return (
          <div
            key={f.label}
            className={`shrink-0 flex gap-2 items-center border px-3 py-1 text-xs rounded-md relative min-h-8 ${pill}`}
            title={by ? `${f.label} by ${userName(by)}` : isNext ? `Up next: ${f.label}` : f.label}
          >
            {isDone && <Avatar name={userName(by)} src={by?.profilePic} size="xs" />}
            {isBad && <FiX />}
            {SHORT[i] || f.label}{progress(i)}
            {i < FLOW.length - 1 && <Arrow color={isLatest ? "border-l-red-500" : "border-l-gray-300"} />}
          </div>
        );
      })}
    </div>
  );
};

export default ProgressTracker;
