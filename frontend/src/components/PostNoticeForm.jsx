import { useState } from 'react';
import { axiosInstance } from '../api/axios.js';

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
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">Post a Notice</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-danger text-sm rounded-lg px-4 py-2 mb-3">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={handleChange}
          required
          placeholder="Title"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <textarea
          name="body"
          value={form.body}
          onChange={handleChange}
          required
          rows={3}
          placeholder="Notice body…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
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
          className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-60"
        >
          {loading ? 'Posting…' : 'Post Notice'}
        </button>
      </form>
    </div>
  );
}
