import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  User, Mail, Lock, Home, Eye, EyeOff,
  Loader2, AlertCircle, ArrowLeft, Shield, CheckCircle2,
} from 'lucide-react';
import { axiosInstance } from '../api/axios.js';

const fade = {
  hidden: { opacity: 0, y: 12 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const PERKS = [
  'Track every maintenance request in real time',
  'Get email updates on every status change',
  'Access your complete complaint history',
];

export default function Register() {
  const navigate = useNavigate();
  const reduce   = useReducedMotion();

  const [form, setForm]       = useState({ name: '', email: '', password: '', flatNo: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axiosInstance.post('/auth/register', form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen font-sans antialiased">
      {/* Left panel */}
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-slate-900 px-12 py-10 lg:flex">
        {/* Subtle grid */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04]" aria-hidden="true">
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-brand-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -right-16 bottom-32 h-48 w-48 rounded-full bg-brand-800/20 blur-3xl pointer-events-none" />

        {/* Logo */}
        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: -8 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600">
              <Shield size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display text-lg font-bold text-white">SocietyTrack</span>
          </Link>
        </motion.div>

        {/* Body */}
        <motion.div
          initial={reduce ? undefined : 'hidden'}
          animate={reduce ? undefined : 'show'}
          variants={stagger}
          className="relative space-y-8"
        >
          <div>
            <motion.h2 variants={fade} className="font-display text-3xl font-bold leading-tight text-white">
              Join your society's
              <br />
              digital workspace.
            </motion.h2>
            <motion.p variants={fade} className="mt-3 text-sm leading-relaxed text-slate-400">
              Create your resident account and get full visibility into every maintenance request.
            </motion.p>
          </div>

          <motion.ul variants={stagger} className="space-y-3">
            {PERKS.map(p => (
              <motion.li key={p} variants={fade} className="flex items-center gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600/20 border border-brand-600/30">
                  <CheckCircle2 size={11} className="text-brand-400" strokeWidth={2.5} />
                </div>
                <span className="text-sm text-slate-300">{p}</span>
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>

        <p className="relative text-xs text-slate-600">© {new Date().getFullYear()} SocietyTrack</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center bg-surface-50 px-6 py-12">
        <motion.div
          initial={reduce ? undefined : 'hidden'}
          animate={reduce ? undefined : 'show'}
          variants={stagger}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <motion.div variants={fade} className="lg:hidden mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600">
                <Shield size={15} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="font-display font-bold text-ink">SocietyTrack</span>
            </Link>
          </motion.div>

          <motion.div variants={fade} className="mb-7">
            <h1 className="font-display text-2xl font-bold text-ink tracking-tight">Create your account</h1>
            <p className="text-sm text-ink-muted mt-1">Register as a resident to get started</p>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              <AlertCircle size={15} strokeWidth={2} className="shrink-0" />
              {error}
            </motion.div>
          )}

          <motion.form variants={fade} onSubmit={handleSubmit} className="space-y-4">
            {/* Full name */}
            <div>
              <label className="label">Full name</label>
              <div className="relative">
                <User size={15} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input type="text" name="name" value={form.name} onChange={handleChange} required placeholder="Raj Sharma" className="input input-icon" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="label">Email address</label>
              <div className="relative">
                <Mail size={15} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="you@example.com" autoComplete="email" className="input input-icon" />
              </div>
            </div>

            {/* Password + Flat */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock size={15} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    name="password" value={form.password} onChange={handleChange}
                    required placeholder="Min 8 chars" autoComplete="new-password"
                    className="input input-icon pr-10"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-muted transition-colors"
                    aria-label={showPass ? 'Hide' : 'Show'}
                  >
                    {showPass ? <EyeOff size={14} strokeWidth={1.75} /> : <Eye size={14} strokeWidth={1.75} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Flat no.</label>
                <div className="relative">
                  <Home size={15} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
                  <input type="text" name="flatNo" value={form.flatNo} onChange={handleChange} placeholder="A-101" className="input input-icon" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-1 py-3">
              {loading ? (
                <><Loader2 size={15} className="animate-spin" strokeWidth={2} /> Creating account…</>
              ) : 'Create account'}
            </button>
          </motion.form>

          <motion.p variants={fade} className="mt-6 text-center text-xs text-ink-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline transition-colors">
              Sign in
            </Link>
          </motion.p>

          <motion.p variants={fade} className="mt-4 flex justify-center">
            <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-ink-faint hover:text-ink-muted transition-colors">
              <ArrowLeft size={11} strokeWidth={2} />
              Back to home
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
