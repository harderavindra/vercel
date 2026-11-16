import React, { useEffect, useState } from "react";
import { listDeclarations } from "../../api/campaignsV2Api";
import DeclarationModal from "./DeclarationModal";
import { ROLE_LABELS, fmtMonthLong, userName } from "../../utils/campaignV2Flow";
import { formatDateTime } from "../../utils/formatDateTime";

// The campaign's state-level declarations (audit trail), newest first. "View" shows the confirmed text.
const KIND_META = {
  zmm_submit: { step: "01", role: "ZMM", stage: "Scheme submission" },
  bm_review: { step: "02", role: "Brand Manager", stage: "Scheme review and decision" },
  zmm_creative: { step: "03", role: "ZMM", stage: "Creative review and sign-off" },
};

const DECISION_STYLE = {
  submitted: "bg-blue-50 text-blue-700 border-blue-200",
  approved: "bg-green-50 text-green-700 border-green-200",
};

// refreshKey: changes after every action, so the list reloads
const DeclarationsSection = ({ campaignId, refreshKey, className = "" }) => {
  const [list, setList] = useState(null);
  const [error, setError] = useState("");
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    let alive = true;
    listDeclarations(campaignId)
      .then((d) => { if (alive) { setList(d); setError(""); } })
      .catch((err) => { if (alive) setError(err.response?.data?.message || "Could not load the declarations"); });
    return () => { alive = false; };
  }, [campaignId, refreshKey]);

  const who = (d) => userName(d.user) || d.userName || d.userEmail || "—";

  return (
    <div className={className}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold text-lg">Declarations {list ? `(${list.length})` : ""}</h2>
        <span className="text-xs text-gray-500">State-level sign-off · named · dated · time-stamped</span>
      </div>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      {!error && list === null && <p className="text-gray-500 mt-2">Loading...</p>}
      {list?.length === 0 && (
        <p className="text-gray-500 mt-2">No declarations yet. They are recorded when the offers are submitted and when a state is approved.</p>
      )}
      {list?.length > 0 && (
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left border border-gray-200 text-sm">
            <thead className="bg-blue-100 border-b border-blue-400 text-blue-500">
              <tr>
                <th className="p-3">State</th>
                <th className="p-3">Step</th>
                <th className="p-3">Version</th>
                <th className="p-3">Declared by</th>
                <th className="p-3">Role</th>
                <th className="p-3">Decision</th>
                <th className="p-3">Date &amp; time</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {list.map((d) => {
                const meta = KIND_META[d.kind] || {};
                return (
                  <tr key={d._id} className="border-b border-gray-200">
                    <td className="p-3 font-semibold">{d.state}</td>
                    <td className="p-3">{meta.step} · {meta.stage}</td>
                    <td className="p-3">v{d.version}</td>
                    <td className="p-3">{who(d)}</td>
                    <td className="p-3">{ROLE_LABELS[d.role] || d.role}</td>
                    <td className="p-3">
                      <span className={`text-xs border rounded-full px-2 py-0.5 capitalize ${DECISION_STYLE[d.decision] || ""}`}>{d.decision}</span>
                    </td>
                    <td className="p-3 whitespace-nowrap">{formatDateTime(d.at)}</td>
                    <td className="p-3 text-right">
                      <button type="button" className="text-blue-600 hover:text-red-500 cursor-pointer" onClick={() => setViewing(d)}>View</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {viewing && (
        <DeclarationModal
          readOnly
          decl={{ ...(KIND_META[viewing.kind] || {}), ...(viewing.textSnapshot || {}) }}
          accepted={viewing.acceptedItems || []}
          state={viewing.state}
          period={fmtMonthLong(viewing.period)}
          userLabel={[who(viewing), ROLE_LABELS[viewing.role] || viewing.role].filter(Boolean).join(" · ")}
          recordedAt={`${formatDateTime(viewing.at)} · v${viewing.version}`}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
};

export default DeclarationsSection;
