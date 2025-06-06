import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const months = [...Array(12)].map((_, i) => ({
  value: i + 1,
  label: new Date(0, i).toLocaleString('default', { month: 'long' }),
}));

const Filters = ({ filters, setFilters }) => {
  const handleMonthChange = (direction) => {
    let current = parseInt(filters.month) || new Date().getMonth() + 1;
    let newMonth = current + direction;
    if (newMonth > 12) newMonth = 1;
    if (newMonth < 1) newMonth = 12;
    setFilters({ ...filters, month: newMonth });
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        type="button"
        onClick={() => handleMonthChange(-1)}
        className="p-2 border rounded"
      >
        <ChevronLeft size={16} />
      </button>

      <select
        value={filters.month || ''}
        onChange={(e) =>
          setFilters({ ...filters, month: parseInt(e.target.value) })
        }
        className="border p-2 rounded"
      >
        <option value="">Month</option>
        {months.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => handleMonthChange(1)}
        className="p-2 border rounded"
      >
        <ChevronRight size={16} />
      </button>

      {/* Year Dropdown */}
      <select
        value={filters.year || ''}
        onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
        className="border p-2 rounded"
      >
        <option value="">Year</option>
        {Array.from({ length: 10 }, (_, i) => {
          const year = new Date().getFullYear() - i;
          return (
            <option key={year} value={year}>
              {year}
            </option>
          );
        })}
      </select>

      {/* Status Filter */}
      <select
        value={filters.status || ''}
        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        className="border p-2 rounded"
      >
        <option value="">Status</option>
        <option value="Pending">Pending</option>
        <option value="Partially Paid">Partially Paid</option>
        <option value="Paid">Paid</option>
      </select>
    </div>
  );
};

export default Filters;
