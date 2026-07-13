import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Inbox, Calendar, ArrowUpDown, X, Loader2, AlertCircle } from 'lucide-react';
import { axiosInstance } from '../../api/axios.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import PriorityBadge from '../../components/PriorityBadge.jsx';
import Layout from '../../components/Layout.jsx';

const fmt = v => v ? v.toLowerCase().replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()) : v;

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const fadeUp  = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } } };

export default function ResidentDashboard() {
  const [complaints,  setComplaints]  = useState([]);
  const [nextCursor,  setNextCursor]  = useState(null);
  const [hasMore,     setHasMore]     = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error,       setError]       = useState('');
  const [search,      setSearch]      = useState('');
  const [statusFilter,setStatusFilter]= useState('ALL');
  const [sortOrder,   setSortOrder]   = useState('newest');

  const fetchPage = useCallback((cursor = null) => {
    if (!cursor) setLoading(true); else setLoadingMore(true);
    axiosInstance.get('/complaints/my', { params: { limit: 20, ...(cursor ? { cursor } : {}) } })
      .then(({ data: r }) => {
        setComplaints(prev => cursor ? [...prev, ...r.data] : r.data);
        setNextCursor(r.nextCursor);
        setHasMore(r.hasMore);
      })
      .catch(() => setError('Failed to load complaints.'))
      .finally(() => { setLoading(false); setLoadingMore(false); });
  }, []);

  useEffect(() => { fetchPage(); }, [fetchPage]);

  const statusOptions = useMemo(
    () => ['ALL', ...new Set(complaints.map(c => c.status).filter(Boolean))],
    [complaints]
  );

  const visible = useMemo(() => {
    let list = [...complaints];
    if (statusFilter !== 'ALL') list = list.filter(c => c.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c => c.category?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      const d = new Date(a.createdAt) - new Date(b.createdAt);
      return sortOrder === 'newest' ? -d : d;
    });
    return list;
  }, [complaints, search, statusFilter, sortOrder]);

  const hasFilters = search.trim() !== '' || statusFilter !== 'ALL';

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-3xl mx-auto">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">My Complaints</h1>
            <p className="page-subtitle">Track your maintenance requests</p>
          </div>
          <Link to="/complaints/new" className="btn-primary">
            <Plus size={15} strokeWidth={2.5} />
            New Complaint
          </Link>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-5">
            <AlertCircle size={15} strokeWidth={2} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Filters — only show when there's data */}
        {!loading && complaints.length > 0 && (
          <div className="mb-5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search size={14} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by category or description"
                className="input input-icon"
              />
            </div>
            <div className="flex gap-2">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input max-w-[160px]">
                {statusOptions.map(s => (
                  <option key={s} value={s}>{s === 'ALL' ? 'All statuses' : fmt(s)}</option>
                ))}
              </select>
              <button
                onClick={() => setSortOrder(o => o === 'newest' ? 'oldest' : 'newest')}
                className="btn-secondary gap-1.5 whitespace-nowrap"
                title="Toggle sort order"
              >
                <ArrowUpDown size={13} strokeWidth={1.75} />
                {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
              </button>
            </div>
          </div>
        )}

        {/* States */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-2xl" style={{ animationDelay: `${i * 60}ms` }} />
            ))}
          </div>
        ) : complaints.length === 0 ? (
          <div className="card flex flex-col items-center justify-center text-center py-20 px-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 mb-4">
              <Inbox size={22} className="text-brand-400" strokeWidth={1.75} />
            </div>
            <p className="font-semibold text-ink">No complaints yet</p>
            <p className="text-sm text-ink-faint mt-1 max-w-xs">Raise a maintenance request and track it from submission to resolution.</p>
            <Link to="/complaints/new" className="btn-primary btn-sm mt-5">
              <Plus size={13} strokeWidth={2.5} /> Raise your first complaint
            </Link>
          </div>
        ) : visible.length === 0 ? (
          <div className="card flex flex-col items-center justify-center text-center py-16 px-6">
            <p className="text-sm font-medium text-ink">No complaints match your filters</p>
            <button onClick={() => { setSearch(''); setStatusFilter('ALL'); }} className="btn-ghost btn-sm mt-3">
              <X size={12} strokeWidth={2} /> Clear filters
            </button>
          </div>
        ) : (
          <>
            {hasFilters && (
              <p className="text-xs text-ink-faint mb-3">
                Showing {visible.length} of {complaints.length}{hasMore ? '+' : ''}
              </p>
            )}

            <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-2.5">
              <AnimatePresence initial={false}>
                {visible.map(c => (
                  <motion.div key={c.id} variants={fadeUp} layout>
                    <Link
                      to={`/complaints/${c.id}`}
                      className="card-hover flex items-center gap-4 px-5 py-4 group"
                    >
                      {/* Category icon */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 border border-brand-100 text-sm font-bold text-brand-600">
                        {c.category?.charAt(0)?.toUpperCase() || '?'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold capitalize text-ink">
                            {c.category?.toLowerCase()}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {c.isOverdue && (
                              <span className="badge bg-red-50 text-red-700 border-red-200">Overdue</span>
                            )}
                            <StatusBadge status={c.status} />
                            <PriorityBadge priority={c.priority} />
                          </div>
                        </div>
                        <p className="mt-0.5 text-xs text-ink-muted truncate">{c.description}</p>
                        <p className="mt-1.5 flex items-center gap-1 text-xs text-ink-faint">
                          <Calendar size={11} strokeWidth={1.75} />
                          {new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Load more — only when no filter active */}
            {hasMore && !hasFilters && (
              <button
                onClick={() => fetchPage(nextCursor)}
                disabled={loadingMore}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-surface-200 py-4 text-sm text-ink-faint hover:border-brand-300 hover:text-ink-muted transition-colors disabled:opacity-60"
              >
                {loadingMore
                  ? <><Loader2 size={14} className="animate-spin" strokeWidth={2} /> Loading…</>
                  : 'Load more complaints'}
              </button>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
