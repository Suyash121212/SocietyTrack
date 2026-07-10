import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { axiosInstance } from '../../api/axios.js';

const StatCard = ({ label, value, highlight }) => (
  <div className={`bg-white rounded-xl shadow-sm p-5 ${highlight ? 'border-l-4 border-danger' : ''}`}>
    <p className="text-xs text-neutral uppercase tracking-wide font-medium">{label}</p>
    {value === null ? (
      <div className="animate-pulse mt-2 h-8 bg-gray-100 rounded w-16" />
    ) : (
      <p className={`text-3xl font-bold mt-1 ${highlight ? 'text-danger' : 'text-gray-800'}`}>
        {value}
      </p>
    )}
  </div>
);

export default function AdminDashboard() {
  const [data, setData]   = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    axiosInstance.get('/admin/dashboard')
      .then(({ data }) => setData(data))
      .catch(() => setError('Failed to load dashboard.'));
  }, []);

  const loading = !data && !error;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <div className="flex gap-4 text-sm">
            <Link to="/admin/complaints" className="text-primary hover:underline">All Complaints</Link>
            <Link to="/admin/notices"    className="text-primary hover:underline">Notices</Link>
            <Link to="/admin/config"     className="text-primary hover:underline">Config</Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-danger text-sm rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-sm font-semibold text-neutral uppercase tracking-wide mb-3">Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard label="Total Complaints" value={loading ? null : data.total} />
            <StatCard label="Overdue"          value={loading ? null : data.overdue} highlight />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-sm font-semibold text-neutral uppercase tracking-wide mb-3">By Status</h2>
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Open"        value={loading ? null : data?.byStatus?.OPEN} />
            <StatCard label="In Progress" value={loading ? null : data?.byStatus?.IN_PROGRESS} />
            <StatCard label="Resolved"    value={loading ? null : data?.byStatus?.RESOLVED} />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-neutral uppercase tracking-wide mb-3">By Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {['ELECTRICAL', 'PLUMBING', 'SECURITY', 'CLEANING', 'OTHER'].map((cat) => (
              <StatCard
                key={cat}
                label={cat.charAt(0) + cat.slice(1).toLowerCase()}
                value={loading ? null : data?.byCategory?.[cat]}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
