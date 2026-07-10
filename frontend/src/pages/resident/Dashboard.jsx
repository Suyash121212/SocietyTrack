import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { axiosInstance } from '../../api/axios.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import PriorityBadge from '../../components/PriorityBadge.jsx';

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
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">My Complaints</h1>
          <Link
            to="/complaints/new"
            className="bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Raise Complaint
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-danger text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl h-20 shadow-sm" />
            ))}
          </div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-20 text-neutral">
            <p className="text-lg font-medium">No complaints yet.</p>
            <p className="text-sm mt-1">
              <Link to="/complaints/new" className="text-primary hover:underline">
                Raise your first complaint
              </Link>
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {complaints.map((c) => (
              <Link
                key={c.id}
                to={`/complaints/${c.id}`}
                className="block bg-white rounded-xl shadow-sm px-5 py-4 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-800 capitalize">
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
    </div>
  );
}
