import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import {
  ArrowLeft, AlertCircle, RefreshCw, Image as ImageIcon,
  Calendar, CheckCircle2, RotateCcw, Clock, Timer, Wifi, WifiOff,
} from 'lucide-react';
import { axiosInstance } from '../../api/axios.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import PriorityBadge from '../../components/PriorityBadge.jsx';
import StatusTimeline from '../../components/StatusTimeline.jsx';
import Toast from '../../components/Toast.jsx';
import Layout from '../../components/Layout.jsx';

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};
const stagger = { show: { transition: { staggerChildren: 0.07 } } };

export default function ComplaintDetail() {
  const { id } = useParams();

  const [complaint, setComplaint] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [toast,     setToast]     = useState(null);
  const [live,      setLive]      = useState(false);
  const [reopening, setReopening] = useState(false);

  const fetchComplaint = useCallback(() => {
    setError('');
    axiosInstance.get(`/complaints/${id}`)
      .then(({ data }) => setComplaint(data))
      .catch(() => setError('Failed to load complaint.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchComplaint(); }, [fetchComplaint]);

  const handleReopen = async () => {
    setReopening(true);
    try {
      await axiosInstance.patch(`/complaints/${id}/reopen`);
      fetchComplaint();
      setToast({ message: 'Complaint reopened. The admin team has been notified.', status: 'REOPENED' });
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to reopen.', status: 'error' });
    } finally {
      setReopening(false);
    }
  };

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL.replace('/api', ''), { transports: ['websocket'] });
    socket.on('connect',    () => setLive(true));
    socket.on('disconnect', () => setLive(false));
    socket.emit('join-complaint', id);
    socket.on('status-updated', payload => {
      fetchComplaint();
      setToast({
        message: `Status changed: ${payload.oldStatus.replace('_', ' ')} → ${payload.newStatus.replace('_', ' ')}${payload.note ? `. Note: ${payload.note}` : ''}`,
        status: payload.newStatus,
      });
    });
    return () => { socket.emit('leave-complaint', id); socket.disconnect(); };
  }, [id, fetchComplaint]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Layout>
        <div className="p-6 md:p-8 max-w-4xl mx-auto">
          <div className="h-4 skeleton rounded-lg w-32 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="skeleton h-48 rounded-2xl lg:col-span-3" />
            <div className="skeleton h-72 rounded-2xl lg:col-span-2" />
          </div>
        </div>
      </Layout>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !complaint) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center px-6">
          <div className="max-w-sm text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
              <AlertCircle size={22} className="text-red-500" strokeWidth={1.75} />
            </div>
            <p className="font-semibold text-ink mb-1">{error || 'Complaint not found'}</p>
            <p className="text-sm text-ink-muted mb-6">It may have been removed or something went wrong.</p>
            <div className="flex justify-center gap-2.5">
              <button
                onClick={() => { setLoading(true); fetchComplaint(); }}
                className="btn-primary btn-sm"
              >
                <RefreshCw size={13} strokeWidth={2} /> Try again
              </button>
              <Link to="/complaints" className="btn-secondary btn-sm">Back to complaints</Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ── Main ──────────────────────────────────────────────────────────────────
  return (
    <Layout>
      <AnimatePresence>
        {toast && <Toast message={toast.message} status={toast.status} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <div className="p-6 md:p-8 max-w-4xl mx-auto">

        {/* Breadcrumb */}
        <Link to="/complaints" className="inline-flex items-center gap-1.5 text-xs text-ink-faint hover:text-ink-muted transition-colors mb-5">
          <ArrowLeft size={12} strokeWidth={2} /> Back to complaints
        </Link>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-xl font-bold capitalize text-ink">
                {complaint.category.toLowerCase()}
              </h1>
              <span className="font-mono text-[11px] text-ink-faint bg-surface-100 border border-surface-200 rounded-lg px-2 py-0.5">
                #{String(id).slice(-6).toUpperCase()}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-muted">
              Submitted {new Date(complaint.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Live indicator */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors
                ${live ? 'bg-green-50 border-green-200 text-green-700' : 'bg-surface-100 border-surface-200 text-ink-faint'}`}
              title={live ? 'Updates in real time' : 'Not connected'}
            >
              {live
                ? <><span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Live</>
                : <><WifiOff size={10} strokeWidth={2} /> Offline</>
              }
            </span>
            {complaint.isOverdue && (
              <span className="badge bg-red-50 text-red-700 border-red-200">Overdue</span>
            )}
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
          </div>
        </div>

        {/* Body — 3/5 + 2/5 grid */}
        <motion.div
          initial="hidden" animate="show" variants={stagger}
          className="grid grid-cols-1 gap-5 lg:grid-cols-5"
        >
          {/* ── Left column ── */}
          <div className="space-y-5 lg:col-span-3">

            {/* Description */}
            <motion.div variants={fadeUp} className="card p-6">
              <p className="section-title">Description</p>
              <p className="text-sm leading-relaxed text-ink">{complaint.description}</p>
            </motion.div>

            {/* Photos */}
            {complaint.photos?.length > 0 && (
              <motion.div variants={fadeUp} className="card p-6">
                <p className="section-title flex items-center gap-1.5">
                  <ImageIcon size={11} strokeWidth={2} />
                  Photos ({complaint.photos.length})
                </p>
                <div className={`grid gap-2.5 ${complaint.photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {complaint.photos.map(photo => (
                    <a
                      key={photo.id}
                      href={photo.url}
                      target="_blank"
                      rel="noreferrer"
                      title="View full size"
                      className="block overflow-hidden rounded-xl border border-surface-200 hover:opacity-90 transition-opacity"
                    >
                      <img
                        src={photo.thumbnailUrl}
                        alt={`Photo ${photo.position + 1}`}
                        className="w-full aspect-square object-cover"
                        loading="lazy"
                      />
                    </a>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* ── Right column — timeline ── */}
          <motion.div variants={fadeUp} className="lg:col-span-2">
            <div className="card p-6 space-y-5">

              {/* Dates */}
              <div>
                <p className="section-title">Timeline</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 border border-brand-200 shrink-0 mt-0.5">
                      <Calendar size={11} className="text-brand-500" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-ink">
                        {new Date(complaint.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-[11px] text-ink-faint">Raised</p>
                    </div>
                  </div>
                  {complaint.resolvedAt && (
                    <div className="flex items-start gap-2.5">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-50 border border-green-200 shrink-0 mt-0.5">
                        <CheckCircle2 size={11} className="text-green-500" strokeWidth={2} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-ink">
                          {new Date(complaint.resolvedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-[11px] text-ink-faint">Resolved</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status history */}
              <div className="border-t border-surface-200 pt-5">
                <p className="section-title">Status History</p>
                <StatusTimeline history={complaint.statusHistory} />
              </div>

              {/* Metrics */}
              {(complaint.timeInStatus || complaint.resolutionTime) && (
                <div className="border-t border-surface-200 pt-4 flex flex-wrap gap-2">
                  {complaint.timeInStatus && (
                    <span className="badge bg-amber-50 text-amber-700 border-amber-200">
                      <Clock size={10} strokeWidth={2} /> {complaint.timeInStatus} in current status
                    </span>
                  )}
                  {complaint.resolutionTime && (
                    <span className="badge bg-green-50 text-green-700 border-green-200">
                      <Timer size={10} strokeWidth={2} /> Resolved in {complaint.resolutionTime}
                    </span>
                  )}
                </div>
              )}

              {/* Reopen */}
              {complaint.canReopen && (
                <div className="border-t border-surface-200 pt-4">
                  <p className="text-xs text-ink-faint mb-2.5">
                    Not satisfied with the resolution? You can reopen this complaint.
                  </p>
                  <button
                    onClick={handleReopen}
                    disabled={reopening}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3.5 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <RotateCcw size={12} strokeWidth={2} />
                    {reopening ? 'Reopening…' : 'Reopen complaint'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
}