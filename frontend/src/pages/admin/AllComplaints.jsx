import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Inbox, AlertTriangle, ListFilter } from 'lucide-react';
import { axiosInstance } from '../../api/axios.js';
import FilterBar from '../../components/FilterBar.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import PriorityBadge from '../../components/PriorityBadge.jsx';
import Layout from '../../components/Layout.jsx';

/* ---------- motion presets ---------- */
const tableContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.035, delayChildren: 0.05 },
  },
};

const rowVariant = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
};

// Admin page listing all complaints with filtering and row navigation
export default function AllComplaints() {
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  const fetchComplaints = useCallback((activeFilters = {}) => {
    setLoading(true);
    setError('');

    const params = {};
    if (activeFilters.status)    params.status    = activeFilters.status;
    if (activeFilters.category)  params.category  = activeFilters.category;
    if (activeFilters.date_from) params.date_from = activeFilters.date_from;
    if (activeFilters.date_to)   params.date_to   = activeFilters.date_to;

    axiosInstance.get('/admin/complaints', { params })
      .then(({ data }) => setComplaints(data))
      .catch(() => setError('Failed to load complaints.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">All Complaints</h1>
            <p className="text-sm text-gray-500 mt-1">Manage and track all society complaints</p>
          </div>
        </div>

        <FilterBar onChange={fetchComplaints} />

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3 mt-4"
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="space-y-2.5 p-5">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-gray-100 rounded-lg h-11"
                  style={{ animationDelay: `${i * 60}ms` }}
                />
              ))}
            </div>
          ) : complaints.length === 0 ? (
            /* Empty state */
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex flex-col items-center justify-center text-center py-20 px-6"
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-400 flex items-center justify-center mb-4">
                <Inbox size={24} strokeWidth={1.75} />
              </div>
              <p className="text-gray-700 font-semibold">No complaints match the current filters</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your filters and search again</p>
            </motion.div>
          ) : (
            <>
              {/* Row count badge */}
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50/60">
                <ListFilter size={13} className="text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Results</span>
                <motion.span
                  key={complaints.length}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-indigo-50 text-indigo-600 text-xs font-bold px-2 py-0.5 rounded-full tabular-nums"
                >
                  {complaints.length}
                </motion.span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50/60 border-b border-gray-100">
                    <tr>
                      {['Flat No', 'Category', 'Status', 'Priority', 'Overdue', 'Raised On'].map((h) => (
                        <th
                          key={h}
                          className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest"
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
                    className="divide-y divide-gray-50"
                  >
                    {complaints.map((c) => (
                      <motion.tr
                        key={c.id}
                        variants={rowVariant}
                        whileHover={{ backgroundColor: c.isOverdue ? 'rgba(254,242,242,0.9)' : 'rgba(238,242,255,0.5)' }}
                        onClick={() => navigate(`/admin/complaints/${c.id}`)}
                        className={`cursor-pointer transition-colors ${c.isOverdue ? 'bg-red-50/40' : ''}`}
                      >
                        <td className="px-5 py-3.5 font-semibold text-gray-800">{c.flatNo ?? '—'}</td>
                        <td className="px-5 py-3.5 capitalize text-gray-600">{c.category.toLowerCase()}</td>
                        <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
                        <td className="px-5 py-3.5"><PriorityBadge priority={c.priority} /></td>
                        <td className="px-5 py-3.5">
                          {c.isOverdue && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                              <AlertTriangle size={11} strokeWidth={2.5} />
                              Overdue
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-gray-400">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </td>
                      </motion.tr>
                    ))}
                  </motion.tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}