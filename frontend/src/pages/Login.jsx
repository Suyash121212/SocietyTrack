import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ArrowLeft, Quote } from 'lucide-react';
import { axiosInstance } from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';


const TOKENS = {
  '--bg': '#FAFAFA',
  '--surface': '#FFFFFF',
  '--border': '#E8EAED',
  '--ink': '#111318',
  '--ink-2': '#667085',
  '--ink-3': '#98A2B3',
  '--accent': '#3652E0',
  '--accent-hover': '#2A41B8',
  '--accent-soft': '#EEF1FE',
  '--accent-deep': '#22349E',
};

const TESTIMONIALS = [
  { text: 'No more lost complaints in WhatsApp groups.', role: 'Resident, Tower B' },
  { text: 'The dashboard gives me full visibility across all flats.', role: 'Society Manager' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

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
    <div className="flex min-h-screen font-['Inter'] antialiased" style={TOKENS}>
      {/* Left panel — brand + social proof */}
      <div
        className="relative hidden w-[42%] flex-col justify-between overflow-hidden px-12 py-10 lg:flex"
        style={{ background: `linear-gradient(155deg, var(--accent) 0%, var(--accent-deep) 100%)` }}
      >
        {/* Restrained dot-grid texture instead of gradient blobs */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]" aria-hidden="true">
          <defs>
            <pattern id="dots" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/[0.06] blur-3xl" />

        <motion.div
          initial={reduce ? undefined : { opacity: 0, y: -8 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/15 text-sm font-bold text-white backdrop-blur">
              S
            </div>
            <span className="font-['Plus_Jakarta_Sans'] text-lg font-bold text-white">Society Tracker</span>
          </Link>
        </motion.div>

        <motion.div
          initial={reduce ? undefined : 'hidden'}
          animate={reduce ? undefined : 'show'}
          variants={stagger}
          className="relative"
        >
          <motion.h2
            variants={fadeUp}
            className="mb-4 font-['Plus_Jakarta_Sans'] text-3xl font-bold leading-tight text-white"
          >
            Your society,
            <br />
            fully in control.
          </motion.h2>
          <motion.p variants={fadeUp} className="mb-10 max-w-xs text-sm leading-relaxed text-white/75">
            Track every maintenance request from submission to resolution with complete transparency and real-time updates.
          </motion.p>

          <div className="space-y-3">
            {TESTIMONIALS.map((t) => (
              <motion.div
                key={t.role}
                variants={fadeUp}
                className="rounded-xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur"
              >
                <Quote className="mb-1.5 h-3.5 w-3.5 text-white/40" fill="currentColor" strokeWidth={0} />
                <p className="mb-1.5 text-xs leading-relaxed text-white">{t.text}</p>
                <p className="text-xs font-medium text-white/60">— {t.role}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <p className="relative text-xs text-white/50">© {new Date().getFullYear()} Society Tracker</p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center bg-[var(--bg)] px-6 py-12">
        <motion.div
          initial={reduce ? undefined : 'hidden'}
          animate={reduce ? undefined : 'show'}
          variants={stagger}
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <motion.div variants={fadeUp}>
            <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[var(--accent)] text-xs font-bold text-white">
                S
              </div>
              <span className="font-['Plus_Jakarta_Sans'] font-bold text-[var(--ink)]">Society Tracker</span>
            </Link>
          </motion.div>

          <motion.div variants={fadeUp} className="mb-8">
            <h1 className="mb-1 font-['Plus_Jakarta_Sans'] text-2xl font-bold tracking-tight text-[var(--ink)]">
              Welcome back
            </h1>
            <p className="text-sm text-[var(--ink-2)]">Sign in to your account to continue</p>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={2} />
              {error}
            </motion.div>
          )}

          <motion.form variants={fadeUp} onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-[var(--ink-2)]">
                Email address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--ink-3)]">
                  <Mail className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-3 pl-10 pr-4 text-sm text-[var(--ink)] placeholder-[var(--ink-3)] shadow-sm transition-all focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-[var(--ink-2)]">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--ink-3)]">
                  <Lock className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-3 pl-10 pr-11 text-sm text-[var(--ink)] placeholder-[var(--ink-3)] shadow-sm transition-all focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[var(--ink-3)] transition-colors hover:text-[var(--ink-2)]"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff className="h-4 w-4" strokeWidth={1.75} /> : <Eye className="h-4 w-4" strokeWidth={1.75} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </motion.form>

          <motion.p variants={fadeUp} className="mt-6 text-center text-xs text-[var(--ink-2)]">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold text-[var(--accent)] hover:underline">
              Create one
            </Link>
          </motion.p>

          <motion.p variants={fadeUp} className="mt-4 flex justify-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-3)] transition-colors hover:text-[var(--ink-2)]"
            >
              <ArrowLeft className="h-3 w-3" strokeWidth={2} />
              Back to home
            </Link>
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}