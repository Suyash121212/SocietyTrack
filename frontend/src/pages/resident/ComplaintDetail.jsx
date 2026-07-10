import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { axiosInstance } from '../../api/axios.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import PriorityBadge from '../../components/PriorityBadge.jsx';
import StatusTimeline from '../../components/StatusTimeline.jsx';
import Layout from '../../components/Layout.jsx';

// Detail view for a single resident complaint with full status history
export default function ComplaintDetail() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  useEffect(() => {
    axiosInstance.get(`/complaints/${id}`)
      .then(({ data }) => setComplaint(data))
      .catch(() => setError('Failed to load complaint.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-xl h-16 border border-gray-100" />
          ))}
        </div>
      </Layout>
    );
  }

  if (error || !complaint) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-danger">{error || 'Complaint not found.'}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Complaint Detail</h1>
            <p className="text-sm text-neutral mt-0.5 capitalize">{complaint.category.toLowerCase()} · {new Date(complaint.createdAt).toLocaleDateString()}</p>
          </div>
          <Link to="/complaints" className="text-sm text-primary hover:underline">
            ← Back
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
            {complaint.isOverdue && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-danger">
                Overdue
              </span>
            )}
          </div>

          {/* Category */}
          <div>
            <p className="text-xs text-neutral uppercase tracking-wide font-medium">Category</p>
            <p className="text-gray-800 mt-0.5 capitalize">{complaint.category.toLowerCase()}</p>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs text-neutral uppercase tracking-wide font-medium">Description</p>
            <p className="text-gray-700 mt-0.5 text-sm leading-relaxed">{complaint.description}</p>
          </div>

          {/* Photo */}
          {complaint.photoUrl && (
            <div>
              <p className="text-xs text-neutral uppercase tracking-wide font-medium mb-2">Photo</p>
              <img
                src={complaint.photoUrl}
                alt="Complaint photo"
                className="rounded-xl max-h-64 object-cover border border-gray-200"
              />
            </div>
          )}

          {/* Dates grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-neutral uppercase tracking-wide font-medium">Raised on</p>
              <p className="text-gray-700 mt-0.5">{new Date(complaint.createdAt).toLocaleString()}</p>
            </div>
            {complaint.resolvedAt && (
              <div>
                <p className="text-xs text-neutral uppercase tracking-wide font-medium">Resolved on</p>
                <p className="text-gray-700 mt-0.5">{new Date(complaint.resolvedAt).toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* Status history */}
          <div>
            <p className="text-xs text-neutral uppercase tracking-wide font-medium mb-3">Status History</p>
            <StatusTimeline history={complaint.statusHistory} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
