import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, AlertTriangle, CircleDot, Clock, CheckCircle2,
  Zap, Wrench, ShieldCheck, Sparkles, Package, RefreshCw,
} from 'lucide-react';
import { axiosInstance } from '../../api/axios.js';
import Layout from '../../components/Layout.jsx';

/* ---------- motion presets ---------- */
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

/* ---------- overview stat card ---------- */
const StatCard = ({ label, value, icon: Icon, tone = 'default' }) => {
  const tones = {
    default: {
      ring: 'from-indigo-50 to-white',
      border: 'border-gray-100',
      iconBg: 'bg-indigo-50 text-indigo-600',
      value: 'text-gray-900',
    },
    danger: {
      ring: 'from-red-50 to-white',
      border: 'border-red-100',
      iconBg: 'bg-red-50 text-red-600',
      value: 'text-red-600',
    },
  };
  const t = tones[tone];

  return (
    <motion.div
      variants={item}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className={`relative overflow-hidden rounded-2xl border ${t.border} bg-gradient-to-b ${t.ring} p-5 shadow-sm hover:shadow-lg transition-shadow`}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{label}</p>
        <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${t.iconBg}`}>
          <Icon size={16} strokeWidth={2.25} />
        </span>
      </div>
      {value === null ? (
        <div className="animate-pulse h-9 bg-gray-100 rounded-lg w-16" />
      ) : (
        <motion.p
          key={value}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-3xl font-bold tabular-nums ${t.value}`}
        >
          {value}
        </motion.p>
      )}
    </motion.div>
  );
};

/* ---------- status row (with mini progress bar) ---------- */
const StatusRow = ({ label, value, total, icon: Icon, color }) => {
  const pct = total ? Math.round((value / total) * 100) : 0;
  const colors = {
    blue: { text: 'text-blue-600', bg: 'bg-blue-50', bar: 'bg-blue-500' },
    amber: { text: 'text-amber-600', bg: 'bg-amber-50', bar: 'bg-amber-500' },
    emerald: { text: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-500' },
  }[color];

  return (
    <motion.div
      variants={item}
      className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${colors.bg} ${colors.text}`}>
            <Icon size={15} strokeWidth={2.25} />
          </span>
          <p className="text-sm font-semibold text-gray-700">{label}</p>
        </div>
        <span className="text-xs font-medium text-gray-400">{pct}%</span>
      </div>
      {value === null ? (
        <div className="animate-pulse h-8 bg-gray-100 rounded-lg w-12 mb-3" />
      ) : (
        <p className={`text-2xl font-bold tabular-nums ${colors.text} mb-3`}>{value}</p>
      )}
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${colors.bar}`}
          initial={{ width: 0 }}
          animate={{ width: value === null ? '0%' : `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
        />
      </div>
    </motion.div>
  );
};

/* ---------- category tile ---------- */
const CategoryTile = ({ label, value, icon: Icon, color }) => {
  const colors = {
    yellow: 'bg-yellow-50 text-yellow-600',
    sky: 'bg-sky-50 text-sky-600',
    violet: 'bg-violet-50 text-violet-600',
    teal: 'bg-teal-50 text-teal-600',
    gray: 'bg-gray-100 text-gray-500',
  }[color];

  return (
    <motion.div
      variants={item}
      whileHover={{ y: -2 }}
      className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col items-start gap-3"
    >
      <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${colors}`}>
        <Icon size={16} strokeWidth={2.25} />
      </span>
      <div>
        {value === null ? (
          <div className="animate-pulse h-6 bg-gray-100 rounded w-8 mb-1" />
        ) : (
          <p className="text-xl font-bold text-gray-900 tabular-nums leading-none mb-1">{value}</p>
        )}
        <p className="text-xs font-medium text-gray-500">{label}</p>
      </div>
    </motion.div>
  );
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = () => {
    axiosInstance.get('/admin/dashboard')
      .then(({ data }) => {
        setData(data);
        setError('');
        setLastUpdated(new Date());
      })
      .catch(() => setError('Failed to load dashboard.'));
  };

  useEffect(() => { fetchData(); }, []);

  const loading = !data && !error;
  const total = data?.total ?? 0;
  const resolved = data?.byStatus?.RESOLVED ?? 0;
  const resolutionRate = total ? Math.round((resolved / total) * 100) : 0;

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        {/* header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Society maintenance at a glance</p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-gray-400 hidden sm:block">
                Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <motion.button
              whileTap={{ scale: 0.94, rotate: 180 }}
              onClick={fetchData}
              className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-indigo-600 hover:border-indigo-200 transition-colors shadow-sm"
              aria-label="Refresh"
            >
              <RefreshCw size={15} strokeWidth={2.25} />
            </motion.button>
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3 mb-6"
          >
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Overview */}
        <motion.div variants={container} initial="hidden" animate="show" className="mb-9">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard label="Total Complaints" value={loading ? null : total} icon={FileText} />
            <StatCard label="Overdue" value={loading ? null : data.overdue} icon={AlertTriangle} tone="danger" />

            {/* resolution rate ring — bonus card */}
            <motion.div
              variants={item}
              whileHover={{ y: -3 }}
              className="hidden md:flex items-center gap-4 rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50 to-white p-5 shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="relative w-16 h-16 shrink-0">
                <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
                  <circle cx="32" cy="32" r="27" fill="none" stroke="#ecfdf5" strokeWidth="7" />
                  <motion.circle
                    cx="32" cy="32" r="27" fill="none" stroke="#10b981" strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 27}
                    initial={{ strokeDashoffset: 2 * Math.PI * 27 }}
                    animate={{ strokeDashoffset: loading ? 2 * Math.PI * 27 : 2 * Math.PI * 27 * (1 - resolutionRate / 100) }}
                    transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-emerald-700">
                  {loading ? '–' : `${resolutionRate}%`}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Resolved</p>
                <p className="text-xs text-gray-400 leading-snug">of all complaints raised so far</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* By Status */}
        <motion.div variants={container} initial="hidden" animate="show" className="mb-9">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">By Status</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatusRow label="Open" value={loading ? null : data?.byStatus?.OPEN} total={total} icon={CircleDot} color="blue" />
            <StatusRow label="In Progress" value={loading ? null : data?.byStatus?.IN_PROGRESS} total={total} icon={Clock} color="amber" />
            <StatusRow label="Resolved" value={loading ? null : data?.byStatus?.RESOLVED} total={total} icon={CheckCircle2} color="emerald" />
          </div>
        </motion.div>

        {/* By Category */}
        <motion.div variants={container} initial="hidden" animate="show">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">By Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <CategoryTile label="Electrical" value={loading ? null : data?.byCategory?.ELECTRICAL} icon={Zap} color="yellow" />
            <CategoryTile label="Plumbing" value={loading ? null : data?.byCategory?.PLUMBING} icon={Wrench} color="sky" />
            <CategoryTile label="Security" value={loading ? null : data?.byCategory?.SECURITY} icon={ShieldCheck} color="violet" />
            <CategoryTile label="Cleaning" value={loading ? null : data?.byCategory?.CLEANING} icon={Sparkles} color="teal" />
            <CategoryTile label="Other" value={loading ? null : data?.byCategory?.OTHER} icon={Package} color="gray" />
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
