import { useState } from 'react';
import { motion } from 'framer-motion';
import { Megaphone, AlertTriangle, Loader2, CalendarClock, Star } from 'lucide-react';
import { axiosInstance } from '../api/axios.js';

export default function PostNoticeForm({ onCreated }) {
  const EMPTY = { title: '', body: '', isImportant: false, validUntil: '' };
  const [form, setForm]       = useState(EMPTY);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [e.target.name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        title: form.title,
        body: form.body,
        isImportant: form.isImportant,
        ...(form.validUntil ? { validUntil: new Date(form.validUntil).toISOString() } : {}),
      };
      const { data } = await axiosInstance.post('/admin/notices', payload);
      onCreated(data);
      setForm(EMPTY);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post notice.');
    } finally {
      setLoading(false);
    }
  };

  const minDateTime = new Date(Date.now() + 60_000).toISOString().slice(0, 16);

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50">
          <Megaphone size={15} className="text-brand-600" strokeWidth={2} />
        </div>
        <h2 className="text-sm font-semibold text-ink">Post a Notice</h2>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3.5 py-2.5 mb-4"
        >
          <AlertTriangle size={13} className="mt-0.5 shrink-0" strokeWidth={2} />
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="label">Title</label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            placeholder="Water supply interruption on Sunday…"
            className="input"
          />
        </div>

        <div>
          <label className="label">Body</label>
          <textarea
            name="body"
            value={form.body}
            onChange={handleChange}
            required
            rows={3}
            placeholder="Provide the full details here…"
            className="input resize-none"
          />
        </div>

        <div>
          <label className="label flex items-center gap-1.5">
            <CalendarClock size={11} strokeWidth={2} />
            Expires at
            <span className="normal-case font-normal text-ink-faint">(optional)</span>
          </label>
          <input
            type="datetime-local"
            name="validUntil"
            value={form.validUntil}
            onChange={handleChange}
            min={minDateTime}
            className="input"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2.5 cursor-pointer select-none group">
            <input
              type="checkbox"
              name="isImportant"
              checked={form.isImportant}
              onChange={handleChange}
              className="w-4 h-4 rounded border-surface-200 text-brand-600 focus:ring-brand-500 focus:ring-offset-0"
            />
            <span className="flex items-center gap-1.5 text-sm font-medium text-ink-muted group-hover:text-ink transition-colors">
              <Star size={13} strokeWidth={2} className={form.isImportant ? 'text-amber-500 fill-amber-500' : 'text-ink-faint'} />
              Mark as important
            </span>
          </label>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <><Loader2 size={14} className="animate-spin" strokeWidth={2} /> Posting…</>
            ) : (
              <>
                <Megaphone size={14} strokeWidth={2} />
                Post Notice
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
