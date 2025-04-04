import React from "react";

const MultiSelect = ({ options, selected, onChange }) => {
  const toggleSelection = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter(item => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="relative w-60">
      <div className="w-full border border-gray-300 rounded-md px-2 py-2 bg-white focus:outline-none">

      <select
        className="focus:outline-0 w-full"
        onChange={(e) => toggleSelection(e.target.value)}
        value=""
      >
        <option value="" disabled>Select Language</option>
        {options
          .filter(opt => !selected.includes(opt.value))
          .map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
      </select>
      </div>

      {/* Selected Tags */}
      {selected.length > 0 && (
        <div className="absolute z-10 top-full mt-0  bg-white border border-gray-200 rounded-md p-2 flex  gap-2">
          {selected.map((lang) => (
            <span
              key={lang}
              className="bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center text-sm"
            >
              {lang}
              <button
                onClick={() => toggleSelection(lang)}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
