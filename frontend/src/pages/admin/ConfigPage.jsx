import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings2, Clock, RotateCcw, ShieldCheck,
  Minus, Plus, AlertTriangle, CheckCircle2, Loader2,
} from 'lucide-react';
import { axiosInstance } from '../../api/axios.js';
import Layout from '../../components/Layout.jsx';

// ─── Reusable numeric config card ────────────────────────────────────────────

function ConfigCard({ icon: Icon, title, description, getRoute, putRoute, min = 1 }) {
  const [value,    setValue]    = useState('');
  const [current,  setCurrent]  = useState(null);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [init,     setInit]     = useState(true);

  useEffect(() => {
    axiosInstance.get(getRoute)
      .then(({ data }) => { setCurrent(data.value); setValue(String(data.value)); })
      .catch(() => setError('Failed to load.'))
      .finally(() => setInit(false));
  }, [getRoute]);

  const adjust = delta => setValue(p => String(Math.max(min, (parseInt(p, 10) || 0) + delta)));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < min) { setError(`Must be ≥ ${min}`); return; }
    setLoading(true);
    try {
      const { data } = await axiosInstance.put(putRoute, { value: parsed });
      setCurrent(data.value);
      setSuccess(`Updated to ${data.value} days`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save.');
    } finally {
      setLoading(false);
    }
  };

  const isDirty = current !== null && Number(value) !== current;

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 shrink-0">
            <Icon size={16} className="text-brand-600" strokeWidth={2} />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">{title}</p>
            <p className="text-xs text-ink-faint leading-relaxed mt-0.5 max-w-[220px]">{description}</p>
          </div>
        </div>

        {init ? (
          <div className="skeleton h-9 w-16 rounded-xl" />
        ) : current !== null ? (
          <motion.div key={current} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex items-baseline gap-1 bg-brand-50 text-brand-700 rounded-xl px-3 py-1.5 border border-brand-200 shrink-0"
          >
            <span className="text-xl font-bold tabular-nums">{current}</span>
            <span className="text-xs text-brand-500">days</span>
          </motion.div>
        ) : null}
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div key="e" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3.5 py-2.5 mb-3 overflow-hidden"
          >
            <AlertTriangle size={12} className="mt-0.5 shrink-0" strokeWidth={2} /> {error}
          </motion.div>
        )}
        {success && (
          <motion.div key="s" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl px-3.5 py-2.5 mb-3 overflow-hidden"
          >
            <CheckCircle2 size={12} className="mt-0.5 shrink-0" strokeWidth={2} /> {success}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="label">Days</label>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => adjust(-1)} className="btn-icon" aria-label="Decrease">
              <Minus size={14} strokeWidth={2.5} />
            </button>
            <input
              type="number" min={min} value={value}
              onChange={e => setValue(e.target.value)} required
              className="input text-center font-semibold tabular-nums max-w-[90px]"
            />
            <button type="button" onClick={() => adjust(1)} className="btn-icon" aria-label="Increase">
              <Plus size={14} strokeWidth={2.5} />
            </button>
            {isDirty && <span className="text-xs text-amber-600 ml-1">Unsaved · was {current}</span>}
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <><Loader2 size={13} className="animate-spin" strokeWidth={2} /> Saving…</> : 'Save changes'}
        </button>
      </form>
    </div>
  );
}

// ─── SLA matrix ───────────────────────────────────────────────────────────────

const CATS  = ['ELECTRICAL', 'PLUMBING', 'SECURITY', 'CLEANING', 'OTHER'];
const PRIOS = ['HIGH', 'MEDIUM', 'LOW', 'DEFAULT'];
const PRIO_LABEL = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low', DEFAULT: 'Default' };

function SlaMatrix() {
  const [matrix,  setMatrix]  = useState({});
  const [saving,  setSaving]  = useState(null);
  const [errors,  setErrors]  = useState({});
  const [success, setSuccess] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get('/admin/config/sla')
      .then(({ data }) => {
        const m = {};
        data.forEach(p => { m[`${p.category}-${p.priority ?? 'DEFAULT'}`] = p.thresholdDays; });
        setMatrix(m);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (cat, pri) => {
    const key  = `${cat}-${pri}`;
    const days = Number(matrix[key]);
    if (!Number.isInteger(days) || days < 1) { setErrors(e => ({ ...e, [key]: '≥ 1' })); return; }
    setErrors(e => ({ ...e, [key]: null }));
    setSaving(key);
    try {
      await axiosInstance.put('/admin/config/sla', {
        category: cat,
        priority: pri === 'DEFAULT' ? null : pri,
        thresholdDays: days,
      });
      setSuccess(s => ({ ...s, [key]: true }));
      setTimeout(() => setSuccess(s => ({ ...s, [key]: false })), 2000);
    } catch {
      setErrors(e => ({ ...e, [key]: 'Failed' }));
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <div className="skeleton h-52 rounded-2xl" />;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-start gap-3 px-5 py-4 border-b border-surface-200 bg-surface-50">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 shrink-0">
          <ShieldCheck size={16} className="text-brand-600" strokeWidth={2} />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">SLA Policy Matrix</p>
          <p className="text-xs text-ink-faint mt-0.5 leading-relaxed">
            Days until overdue per category × priority. The cron picks the most specific match, falls back to Default, then the global threshold.
            On breach: <span className="font-medium text-ink">overdue flag set + priority auto-bumped one level.</span>
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-surface-50 border-b border-surface-200">
            <tr>
              <th className="px-4 py-2.5 text-left font-semibold text-ink-faint uppercase tracking-wider w-28">Category</th>
              {PRIOS.map(p => (
                <th key={p} className="px-3 py-2.5 text-center font-semibold text-ink-faint uppercase tracking-wider">
                  {PRIO_LABEL[p]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {CATS.map(cat => (
              <tr key={cat} className="hover:bg-surface-50 transition-colors">
                <td className="px-4 py-3 font-semibold text-ink capitalize">{cat.toLowerCase()}</td>
                {PRIOS.map(pri => {
                  const key     = `${cat}-${pri}`;
                  const isSav   = saving === key;
                  const isOk    = success[key];
                  const err     = errors[key];
                  return (
                    <td key={pri} className="px-3 py-2.5">
                      <div className="flex items-center gap-1 justify-center">
                        <input
                          type="number" min={1}
                          value={matrix[key] ?? ''}
                          onChange={e => setMatrix(m => ({ ...m, [key]: e.target.value }))}
                          className={`w-12 text-center rounded-lg border py-1.5 text-xs font-semibold tabular-nums focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 transition-all ${err ? 'border-red-300 bg-red-50' : 'border-surface-200 bg-surface-0'}`}
                        />
                        <button
                          onClick={() => handleSave(cat, pri)}
                          disabled={isSav}
                          className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50
                            ${isOk ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-brand-50 text-brand-600 hover:bg-brand-100 border border-brand-200'}`}
                        >
                          {isSav ? '…' : isOk ? '✓' : 'Set'}
                        </button>
                      </div>
                      {err && <p className="text-red-500 text-center mt-0.5">{err}</p>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConfigPage() {
  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">

        <div className="page-header">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50">
              <Settings2 size={18} className="text-brand-600" strokeWidth={2} />
            </div>
            <div>
              <h1 className="page-title">Settings</h1>
              <p className="page-subtitle">Configure thresholds and SLA policies</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ConfigCard
            icon={Clock}
            title="Overdue Threshold"
            description="Global fallback used when no SLA row matches the complaint."
            getRoute="/admin/config/overdue-days"
            putRoute="/admin/config/overdue-days"
          />
          <ConfigCard
            icon={RotateCcw}
            title="Reopen Window"
            description="How many days after resolution a resident can reopen a complaint."
            getRoute="/admin/config/reopen-days"
            putRoute="/admin/config/reopen-days"
          />
        </div>

        <SlaMatrix />

      </div>
    </Layout>
  );
}
