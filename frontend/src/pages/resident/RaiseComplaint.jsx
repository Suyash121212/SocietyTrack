import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../../api/axios.js';
import Layout from '../../components/Layout.jsx';

const CATEGORIES = ['ELECTRICAL', 'PLUMBING', 'SECURITY', 'CLEANING', 'OTHER'];

// Form page for residents to submit a new maintenance complaint
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
    <Layout>
      <div className="p-6 md:p-8 max-w-xl mx-auto">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Raise a Complaint</h1>
          <p className="text-sm text-neutral mt-0.5">Submit a new maintenance request for your unit</p>
        </div>

        {success && (
          <div className="flex items-start gap-2 bg-green-50 border border-green-100 text-success text-sm rounded-lg px-4 py-3 mb-4">
            <span className="mt-0.5">✓</span>
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            <span className="mt-0.5">⚠</span>
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition bg-white"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition resize-none"
                placeholder="Describe the issue in detail…"
              />
            </div>

            {/* Dropzone-style file upload area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Photo (optional)</label>
              <label
                className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl px-4 py-8 cursor-pointer hover:border-primary hover:bg-blue-50/30 transition-colors"
              >
                <span className="text-2xl">📷</span>
                <span className="text-sm text-gray-500">
                  {photo ? photo.name : 'Click to upload a photo'}
                </span>
                <span className="text-xs text-neutral">JPEG, PNG or WebP</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhoto}
                  className="sr-only"
                />
              </label>
              {preview && (
                <img
                  src={preview}
                  alt="Preview"
                  className="mt-3 rounded-lg max-h-48 object-cover border border-gray-200 w-full"
                />
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting…' : 'Submit Complaint'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
