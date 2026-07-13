import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import {
  Bell, LayoutDashboard, Megaphone, AlarmClock, ShieldCheck,
  Building2, Smartphone, ArrowRight, Menu, X, Check,
  MessageSquare, Clock, Shield, ChevronRight, ChevronDown,
  BarChart2, Wifi, CheckCircle2, AlertCircle, Sparkles,
} from 'lucide-react';

// ─── Motion presets ───────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.08 } },
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: 'Features',     href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'About',        href: '#about' },
];

// Each feature owns a distinct accent color — categories in a maintenance
// system are visually distinct in real life (electrical vs. plumbing vs.
// security), so the palette carries that same logic here.
const COLORS = [
  { name: 'indigo',  bg: 'bg-indigo-50',  border: 'border-indigo-100',  text: 'text-indigo-600',  hover: 'group-hover:bg-indigo-100',  solid: 'bg-indigo-500',  ring: 'ring-indigo-500/20',  from: 'from-indigo-500',  grad: 'bg-gradient-to-br from-indigo-500 to-indigo-600' },
  { name: 'sky',     bg: 'bg-sky-50',     border: 'border-sky-100',     text: 'text-sky-600',     hover: 'group-hover:bg-sky-100',     solid: 'bg-sky-500',     ring: 'ring-sky-500/20',     from: 'from-sky-500',     grad: 'bg-gradient-to-br from-sky-500 to-sky-600' },
  { name: 'emerald', bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600', hover: 'group-hover:bg-emerald-100', solid: 'bg-emerald-500', ring: 'ring-emerald-500/20', from: 'from-emerald-500', grad: 'bg-gradient-to-br from-emerald-500 to-emerald-600' },
  { name: 'amber',   bg: 'bg-amber-50',   border: 'border-amber-100',   text: 'text-amber-600',   hover: 'group-hover:bg-amber-100',   solid: 'bg-amber-500',   ring: 'ring-amber-500/20',   from: 'from-amber-500',   grad: 'bg-gradient-to-br from-amber-500 to-amber-600' },
  { name: 'rose',    bg: 'bg-rose-50',    border: 'border-rose-100',    text: 'text-rose-600',    hover: 'group-hover:bg-rose-100',    solid: 'bg-rose-500',    ring: 'ring-rose-500/20',    from: 'from-rose-500',    grad: 'bg-gradient-to-br from-rose-500 to-rose-600' },
  { name: 'violet',  bg: 'bg-violet-50',  border: 'border-violet-100',  text: 'text-violet-600',  hover: 'group-hover:bg-violet-100',  solid: 'bg-violet-500',  ring: 'ring-violet-500/20',  from: 'from-violet-500',  grad: 'bg-gradient-to-br from-violet-500 to-violet-600' },
];

const FEATURES = [
  {
    Icon:  MessageSquare,
    title: 'Structured complaint tracking',
    desc:  'Submit, monitor, and resolve maintenance requests with a full audit trail — nothing gets lost.',
  },
  {
    Icon:  Bell,
    title: 'Automated notifications',
    desc:  'Residents receive an email the moment their complaint status changes. No follow-up needed.',
  },
  {
    Icon:  LayoutDashboard,
    title: 'Admin reporting dashboard',
    desc:  'Real-time stats, urgency scoring, SLA tracking, and recurring issue detection in one view.',
  },
  {
    Icon:  Megaphone,
    title: 'Notice board',
    desc:  'Broadcast important announcements to every resident instantly, with optional expiry dates.',
  },
  {
    Icon:  AlarmClock,
    title: 'SLA-aware overdue detection',
    desc:  'Hourly cron checks flag and auto-escalate complaints that breach their SLA threshold.',
  },
  {
    Icon:  ShieldCheck,
    title: 'Role-based security',
    desc:  'JWT authentication with strict resident and admin access separation baked in from day one.',
  },
].map((f, i) => ({ ...f, color: COLORS[i % COLORS.length] }));

const STEPS = [
  { num: '01', title: 'Register',  desc: 'Create your resident account with your flat number in under 60 seconds.' },
  { num: '02', title: 'Submit',    desc: 'Raise a complaint with category, description, and up to 3 photos.' },
  { num: '03', title: 'Track',     desc: 'Admin triages, assigns priority, and moves it through the workflow.' },
  { num: '04', title: 'Resolve',   desc: 'Get notified at every update. Reopen within 3 days if unresolved.' },
].map((s, i) => ({ ...s, color: COLORS[i % COLORS.length] }));

const HERO_STATS = [
  { value: '< 60s',    label: 'To register',       color: COLORS[0] },
  { value: '3 photos', label: 'Per complaint',      color: COLORS[1] },
  { value: '1h',       label: 'SLA check interval', color: COLORS[3] },
  { value: '100%',     label: 'Audit trail',        color: COLORS[2] },
];

const ABOUT_POINTS = [
  {
    Icon:  Building2,
    title: 'Built for real workflows',
    desc:  'Designed around how society management actually works, not a generic ticketing template.',
  },
  {
    Icon:  Smartphone,
    title: 'Works on every device',
    desc:  'Fully responsive — works equally well on phones, tablets, and desktops.',
  },
  {
    Icon:  BarChart2,
    title: 'Operational reporting',
    desc:  'Recurring issue detection, resolution time by category, and weekly trend charts built in.',
  },
].map((p, i) => ({ ...p, color: COLORS[(i + 2) % COLORS.length] }));

const DASHBOARD_QUEUE = [
  { label: 'Leaking pipe — B-402',      status: 'Overdue',     color: COLORS[4], Icon: AlertCircle },
  { label: 'Lift not working — Tower A', status: 'In Progress', color: COLORS[3], Icon: Clock },
  { label: 'Gate light fused — Gate 2',  status: 'Resolved',    color: COLORS[2], Icon: CheckCircle2 },
];

const CHART_BARS = [
  { label: 'Plumbing',   value: 72, color: COLORS[0] },
  { label: 'Electrical', value: 54, color: COLORS[1] },
  { label: 'Security',   value: 90, color: COLORS[4] },
  { label: 'Cleaning',   value: 38, color: COLORS[2] },
  { label: 'Other',      value: 61, color: COLORS[5] },
];

// ─── Status trail animation ───────────────────────────────────────────────────

const STAGES = ['Submitted', 'Triaged', 'In Progress', 'Resolved'];

function StatusTrail() {
  const reduce  = useReducedMotion();
  const [active, setActive] = useState(reduce ? STAGES.length - 1 : 0);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setActive(a => (a + 1) % STAGES.length), 2000);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <div className="flex items-center justify-between">
      {STAGES.map((label, i) => {
        const state = i < active ? 'done' : i === active ? 'active' : 'pending';
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5 px-2">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-500
                ${state === 'done'    ? 'border-emerald-500 bg-emerald-500'
                : state === 'active'  ? 'border-indigo-500 bg-indigo-50'
                :                       'border-slate-200 bg-slate-50'}`}
              >
                {state === 'done'   && <Check size={11} className="text-white" strokeWidth={3} />}
                {state === 'active' && <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />}
                {state === 'pending'&& <span className="h-1 w-1 rounded-full bg-slate-300" />}
              </span>
              <span className={`text-[10px] font-semibold whitespace-nowrap transition-colors duration-500
                ${state === 'pending' ? 'text-slate-400' : 'text-slate-700'}`}
              >
                {label}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div className={`mb-4 h-px w-6 sm:w-8 transition-colors duration-500 ${i < active ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Animated dashboard preview (hero centerpiece) ─────────────────────────────

function DashboardPreview() {
  const reduce = useReducedMotion();

  return (
    <motion.div
      animate={reduce ? undefined : { y: [0, -10, 0] }}
      transition={reduce ? undefined : { duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      className="relative mx-auto w-full max-w-3xl"
    >
      {/* glow behind the card */}
      <div className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-gradient-to-r from-indigo-400/20 via-sky-300/20 to-emerald-300/20 blur-2xl" />

      <div className="relative rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_20px_60px_-15px_rgba(30,41,59,0.25)] backdrop-blur-xl sm:p-7">
        {/* window chrome */}
        <div className="mb-5 flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          <span className="ml-3 text-[11px] font-medium text-slate-400">admin.societytrack.app</span>
        </div>

        {/* overview stat chips */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          {[
            { label: 'Open',        value: 12,  color: COLORS[4] },
            { label: 'In progress', value: 5,   color: COLORS[3] },
            { label: 'Resolved',    value: 128, color: COLORS[2] },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl border ${s.color.border} ${s.color.bg} px-3 py-3 text-left sm:px-4`}>
              <p className={`font-display text-xl font-bold sm:text-2xl ${s.color.text}`}>{s.value}</p>
              <p className="text-[11px] font-medium text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* live status trail */}
        <div className="mb-6 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-4 sm:px-6">
          <StatusTrail />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
          {/* queue list */}
          <div className="space-y-2 sm:col-span-3">
            {DASHBOARD_QUEUE.map((row, i) => (
              <motion.div
                key={row.label}
                initial={reduce ? undefined : { opacity: 0, x: -8 }}
                whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.4 }}
                className={`flex items-center justify-between rounded-xl border ${row.color.border} bg-white px-3 py-2.5`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${row.color.bg}`}>
                    <row.Icon size={13} className={row.color.text} strokeWidth={2} />
                  </span>
                  <span className="text-xs font-medium text-slate-700">{row.label}</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${row.color.bg} ${row.color.text}`}>
                  {row.status}
                </span>
              </motion.div>
            ))}
          </div>

          {/* mini bar chart */}
          <div className="flex items-end justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3 sm:col-span-2">
            {CHART_BARS.map((bar, i) => (
              <div key={bar.label} className="flex flex-1 flex-col items-center gap-1.5">
                <div className="flex h-20 w-full items-end overflow-hidden rounded-md bg-white">
                  <motion.div
                    initial={reduce ? undefined : { height: 0 }}
                    whileInView={reduce ? undefined : { height: `${bar.value}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className={`w-full rounded-md ${bar.color.solid}`}
                    style={reduce ? { height: `${bar.value}%` } : undefined}
                  />
                </div>
                <span className="text-[9px] font-medium text-slate-400">{bar.label.slice(0, 4)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const reduce  = useReducedMotion();
  const heroRef = useRef(null);
  const rafId   = useRef(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Spotlight cursor glow — throttled with requestAnimationFrame so it
  // never fights the main thread, and skipped entirely for reduced motion.
  const handleHeroMouseMove = useCallback((e) => {
    if (reduce || !heroRef.current) return;
    if (rafId.current) return;
    const { clientX, clientY } = e;
    rafId.current = requestAnimationFrame(() => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        heroRef.current.style.setProperty('--spot-x', `${clientX - rect.left}px`);
        heroRef.current.style.setProperty('--spot-y', `${clientY - rect.top}px`);
      }
      rafId.current = null;
    });
  }, [reduce]);

  return (
    <motion.div
      initial={reduce ? undefined : { opacity: 0 }}
      animate={reduce ? undefined : { opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-white font-sans text-slate-900 antialiased"
    >

      {/* ── Floating glass navbar ──────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-3 z-50 px-3 sm:top-4 sm:px-6">
        <div
          className={`mx-auto flex h-14 max-w-5xl items-center justify-between rounded-2xl border px-4 transition-all duration-300 sm:px-5
            ${scrolled
              ? 'border-slate-200/80 bg-white/80 shadow-[0_8px_30px_-8px_rgba(30,41,59,0.15)] backdrop-blur-xl'
              : 'border-white/40 bg-white/50 backdrop-blur-xl'}`}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-500 shadow-sm">
              <Shield size={16} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold tracking-tight text-slate-900">SocietyTrack</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map(link => (
              <a key={link.href} href={link.href}
                className="rounded-full px-3.5 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-900/5 hover:text-slate-900">
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-2 md:flex">
            <Link to="/login" className="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900">
              Sign in
            </Link>
            <Link to="/register"
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-600 hover:shadow-md active:scale-[0.97]">
              Get started
              <ArrowRight size={13} strokeWidth={2.5} />
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-900/5 md:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="mx-auto mt-2 max-w-5xl space-y-1 rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-xl backdrop-blur-xl md:hidden"
            >
              {NAV_LINKS.map(link => (
                <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
                  className="block rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors">
                  {link.label}
                </a>
              ))}
              <div className="flex gap-2 border-t border-slate-100 pt-3">
                <Link to="/login" className="flex-1 rounded-xl border border-slate-200 py-2.5 text-center text-sm font-medium text-slate-700">Sign in</Link>
                <Link to="/register" className="flex-1 rounded-xl bg-slate-900 py-2.5 text-center text-sm font-semibold text-white">Get started</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        className="relative isolate overflow-hidden bg-white px-6 pb-20 pt-40 sm:pb-28"
        style={{ '--spot-x': '50%', '--spot-y': '30%' }}
      >
        {/* spotlight cursor glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(600px circle at var(--spot-x) var(--spot-y), rgba(99,102,241,0.08), transparent 45%)' }}
        />

        {/* soft grid texture */}
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.4]" aria-hidden="true">
          <defs>
            <pattern id="hero-grid" width="36" height="36" patternUnits="userSpaceOnUse">
              <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#e2e8f0" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>

        {/* floating gradient blobs */}
        <motion.div
          animate={reduce ? undefined : { x: [0, 24, 0], y: [0, -18, 0] }}
          transition={reduce ? undefined : { duration: 11, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute -left-28 top-16 h-72 w-72 rounded-full bg-indigo-300/30 blur-3xl"
        />
        <motion.div
          animate={reduce ? undefined : { x: [0, -28, 0], y: [0, 22, 0] }}
          transition={reduce ? undefined : { duration: 13, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-sky-300/30 blur-3xl"
        />
        <motion.div
          animate={reduce ? undefined : { x: [0, 20, 0], y: [0, 20, 0] }}
          transition={reduce ? undefined : { duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute left-1/3 top-4 h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl"
        />

        <motion.div
          initial={reduce ? undefined : 'hidden'}
          animate={reduce ? undefined : 'show'}
          variants={stagger}
          className="relative mx-auto max-w-4xl text-center"
        >
          {/* Eyebrow */}
          <motion.div variants={fadeUp}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-600"
          >
            <Sparkles size={12} strokeWidth={2.5} />
            Built for residential societies
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={fadeUp}
            className="mb-6 font-display text-5xl font-extrabold leading-[1.08] tracking-tight text-slate-900 md:text-6xl text-balance"
          >
            Society maintenance,
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-500 bg-clip-text text-transparent">
              finally organised.
            </span>
          </motion.h1>

          {/* Sub */}
          <motion.p variants={fadeUp}
            className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-slate-500"
          >
            Give every resident a direct line to raise complaints. Give your management team the tools to track, prioritise, and resolve them — with zero follow-up required.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={fadeUp} className="mb-12 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/register"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-8 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_rgba(79,70,229,0.5)] transition-all hover:shadow-[0_14px_36px_-6px_rgba(79,70,229,0.6)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              Start for free
              <ArrowRight size={15} strokeWidth={2} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-8 py-3.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
            >
              See how it works
            </a>
          </motion.div>

          {/* Hero statistics */}
          <motion.div variants={fadeUp} className="mb-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {HERO_STATS.map((s, i) => (
              <div key={s.label} className="flex items-center gap-3">
                {i > 0 && <span className="hidden h-8 w-px bg-slate-200 sm:block" />}
                <div className="text-left">
                  <p className={`font-display text-xl font-bold ${s.color.text}`}>{s.value}</p>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{s.label}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Animated dashboard preview */}
          <motion.div variants={fadeUp}>
            <DashboardPreview />
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.a
          href="#features"
          aria-label="Scroll to features"
          animate={reduce ? undefined : { y: [0, 8, 0] }}
          transition={reduce ? undefined : { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-slate-400 hover:text-indigo-500 transition-colors sm:flex"
        >
          <span className="text-[10px] font-medium uppercase tracking-widest">Scroll</span>
          <ChevronDown size={16} strokeWidth={2} />
        </motion.a>
      </section>

      {/* ── Features ───────────────────────────────────────────────────── */}
      <section id="features" className="relative px-6 py-24 bg-slate-50/70">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial={reduce ? undefined : 'hidden'}
            whileInView={reduce ? undefined : 'show'}
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="mb-16 text-center"
          >
            <motion.p variants={fadeUp} className="mb-3 text-xs font-bold uppercase tracking-widest text-indigo-600">Features</motion.p>
            <motion.h2 variants={fadeUp} className="mb-4 font-display text-3xl font-bold text-slate-900 md:text-4xl">Everything in one platform</motion.h2>
            <motion.p variants={fadeUp} className="mx-auto max-w-lg text-sm leading-relaxed text-slate-500">
              From submission to resolution — every tool your society needs, in a single clean interface.
            </motion.p>
          </motion.div>

          <motion.div
            initial={reduce ? undefined : 'hidden'}
            whileInView={reduce ? undefined : 'show'}
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {FEATURES.map(f => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                whileHover={reduce ? undefined : { y: -4 }}
                className={`group rounded-2xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-[0_16px_40px_-16px_rgba(30,41,59,0.18)]`}
              >
                <div className={`mb-5 flex h-10 w-10 items-center justify-center rounded-xl border ${f.color.border} ${f.color.bg} transition-colors ${f.color.hover}`}>
                  <f.Icon size={18} className={f.color.text} strokeWidth={1.75} />
                </div>
                <h3 className="mb-2 text-sm font-semibold text-slate-900">{f.title}</h3>
                <p className="text-xs leading-relaxed text-slate-500">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────── */}
      <section id="how-it-works" className="px-6 py-24 bg-white">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={reduce ? undefined : 'hidden'}
            whileInView={reduce ? undefined : 'show'}
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="mb-16 text-center"
          >
            <motion.p variants={fadeUp} className="mb-3 text-xs font-bold uppercase tracking-widest text-sky-600">Process</motion.p>
            <motion.h2 variants={fadeUp} className="mb-4 font-display text-3xl font-bold text-slate-900 md:text-4xl">Simple four-step workflow</motion.h2>
            <motion.p variants={fadeUp} className="mx-auto max-w-lg text-sm leading-relaxed text-slate-500">
              Structured, accountable — from complaint submission to full resolution.
            </motion.p>
          </motion.div>

          <motion.div
            initial={reduce ? undefined : 'hidden'}
            whileInView={reduce ? undefined : 'show'}
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="relative grid grid-cols-1 gap-8 md:grid-cols-4"
          >
            {/* Connector line — multi-color gradient tracing the sequence */}
            <div className="absolute left-[12.5%] right-[12.5%] top-8 hidden h-px bg-gradient-to-r from-indigo-300 via-amber-300 to-emerald-300 md:block" />

            {STEPS.map((s, i) => (
              <motion.div key={s.num} variants={fadeUp} className="relative text-center">
                <div className={`relative z-10 mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border-2 ${s.color.border} ${s.color.bg} font-display text-xl font-extrabold ${s.color.text}`}>
                  {s.num}
                </div>
                <h3 className="mb-2 text-sm font-bold text-slate-900">{s.title}</h3>
                <p className="text-xs leading-relaxed text-slate-500">{s.desc}</p>
                {i < STEPS.length - 1 && (
                  <ChevronRight size={14} className="absolute -right-4 top-8 hidden text-slate-300 md:block" strokeWidth={2} />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── About ──────────────────────────────────────────────────────── */}
      <section id="about" className="px-6 py-24 bg-slate-50/70">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={reduce ? undefined : 'hidden'}
            whileInView={reduce ? undefined : 'show'}
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2"
          >
            {/* Copy */}
            <motion.div variants={stagger}>
              <motion.p variants={fadeUp} className="mb-3 text-xs font-bold uppercase tracking-widest text-emerald-600">About</motion.p>
              <motion.h2 variants={fadeUp} className="mb-6 font-display text-3xl font-bold leading-tight text-slate-900 md:text-4xl">
                Built to eliminate
                <br />
                maintenance chaos.
              </motion.h2>
              <motion.p variants={fadeUp} className="mb-4 text-sm leading-relaxed text-slate-500">
                Maintenance complaints disappearing into WhatsApp threads. Residents with no visibility. Managers with no system. SocietyTrack was built to fix exactly that.
              </motion.p>
              <motion.p variants={fadeUp} className="mb-8 text-sm leading-relaxed text-slate-500">
                Residents get real-time updates. Admins get a structured dashboard with SLA enforcement. Nothing gets lost.
              </motion.p>
              <motion.div variants={fadeUp}>
                <Link to="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
                >
                  Get started free
                  <ArrowRight size={15} strokeWidth={2} />
                </Link>
              </motion.div>
            </motion.div>

            {/* Cards */}
            <motion.div variants={stagger} className="space-y-3">
              {ABOUT_POINTS.map(item => (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  whileHover={reduce ? undefined : { x: 4 }}
                  className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-[0_16px_40px_-16px_rgba(30,41,59,0.18)]"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${item.color.border} ${item.color.bg}`}>
                    <item.Icon size={17} className={item.color.text} strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="mb-1 text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="text-xs leading-relaxed text-slate-500">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA banner ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-500 to-sky-500" />
        <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />

        <motion.div
          initial={reduce ? undefined : 'hidden'}
          whileInView={reduce ? undefined : 'show'}
          viewport={{ once: true }}
          variants={stagger}
          className="relative mx-auto max-w-3xl text-center"
        >
          <motion.h2 variants={fadeUp} className="mb-4 font-display text-3xl font-bold tracking-tight text-white md:text-4xl">
            Ready to get organised?
          </motion.h2>
          <motion.p variants={fadeUp} className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-indigo-100">
            Join your society on SocietyTrack. Registration takes less than two minutes.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-indigo-700 shadow-sm transition-colors hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-indigo-600"
            >
              Create your account
              <ArrowRight size={15} strokeWidth={2} />
            </Link>
            <Link to="/login"
              className="inline-flex items-center justify-center rounded-xl border border-white/40 bg-white/10 px-8 py-3.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
            >
              Sign in
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 px-6 py-14 text-slate-400">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            {/* Brand */}
            <div>
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-sky-500 to-emerald-500">
                  <Shield size={16} className="text-white" strokeWidth={2.5} />
                </div>
                <span className="font-display font-bold text-white">SocietyTrack</span>
              </div>
              <p className="max-w-xs text-xs leading-relaxed">
                Modern maintenance management for residential societies.
              </p>
            </div>

            {/* Links */}
            <div className="flex gap-12">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Navigate</p>
                <div className="space-y-2">
                  {NAV_LINKS.map(link => (
                    <a key={link.href} href={link.href}
                      className="block text-xs text-slate-400 transition-colors hover:text-white">
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">Account</p>
                <div className="space-y-2">
                  <Link to="/login"    className="block text-xs text-slate-400 transition-colors hover:text-white">Sign in</Link>
                  <Link to="/register" className="block text-xs text-slate-400 transition-colors hover:text-white">Register</Link>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-8 text-xs sm:flex-row">
            <p>© {new Date().getFullYear()} SocietyTrack. All rights reserved.</p>
            <div className="flex items-center gap-1.5 text-slate-500">
              
            </div>
          </div>
        </div>
      </footer>
    </motion.div>
  );
}