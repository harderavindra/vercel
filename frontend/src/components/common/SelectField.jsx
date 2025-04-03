const SelectField = ({ label, name, value, onChange, options, className = "" }) => {
    return (
        <div className={`flex flex-col gap-1 w-full ${className || ''}`}>
            {label && <label className="font-medium">{label}</label>}
            <select
                className="border rounded-md border-gray-400 px-3 py-2 focus:border-blue-300 focus:outline-0"
                name={name}
                value={value}
                onChange={onChange}
            >
                <option value="">Select {label}</option>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default SelectField;
