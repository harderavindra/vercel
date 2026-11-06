import React, { useState } from "react";
import { FiX } from "react-icons/fi";

// Inline "Rename X to [ ] Save ✕" form, shown inside a ChipRow.
// onSave(newName) may return false to keep the form open (e.g. on an error).
const RenameForm = ({ current, onSave, onCancel, busy = false }) => {
  const [value, setValue] = useState(current);
  const trimmed = value.trim();

  const submit = async (e) => {
    e.preventDefault();
    if (!trimmed || trimmed === current) return;
    await onSave(trimmed);
  };

  return (
    <form onSubmit={submit} className="flex flex-wrap gap-2 items-center border-t border-gray-200 pt-4">
      <span className="text-gray-600">Rename <b>{current}</b> to</span>
      <input
        type="text"
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="border border-gray-300 px-4 py-2 rounded-md"
      />
      <button
        type="submit"
        disabled={busy || !trimmed || trimmed === current}
        className="bg-red-500 text-white px-4 py-2 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Save
      </button>
      <button
        type="button"
        className="bg-white border border-gray-400 text-gray-800 px-4 py-2 rounded-md cursor-pointer"
        onClick={onCancel}
      ><FiX /></button>
    </form>
  );
};

export default RenameForm;
