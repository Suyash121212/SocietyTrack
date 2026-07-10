import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { axiosInstance } from '../../api/axios.js';

export default function ConfigPage() {
  const [value, setValue]     = useState('');
  const [current, setCurrent] = useState(null);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axiosInstance.get('/admin/config/overdue-days')
      .then(({ data }) => {
        setCurrent(data.value);
        setValue(String(data.value));
      })
      .catch(() => setError('Failed to load config.'));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      setError('Value must be a positive integer.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axiosInstance.put('/admin/config/overdue-days', { value: parsed });
      setCurrent(data.value);
      setSuccess(`Threshold updated to ${data.value} days.`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update config.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Overdue Threshold</h1>
          <Link to="/admin/dashboard" className="text-sm text-primary hover:underline">
            ← Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">
          {current !== null && (
            <p className="text-sm text-neutral mb-4">
              Current threshold: <span className="font-semibold text-gray-800">{current} days</span>
            </p>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-danger text-sm rounded-lg px-4 py-2 mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-success text-sm rounded-lg px-4 py-2 mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Days before overdue
              </label>
              <input
                type="number"
                min="1"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-60"
            >
              {loading ? 'Saving…' : 'Save'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
