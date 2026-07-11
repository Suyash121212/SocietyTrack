import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, AlertCircle, Inbox, Calendar, ArrowUpDown, X } from 'lucide-react';
import { axiosInstance } from '../../api/axios.js';
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

const formatLabel = (value) =>
  value ? value.toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()) : value;

// Resident dashboard showing their submitted complaints
export default function ResidentDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('newest');

  useEffect(() => {
    axiosInstance
      .get('/complaints/my')
      .then(({ data }) => setComplaints(data))
      .catch(() => setError('Failed to load complaints.'))
      .finally(() => setLoading(false));
  }, []);

  const statusOptions = useMemo(
    () => ['ALL', ...new Set(complaints.map((c) => c.status).filter(Boolean))],
    [complaints]
  );

  const visibleComplaints = useMemo(() => {
    let list = [...complaints];
    if (statusFilter !== 'ALL') list = list.filter((c) => c.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) => c.category?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const diff = new Date(a.createdAt) - new Date(b.createdAt);
      return sortOrder === 'newest' ? -diff : diff;
    });
    return list;
  }, [complaints, search, statusFilter, sortOrder]);

  const hasActiveFilters = search.trim() !== '' || statusFilter !== 'ALL';
  const clearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
  };

  return (
    <Layout>
      <div className="mx-auto max-w-3xl p-6 font-['Inter'] text-[var(--ink)] md:p-8" style={TOKENS}>
        {/* Page header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[var(--ink)]">My Complaints</h1>
            <p className="mt-0.5 text-sm text-[var(--ink-2)]">Track the status of your maintenance requests</p>
          </div>
          <Link
            to="/complaints/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.25} />
            New complaint
          </Link>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
            <span>{error}</span>
          </div>
        )}

        {/* Search + filter bar — only worth showing once there's something to filter */}
        {!loading && complaints.length > 0 && (
          <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-3)]" strokeWidth={1.75} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by category or description"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2.5 pl-9 pr-3 text-sm text-[var(--ink)] placeholder-[var(--ink-3)] transition-all focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
              />
            </div>

            <div className="flex gap-2.5">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--ink)] transition-all focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s === 'ALL' ? 'All statuses' : formatLabel(s)}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setSortOrder((o) => (o === 'newest' ? 'oldest' : 'newest'))}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--ink-2)] transition-colors hover:bg-[var(--bg)]"
                title="Toggle sort order"
              >
                <ArrowUpDown className="h-3.5 w-3.5" strokeWidth={1.75} />
                {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4">
                <div className="mb-2.5 h-3.5 w-32 rounded bg-[var(--bg)]" />
                <div className="h-3 w-56 rounded bg-[var(--bg)]" />
              </div>
            ))}
          </div>
        ) : complaints.length === 0 ? (
          /* True empty state — nothing has ever been submitted */
          <div className="rounded-2xl border border-dashed border-[var(--border)] py-20 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-soft)]">
              <Inbox className="h-5 w-5 text-[var(--accent)]" strokeWidth={1.75} />
            </div>
            <p className="font-medium text-[var(--ink)]">No complaints yet</p>
            <p className="mx-auto mt-1 max-w-xs text-sm text-[var(--ink-2)]">
              Raise a maintenance request and track it here from submission to resolution.
            </p>
            <Link
              to="/complaints/new"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
            >
              <Plus className="h-4 w-4" strokeWidth={2.25} />
              Raise your first complaint
            </Link>
          </div>
        ) : visibleComplaints.length === 0 ? (
          /* Filters/search matched nothing */
          <div className="rounded-2xl border border-dashed border-[var(--border)] py-16 text-center">
            <p className="text-sm font-medium text-[var(--ink)]">No complaints match your filters</p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] hover:underline"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} />
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {hasActiveFilters && (
              <p className="text-xs text-[var(--ink-3)]">
                Showing {visibleComplaints.length} of {complaints.length}
              </p>
            )}
            {visibleComplaints.map((c) => (
              <Link
                key={c.id}
                to={`/complaints/${c.id}`}
                className="flex items-start gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-4 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/30 hover:shadow-md"
              >
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-xs font-bold text-[var(--accent)]">
                  {c.category?.charAt(0)?.toUpperCase() || '?'}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold capitalize text-[var(--ink)]">
                      {c.category?.toLowerCase()}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {c.isOverdue && (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                          Overdue
                        </span>
                      )}
                      <StatusBadge status={c.status} />
                      <PriorityBadge priority={c.priority} />
                    </div>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-[var(--ink-2)]">{c.description}</p>
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-[var(--ink-3)]">
                    <Calendar className="h-3 w-3" strokeWidth={1.75} />
                    {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}