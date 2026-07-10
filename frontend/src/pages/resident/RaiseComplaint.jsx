import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { axiosInstance } from '../../api/axios.js';

const CATEGORIES = ['ELECTRICAL', 'PLUMBING', 'SECURITY', 'CLEANING', 'OTHER'];

export default function RaiseComplaint() {
  const navigate = useNavigate();

  const [form, setForm]       = useState({ category: '', description: '' });
  const [photo, setPhoto]     = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('category', form.category);
      formData.append('description', form.description);
      if (photo) formData.append('photo', photo);

      const { data } = await axiosInstance.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess(`Complaint submitted successfully. ID: ${data.id}`);
      setForm({ category: '', description: '' });
      setPhoto(null);
      setPreview(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit complaint.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Raise a Complaint</h1>
          <Link to="/complaints" className="text-sm text-primary hover:underline">
            ← Back to My Complaints
          </Link>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-success text-sm rounded-lg px-4 py-3 mb-4">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-danger text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Describe the issue in detail…"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Photo (optional)</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhoto}
                className="text-sm text-gray-600"
              />
              {preview && (
                <img
                  src={preview}
                  alt="Preview"
                  className="mt-3 rounded-lg max-h-48 object-cover border border-gray-200"
                />
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-60"
            >
              {loading ? 'Submitting…' : 'Submit Complaint'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
