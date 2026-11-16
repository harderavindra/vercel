import React, { useState } from "react";
import Button from "../common/Button";

// Tick the HP segments a model comes in (from Settings → HP Segments).
// None ticked = not set: the offer form then offers every HP segment for this model.
const ModelHpForm = ({ modelName, current = [], options = [], busy, onSave }) => {
  const [picked, setPicked] = useState(current);
  const changed = picked.length !== current.length || picked.some((v) => !current.includes(v));
  const toggle = (v) => setPicked((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));

  return (
    <div className="flex flex-col gap-3">
      <span>HP segments for <strong>{modelName}</strong></span>
      {options.length === 0 ? (
        <p className="text-gray-500 text-sm">No HP segments yet. Add them in Masters → Settings first.</p>
      ) : (
        <div className="flex flex-wrap gap-2" role="group" aria-label={`HP segments for ${modelName}`}>
          {options.map((v) => {
            const on = picked.includes(v);
            return (
              <button
                key={v}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(v)}
                className={`px-4 py-2 rounded-md border cursor-pointer ${on ? "bg-red-500 border-red-500 text-white" : "bg-white border-gray-300 hover:border-red-400"}`}
              >
                {v}
              </button>
            );
          })}
        </div>
      )}
      <div className="flex items-center gap-3">
        <Button width="auto" disabled={busy || !changed} onClick={() => onSave(picked)}>Save HP segments</Button>
        <span className="text-gray-500 text-sm">
          {picked.length ? `${picked.length} selected` : "None selected: the offer form shows every HP segment for this model."}
        </span>
      </div>
    </div>
  );
};

export default ModelHpForm;
