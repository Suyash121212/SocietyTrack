import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, AlertCircle, Loader2, ImagePlus, X,
  Zap, Droplets, ShieldCheck, Sparkles, MoreHorizontal,
} from 'lucide-react';
import { axiosInstance } from '../../api/axios.js';
import Layout from '../../components/Layout.jsx';

const CATEGORIES = [
  { value: 'ELECTRICAL', label: 'Electrical', Icon: Zap },
  { value: 'PLUMBING',   label: 'Plumbing',   Icon: Droplets },
  { value: 'SECURITY',   label: 'Security',   Icon: ShieldCheck },
  { value: 'CLEANING',   label: 'Cleaning',   Icon: Sparkles },
  { value: 'OTHER',      label: 'Other',       Icon: MoreHorizontal },
];

const MAX_PHOTOS = 3;

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

export default function RaiseComplaint() {
  const [form,    setForm]    = useState({ category: '', description: '' });
  const [photos,  setPhotos]  = useState([]);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handlePhotos = (e) => {
    const incoming  = Array.from(e.target.files ?? []);
    const remaining = MAX_PHOTOS - photos.length;
    const toAdd     = incoming.slice(0, remaining).map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos(p => [...p, ...toAdd]);
    e.target.value = '';
  };

  const removePhoto = (i) => {
    setPhotos(p => {
      URL.revokeObjectURL(p[i].preview);
      return p.filter((_, idx) => idx !== i);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.category) { setError('Please select a category.'); return; }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('category',    form.category);
      fd.append('description', form.description);
      photos.forEach(({ file }) => fd.append('photos', file));

      const { data } = await axiosInstance.post('/complaints', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess(`Complaint submitted · ID: ${data.id}`);
      setForm({ category: '', description: '' });
      photos.forEach(({ preview }) => URL.revokeObjectURL(preview));
      setPhotos([]);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit complaint.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-xl mx-auto">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Raise a Complaint</h1>
            <p className="page-subtitle">Submit a new maintenance request for your unit</p>
          </div>
        </div>

        {/* Alerts */}
        <AnimatePresence>
          {success && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              className="mb-5 flex items-start gap-2.5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 overflow-hidden"
            >
              <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-green-500" strokeWidth={2} />
              {success}
            </motion.div>
          )}
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 overflow-hidden"
            >
              <AlertCircle size={15} className="shrink-0 mt-0.5" strokeWidth={2} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07 } } }}>

          {/* Form card */}
          <motion.div variants={fadeUp} className="card p-6">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Category picker */}
              <div>
                <label className="label">Category</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {CATEGORIES.map(({ value, label, Icon }) => {
                    const selected = form.category === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setForm(p => ({ ...p, category: value }))}
                        className={`flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center transition-all duration-150
                          ${selected
                            ? 'border-brand-400 bg-brand-50 shadow-input'
                            : 'border-surface-200 bg-surface-0 hover:border-brand-200 hover:bg-brand-50/40'
                          }`}
                      >
                        <Icon
                          size={18}
                          strokeWidth={selected ? 2.25 : 1.75}
                          className={selected ? 'text-brand-600' : 'text-ink-faint'}
                        />
                        <span className={`text-xs font-semibold ${selected ? 'text-brand-700' : 'text-ink-muted'}`}>
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="description" className="label mb-0">Description</label>
                  <span className="text-xs text-ink-faint tabular-nums">{form.description.length} chars</span>
                </div>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Describe the issue — what's wrong, where, and since when."
                  className="input resize-none"
                />
              </div>

              {/* Photos */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0">
                    Photos
                    <span className="ml-1.5 normal-case font-normal text-ink-faint">
                      {photos.length}/{MAX_PHOTOS}
                    </span>
                  </label>
                  <span className="text-xs text-ink-faint">Optional</span>
                </div>

                {/* Preview grid */}
                {photos.length > 0 && (
                  <div className="mb-2.5 grid grid-cols-3 gap-2">
                    {photos.map(({ preview }, idx) => (
                      <div key={preview} className="relative aspect-square">
                        <img
                          src={preview}
                          alt={`Photo ${idx + 1}`}
                          className="h-full w-full rounded-xl object-cover border border-surface-200"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                          aria-label={`Remove photo ${idx + 1}`}
                        >
                          <X size={11} strokeWidth={2.5} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload zone */}
                {photos.length < MAX_PHOTOS && (
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-surface-200 px-4 py-7 transition-all hover:border-brand-300 hover:bg-brand-50/30">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-100">
                      <ImagePlus size={16} className="text-ink-faint" strokeWidth={1.75} />
                    </div>
                    <p className="text-sm font-medium text-ink-muted">
                      {photos.length === 0 ? 'Click to upload photos' : 'Add another photo'}
                    </p>
                    <p className="text-xs text-ink-faint">JPEG, PNG or WebP · max 5 MB each · up to {MAX_PHOTOS} total</p>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handlePhotos}
                      className="sr-only"
                    />
                  </label>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-base"
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" strokeWidth={2} /> Submitting…</>
                ) : 'Submit Complaint'}
              </button>
            </form>
          </motion.div>

        </motion.div>
      </div>
    </Layout>
  );
}
