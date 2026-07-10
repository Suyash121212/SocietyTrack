import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { axiosInstance } from '../../api/axios.js';
import FilterBar from '../../components/FilterBar.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import PriorityBadge from '../../components/PriorityBadge.jsx';

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
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">All Complaints</h1>
          <Link to="/admin/dashboard" className="text-sm text-primary hover:underline">
            ← Dashboard
          </Link>
        </div>

        <FilterBar onChange={fetchComplaints} />

        {error && (
          <div className="bg-red-50 border border-red-200 text-danger text-sm rounded-lg px-4 py-3 mt-4">
            {error}
          </div>
        )}

        <div className="mt-4 bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="space-y-2 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse bg-gray-100 rounded h-10" />
              ))}
            </div>
          ) : complaints.length === 0 ? (
            <p className="text-center text-neutral py-16 text-sm">
              No complaints match the current filters.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Flat No', 'Category', 'Status', 'Priority', 'Overdue', 'Raised On'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-neutral uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {complaints.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/admin/complaints/${c.id}`)}
                    className={`hover:bg-gray-50 transition cursor-pointer ${c.isOverdue ? 'bg-red-50' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-800">{c.flatNo ?? '—'}</td>
                    <td className="px-4 py-3 capitalize text-gray-700">{c.category.toLowerCase()}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3"><PriorityBadge priority={c.priority} /></td>
                    <td className="px-4 py-3">
                      {c.isOverdue && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-danger">
                          Overdue
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
