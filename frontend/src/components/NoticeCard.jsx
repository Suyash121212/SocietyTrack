import { axiosInstance } from '../api/axios.js';

export default function NoticeCard({ notice, isAdmin, onDelete }) {
  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/admin/notices/${notice.id}`);
      onDelete(notice.id);
    } catch {
      alert('Failed to delete notice.');
    }
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm p-5 border-l-4 ${
        notice.isImportant ? 'border-primary' : 'border-transparent'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-gray-800">{notice.title}</h3>
            {notice.isImportant && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-primary">
                Important
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{notice.body}</p>
          <p className="text-xs text-neutral mt-2">
            {new Date(notice.createdAt).toLocaleString()}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleDelete}
            className="text-xs text-danger hover:underline shrink-0"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
