import React from "react";
import { FiChevronDown, FiX } from "react-icons/fi";
import { snakeToCapitalCase } from "../../utils/convertCase";

const DropdownFilter = ({ options, value, onChange, onClear }) => {
    console.log("Selected Value:", value);
    console.log("Options:", options);
    console.log("Matching Option:", options.items.find((opt) => opt.value === value));
    
    return (
        <div className="relative">
            <select
                className={`rounded-md px-3 py-0 pr-12 h-10 border focus:border-blue-400  focus:outline-0 appearance-none ${value ? '  border-blue-400 bg-blue-100': 'bg-white border border-gray-300'}`}
                value={value}
                onChange={onChange}
            >
                <option value="">All {options.label}</option>
                {options.items.map((item) => (
                    <option key={item.value} value={item.value}>
                        { snakeToCapitalCase( item.label)}
                    </option>
                ))}
            </select>
            {value && (
                <button
                    className="absolute right-8 top-[0] h-10 w-4 text-blue-500 text-lg focus:outline-0 flex items-center"
                    onClick={onClear}
                >
                    <FiX />
                </button>
            )}
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
    <FiChevronDown/>
  </div>
        </div>
    );
};

export default DropdownFilter;
