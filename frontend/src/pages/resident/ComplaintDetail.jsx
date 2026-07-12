import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { ArrowLeft, AlertCircle, RefreshCw, Image as ImageIcon, Calendar, CheckCircle2, RotateCcw, Clock, Timer } from 'lucide-react';
import { axiosInstance } from '../../api/axios.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import PriorityBadge from '../../components/PriorityBadge.jsx';
import StatusTimeline from '../../components/StatusTimeline.jsx';
import Toast from '../../components/Toast.jsx';
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
  '--success': '#15803D',
};

export default function ComplaintDetail() {
  const { id } = useParams();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [live, setLive] = useState(false);
  const [reopening, setReopening] = useState(false);

  const fetchComplaint = useCallback(() => {
    setError('');
    axiosInstance
      .get(`/complaints/${id}`)
      .then(({ data }) => setComplaint(data))
      .catch(() => setError('Failed to load complaint.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchComplaint();
  }, [fetchComplaint]);

  const handleReopen = async () => {
    setReopening(true);
    try {
      await axiosInstance.patch(`/complaints/${id}/reopen`);
      fetchComplaint();
      setToast({ message: 'Complaint reopened. The admin team has been notified.', status: 'REOPENED' });
    } catch (err) {
      setToast({
        message: err.response?.data?.error || 'Failed to reopen complaint.',
        status: 'OPEN',
      });
    } finally {
      setReopening(false);
    }
  };

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL.replace('/api', ''), {
      transports: ['websocket'],
    });

    socket.on('connect', () => setLive(true));
    socket.on('disconnect', () => setLive(false));

    socket.emit('join-complaint', id);

    socket.on('status-updated', (payload) => {
      fetchComplaint();
      setToast({
        message: `Status changed from ${payload.oldStatus.replace('_', ' ')} → ${payload.newStatus.replace('_', ' ')}${payload.note ? `. Note: ${payload.note}` : ''}`,
        status: payload.newStatus,
      });
    });

    return () => {
      socket.emit('leave-complaint', id);
      socket.disconnect();
    };
  }, [id, fetchComplaint]);

  if (loading) {
    return (
      <Layout>
        <div className="mx-auto max-w-4xl p-6 md:p-8" style={TOKENS}>
          <div className="mb-6 space-y-3">
            <div className="h-3 w-32 animate-pulse rounded bg-[var(--border)]" />
            <div className="h-6 w-48 animate-pulse rounded bg-[var(--border)]" />
          </div>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
            <div className="h-44 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface)] lg:col-span-3" />
            <div className="h-64 animate-pulse rounded-2xl border border-[var(--border)] bg-[var(--surface)] lg:col-span-2" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !complaint) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center px-6" style={TOKENS}>
          <div className="max-w-sm text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
              <AlertCircle className="h-5 w-5 text-red-600" strokeWidth={1.75} />
            </div>
            <p className="mb-1 font-['Plus_Jakarta_Sans'] font-semibold text-[var(--ink)]">
              {error || 'Complaint not found'}
            </p>
            <p className="mb-5 text-sm text-[var(--ink-2)]">
              It may have been removed, or something went wrong while loading it.
            </p>
            <div className="flex justify-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  fetchComplaint();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-hover)]"
              >
                <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
                Try again
              </button>
              <Link
                to="/complaints"
                className="inline-flex items-center rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--bg)]"
              >
                Back to complaints
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {toast && <Toast message={toast.message} status={toast.status} onClose={() => setToast(null)} />}

      <div className="mx-auto max-w-4xl p-6 font-['Inter'] text-[var(--ink)] md:p-8" style={TOKENS}>
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/complaints"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-[var(--ink-2)] transition-colors hover:text-[var(--accent)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
            Back to complaints
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-['Plus_Jakarta_Sans'] text-xl font-bold capitalize text-[var(--ink)]">
                  {complaint.category.toLowerCase()}
                </h1>
                <span className="rounded-md bg-[var(--bg)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--ink-3)]">
                  #{String(id).slice(-6).toUpperCase()}
                </span>
              </div>
              <p className="mt-1 text-sm text-[var(--ink-2)]">
                Submitted {new Date(complaint.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {live && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs font-medium text-[var(--ink-2)]"
                  title="This page updates automatically when the status changes — no need to refresh"
                >
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  Live
                </span>
              )}
              {complaint.isOverdue && (
                <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                  Overdue
                </span>
              )}
              <StatusBadge status={complaint.status} />
              <PriorityBadge priority={complaint.priority} />
            </div>
          </div>
        </div>

        {/* Content vs. timeline — separated so "what happened" and "where it stands" are easy to tell apart */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          {/* Main content */}
          <div className="space-y-5 lg:col-span-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--ink-3)]">Description</p>
              <p className="text-sm leading-relaxed text-[var(--ink)]">{complaint.description}</p>
            </div>

            {complaint.photoUrl && (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
                <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--ink-3)]">
                  <ImageIcon className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Photo
                </p>
                <img
                  src={complaint.photoUrl}
                  alt="Complaint"
                  className="max-h-80 w-full rounded-xl border border-[var(--border)] object-cover"
                />
              </div>
            )}
          </div>

          {/* Timeline sidebar — dates and status history live together since they're both "when" */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-[var(--ink-3)]">Timeline</p>

              <div className="mb-4 space-y-3">
                <div className="flex items-start gap-2.5 text-sm">
                  <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ink-3)]" strokeWidth={1.75} />
                  <div>
                    <p className="text-[var(--ink)]">{new Date(complaint.createdAt).toLocaleString()}</p>
                    <p className="text-xs text-[var(--ink-3)]">Raised</p>
                  </div>
                </div>
                {complaint.resolvedAt && (
                  <div className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" strokeWidth={1.75} />
                    <div>
                      <p className="text-[var(--ink)]">{new Date(complaint.resolvedAt).toLocaleString()}</p>
                      <p className="text-xs text-[var(--ink-3)]">Resolved</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-[var(--border)] pt-4">
                <StatusTimeline history={complaint.statusHistory} />
              </div>

              {/* Computed metrics */}
              <div className="mt-4 border-t border-[var(--border)] pt-4 space-y-2.5">
                {complaint.timeInStatus && (
                  <div className="flex items-center gap-2 text-xs text-[var(--ink-2)]">
                    <Clock className="h-3.5 w-3.5 text-[var(--ink-3)]" strokeWidth={1.75} />
                    <span>In current status: <span className="font-medium text-[var(--ink)]">{complaint.timeInStatus}</span></span>
                  </div>
                )}
                {complaint.resolutionTime && (
                  <div className="flex items-center gap-2 text-xs text-[var(--ink-2)]">
                    <Timer className="h-3.5 w-3.5 text-[var(--ink-3)]" strokeWidth={1.75} />
                    <span>Resolution time: <span className="font-medium text-[var(--ink)]">{complaint.resolutionTime}</span></span>
                  </div>
                )}
              </div>

              {/* Reopen — only for RESOLVED within the window */}
              {complaint.canReopen && (
                <div className="mt-4 border-t border-[var(--border)] pt-4">
                  <p className="mb-2 text-xs text-[var(--ink-3)]">
                    Not satisfied with the resolution? Reopen this complaint.
                  </p>
                  <button
                    type="button"
                    onClick={handleReopen}
                    disabled={reopening}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700 transition-colors hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
                    {reopening ? 'Reopening…' : 'Reopen complaint'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}