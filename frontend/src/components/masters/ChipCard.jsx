import React, { useState } from "react";
import { FiPlus, FiX } from "react-icons/fi";
import Button from "../common/Button";

const labelStyle = "py-2 px-4 rounded-md border flex gap-3 items-center bg-white border-gray-300";

// One masters card: title on the left, chips on the right.
// Pass onAdd / onRemove only when the user is allowed to edit.
// canRemove(item) can hide the remove cross for single items (e.g. English).
const ChipCard = ({ title, items = [], onAdd, onRemove, canRemove, addPlaceholder = "Enter new value", emptyText = "No values yet.", busy = false }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [value, setValue] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    const v = value.trim();
    if (!v || !onAdd) return;
    const ok = await onAdd(v);
    if (ok !== false) {
      setValue("");
      setIsAdding(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-6 p-8 bg-white border border-blue-300/60 rounded-xl shadow-md sm:items-center sm:justify-between">
      <h2 className="font-semibold text-lg min-w-1/5">{title}</h2>
      <div className="flex flex-col gap-3 sm:flex-row justify-between sm:items-center w-full">
        <div className="flex gap-4 flex-wrap">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item} className={labelStyle}>
                <span>{item}</span>
                {onRemove && (!canRemove || canRemove(item)) && (
                  <button
                    type="button"
                    title={`Remove ${item}`}
                    aria-label={`Remove ${item}`}
                    disabled={busy}
                    onClick={() => onRemove(item)}
                    className="cursor-pointer text-gray-500 hover:text-red-500"
                  >
                    <FiX />
                  </button>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500">{emptyText}</p>
          )}
        </div>

        {onAdd && (
          <div className="flex items-start justify-center gap-3">
            {!isAdding ? (
              <div className="w-12">
                <Button onClick={() => setIsAdding(true)}><FiPlus /></Button>
              </div>
            ) : (
              <form onSubmit={submit} className="flex gap-2 items-start justify-start">
                <input
                  type="text"
                  autoFocus
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={addPlaceholder}
                  className="border border-gray-300 px-4 py-2 rounded-md"
                />
                <button type="submit" disabled={busy} className="bg-red-500 text-white px-4 py-2 rounded-md cursor-pointer">
                  Add
                </button>
                <button
                  type="button"
                  className="bg-white border border-gray-400 text-gray-800 px-4 py-2 rounded-md cursor-pointer"
                  onClick={() => { setIsAdding(false); setValue(""); }}
                ><FiX /></button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChipCard;
