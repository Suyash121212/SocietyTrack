import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, AlertTriangle, Tag, Calendar, CheckCircle2,
  FileText, Image as ImageIcon, History, ChevronRight,
  Clock, Timer, RotateCcw,
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
  REOPENED:    ['IN_PROGRESS', 'RESOLVED'],
};
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

const fadeUp = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16,1,0.3,1] } } };
const stagger = { show: { transition: { staggerChildren: 0.06 } } };

const MetaItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-100 mt-0.5">
      <Icon size={13} className="text-ink-faint" strokeWidth={2} />
    </div>
    <div>
      <p className="text-[11px] font-semibold text-ink-faint uppercase tracking-widest">{label}</p>
      <p className="text-sm text-ink mt-0.5">{value}</p>
    </div>
  </div>
);

export default function ComplaintManage() {
  const { id } = useParams();

  const [complaint,      setComplaint]      = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState('');
  const [statusForm,     setStatusForm]     = useState({ status: '', note: '' });
  const [statusError,    setStatusError]    = useState('');
  const [statusLoading,  setStatusLoading]  = useState(false);
  const [priorityLoading,setPriorityLoading]= useState(false);
  const [priorityError,  setPriorityError]  = useState('');
  const [toast,          setToast]          = useState(null);

  const fetchComplaint = useCallback(() => {
    setLoading(true);
    axiosInstance.get(`/complaints/${id}`)
      .then(({ data }) => { setComplaint(data); setStatusForm({ status: '', note: '' }); })
      .catch(() => setError('Failed to load complaint.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchComplaint(); }, [fetchComplaint]);

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setStatusError('');
    setStatusLoading(true);
    const snapshot = complaint;

    setComplaint(prev => ({
      ...prev,
      status: statusForm.status,
      resolvedAt: statusForm.status === 'RESOLVED' ? new Date().toISOString() : prev.resolvedAt,
      statusHistory: [...prev.statusHistory, {
        oldStatus: prev.status, newStatus: statusForm.status,
        changedBy: 'Admin', note: statusForm.note || null,
        changedAt: new Date().toISOString(),
      }],
    }));
    setStatusForm({ status: '', note: '' });

    try {
      await axiosInstance.patch(`/admin/complaints/${id}/status`, statusForm);
      setToast({ message: `Status updated to ${statusForm.status.replace('_', ' ')}`, type: 'success' });
      fetchComplaint();
    } catch (err) {
      setComplaint(snapshot);
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
    const snapshot = complaint;
    setComplaint(prev => ({ ...prev, priority }));
    try {
      await axiosInstance.patch(`/admin/complaints/${id}/priority`, { priority });
      setToast({ message: `Priority set to ${priority}`, type: 'success' });
    } catch (err) {
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
        <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-2xl" style={{ animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
      </Layout>
    );
  }

  if (error || !complaint) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center gap-4 min-h-[60vh] text-center px-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <AlertTriangle size={22} className="text-red-500" strokeWidth={1.75} />
          </div>
          <p className="font-semibold text-ink">{error || 'Complaint not found.'}</p>
          <Link to="/admin/complaints" className="btn-secondary btn-sm">← All Complaints</Link>
        </div>
      </Layout>
    );
  }

  const allowed = VALID_TRANSITIONS[complaint.status] ?? [];

  return (
    <Layout>
      <AnimatePresence>
        {toast && <Toast message={toast.message} status={toast.type === 'error' ? 'error' : 'RESOLVED'} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        {/* Page header */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <Link to="/admin/complaints" className="inline-flex items-center gap-1.5 text-xs text-ink-faint hover:text-ink-muted transition-colors mb-3">
              <ArrowLeft size={12} strokeWidth={2} /> All Complaints
            </Link>
            <h1 className="page-title">Manage Complaint</h1>
            <p className="page-subtitle">Review, update status and set priority</p>
          </div>
          <span className="font-mono text-xs text-ink-faint bg-surface-100 border border-surface-200 rounded-lg px-2.5 py-1.5 mt-8 shrink-0">
            #{String(id).slice(-8).toUpperCase()}
          </span>
        </div>

        <motion.div initial="hidden" animate="show" variants={stagger} className="space-y-5">

          {/* Badges + metrics */}
          <motion.div variants={fadeUp} className="card p-5">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <StatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
              {complaint.isOverdue && (
                <span className="badge bg-red-50 text-red-700 border-red-200">
                  <AlertTriangle size={10} strokeWidth={2.5} /> Overdue
                </span>
              )}
              {complaint.status === 'REOPENED' && (
                <span className="badge bg-purple-50 text-purple-700 border-purple-200">
                  <RotateCcw size={10} strokeWidth={2.5} /> Needs attention
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <MetaItem icon={Tag}      label="Category" value={complaint.category.charAt(0) + complaint.category.slice(1).toLowerCase()} />
              <MetaItem icon={Calendar} label="Raised on" value={new Date(complaint.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />
              {complaint.resolvedAt && (
                <MetaItem icon={CheckCircle2} label="Resolved on" value={new Date(complaint.resolvedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} />
              )}
            </div>

            {(complaint.timeInStatus || complaint.resolutionTime) && (
              <div className="flex flex-wrap gap-2.5 mt-4 pt-4 border-t border-surface-200">
                {complaint.timeInStatus && (
                  <span className="badge bg-amber-50 text-amber-700 border-amber-200">
                    <Clock size={10} strokeWidth={2} /> In status: {complaint.timeInStatus}
                  </span>
                )}
                {complaint.resolutionTime && (
                  <span className="badge bg-green-50 text-green-700 border-green-200">
                    <Timer size={10} strokeWidth={2} /> Resolved in: {complaint.resolutionTime}
                  </span>
                )}
              </div>
            )}
          </motion.div>

          {/* Description */}
          <motion.div variants={fadeUp} className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={13} className="text-ink-faint" strokeWidth={2} />
              <p className="text-xs font-semibold text-ink-faint uppercase tracking-widest">Description</p>
            </div>
            <p className="text-sm text-ink-muted leading-relaxed">{complaint.description}</p>
          </motion.div>

          {/* Photos */}
          {complaint.photos?.length > 0 && (
            <motion.div variants={fadeUp} className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <ImageIcon size={13} className="text-ink-faint" strokeWidth={2} />
                <p className="text-xs font-semibold text-ink-faint uppercase tracking-widest">
                  Photos ({complaint.photos.length})
                </p>
              </div>
              <div className={`grid gap-2.5 ${complaint.photos.length === 1 ? 'grid-cols-1 max-w-xs' : 'grid-cols-3'}`}>
                {complaint.photos.map(p => (
                  <a key={p.id} href={p.url} target="_blank" rel="noreferrer"
                    className="block overflow-hidden rounded-xl border border-surface-200 hover:opacity-90 transition-opacity"
                  >
                    <img src={p.thumbnailUrl} alt="" className="w-full aspect-square object-cover" />
                  </a>
                ))}
              </div>
            </motion.div>
          )}

          {/* Update status */}
          {allowed.length > 0 && (
            <motion.div variants={fadeUp} className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <ChevronRight size={14} className="text-brand-500" strokeWidth={2.5} />
                <p className="text-sm font-semibold text-ink">Update Status</p>
              </div>

              <AnimatePresence>
                {statusError && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3.5 py-2.5 mb-4 overflow-hidden"
                  >
                    <AlertTriangle size={13} className="mt-0.5 shrink-0" strokeWidth={2} />
                    {statusError}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleStatusSubmit} className="space-y-3">
                <select
                  value={statusForm.status}
                  onChange={e => setStatusForm(p => ({ ...p, status: e.target.value }))}
                  required
                  className="input"
                >
                  <option value="">Select new status…</option>
                  {allowed.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
                <input
                  type="text"
                  placeholder="Add a note for the resident (optional)…"
                  value={statusForm.note}
                  onChange={e => setStatusForm(p => ({ ...p, note: e.target.value }))}
                  className="input"
                />
                <button type="submit" disabled={statusLoading} className="btn-primary">
                  {statusLoading ? 'Saving…' : 'Update Status'}
                </button>
              </form>
            </motion.div>
          )}

          {/* Priority */}
          <motion.div variants={fadeUp} className="card p-5">
            <p className="text-sm font-semibold text-ink mb-3">Set Priority</p>
            <AnimatePresence>
              {priorityError && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3.5 py-2.5 mb-3 overflow-hidden"
                >
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" strokeWidth={2} />
                  {priorityError}
                </motion.div>
              )}
            </AnimatePresence>
            <select
              value={complaint.priority ?? ''}
              onChange={handlePriorityChange}
              disabled={priorityLoading}
              className="input max-w-[200px]"
            >
              <option value="">No priority</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>)}
            </select>
          </motion.div>

          {/* History */}
          <motion.div variants={fadeUp} className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <History size={13} className="text-ink-faint" strokeWidth={2} />
              <p className="text-xs font-semibold text-ink-faint uppercase tracking-widest">Status History</p>
            </div>
            <StatusTimeline history={complaint.statusHistory} />
          </motion.div>

        </motion.div>
      </div>
    </Layout>
  );
}
