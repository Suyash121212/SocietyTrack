import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { axiosInstance } from '../../api/axios.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import PriorityBadge from '../../components/PriorityBadge.jsx';
import Layout from '../../components/Layout.jsx';

// Resident dashboard showing their submitted complaints
export default function ResidentDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');

  useEffect(() => {
    axiosInstance.get('/complaints/my')
      .then(({ data }) => setComplaints(data))
      .catch(() => setError('Failed to load complaints.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Complaints</h1>
            <p className="text-sm text-neutral mt-0.5">Track the status of your maintenance requests</p>
          </div>
          <Link to="/complaints/new" className="bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium">
            + New Complaint
          </Link>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            <span className="mt-0.5">⚠</span>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl h-20 border border-gray-100" />
            ))}
          </div>
        ) : complaints.length === 0 ? (
          /* Empty state with icon */
          <div className="text-center py-20">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-600 font-medium">No complaints yet</p>
            <Link to="/complaints/new" className="text-primary text-sm hover:underline mt-1 inline-block">Raise your first complaint →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {complaints.map((c) => (
              <Link
                key={c.id}
                to={`/complaints/${c.id}`}
                className="block bg-white rounded-xl border border-gray-100 px-5 py-4 hover:shadow-md hover:border-gray-200 transition-all"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-800 capitalize">
                      {c.category.toLowerCase()}
                    </p>
                    <p className="text-xs text-neutral mt-0.5 line-clamp-1">
                      {c.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {c.isOverdue && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-danger">
                        Overdue
                      </span>
                    )}
                    <StatusBadge status={c.status} />
                    <PriorityBadge priority={c.priority} />
                    <span className="text-xs text-neutral">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
