import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Inbox, AlertTriangle } from 'lucide-react';
import { axiosInstance } from '../../api/axios.js';
import NoticeCard from '../../components/NoticeCard.jsx';
import PostNoticeForm from '../../components/PostNoticeForm.jsx';
import Layout from '../../components/Layout.jsx';

const listVariant = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } },
};
const itemVariant = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit:   { opacity: 0, x: -12, height: 0, marginBottom: 0, transition: { duration: 0.25, ease: 'easeIn' } },
};

export default function NoticeManage() {
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

        <div className="page-header mb-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50">
              <Megaphone size={18} className="text-brand-600" strokeWidth={2} />
            </div>
            <div>
              <h1 className="page-title">Manage Notices</h1>
              <p className="page-subtitle">Post and manage society announcements</p>
            </div>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <PostNoticeForm onCreated={notice => setNotices(prev => [notice, ...prev])} />
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 overflow-hidden"
            >
              <AlertTriangle size={15} className="mt-0.5 shrink-0" strokeWidth={2} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-2xl" style={{ animationDelay: `${i * 70}ms` }} />
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
            <p className="text-sm text-ink-faint mt-1">Use the form above to post your first notice</p>
          </motion.div>
        ) : (
          <motion.div variants={listVariant} initial="hidden" animate="show" className="space-y-3">
            <AnimatePresence mode="popLayout">
              {notices.map(n => (
                <motion.div key={n.id} layout variants={itemVariant} initial="hidden" animate="show" exit="exit">
                  <NoticeCard
                    notice={n}
                    isAdmin
                    onDelete={id => setNotices(prev => prev.filter(x => x.id !== id))}
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
