import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Inbox, AlertTriangle, ListFilter, Search, X, RefreshCw } from 'lucide-react';
import { axiosInstance } from '../../api/axios.js';
import FilterBar from '../../components/FilterBar.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import PriorityBadge from '../../components/PriorityBadge.jsx';
import Layout from '../../components/Layout.jsx';

const TOKENS = {
  '--bg': '#FAFAFA',
  '--surface': '#FFFFFF',
  '--border': '#E8EAED',
  '--ink': '#111318',
  '--ink-2': '#667085',
  '--ink-3': '#98A2B3',
  '--accent': '#3652E0',
  '--accent-hover': '#2A41B8',
  '--accent-soft': '#EEF1FE',
};

const tableContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.035, delayChildren: 0.05 } },
};

const rowVariant = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
};

export default function AllComplaints() {
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  const fetchComplaints = useCallback((filters = {}, q = '') => {
    // Cancel whatever request is still in flight so a slow, older response
    // can never land after a newer one and overwrite it with stale data.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError('');

    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.category) params.category = filters.category;
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;
    if (q.trim()) params.q = q.trim();

    axiosInstance
      .get('/admin/complaints', { params, signal: controller.signal })
      .then(({ data }) => setComplaints(data))
      .catch((err) => {
        if (axios.isCancel(err) || err.code === 'ERR_CANCELED') return; // we cancelled it on purpose
        setError('Failed to load complaints. Check your connection and try again.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchComplaints({}, '');
    return () => {
      clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, [fetchComplaints]);

  const handleFilterChange = (newFilters) => {
    // A filter change should win over any search debounce still waiting to
    // fire with the previous filters — otherwise the stale one can land
    // after this one and silently undo the filter.
    clearTimeout(debounceRef.current);
    setActiveFilters(newFilters);
    fetchComplaints(newFilters, searchInput);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchComplaints(activeFilters, val);
    }, 300);
  };

  const clearSearch = () => {
    setSearchInput('');
    clearTimeout(debounceRef.current);
    fetchComplaints(activeFilters, '');
  };

  const retry = () => fetchComplaints(activeFilters, searchInput);

  return (
    <Layout>
      <div className="mx-auto max-w-6xl p-6 font-['Inter'] text-[var(--ink)] md:p-8" style={TOKENS}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-tight text-[var(--ink)]">
              All Complaints
            </h1>
            <p className="mt-1 text-sm text-[var(--ink-2)]">Manage and track all society complaints</p>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative mb-4">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--ink-3)]">
            <Search size={15} strokeWidth={2} />
          </div>
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search by description, flat number, or category…"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-10 pr-10 text-sm text-[var(--ink)] placeholder-[var(--ink-3)] shadow-sm transition-all focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
          />
          {searchInput && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[var(--ink-3)] transition-colors hover:text-[var(--ink-2)]"
              aria-label="Clear search"
            >
              <X size={14} strokeWidth={2} />
            </button>
          )}
        </div>

        <FilterBar onChange={handleFilterChange} />

        <div
          className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm"
        >
          <AnimatePresence mode="wait">
            {error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center px-6 py-20 text-center"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                  <AlertTriangle size={22} strokeWidth={1.75} />
                </div>
                <p className="font-semibold text-[var(--ink)]">Couldn&apos;t load complaints</p>
                <p className="mt-1 max-w-xs text-sm text-[var(--ink-2)]">{error}</p>
                <button
                  type="button"
                  onClick={retry}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
                >
                  <RefreshCw size={14} strokeWidth={2} />
                  Try again
                </button>
              </motion.div>
            ) : loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2.5 p-5">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-11 animate-pulse rounded-lg bg-[var(--bg)]"
                    style={{ animationDelay: `${i * 60}ms` }}
                  />
                ))}
              </motion.div>
            ) : complaints.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="flex flex-col items-center justify-center px-6 py-20 text-center"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Inbox size={24} strokeWidth={1.75} />
                </div>
                <p className="font-semibold text-[var(--ink)]">No complaints match the current filters</p>
                <p className="mt-1 text-sm text-[var(--ink-3)]">
                  {searchInput ? `No results for "${searchInput}"` : 'Try adjusting your filters'}
                </p>
              </motion.div>
            ) : (
              <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--bg)] px-5 py-3">
                  <ListFilter size={13} className="text-[var(--ink-3)]" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-[var(--ink-2)]">Results</span>
                  <motion.span
                    key={complaints.length}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-bold tabular-nums text-[var(--accent)]"
                  >
                    {complaints.length}
                  </motion.span>
                  {searchInput && (
                    <span className="ml-1 text-xs text-[var(--ink-3)]">
                      for <span className="font-medium text-[var(--ink-2)]">&quot;{searchInput}&quot;</span>
                    </span>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-[var(--border)] bg-[var(--bg)]">
                      <tr>
                        {['Flat No', 'Category', 'Status', 'Priority', 'Overdue', 'Raised On'].map((h) => (
                          <th
                            key={h}
                            className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-[var(--ink-3)]"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <motion.tbody
                      variants={tableContainer}
                      initial="hidden"
                      animate="show"
                      className="divide-y divide-[var(--bg)]"
                    >
                      {complaints.map((c) => (
                        <motion.tr
                          key={c.id}
                          variants={rowVariant}
                          whileHover={{
                            backgroundColor: c.isOverdue ? 'rgba(254,242,242,0.9)' : 'rgba(238,241,254,0.6)',
                          }}
                          onClick={() => navigate(`/admin/complaints/${c.id}`)}
                          className={`cursor-pointer transition-colors ${c.isOverdue ? 'bg-red-50/40' : ''}`}
                        >
                          <td className="px-5 py-3.5 font-semibold text-[var(--ink)]">{c.flatNo ?? '—'}</td>
                          <td className="px-5 py-3.5 capitalize text-[var(--ink-2)]">{c.category.toLowerCase()}</td>
                          <td className="px-5 py-3.5">
                            <StatusBadge status={c.status} />
                          </td>
                          <td className="px-5 py-3.5">
                            <PriorityBadge priority={c.priority} />
                          </td>
                          <td className="px-5 py-3.5">
                            {c.isOverdue && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                                <AlertTriangle size={11} strokeWidth={2.5} />
                                Overdue
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-[var(--ink-3)]">
                            {new Date(c.createdAt).toLocaleDateString()}
                          </td>
                        </motion.tr>
                      ))}
                    </motion.tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}