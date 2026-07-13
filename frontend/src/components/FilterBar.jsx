import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

const STATUSES   = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'REOPENED'];
const CATEGORIES = ['ELECTRICAL', 'PLUMBING', 'SECURITY', 'CLEANING', 'OTHER'];

const fmt = (s) => s.replace('_', ' ').charAt(0) + s.replace('_', ' ').slice(1).toLowerCase();

export default function FilterBar({ onChange }) {
  const EMPTY = { status: '', category: '', date_from: '', date_to: '' };
  const [filters, setFilters] = useState(EMPTY);

  const handleChange = (e) => {
    const updated = { ...filters, [e.target.name]: e.target.value };
    setFilters(updated);
    onChange(updated);
  };

  const hasActive = Object.values(filters).some(Boolean);

  const clearAll = () => {
    setFilters(EMPTY);
    onChange(EMPTY);
  };

  return (
    <div className="card px-4 py-3">
      <div className="flex items-center gap-2 mb-3">
        <SlidersHorizontal size={13} className="text-ink-faint" strokeWidth={2} />
        <span className="text-xs font-semibold text-ink-faint uppercase tracking-widest">Filters</span>
        {hasActive && (
          <button
            onClick={clearAll}
            className="ml-auto flex items-center gap-1 text-xs text-ink-muted hover:text-brand-600 transition-colors font-medium"
          >
            <X size={11} strokeWidth={2.5} />
            Clear
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2.5 items-end">
        {/* Status */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-ink-faint uppercase tracking-wide">Status</label>
          <select
            name="status"
            value={filters.status}
            onChange={handleChange}
            className="h-8 rounded-lg border border-surface-200 bg-surface-0 px-3 text-xs text-ink shadow-card focus:outline-none focus:border-brand-400 focus:shadow-input transition-all"
          >
            <option value="">All statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{fmt(s)}</option>)}
          </select>
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-ink-faint uppercase tracking-wide">Category</label>
          <select
            name="category"
            value={filters.category}
            onChange={handleChange}
            className="h-8 rounded-lg border border-surface-200 bg-surface-0 px-3 text-xs text-ink shadow-card focus:outline-none focus:border-brand-400 focus:shadow-input transition-all"
          >
            <option value="">All categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{fmt(c)}</option>)}
          </select>
        </div>

        {/* Date from */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-ink-faint uppercase tracking-wide">From</label>
          <input
            type="date"
            name="date_from"
            value={filters.date_from}
            onChange={handleChange}
            className="h-8 rounded-lg border border-surface-200 bg-surface-0 px-3 text-xs text-ink shadow-card focus:outline-none focus:border-brand-400 focus:shadow-input transition-all"
          />
        </div>

        {/* Date to */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-ink-faint uppercase tracking-wide">To</label>
          <input
            type="date"
            name="date_to"
            value={filters.date_to}
            onChange={handleChange}
            className="h-8 rounded-lg border border-surface-200 bg-surface-0 px-3 text-xs text-ink shadow-card focus:outline-none focus:border-brand-400 focus:shadow-input transition-all"
          />
        </div>
      </div>
    </div>
  );
}
