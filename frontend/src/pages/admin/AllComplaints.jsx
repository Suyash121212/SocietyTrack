import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, AlertTriangle, Inbox, RefreshCw, ListFilter } from 'lucide-react';
import { axiosInstance } from '../../api/axios.js';
import FilterBar from '../../components/FilterBar.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import PriorityBadge from '../../components/PriorityBadge.jsx';
import Layout from '../../components/Layout.jsx';

const URGENCY = [
  { min: 55, label: 'Critical', cls: 'bg-red-50 text-red-700 border-red-200' },
  { min: 40, label: 'High',     cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  { min: 20, label: 'Medium',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  { min: 0,  label: 'Low',      cls: 'bg-slate-50 text-slate-500 border-slate-200' },
];

const UrgencyPill = ({ score }) => {
  if (score == null) return null;
  const { label, cls } = URGENCY.find(u => score >= u.min) ?? URGENCY[3];
  return (
    <span className={`badge ${cls}`}>
      {label}
      <span className="opacity-50 ml-0.5">·{score}</span>
    </span>
  );
};

const rowVariant = {
  hidden: { opacity: 0, y: 6 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
};
const tableVariant = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.03, delayChildren: 0.05 } },
};

export default function AllComplaints() {
  const navigate = useNavigate();

  const [complaints,   setComplaints]   = useState([]);
  const [nextCursor,   setNextCursor]   = useState(null);
  const [hasMore,      setHasMore]      = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [error,        setError]        = useState('');
  const [searchInput,  setSearchInput]  = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const debounceRef = useRef(null);
  const abortRef    = useRef(null);

  const fetchComplaints = useCallback((filters = {}, q = '', cursor = null) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (!cursor) { setLoading(true); setComplaints([]); setNextCursor(null); setHasMore(false); }
    else setLoadingMore(true);
    setError('');

    const params = { limit: 20, ...filters };
    if (q.trim()) params.q = q.trim();
    if (cursor)   params.cursor = cursor;
    // remove empty filter values
    Object.keys(params).forEach(k => !params[k] && delete params[k]);

    axiosInstance.get('/admin/complaints', { params, signal: controller.signal })
      .then(({ data: r }) => {
        setComplaints(prev => cursor ? [...prev, ...r.data] : r.data);
        setNextCursor(r.nextCursor);
        setHasMore(r.hasMore);
      })
      .catch(err => {
        if (axios.isCancel(err) || err.code === 'ERR_CANCELED') return;
        setError('Failed to load complaints.');
      })
      .finally(() => { if (!controller.signal.aborted) { setLoading(false); setLoadingMore(false); } });
  }, []);

  useEffect(() => {
    fetchComplaints();
    return () => { clearTimeout(debounceRef.current); abortRef.current?.abort(); };
  }, [fetchComplaints]);

  const handleFilterChange = (f) => { clearTimeout(debounceRef.current); setActiveFilters(f); fetchComplaints(f, searchInput); };
  const handleSearch = (e) => {
    const val = e.target.value; setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchComplaints(activeFilters, val), 300);
  };
  const clearSearch = () => { setSearchInput(''); fetchComplaints(activeFilters, ''); };
  const loadMore    = () => { if (nextCursor && !loadingMore) fetchComplaints(activeFilters, searchInput, nextCursor); };

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-5">

        <div className="page-header">
          <div>
            <h1 className="page-title">All Complaints</h1>
            <p className="page-subtitle">Triage and manage every maintenance request</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={15} strokeWidth={2} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            type="text" value={searchInput} onChange={handleSearch}
            placeholder="Search by description, flat number, or category…"
            className="input input-icon pr-10"
          />
          {searchInput && (
            <button onClick={clearSearch} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-muted transition-colors" aria-label="Clear">
              <X size={14} strokeWidth={2} />
            </button>
          )}
        </div>

        <FilterBar onChange={handleFilterChange} />

        {/* Table */}
        <div className="card overflow-hidden">
          <AnimatePresence mode="wait">
            {error ? (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 px-6 text-center"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                  <AlertTriangle size={22} strokeWidth={1.75} />
                </div>
                <p className="font-semibold text-ink">Couldn&apos;t load complaints</p>
                <p className="mt-1 text-sm text-ink-muted">{error}</p>
                <button onClick={() => fetchComplaints(activeFilters, searchInput)} className="btn-primary btn-sm mt-4">
                  <RefreshCw size={13} strokeWidth={2} /> Try again
                </button>
              </motion.div>
            ) : loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-5 space-y-2.5">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="skeleton h-12 rounded-xl" style={{ animationDelay: `${i * 50}ms` }} />
                ))}
              </motion.div>
            ) : complaints.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 px-6 text-center"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                  <Inbox size={22} strokeWidth={1.75} />
                </div>
                <p className="font-semibold text-ink">No complaints match</p>
                <p className="mt-1 text-sm text-ink-faint">
                  {searchInput ? `No results for "${searchInput}"` : 'Try adjusting the filters'}
                </p>
              </motion.div>
            ) : (
              <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Header row */}
                <div className="flex items-center gap-2 border-b border-surface-200 bg-surface-50 px-5 py-3">
                  <ListFilter size={12} className="text-ink-faint" strokeWidth={2} />
                  <span className="text-xs font-semibold text-ink-faint uppercase tracking-widest">Results</span>
                  <motion.span key={complaints.length} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="badge bg-brand-50 text-brand-700 border-brand-200 ml-0.5">
                    {complaints.length}{hasMore ? '+' : ''}
                  </motion.span>
                  {searchInput && (
                    <span className="ml-1 text-xs text-ink-faint">
                      for <span className="font-medium text-ink-muted">"{searchInput}"</span>
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-surface-200 bg-surface-50">
                      <tr>
                        {['Urgency', 'Flat', 'Category', 'Status', 'Priority', 'Raised On'].map(h => (
                          <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-ink-faint uppercase tracking-widest whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <motion.tbody variants={tableVariant} initial="hidden" animate="show" className="divide-y divide-surface-100">
                      {complaints.map(c => (
                        <motion.tr
                          key={c.id}
                          variants={rowVariant}
                          onClick={() => navigate(`/admin/complaints/${c.id}`)}
                          className={`cursor-pointer transition-colors hover:bg-surface-50 ${c.isOverdue ? 'bg-red-50/30' : ''}`}
                          whileHover={{ backgroundColor: c.isOverdue ? 'rgba(254,242,242,0.7)' : 'rgba(248,250,252,1)' }}
                        >
                          <td className="px-5 py-3.5"><UrgencyPill score={c.urgencyScore} /></td>
                          <td className="px-5 py-3.5 font-semibold text-ink">{c.flatNo ?? '—'}</td>
                          <td className="px-5 py-3.5 capitalize text-ink-muted">{c.category.toLowerCase()}</td>
                          <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
                          <td className="px-5 py-3.5"><PriorityBadge priority={c.priority} /></td>
                          <td className="px-5 py-3.5 text-ink-faint tabular-nums whitespace-nowrap">
                            {new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                        </motion.tr>
                      ))}
                    </motion.tbody>
                  </table>
                </div>

                {/* Load more */}
                {hasMore && (
                  <div className="border-t border-surface-200 bg-surface-50 px-5 py-3 text-center">
                    <button onClick={loadMore} disabled={loadingMore} className="btn-ghost btn-sm">
                      {loadingMore ? <><RefreshCw size={13} className="animate-spin" strokeWidth={2} /> Loading…</> : 'Load more'}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}
