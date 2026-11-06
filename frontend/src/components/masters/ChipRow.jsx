import React, { useState } from "react";
import { FiPlus, FiX } from "react-icons/fi";
import Button from "../common/Button";

const chipStyle = "py-2 px-4 rounded-md border flex gap-3 items-center";
const defaultStyle = "bg-white border-gray-300";
const selectedStyle = "bg-red-500 text-white border-red-500";

// One masters card: label on the left, chips on the right (ported from the prototype's ChipRow,
// styled like MasterDataPage). Leave out onAdd / onRemove for read-only users.
//  - items: string[]
//  - selected / onSelect: highlight a chip and make chips clickable
//  - onRemove(name), canRemove(name): show the ✕ (canRemove can hide it for single items)
//  - onAdd(name): may return false to keep the add form open (e.g. on a validation error)
//  - addOptions: when given, Add picks from this list instead of typing
const ChipRow = ({
  label,
  items = [],
  selected,
  onSelect,
  onRemove,
  canRemove,
  onAdd,
  addOptions,
  placeholder = "Add new",
  empty = "Nothing here yet.",
  busy = false,
  children,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [value, setValue] = useState("");

  const close = () => {
    setIsAdding(false);
    setValue("");
  };

  const submit = async (e) => {
    e.preventDefault();
    const v = value.trim();
    if (!v || !onAdd) return;
    const ok = await onAdd(v);
    if (ok !== false) close();
  };

  return (
    <div className="flex flex-col gap-4 p-8 bg-white border border-blue-300/60 rounded-xl shadow-md">
      <div className="flex flex-col sm:flex-row gap-6 sm:items-center sm:justify-between">
        <h2 className="font-semibold text-lg min-w-1/5">{label}</h2>
        <div className="flex flex-col gap-3 sm:flex-row justify-between sm:items-center w-full">
          <div className="flex gap-4 flex-wrap">
            {items.length > 0 ? (
              items.map((item) => (
                <div key={item} className={`${chipStyle} ${item === selected ? selectedStyle : defaultStyle}`}>
                  {onSelect ? (
                    <button type="button" className="cursor-pointer" onClick={() => onSelect(item)}>
                      {item}
                    </button>
                  ) : (
                    <span>{item}</span>
                  )}
                  {onRemove && (!canRemove || canRemove(item)) && (
                    <button
                      type="button"
                      title={`Remove ${item}`}
                      aria-label={`Remove ${item}`}
                      disabled={busy}
                      onClick={() => onRemove(item)}
                      className={`cursor-pointer ${item === selected ? "text-white" : "text-gray-500 hover:text-red-500"}`}
                    >
                      <FiX />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500">{empty}</p>
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
                  {addOptions ? (
                    <select
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      disabled={!addOptions.length}
                      className="border border-gray-300 px-4 py-2 rounded-md bg-white"
                    >
                      <option value="">{addOptions.length ? placeholder : "All added"}</option>
                      {addOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type="text"
                      autoFocus
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder={placeholder}
                      className="border border-gray-300 px-4 py-2 rounded-md"
                    />
                  )}
                  <button
                    type="submit"
                    disabled={busy || !value.trim()}
                    className="bg-red-500 text-white px-4 py-2 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    className="bg-white border border-gray-400 text-gray-800 px-4 py-2 rounded-md cursor-pointer"
                    onClick={close}
                  ><FiX /></button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
};

export default ChipRow;
