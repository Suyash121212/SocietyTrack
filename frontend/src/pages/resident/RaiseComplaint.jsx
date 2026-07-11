import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Loader2, ImagePlus, X, Zap, Droplets, ShieldCheck, Sparkles, MoreHorizontal } from 'lucide-react';
import { axiosInstance } from '../../api/axios.js';
import Layout from '../../components/Layout.jsx';

const TOKENS = {
  '--bg': '#FAFAFA',
  '--surface': '#FFFFFF',
  '--border': '#E8EAED',
  '--ink': '#111318',
  '--ink-2': '#667085',
  '--ink-3': '#98A2B3',
  '--accent': '#3652E0',
  '--accent-hover': '#2A41B8',
  '--accent-soft': '#EEF1FE',
  '--success': '#15803D',
};

// Values sent to the API are unchanged — only labels/icons are new.
const CATEGORIES = [
  { value: 'ELECTRICAL', label: 'Electrical', Icon: Zap },
  { value: 'PLUMBING', label: 'Plumbing', Icon: Droplets },
  { value: 'SECURITY', label: 'Security', Icon: ShieldCheck },
  { value: 'CLEANING', label: 'Cleaning', Icon: Sparkles },
  { value: 'OTHER', label: 'Other', Icon: MoreHorizontal },
];

// Form page for residents to submit a new maintenance complaint
export default function RaiseComplaint() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ category: '', description: '' });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
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

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.category) {
      setError('Please select a category.');
      return;
    }

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
      <div className="mx-auto max-w-xl p-6 font-['Inter'] text-[var(--ink)] md:p-8" style={TOKENS}>
        {/* Page header */}
        <div className="mb-6">
          <h1 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[var(--ink)]">Raise a complaint</h1>
          <p className="mt-0.5 text-sm text-[var(--ink-2)]">Submit a new maintenance request for your unit</p>
        </div>

        {success && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-[var(--success)]">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
            <span>{error}</span>
          </div>
        )}

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category — visual picker instead of a native dropdown, so all 5 options are visible at once */}
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--ink)]">Category</label>
              <div className="grid grid-cols-3 gap-2.5">
                {CATEGORIES.map(({ value, label, Icon }) => {
                  const selected = form.category === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, category: value }))}
                      className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center transition-all ${
                        selected
                          ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                          : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)]/30 hover:bg-[var(--bg)]'
                      }`}
                    >
                      <Icon
                        className={`h-5 w-5 ${selected ? 'text-[var(--accent)]' : 'text-[var(--ink-3)]'}`}
                        strokeWidth={1.75}
                      />
                      <span className={`text-xs font-medium ${selected ? 'text-[var(--accent)]' : 'text-[var(--ink-2)]'}`}>
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="description" className="text-sm font-medium text-[var(--ink)]">
                  Description
                </label>
                <span className="text-xs text-[var(--ink-3)]">{form.description.length} characters</span>
              </div>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Describe the issue — what's wrong, where, and since when."
                className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm text-[var(--ink)] placeholder-[var(--ink-3)] transition-all focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
              />
            </div>

            {/* Photo */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-sm font-medium text-[var(--ink)]">Photo</label>
                <span className="text-xs text-[var(--ink-3)]">Optional</span>
              </div>

              {preview ? (
                <div className="relative">
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-56 w-full rounded-xl border border-[var(--border)] object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/75"
                    aria-label="Remove photo"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--border)] px-4 py-8 transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]/40">
                  <ImagePlus className="h-6 w-6 text-[var(--ink-3)]" strokeWidth={1.5} />
                  <span className="text-sm text-[var(--ink-2)]">Click to upload a photo</span>
                  <span className="text-xs text-[var(--ink-3)]">JPEG, PNG or WebP</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhoto}
                    className="sr-only"
                  />
                </label>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--accent-hover)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                  Submitting…
                </>
              ) : (
                'Submit complaint'
              )}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}