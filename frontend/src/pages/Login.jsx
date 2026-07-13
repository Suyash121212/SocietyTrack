import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowLeft, Shield, Quote } from 'lucide-react';
import { axiosInstance } from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

const fade   = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const TESTIMONIALS = [
  { text: 'No more complaints disappearing into WhatsApp groups.', role: 'Resident, Tower B' },
  { text: 'The dashboard gives me full visibility across all flats.', role: 'Society Manager' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const reduce     = useReducedMotion();

  const [form, setForm]     = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axiosInstance.post('/auth/login', form);
      login(data.token, data.user);
      navigate(data.user.role === 'ADMIN' ? '/admin/dashboard' : '/complaints');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen font-sans antialiased">
      {/* Left brand panel — dark, premium */}
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-slate-900 px-12 py-10 lg:flex">
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04]" aria-hidden="true">
          <defs>
            <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-600/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 bottom-40 h-56 w-56 rounded-full bg-brand-800/15 blur-3xl pointer-events-none" />

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

        <motion.div
          initial={reduce ? undefined : 'hidden'}
          animate={reduce ? undefined : 'show'}
          variants={stagger}
          className="relative space-y-8"
        >
          <div>
            <motion.h2 variants={fade} className="font-display text-3xl font-bold leading-tight text-white">
              Your society,
              <br />
              fully in control.
            </motion.h2>
            <motion.p variants={fade} className="mt-3 max-w-xs text-sm leading-relaxed text-slate-400">
              Track every maintenance request from submission to resolution with complete transparency.
            </motion.p>
          </div>

          <motion.div variants={stagger} className="space-y-3">
            {TESTIMONIALS.map(t => (
              <motion.div
                key={t.role}
                variants={fade}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.05] p-4 backdrop-blur"
              >
                <Quote size={12} className="mb-2 text-white/30 fill-white/30" strokeWidth={0} />
                <p className="text-xs leading-relaxed text-slate-300">{t.text}</p>
                <p className="mt-2 text-xs font-medium text-slate-500">— {t.role}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <p className="relative text-xs text-slate-700">© {new Date().getFullYear()} SocietyTrack</p>
      </div>

      {/* Right form panel — clean light */}
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

          <motion.div variants={fade} className="mb-8">
            <h1 className="font-display text-2xl font-bold text-ink tracking-tight">Welcome back</h1>
            <p className="mt-1 text-sm text-ink-muted">Sign in to your account to continue</p>
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
            <div>
              <label htmlFor="email" className="label">Email address</label>
              <div className="relative">
                <Mail size={15} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input
                  id="email" type="email" name="email"
                  value={form.email} onChange={handleChange}
                  required autoComplete="email" placeholder="you@example.com"
                  className="input input-icon"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <Lock size={15} strokeWidth={1.75} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input
                  id="password" type={showPass ? 'text' : 'password'} name="password"
                  value={form.password} onChange={handleChange}
                  required autoComplete="current-password" placeholder="••••••••"
                  className="input input-icon pr-11"
                />
                <button
                  type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-muted transition-colors"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={14} strokeWidth={1.75} /> : <Eye size={14} strokeWidth={1.75} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-1">
              {loading ? (
                <><Loader2 size={15} className="animate-spin" strokeWidth={2} /> Signing in…</>
              ) : 'Sign in'}
            </button>
          </motion.form>

          <motion.p variants={fade} className="mt-6 text-center text-xs text-ink-muted">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline transition-colors">
              Create one
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
