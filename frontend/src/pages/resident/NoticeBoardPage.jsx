import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Inbox, AlertTriangle } from 'lucide-react';
import { axiosInstance } from '../../api/axios.js';
import NoticeCard from '../../components/NoticeCard.jsx';
import Layout from '../../components/Layout.jsx';

const listVariant = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const itemVariant = {
  hidden: { opacity: 0, y: 8 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

export default function NoticeBoardPage() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    axiosInstance.get('/notices')
      .then(({ data }) => setNotices(data))
      .catch(() => setError('Failed to load notices.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="page-header">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50">
              <Bell size={18} className="text-brand-600" strokeWidth={2} />
            </div>
            <div>
              <h1 className="page-title">Notice Board</h1>
              <p className="page-subtitle">Society announcements and updates</p>
            </div>
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 overflow-hidden"
            >
              <AlertTriangle size={15} className="mt-0.5 shrink-0" strokeWidth={2} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading skeletons */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-2xl" style={{ animationDelay: `${i * 60}ms` }} />
            ))}
          </div>
        ) : notices.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="card flex flex-col items-center justify-center text-center py-20 px-6"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 mb-4">
              <Inbox size={22} className="text-brand-400" strokeWidth={1.75} />
            </div>
            <p className="font-semibold text-ink">No notices yet</p>
            <p className="text-sm text-ink-faint mt-1">Check back later for society announcements.</p>
          </motion.div>
        ) : (
          <motion.div variants={listVariant} initial="hidden" animate="show" className="space-y-3">
            {notices.map(n => (
              <motion.div key={n.id} variants={itemVariant}>
                <NoticeCard notice={n} isAdmin={false} onDelete={() => {}} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
