import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { axiosInstance } from '../../api/axios.js';
import Layout from '../../components/Layout.jsx';

const StatCard = ({ label, value, highlight, icon }) => (
  <div className={`bg-white rounded-xl border ${highlight ? 'border-red-100' : 'border-gray-100'} p-5 hover:shadow-md transition-shadow`}>
    <div className="flex items-center justify-between mb-3">
      <p className="text-xs font-semibold text-neutral uppercase tracking-widest">{label}</p>
      {icon && <span className="text-lg">{icon}</span>}
    </div>
    {value === null ? (
      <div className="animate-pulse h-9 bg-gray-100 rounded-lg w-16" />
    ) : (
      <p className={`text-3xl font-bold ${highlight ? 'text-danger' : 'text-gray-900'}`}>{value}</p>
    )}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-md px-4 py-3 text-sm">
      <p className="text-neutral font-medium mb-1">Week of {label}</p>
      <p className="text-primary font-bold">{payload[0].value} complaint{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  );
};

export default function AdminDashboard() {
  const [data, setData]         = useState(null);
  const [weekly, setWeekly]     = useState(null);
  const [error, setError]       = useState('');

  useEffect(() => {
    axiosInstance.get('/admin/dashboard')
      .then(({ data }) => setData(data))
      .catch(() => setError('Failed to load dashboard.'));

    axiosInstance.get('/admin/dashboard/weekly')
      .then(({ data }) => setWeekly(data))
      .catch(() => {});
  }, []);

  const loading = !data && !error;

  return (
    <Layout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-neutral mt-0.5">Society maintenance at a glance</p>
          </div>
          <div className="flex gap-3 text-sm">
            <Link to="/admin/complaints" className="text-primary hover:underline">All Complaints</Link>
            <Link to="/admin/notices"    className="text-primary hover:underline">Notices</Link>
            <Link to="/admin/config"     className="text-primary hover:underline">Config</Link>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
            <span>⚠</span><span>{error}</span>
          </div>
        )}

        {/* Overview */}
        <div className="mb-8">
          <h2 className="text-xs font-bold text-neutral uppercase tracking-widest mb-4">Overview</h2>
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Total Complaints" value={loading ? null : data.total}  icon="📝" />
            <StatCard label="Overdue"           value={loading ? null : data.overdue} highlight icon="⚠️" />
          </div>
        </div>

        {/* By Status */}
        <div className="mb-8">
          <h2 className="text-xs font-bold text-neutral uppercase tracking-widest mb-4">By Status</h2>
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Open"        value={loading ? null : data?.byStatus?.OPEN}        icon="🔵" />
            <StatCard label="In Progress" value={loading ? null : data?.byStatus?.IN_PROGRESS} icon="🟡" />
            <StatCard label="Resolved"    value={loading ? null : data?.byStatus?.RESOLVED}    icon="✅" />
          </div>
        </div>

        {/* By Category */}
        <div className="mb-8">
          <h2 className="text-xs font-bold text-neutral uppercase tracking-widest mb-4">By Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard label="Electrical" value={loading ? null : data?.byCategory?.ELECTRICAL} icon="⚡" />
            <StatCard label="Plumbing"   value={loading ? null : data?.byCategory?.PLUMBING}   icon="🔧" />
            <StatCard label="Security"   value={loading ? null : data?.byCategory?.SECURITY}   icon="🔒" />
            <StatCard label="Cleaning"   value={loading ? null : data?.byCategory?.CLEANING}   icon="🧹" />
            <StatCard label="Other"      value={loading ? null : data?.byCategory?.OTHER}      icon="📦" />
          </div>
        </div>

        {/* Weekly chart */}
        <div>
          <h2 className="text-xs font-bold text-neutral uppercase tracking-widest mb-4">Complaints per Week — Last 6 Weeks</h2>
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            {!weekly ? (
              <div className="animate-pulse h-48 bg-gray-50 rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weekly} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                  <Bar
                    dataKey="complaints"
                    fill="#2563EB"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
