import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { axiosInstance } from '../../api/axios.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import PriorityBadge from '../../components/PriorityBadge.jsx';
import StatusTimeline from '../../components/StatusTimeline.jsx';

const VALID_TRANSITIONS = {
  OPEN:        ['IN_PROGRESS', 'RESOLVED'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED:    [],
};

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

export default function ComplaintManage() {
  const { id } = useParams();

  const [complaint, setComplaint]         = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [statusForm, setStatusForm]       = useState({ status: '', note: '' });
  const [statusError, setStatusError]     = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [priorityLoading, setPriorityLoading] = useState(false);
  const [priorityError, setPriorityError]     = useState('');

  const fetchComplaint = useCallback(() => {
    setLoading(true);
    axiosInstance.get(`/complaints/${id}`)
      .then(({ data }) => {
        setComplaint(data);
        setStatusForm({ status: '', note: '' });
      })
      .catch(() => setError('Failed to load complaint.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchComplaint();
  }, [fetchComplaint]);

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setStatusError('');
    setStatusLoading(true);

    try {
      await axiosInstance.patch(`/admin/complaints/${id}/status`, statusForm);
      fetchComplaint();
    } catch (err) {
      setStatusError(err.response?.data?.error || 'Failed to update status.');
    } finally {
      setStatusLoading(false);
    }
  };

  const handlePriorityChange = async (e) => {
    const priority = e.target.value;
    if (!priority) return;
    setPriorityError('');
    setPriorityLoading(true);

    try {
      await axiosInstance.patch(`/admin/complaints/${id}/priority`, { priority });
      fetchComplaint();
    } catch (err) {
      setPriorityError(err.response?.data?.error || 'Failed to update priority.');
    } finally {
      setPriorityLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-xl h-16 shadow-sm" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-danger">{error || 'Complaint not found.'}</p>
      </div>
    );
  }

  const allowedTransitions = VALID_TRANSITIONS[complaint.status] ?? [];

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Manage Complaint</h1>
          <Link to="/admin/complaints" className="text-sm text-primary hover:underline">
            ← All Complaints
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
            {complaint.isOverdue && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-danger">
                Overdue
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-neutral uppercase tracking-wide font-medium">Category</p>
              <p className="text-gray-800 mt-0.5 capitalize">{complaint.category.toLowerCase()}</p>
            </div>
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

          <div>
            <p className="text-xs text-neutral uppercase tracking-wide font-medium">Description</p>
            <p className="text-gray-700 mt-0.5 text-sm leading-relaxed">{complaint.description}</p>
          </div>

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

          {allowedTransitions.length > 0 && (
            <div className="border-t border-gray-100 pt-5">
              <p className="text-sm font-semibold text-gray-700 mb-3">Update Status</p>
              {statusError && (
                <div className="bg-red-50 border border-red-200 text-danger text-sm rounded-lg px-4 py-2 mb-3">
                  {statusError}
                </div>
              )}
              <form onSubmit={handleStatusSubmit} className="space-y-3">
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm((p) => ({ ...p, status: e.target.value }))}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select new status</option>
                  {allowedTransitions.map((s) => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Optional note…"
                  value={statusForm.note}
                  onChange={(e) => setStatusForm((p) => ({ ...p, note: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={statusLoading}
                  className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-60"
                >
                  {statusLoading ? 'Updating…' : 'Update Status'}
                </button>
              </form>
            </div>
          )}

          <div className="border-t border-gray-100 pt-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Set Priority</p>
            {priorityError && (
              <div className="bg-red-50 border border-red-200 text-danger text-sm rounded-lg px-4 py-2 mb-3">
                {priorityError}
              </div>
            )}
            <select
              defaultValue={complaint.priority ?? ''}
              onChange={handlePriorityChange}
              disabled={priorityLoading}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
            >
              <option value="">No priority</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <p className="text-xs text-neutral uppercase tracking-wide font-medium mb-3">Status History</p>
            <StatusTimeline history={complaint.statusHistory} />
          </div>
        </div>
      </div>
    </div>
  );
}
