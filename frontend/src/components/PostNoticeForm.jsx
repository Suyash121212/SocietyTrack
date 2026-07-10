import { useState } from 'react';
import { axiosInstance } from '../api/axios.js';

// Form for admins to compose and publish a new notice
export default function PostNoticeForm({ onCreated }) {
  const [form, setForm]       = useState({ title: '', body: '', isImportant: false });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [e.target.name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await axiosInstance.post('/admin/notices', form);
      onCreated(data);
      setForm({ title: '', body: '', isImportant: false });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post notice.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h2 className="text-sm font-semibold text-gray-800 mb-4">Post a Notice</h2>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg px-3 py-2 mb-3">
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          required
          placeholder="Notice title"
          className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
        />
        <textarea
          name="body"
          value={form.body}
          onChange={handleChange}
          required
          rows={3}
          placeholder="Notice body…"
          className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition resize-none"
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
            <input
              type="checkbox"
              name="isImportant"
              checked={form.isImportant}
              onChange={handleChange}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            Mark as important
          </label>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Posting…' : 'Post Notice'}
          </button>
        </div>
      </form>
    </div>
  );
}
