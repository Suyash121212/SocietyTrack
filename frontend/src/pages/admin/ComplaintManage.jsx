import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, AlertTriangle, Tag, CalendarClock, CheckCircle2,
  FileText, ImageIcon, History, ChevronRight,
} from 'lucide-react';
import { axiosInstance } from '../../api/axios.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import PriorityBadge from '../../components/PriorityBadge.jsx';
import StatusTimeline from '../../components/StatusTimeline.jsx';
import Toast from '../../components/Toast.jsx';
import Layout from '../../components/Layout.jsx';

const VALID_TRANSITIONS = {
  OPEN:        ['IN_PROGRESS', 'RESOLVED'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED:    [],
};

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

const MetaField = ({ label, value, icon: Icon }) => (
  <div className="flex items-start gap-2.5">
    <span className="mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gray-50 text-gray-400 shrink-0">
      <Icon size={13} strokeWidth={2.25} />
    </span>
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">{label}</p>
      <p className="text-gray-800 mt-0.5 text-sm">{value}</p>
    </div>
  </div>
);

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

export default function ComplaintManage() {
  const { id } = useParams();

  const [complaint, setComplaint]             = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState('');
  const [statusForm, setStatusForm]           = useState({ status: '', note: '' });
  const [statusError, setStatusError]         = useState('');
  const [statusLoading, setStatusLoading]     = useState(false);
  const [priorityLoading, setPriorityLoading] = useState(false);
  const [priorityError, setPriorityError]     = useState('');
  const [toast, setToast]                     = useState(null);

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

  useEffect(() => { fetchComplaint(); }, [fetchComplaint]);

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setStatusError('');
    setStatusLoading(true);

    // Snapshot for rollback
    const snapshot = complaint;

    // Optimistic update — apply new status immediately
    setComplaint((prev) => ({
      ...prev,
      status: statusForm.status,
      resolvedAt: statusForm.status === 'RESOLVED' ? new Date().toISOString() : prev.resolvedAt,
      statusHistory: [
        ...prev.statusHistory,
        {
          oldStatus: prev.status,
          newStatus: statusForm.status,
          changedBy: 'Admin',
          note: statusForm.note || null,
          changedAt: new Date().toISOString(),
        },
      ],
    }));
    setStatusForm({ status: '', note: '' });

    try {
      await axiosInstance.patch(`/admin/complaints/${id}/status`, statusForm);
      setToast({ message: `Status updated to ${statusForm.status.replace('_', ' ')}`, type: 'success' });
      // Sync with server to get accurate timestamps and admin name
      fetchComplaint();
    } catch (err) {
      // Rollback on failure
      setComplaint(snapshot);
      setStatusForm({ status: snapshot.status === statusForm.status ? '' : statusForm.status, note: statusForm.note });
      const msg = err.response?.data?.error || 'Failed to update status.';
      setStatusError(msg);
      setToast({ message: msg, type: 'error' });
    } finally {
      setStatusLoading(false);
    }
  };

  const handlePriorityChange = async (e) => {
    const priority = e.target.value;
    if (!priority) return;
    setPriorityError('');
    setPriorityLoading(true);

    // Snapshot for rollback
    const snapshot = complaint;

    // Optimistic update
    setComplaint((prev) => ({ ...prev, priority }));

    try {
      await axiosInstance.patch(`/admin/complaints/${id}/priority`, { priority });
      setToast({ message: `Priority set to ${priority}`, type: 'success' });
    } catch (err) {
      // Rollback on failure
      setComplaint(snapshot);
      const msg = err.response?.data?.error || 'Failed to update priority.';
      setPriorityError(msg);
      setToast({ message: msg, type: 'error' });
    } finally {
      setPriorityLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse bg-white rounded-xl h-16 border border-gray-100"
              style={{ animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
      </Layout>
    );
  }

  if (error || !complaint) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center gap-3 min-h-[60vh] text-center px-6">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
            <AlertTriangle size={22} strokeWidth={1.75} />
          </div>
          <p className="text-red-600 font-medium">{error || 'Complaint not found.'}</p>
          <Link to="/admin/complaints" className="text-sm text-indigo-600 hover:underline">
            ← Back to All Complaints
          </Link>
        </div>
      </Layout>
    );
  }

  const allowedTransitions = VALID_TRANSITIONS[complaint.status] ?? [];

  return (
    <Layout>
      {toast && (
        <Toast
          message={toast.message}
          status={toast.type === 'error' ? 'OPEN' : 'RESOLVED'}
          onClose={() => setToast(null)}
        />
      )}

      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manage Complaint</h1>
            <p className="text-sm text-gray-500 mt-1">Review details and update status or priority</p>
          </div>
          <Link
            to="/admin/complaints"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeft size={15} strokeWidth={2.25} />
            All Complaints
          </Link>
        </div>

        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6"
        >
          {/* Badges — update instantly via optimistic state */}
          <motion.div variants={fadeUp} className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
            {complaint.isOverdue && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                <AlertTriangle size={11} strokeWidth={2.5} />
                Overdue
              </span>
            )}
          </motion.div>

          <motion.div variants={fadeUp} className="grid grid-cols-2 gap-5 pt-1">
            <MetaField label="Category" value={complaint.category.charAt(0) + complaint.category.slice(1).toLowerCase()} icon={Tag} />
            <MetaField label="Raised on" value={new Date(complaint.createdAt).toLocaleString()} icon={CalendarClock} />
            {complaint.resolvedAt && (
              <MetaField label="Resolved on" value={new Date(complaint.resolvedAt).toLocaleString()} icon={CheckCircle2} />
            )}
          </motion.div>

          <motion.div variants={fadeUp}>
            <div className="flex items-center gap-2 mb-2">
              <FileText size={13} className="text-gray-400" strokeWidth={2.25} />
              <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Description</p>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 rounded-xl p-4 border border-gray-100">
              {complaint.description}
            </p>
          </motion.div>

          {complaint.photoUrl && (
            <motion.div variants={fadeUp}>
              <div className="flex items-center gap-2 mb-2">
                <ImageIcon size={13} className="text-gray-400" strokeWidth={2.25} />
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Photo</p>
              </div>
              <img src={complaint.photoUrl} alt="Complaint photo"
                className="rounded-xl max-h-64 object-cover border border-gray-200 shadow-sm" />
            </motion.div>
          )}

          {/* Update Status — optimistic submit */}
          {allowedTransitions.length > 0 && (
            <motion.div variants={fadeUp}
              className="bg-gradient-to-b from-indigo-50/60 to-gray-50 rounded-xl p-5 border border-indigo-100/60">
              <p className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-1.5">
                <ChevronRight size={14} className="text-indigo-500" strokeWidth={2.5} />
                Update Status
              </p>
              <AnimatePresence>
                {statusError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg px-3 py-2 mb-3"
                  >
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                    <span>{statusError}</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <form onSubmit={handleStatusSubmit} className="space-y-3">
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm((p) => ({ ...p, status: e.target.value }))}
                  required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-shadow"
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
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-shadow"
                />
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={statusLoading}
                  className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60 shadow-sm"
                >
                  {statusLoading ? 'Saving…' : 'Update Status'}
                </motion.button>
              </form>
            </motion.div>
          )}

          {/* Set Priority — optimistic change */}
          <motion.div variants={fadeUp} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
            <p className="text-sm font-semibold text-gray-800 mb-3">Set Priority</p>
            <AnimatePresence>
              {priorityError && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg px-3 py-2 mb-3"
                >
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>{priorityError}</span>
                </motion.div>
              )}
            </AnimatePresence>
            <select
              value={complaint.priority ?? ''}
              onChange={handlePriorityChange}
              disabled={priorityLoading}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-shadow disabled:opacity-60"
            >
              <option value="">No priority</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </motion.div>

          <motion.div variants={fadeUp}>
            <div className="flex items-center gap-2 mb-3">
              <History size={13} className="text-gray-400" strokeWidth={2.25} />
              <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Status History</p>
            </div>
            <StatusTimeline history={complaint.statusHistory} />
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
}
