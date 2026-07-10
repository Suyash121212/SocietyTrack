import { useEffect, useState } from 'react';
import { axiosInstance } from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';
import NoticeCard from '../../components/NoticeCard.jsx';
import PostNoticeForm from '../../components/PostNoticeForm.jsx';
import Layout from '../../components/Layout.jsx';

// Notice board for residents — read-only view of all society announcements
export default function NoticeBoardPage() {
  const { isAdmin } = useAuth();

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
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Notice Board</h1>
          <p className="text-sm text-neutral mt-0.5">Society announcements and updates</p>
        </div>

        {isAdmin() && (
          <div className="mb-6">
            <PostNoticeForm onCreated={handleCreated} />
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            <span className="mt-0.5">⚠</span>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl h-24 border border-gray-100" />
            ))}
          </div>
        ) : notices.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">📣</p>
            <p className="text-gray-500 font-medium">No notices posted yet</p>
            <p className="text-sm text-neutral mt-1">Check back later for society announcements</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notices.map((n) => (
              <NoticeCard
                key={n.id}
                notice={n}
                isAdmin={isAdmin()}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
