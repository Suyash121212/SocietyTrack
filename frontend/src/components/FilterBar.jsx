import { useState } from 'react';

const STATUSES   = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];
const CATEGORIES = ['ELECTRICAL', 'PLUMBING', 'SECURITY', 'CLEANING', 'OTHER'];

export default function FilterBar({ onChange }) {
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    date_from: '',
    date_to: '',
  });

  const handleChange = (e) => {
    const updated = { ...filters, [e.target.name]: e.target.value };
    setFilters(updated);
    onChange(updated);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm px-5 py-4 flex flex-wrap gap-4 items-end">
      <div>
        <label className="block text-xs font-medium text-neutral mb-1">Status</label>
        <select
          name="status"
          value={filters.status}
          onChange={handleChange}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-neutral mb-1">Category</label>
        <select
          name="category"
          value={filters.category}
          onChange={handleChange}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-neutral mb-1">From</label>
        <input
          type="date"
          name="date_from"
          value={filters.date_from}
          onChange={handleChange}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-neutral mb-1">To</label>
        <input
          type="date"
          name="date_to"
          value={filters.date_to}
          onChange={handleChange}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
    </div>
  );
}
