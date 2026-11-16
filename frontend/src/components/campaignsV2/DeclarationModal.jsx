import React, { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";

// State-level declaration: title, state and period, then the points to confirm.
// The confirm button stays disabled until every point is ticked.
// decl: one entry of GET /declarations/texts (only title, intro and items are shown)
// readOnly + accepted: shows a recorded declaration (the snapshot) instead.
const DeclarationModal = ({
  decl, state, period, userLabel, progress, confirmLabel = "Confirm", busy, onConfirm, onClose,
  readOnly = false, accepted: acceptedInit = [], recordedAt,
}) => {
  const [ticked, setTicked] = useState(readOnly ? acceptedInit : []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, busy]);

  if (!decl) return null;
  const items = decl.items || [];
  const all = items.length > 0 && items.every((i) => ticked.includes(i.id));
  const toggle = (id) => setTicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex justify-center items-start sm:items-center p-4 overflow-y-auto" onClick={() => !busy && onClose?.()}>
      <div
        className="bg-white rounded-xl shadow-md w-full max-w-2xl flex flex-col overflow-hidden max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={decl.title}
      >
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-start justify-between gap-4 px-6 pt-5">
            <h2 className="font-semibold text-lg">
              {decl.title}
              {progress && <span className="ml-2 text-sm font-normal text-gray-500">({progress})</span>}
            </h2>
            <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="text-gray-500 hover:text-red-500 cursor-pointer p-1">
              <FiX size={20} />
            </button>
          </div>

          <div className="px-6 py-4 overflow-y-auto flex flex-col gap-4">
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm bg-gray-100/70 rounded-md px-4 py-2">
              <span><span className="text-gray-500">State</span> <strong>{state}</strong></span>
              {period && <span><span className="text-gray-500">Scheme period</span> <strong>{period}</strong></span>}
              {userLabel && <span><span className="text-gray-500">{readOnly ? "By" : "Signing as"}</span> <strong>{userLabel}</strong></span>}
              {recordedAt && <span><span className="text-gray-500">At</span> <strong>{recordedAt}</strong></span>}
            </div>

            <p className="font-semibold">{decl.intro}</p>
            <div className="flex flex-col divide-y divide-gray-200">
              {items.map((it) => (
                <label key={it.id} className={`flex gap-3 py-3 items-start ${readOnly ? "" : "cursor-pointer"}`}>
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-red-600 shrink-0"
                    checked={ticked.includes(it.id)}
                    disabled={readOnly || busy}
                    onChange={() => toggle(it.id)}
                  />
                  <span>{it.text}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
            <button type="button" onClick={onClose} disabled={busy} className="border border-gray-300 rounded-md px-4 py-2 hover:border-red-400 cursor-pointer">
              {readOnly ? "Close" : "Cancel"}
            </button>
            {!readOnly && (
              <button
                type="button"
                disabled={!all || busy}
                onClick={() => onConfirm(ticked)}
                className="bg-red-600 hover:bg-red-700 text-white rounded-md px-4 py-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? "Saving..." : confirmLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeclarationModal;
