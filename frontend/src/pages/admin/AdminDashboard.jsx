import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, AlertTriangle, RotateCcw, Clock,
  CheckCircle2, Zap, Droplets, ShieldCheck, Sparkles, Package,
  ArrowUpRight,
} from 'lucide-react';
import { axiosInstance } from '../../api/axios.js';
import Layout from '../../components/Layout.jsx';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } };
const fadeUp  = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } };

const CATEGORY_ICON = { ELECTRICAL: Zap, PLUMBING: Droplets, SECURITY: ShieldCheck, CLEANING: Sparkles, OTHER: Package };
const CATEGORY_ORDER = ['ELECTRICAL', 'SECURITY', 'PLUMBING', 'CLEANING', 'OTHER'];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, iconBg = 'bg-brand-50', iconColor = 'text-brand-600', highlight }) {
  return (
    <motion.div variants={fadeUp} className={`card p-5 transition-all duration-200 hover:shadow-card-hover ${highlight ? 'border-red-200 bg-red-50/50' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-ink-faint uppercase tracking-widest">{label}</p>
        {Icon && (
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${iconBg}`}>
            <Icon size={15} className={iconColor} strokeWidth={2} />
          </div>
        )}
      </div>
      {value === null ? (
        <div className="skeleton h-9 w-20 rounded-xl" />
      ) : (
        <>
          <p className={`text-3xl font-bold tracking-tight ${highlight ? 'text-red-700' : 'text-ink'}`}>{value}</p>
          {sub && <p className="mt-1 text-xs text-ink-faint">{sub}</p>}
        </>
      )}
    </motion.div>
  );
}

function Skeleton({ h = 'h-48' }) {
  return <div className={`skeleton ${h} rounded-2xl`} />;
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-4 py-3 text-xs space-y-1 shadow-modal">
      <p className="font-semibold text-ink-muted mb-1.5">Week of {label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          {p.name}: <span className="font-bold ml-auto pl-4">{p.value ?? '—'}{p.dataKey === 'avgResolutionHours' && p.value != null ? 'h' : ''}</span>
        </p>
      ))}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [data,       setData]       = useState(null);
  const [trend,      setTrend]      = useState(null);
  const [recurring,  setRecurring]  = useState(null);
  const [resolution, setResolution] = useState(null);
  const [error,      setError]      = useState('');

  useEffect(() => {
    axiosInstance.get('/admin/dashboard').then(({ data }) => setData(data)).catch(() => setError('Failed to load dashboard.'));
    axiosInstance.get('/admin/dashboard/weekly').then(({ data }) => setTrend(data)).catch(() => {});
    axiosInstance.get('/admin/dashboard/recurring').then(({ data }) => setRecurring(data)).catch(() => setRecurring([]));
    axiosInstance.get('/admin/dashboard/resolution-by-category').then(({ data }) => setResolution(data)).catch(() => setResolution([]));
  }, []);

  const loading = !data && !error;

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Society maintenance at a glance</p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/complaints" className="btn-secondary btn-sm">Complaints</Link>
            <Link to="/admin/notices"    className="btn-secondary btn-sm">Notices</Link>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle size={15} strokeWidth={2} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Overview */}
        <section>
          <p className="section-title">Overview</p>
          <motion.div
            initial="hidden" animate="show" variants={stagger}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <StatCard label="Total Complaints" value={loading ? null : data?.total}
              icon={TrendingUp} iconBg="bg-brand-50" iconColor="text-brand-600" />
            <StatCard label="Overdue" value={loading ? null : data?.overdue}
              icon={AlertTriangle} iconBg="bg-red-50" iconColor="text-red-500" highlight={data?.overdue > 0} />
            <StatCard label="Avg Resolution" value={loading ? null : (data?.avgResolutionHours != null ? `${data.avgResolutionHours}h` : '—')}
              sub="across all resolved" icon={Clock} iconBg="bg-amber-50" iconColor="text-amber-600" />
            <StatCard label="Reopened" value={loading ? null : data?.byStatus?.REOPENED}
              icon={RotateCcw} iconBg="bg-purple-50" iconColor="text-purple-600" />
          </motion.div>
        </section>

        {/* Status breakdown */}
        <section>
          <p className="section-title">By Status</p>
          <motion.div initial="hidden" animate="show" variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Open"        value={loading ? null : data?.byStatus?.OPEN}        icon={CheckCircle2} iconBg="bg-blue-50"   iconColor="text-blue-500" />
            <StatCard label="In Progress" value={loading ? null : data?.byStatus?.IN_PROGRESS} icon={Clock}        iconBg="bg-amber-50"  iconColor="text-amber-500" />
            <StatCard label="Resolved"    value={loading ? null : data?.byStatus?.RESOLVED}    icon={CheckCircle2} iconBg="bg-green-50"  iconColor="text-green-500" />
            <StatCard label="Reopened"    value={loading ? null : data?.byStatus?.REOPENED}    icon={RotateCcw}    iconBg="bg-purple-50" iconColor="text-purple-500" />
          </motion.div>
        </section>

        {/* Two-col: recurring + resolution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recurring issues */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <p className="section-title mb-0">Recurring Issues — 60 days</p>
            </div>
            <p className="text-xs text-ink-faint -mt-2 mb-3">Flat + category pairs with ≥ 2 complaints</p>

            {recurring === null ? (
              <Skeleton h="h-36" />
            ) : recurring.length === 0 ? (
              <div className="card p-8 text-center">
                <CheckCircle2 size={28} className="mx-auto mb-2 text-green-400" strokeWidth={1.5} />
                <p className="text-sm font-medium text-ink">No recurring issues</p>
                <p className="text-xs text-ink-faint mt-1">No flat has raised the same type of complaint twice in 60 days.</p>
              </div>
            ) : (
              <div className="card divide-y divide-surface-100 overflow-hidden">
                {recurring.map((row, i) => {
                  const Icon = CATEGORY_ICON[row.category] ?? Package;
                  return (
                    <div key={i} className="flex items-center justify-between px-5 py-3.5 hover:bg-surface-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-100">
                          <Icon size={14} className="text-ink-muted" strokeWidth={2} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-ink">Flat {row.flatNo}
                            <span className="ml-2 text-xs font-normal text-ink-muted capitalize">· {row.category.toLowerCase()}</span>
                          </p>
                          <p className="text-xs text-ink-faint">Last: {new Date(row.lastSeen).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>
                        </div>
                      </div>
                      <span className={`badge font-bold ${row.count >= 4 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                        {row.count}×
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Resolution by category */}
          <section>
            <p className="section-title mb-4">Avg Resolution by Category</p>
            {resolution === null ? (
              <Skeleton h="h-36" />
            ) : (
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-surface-50 border-b border-surface-200">
                    <tr>
                      {['Category', 'Avg Time', 'Resolved'].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-ink-faint uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {CATEGORY_ORDER.map(cat => {
                      const row = resolution?.find(r => r.category === cat);
                      const Icon = CATEGORY_ICON[cat] ?? Package;
                      return (
                        <tr key={cat} className="hover:bg-surface-50 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-surface-100">
                                <Icon size={12} className="text-ink-muted" strokeWidth={2} />
                              </div>
                              <span className="capitalize text-ink font-medium">{cat.toLowerCase()}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 font-semibold tabular-nums text-ink">{row ? `${row.avgHours}h` : '—'}</td>
                          <td className="px-5 py-3 tabular-nums text-ink-muted">{row?.resolvedCount ?? 0}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Weekly trend chart */}
        <section>
          <div className="flex items-center justify-between mb-1">
            <p className="section-title mb-0">Weekly Trend — Last 6 Weeks</p>
          </div>
          <p className="text-xs text-ink-faint mb-4">Bars = complaints raised · Line = avg resolution time for that week</p>

          <div className="card p-6">
            {!trend ? (
              <Skeleton h="h-52" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={trend} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left"  allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'Inter' }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'Inter' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}h`} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 12, fontFamily: 'Inter' }} />
                  <Bar yAxisId="left" dataKey="complaints" name="Complaints raised" fill="#3b82f6" radius={[5, 5, 0, 0]} barSize={24} />
                  <Line yAxisId="right" type="monotone" dataKey="avgResolutionHours" name="Avg resolution (h)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }} connectNulls={false} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* Category volume */}
        <section>
          <p className="section-title">Volume by Category</p>
          <motion.div initial="hidden" animate="show" variants={stagger} className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {CATEGORY_ORDER.map(cat => {
              const Icon = CATEGORY_ICON[cat];
              return (
                <StatCard key={cat}
                  label={cat.charAt(0) + cat.slice(1).toLowerCase()}
                  value={loading ? null : data?.byCategory?.[cat]}
                  icon={Icon} iconBg="bg-surface-100" iconColor="text-ink-muted"
                />
              );
            })}
          </motion.div>
        </section>

        {/* Quick nav */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {[
            { label: 'View all complaints', href: '/admin/complaints', sub: 'Triage and manage' },
            { label: 'Post a notice',       href: '/admin/notices',    sub: 'Broadcast to residents' },
            { label: 'Configure SLA',       href: '/admin/config',     sub: 'Thresholds & policies' },
          ].map(item => (
            <Link
              key={item.href}
              to={item.href}
              className="card-hover flex items-center justify-between px-5 py-4 group"
            >
              <div>
                <p className="text-sm font-semibold text-ink">{item.label}</p>
                <p className="text-xs text-ink-faint mt-0.5">{item.sub}</p>
              </div>
              <ArrowUpRight size={15} className="text-ink-faint group-hover:text-brand-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" strokeWidth={2} />
            </Link>
          ))}
        </div>

      </div>
    </Layout>
  );
}
