import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Inbox, AlertTriangle } from 'lucide-react';
import { axiosInstance } from '../../api/axios.js';
import NoticeCard from '../../components/NoticeCard.jsx';
import PostNoticeForm from '../../components/PostNoticeForm.jsx';
import Layout from '../../components/Layout.jsx';

/* ---------- motion presets ---------- */
const listContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

const listItem = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, x: -12, height: 0, marginBottom: 0, transition: { duration: 0.25, ease: 'easeIn' } },
};

// Admin notice management — create and delete society notices
export default function NoticeManage() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    axiosInstance.get('/notices')
      .then(({ data }) => setNotices(data))
      .catch(() => setError('Failed to load notices.'))
      .finally(() => setLoading(false));
  }, []);

  const handleCreated = (notice) => {
    setNotices((prev) => [notice, ...prev]);
  };

  const handleDelete = (id) => {
    setNotices((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600">
            <Megaphone size={18} strokeWidth={2.25} />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manage Notices</h1>
            <p className="text-sm text-gray-500 mt-0.5">Post and delete society notices</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="mb-6"
        >
          <PostNoticeForm onCreated={handleCreated} />
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3 mb-4 overflow-hidden"
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-white rounded-2xl h-24 border border-gray-100"
                style={{ animationDelay: `${i * 70}ms` }}
              />
            ))}
          </div>
        ) : notices.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex flex-col items-center justify-center text-center py-20 px-6 bg-white rounded-2xl border border-gray-100"
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-400 flex items-center justify-center mb-4">
              <Inbox size={24} strokeWidth={1.75} />
            </div>
            <p className="text-gray-700 font-semibold">No notices posted yet</p>
            <p className="text-sm text-gray-400 mt-1">Use the form above to post your first notice</p>
          </motion.div>
        ) : (
          <motion.div
            variants={listContainer}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            <AnimatePresence mode="popLayout">
              {notices.map((n) => (
                <motion.div
                  key={n.id}
                  layout
                  variants={listItem}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                >
                  <NoticeCard
                    notice={n}
                    isAdmin={true}
                    onDelete={handleDelete}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}