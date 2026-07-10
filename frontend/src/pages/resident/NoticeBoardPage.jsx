import { useEffect, useState } from 'react';
import { axiosInstance } from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';
import NoticeCard from '../../components/NoticeCard.jsx';
import PostNoticeForm from '../../components/PostNoticeForm.jsx';

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
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Notice Board</h1>

        {isAdmin() && (
          <div className="mb-6">
            <PostNoticeForm onCreated={handleCreated} />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-danger text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl h-24 shadow-sm" />
            ))}
          </div>
        ) : notices.length === 0 ? (
          <p className="text-center text-neutral py-16 text-sm">
            No notices have been posted yet.
          </p>
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
    </div>
  );
}
