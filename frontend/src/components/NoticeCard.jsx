import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Check, X, AlertTriangle } from 'lucide-react';
import { axiosInstance } from '../api/axios.js';

// Individual notice card with optional delete action for admins
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
      setError('Failed to delete notice.');
      setDeleting(false);
      setConfirming(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow ${
        notice.isImportant ? 'border-l-4 border-l-primary' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Title row */}
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="text-sm font-semibold text-gray-900">{notice.title}</h3>
            {notice.isImportant && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-primary border border-blue-100">
                Important
              </span>
            )}
          </div>
          {/* Body */}
          <p className="text-sm text-gray-600 leading-relaxed">{notice.body}</p>
          {/* Timestamp */}
          <p className="text-xs text-neutral mt-2">
            {new Date(notice.createdAt).toLocaleString()}
          </p>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 text-xs text-red-600 mt-2"
              >
                <AlertTriangle size={12} strokeWidth={2.5} />
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {isAdmin && (
          <div className="shrink-0">
            <AnimatePresence mode="wait" initial={false}>
              {!confirming ? (
                <motion.button
                  key="delete"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => setConfirming(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-neutral hover:text-danger hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <Trash2 size={13} strokeWidth={2.25} />
                  Delete
                </motion.button>
              ) : (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-lg px-2 py-1.5"
                >
                  <span className="text-xs font-medium text-red-700 pl-1 pr-0.5">Sure?</span>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60"
                    aria-label="Confirm delete"
                  >
                    {deleting ? (
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                        className="w-2.5 h-2.5 border-2 border-white/40 border-t-white rounded-full"
                      />
                    ) : (
                      <Check size={13} strokeWidth={2.75} />
                    )}
                  </button>
                  <button
                    onClick={() => setConfirming(false)}
                    disabled={deleting}
                    className="inline-flex items-center justify-center w-6 h-6 rounded-md text-gray-400 hover:text-gray-600 hover:bg-white transition-colors disabled:opacity-60"
                    aria-label="Cancel"
                  >
                    <X size={13} strokeWidth={2.75} />
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