import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Check, X, AlertTriangle, Megaphone, Clock } from 'lucide-react';
import { axiosInstance } from '../api/axios.js';

export default function NoticeCard({ notice, isAdmin, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [error, setError]           = useState('');

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      await axiosInstance.delete(`/admin/notices/${notice.id}`);
      onDelete(notice.id);
    } catch {
      setError('Failed to delete.');
      setDeleting(false);
      setConfirming(false);
    }
  };

  const expiresAt = notice.validUntil ? new Date(notice.validUntil) : null;
  const isExpiringSoon = expiresAt && (expiresAt - Date.now()) < 86_400_000 * 2; // < 2 days

  return (
    <div className={`card p-5 transition-all duration-200 hover:shadow-card-hover
      ${notice.isImportant ? 'border-l-4 border-l-brand-500' : ''}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3 flex-1 min-w-0">
          {/* Icon */}
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl mt-0.5
            ${notice.isImportant ? 'bg-brand-50 text-brand-600' : 'bg-surface-100 text-ink-muted'}`}
          >
            <Megaphone size={16} strokeWidth={2} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-ink">{notice.title}</h3>
              {notice.isImportant && (
                <span className="badge bg-brand-50 text-brand-700 border-brand-200">Important</span>
              )}
              {isExpiringSoon && expiresAt && (
                <span className="badge bg-amber-50 text-amber-700 border-amber-200">
                  <Clock size={10} strokeWidth={2} />
                  Expires {expiresAt.toLocaleDateString()}
                </span>
              )}
            </div>
            <p className="text-sm text-ink-muted leading-relaxed">{notice.body}</p>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-xs text-ink-faint">
                {new Date(notice.createdAt).toLocaleString('en-GB', {
                  day: '2-digit', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
              {expiresAt && !isExpiringSoon && (
                <p className="text-xs text-ink-faint">
                  · Expires {expiresAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-1.5 text-xs text-danger mt-2"
                >
                  <AlertTriangle size={11} strokeWidth={2.5} />
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Admin actions */}
        {isAdmin && (
          <div className="shrink-0">
            <AnimatePresence mode="wait" initial={false}>
              {!confirming ? (
                <motion.button
                  key="delete"
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => setConfirming(true)}
                  className="btn-icon btn-sm text-ink-faint hover:text-danger hover:border-red-200 hover:bg-red-50"
                  aria-label="Delete notice"
                >
                  <Trash2 size={13} strokeWidth={2} />
                </motion.button>
              ) : (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-xl px-2.5 py-1.5"
                >
                  <span className="text-xs font-semibold text-red-700">Delete?</span>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60"
                    aria-label="Confirm"
                  >
                    {deleting
                      ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }} className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full block" />
                      : <Check size={12} strokeWidth={3} />
                    }
                  </button>
                  <button
                    onClick={() => setConfirming(false)}
                    disabled={deleting}
                    className="flex h-6 w-6 items-center justify-center rounded-lg text-ink-faint hover:text-ink hover:bg-surface-100 transition-colors"
                    aria-label="Cancel"
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
