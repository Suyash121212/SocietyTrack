import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, Clock, AlertTriangle, CheckCircle2, Minus, Plus, RotateCcw } from 'lucide-react';
import { axiosInstance } from '../../api/axios.js';
import Layout from '../../components/Layout.jsx';

// Reusable numeric stepper card for a single config key
function ConfigCard({ icon: Icon, title, description, configKey, getRoute, putRoute, min = 1 }) {
  const [value, setValue]     = useState('');
  const [current, setCurrent] = useState(null);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get(getRoute)
      .then(({ data }) => {
        setCurrent(data.value);
        setValue(String(data.value));
      })
      .catch(() => setError('Failed to load config.'))
      .finally(() => setInitialLoading(false));
  }, [getRoute]);

  const adjust = (delta) => {
    setValue((prev) => {
      const n = Math.max(min, (parseInt(prev, 10) || 0) + delta);
      return String(n);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < min) {
      setError(`Value must be a positive integer (minimum ${min}).`);
      return;
    }

    setLoading(true);
    try {
      const { data } = await axiosInstance.put(putRoute, { value: parsed });
      setCurrent(data.value);
      setSuccess(`Updated to ${data.value} days.`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update config.');
    } finally {
      setLoading(false);
    }
  };

  const isDirty = current !== null && Number(value) !== current;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-sm font-semibold text-gray-800 mb-1 flex items-center gap-1.5">
            <Icon size={14} className="text-gray-400" strokeWidth={2.25} />
            {title}
          </p>
          <p className="text-xs text-gray-400 leading-relaxed max-w-[220px]">{description}</p>
        </div>

        {initialLoading ? (
          <div className="animate-pulse h-8 w-16 bg-gray-100 rounded-lg" />
        ) : current !== null && (
          <motion.div
            key={current}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex items-baseline gap-1 bg-indigo-50 text-indigo-700 rounded-lg px-3 py-1.5 shrink-0"
          >
            <span className="text-xl font-bold tabular-nums">{current}</span>
            <span className="text-xs font-medium text-indigo-500">days</span>
          </motion.div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg px-4 py-2.5 mb-4 overflow-hidden"
          >
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
        {success && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-lg px-4 py-2.5 mb-4 overflow-hidden"
          >
            <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
            <span>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Days</label>
          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => adjust(-1)}
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-200 transition-colors shrink-0"
              aria-label="Decrease"
            >
              <Minus size={15} strokeWidth={2.5} />
            </motion.button>

            <input
              type="number"
              min={min}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
              className="w-full text-center border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-gray-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-shadow"
            />

            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => adjust(1)}
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-200 transition-colors shrink-0"
              aria-label="Increase"
            >
              <Plus size={15} strokeWidth={2.5} />
            </motion.button>
          </div>
          {isDirty && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-amber-600 mt-2"
            >
              Unsaved change — currently {current} days
            </motion.p>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        >
          {loading ? 'Saving…' : 'Save changes'}
        </motion.button>
      </form>
    </motion.div>
  );
}

// Admin settings page — overdue threshold and reopen window
export default function ConfigPage() {
  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-md mx-auto">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600">
            <Settings2 size={18} strokeWidth={2.25} />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h1>
            <p className="text-sm text-gray-500 mt-0.5">Configure complaint thresholds</p>
          </div>
        </div>

        <div className="space-y-4">
          <ConfigCard
            icon={Clock}
            title="Overdue Threshold"
            description="Complaints unresolved past this many days are flagged overdue."
            configKey="overdue_days"
            getRoute="/admin/config/overdue-days"
            putRoute="/admin/config/overdue-days"
          />

          <ConfigCard
            icon={RotateCcw}
            title="Reopen Window"
            description="Residents can reopen a resolved complaint within this many days. After the window closes they must raise a new complaint."
            configKey="reopen_window_days"
            getRoute="/admin/config/reopen-days"
            putRoute="/admin/config/reopen-days"
          />
        </div>
      </div>
    </Layout>
  );
}
