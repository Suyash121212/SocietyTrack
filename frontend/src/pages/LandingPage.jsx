import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Zap, Bell, LayoutDashboard, Megaphone, AlarmClock, ShieldCheck,
  Building2, Smartphone, ArrowRight, Menu, X, Check,
} from 'lucide-react';

 
const TOKENS = {
  '--bg': '#FAFAFA',
  '--surface': '#FFFFFF',
  '--section-alt': '#F6F7F9',
  '--border': '#E8EAED',
  '--ink': '#111318',
  '--ink-2': '#667085',
  '--ink-3': '#98A2B3',
  '--accent': '#3652E0',
  '--accent-hover': '#2A41B8',
  '--accent-soft': '#EEF1FE',
  '--success': '#15803D',
};

const CARD_SHADOW = '0_1px_2px_rgba(16,24,40,0.04),0_1px_3px_rgba(16,24,40,0.06)';

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'About', href: '#about' },
];

const FEATURES = [
  { Icon: Zap, title: 'Instant complaint tracking', desc: 'Submit, monitor, and resolve maintenance requests with full transparency.' },
  { Icon: Bell, title: 'Automated notifications', desc: 'Residents get an email the moment their complaint status changes.' },
  { Icon: LayoutDashboard, title: 'Admin dashboard', desc: 'Real-time stats, priority management, and overdue alerts in one view.' },
  { Icon: Megaphone, title: 'Society notices', desc: 'Broadcast important announcements to every resident instantly.' },
  { Icon: AlarmClock, title: 'Overdue detection', desc: 'Hourly checks flag unresolved complaints past the threshold automatically.' },
  { Icon: ShieldCheck, title: 'Role-based security', desc: 'JWT authentication with strict resident and admin access separation.' },
];

const STEPS = [
  { num: '01', title: 'Register', desc: 'Create your resident account with your flat number in under 60 seconds.' },
  { num: '02', title: 'Submit', desc: 'Raise a complaint with category, description, and an optional photo.' },
  { num: '03', title: 'Track', desc: 'Admin reviews, assigns priority, and moves it through workflow stages.' },
  { num: '04', title: 'Resolve', desc: 'Get notified by email at every update until the issue is closed.' },
];

const ABOUT_POINTS = [
  { Icon: Building2, title: 'Designed for real workflows', desc: 'Built around how society management actually works, not a generic ticketing system.' },
  { Icon: Smartphone, title: 'Works on every device', desc: 'Fully responsive, so it works equally well on phones, tablets, and desktops.' },
  { Icon: ShieldCheck, title: 'Secure by design', desc: 'JWT auth, bcrypt passwords, role-based access — security built in from day one.' },
];

const STAGES = ['Submitted', 'Assigned', 'In progress', 'Resolved'];

/** Signature element — cycles through a complaint's real lifecycle to show
 *  the product's core promise (visible status, always) rather than a
 *  generic stat block. */
function StatusTrail() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(reduce ? STAGES.length - 1 : 0);

  useEffect(() => {
    if (reduce) return undefined;
    const id = setInterval(() => {
      setActive((a) => (a + 1) % STAGES.length);
    }, 2200);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <div
      className="inline-flex items-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-5"
      style={{ boxShadow: `0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)` }}
    >
      {STAGES.map((label, i) => {
        const state = i < active ? 'done' : i === active ? 'active' : 'pending';
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-2 px-4">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors duration-500 ${
                  state === 'done'
                    ? 'border-[var(--accent)] bg-[var(--accent)]'
                    : state === 'active'
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                    : 'border-[var(--border)] bg-[var(--bg)]'
                }`}
              >
                {state === 'done' && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                {state === 'active' && <span className="h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse" />}
                {state === 'pending' && <span className="h-1.5 w-1.5 rounded-full bg-[var(--ink-3)]" />}
              </span>
              <span
                className={`whitespace-nowrap text-[11px] font-medium transition-colors duration-500 ${
                  state === 'pending' ? 'text-[var(--ink-3)]' : 'text-[var(--ink)]'
                }`}
              >
                {label}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div
                className={`mb-5 h-px w-8 sm:w-10 transition-colors duration-500 ${
                  i < active ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div
      className="min-h-screen bg-[var(--bg)] font-['Inter'] text-[var(--ink)] antialiased"
      style={TOKENS}
    >
      {/* Navbar */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-200 ${
          scrolled ? 'border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[var(--accent)] text-xs font-bold text-white">
              S
            </div>
            <span className="font-['Plus_Jakarta_Sans'] font-bold tracking-tight text-[var(--ink)]">
              Society Tracker
            </span>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[var(--ink-2)] transition-colors hover:text-[var(--ink)]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              to="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--ink-2)] transition-colors hover:bg-[var(--section-alt)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-xl bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
            >
              Get started
            </Link>
          </div>

          <button
            className="text-[var(--ink-2)] hover:text-[var(--ink)] md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="space-y-3 border-t border-[var(--border)] bg-[var(--surface)] px-6 py-4 shadow-lg md:hidden">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block py-1 text-sm font-medium text-[var(--ink-2)] hover:text-[var(--accent)]"
              >
                {link.label}
              </a>
            ))}
            <div className="flex gap-3 border-t border-[var(--border)] pt-3">
              <Link
                to="/login"
                className="flex-1 rounded-xl border border-[var(--border)] py-2.5 text-center text-sm font-medium text-[var(--ink)] hover:bg-[var(--section-alt)]"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="flex-1 rounded-xl bg-[var(--accent)] py-2.5 text-center text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
              >
                Get started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="home" className="relative overflow-hidden px-6 pb-24 pt-36">
        <motion.div
          initial={reduce ? undefined : 'hidden'}
          animate={reduce ? undefined : 'show'}
          variants={stagger}
          className="relative mx-auto max-w-4xl text-center"
        >
          <motion.div
            variants={fadeUp}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--accent-soft)] px-4 py-1.5 text-xs font-semibold text-[var(--accent)]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            Built for residential societies
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mb-6 font-['Plus_Jakarta_Sans'] text-5xl font-extrabold leading-[1.08] tracking-tight text-[var(--ink)] md:text-6xl"
          >
            Society maintenance,
            <br />
            <span className="text-[var(--accent)]">finally organised.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-[var(--ink-2)]"
          >
            Give every resident a direct line to raise complaints. Give your management team the tools to track, prioritise, and resolve them — with zero follow-up required.
          </motion.p>

          <motion.div variants={fadeUp} className="mb-16 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-8 py-3.5 font-semibold text-white shadow-sm transition-colors hover:bg-[var(--accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
            >
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-8 py-3.5 font-medium text-[var(--ink)] transition-colors hover:bg-[var(--section-alt)]"
            >
              See how it works
            </a>
          </motion.div>

          <motion.div variants={fadeUp} className="flex justify-center">
            <StatusTrail />
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="bg-[var(--section-alt)] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--accent)]">Features</p>
            <h2 className="mb-4 font-['Plus_Jakarta_Sans'] text-3xl font-bold text-[var(--ink)] md:text-4xl">
              Everything in one platform
            </h2>
            <p className="mx-auto max-w-lg text-sm leading-relaxed text-[var(--ink-2)]">
              From submission to resolution — every tool your society needs, built into a single clean interface.
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {FEATURES.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/30"
                style={{ boxShadow: `0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.06)` }}
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-soft)] transition-colors group-hover:bg-[var(--accent)]/15">
                  <f.Icon className="h-5 w-5 text-[var(--accent)]" strokeWidth={1.75} />
                </div>
                <h3 className="mb-2 text-sm font-semibold text-[var(--ink)]">{f.title}</h3>
                <p className="text-xs leading-relaxed text-[var(--ink-2)]">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-[var(--surface)] px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--accent)]">Process</p>
            <h2 className="mb-4 font-['Plus_Jakarta_Sans'] text-3xl font-bold text-[var(--ink)] md:text-4xl">
              Simple four-step workflow
            </h2>
            <p className="mx-auto max-w-lg text-sm leading-relaxed text-[var(--ink-2)]">
              From complaint submission to full resolution, in a structured, accountable flow.
            </p>
          </div>

          <div className="relative grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="absolute left-[10%] right-[10%] top-8 hidden h-px bg-[var(--border)] md:block" />
            {STEPS.map((s) => (
              <div key={s.num} className="relative text-center">
                <div className="relative z-10 mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-[var(--accent-soft)] bg-[var(--accent-soft)] text-lg font-extrabold text-[var(--accent)]">
                  {s.num}
                </div>
                <h3 className="mb-2 text-sm font-bold text-[var(--ink)]">{s.title}</h3>
                <p className="text-xs leading-relaxed text-[var(--ink-2)]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="bg-[var(--section-alt)] px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--accent)]">About</p>
              <h2 className="mb-6 font-['Plus_Jakarta_Sans'] text-3xl font-bold leading-tight text-[var(--ink)] md:text-4xl">
                Built to eliminate
                <br />
                maintenance chaos.
              </h2>
              <p className="mb-4 text-sm leading-relaxed text-[var(--ink-2)]">
                Maintenance complaints disappearing into WhatsApp threads. Residents with no visibility. Managers with no system. Society Tracker was built to fix exactly that.
              </p>
              <p className="text-sm leading-relaxed text-[var(--ink-2)]">
                Residents get real-time updates. Admins get a structured dashboard. Nothing gets lost.
              </p>
            </div>
            <div className="space-y-3">
              {ABOUT_POINTS.map((item) => (
                <div
                  key={item.title}
                  className="flex gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-all hover:border-[var(--accent)]/30"
                  style={{ boxShadow: `0 1px 2px rgba(16,24,40,0.04)` }}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)]">
                    <item.Icon className="h-5 w-5 text-[var(--accent)]" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="mb-0.5 text-sm font-semibold text-[var(--ink)]">{item.title}</p>
                    <p className="text-xs leading-relaxed text-[var(--ink-2)]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[var(--accent)] px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 font-['Plus_Jakarta_Sans'] text-3xl font-bold tracking-tight text-white md:text-4xl">
            Ready to get organised?
          </h2>
          <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-white/80">
            Join your society on Society Tracker. Registration takes less than two minutes.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 font-semibold text-[var(--accent)] shadow-sm transition-colors hover:bg-white/90"
            >
              Create your account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl border border-white/30 px-8 py-3.5 font-medium text-white transition-colors hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0B0D12] px-6 py-12 text-[#8A8F98]">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent)] text-xs font-bold text-white">
                  S
                </div>
                <span className="font-['Plus_Jakarta_Sans'] font-bold text-white">Society Tracker</span>
              </div>
              <p className="max-w-xs text-sm text-[#8A8F98]">
                Modern maintenance management for residential societies.
              </p>
            </div>

            <div className="flex gap-10">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white">Navigation</p>
                <div className="space-y-2">
                  {NAV_LINKS.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className="block text-sm text-[#8A8F98] transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white">Account</p>
                <div className="space-y-2">
                  <Link to="/login" className="block text-sm text-[#8A8F98] transition-colors hover:text-white">
                    Sign in
                  </Link>
                  <Link to="/register" className="block text-sm text-[#8A8F98] transition-colors hover:text-white">
                    Register
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-[#5F636B] sm:flex-row">
            <p>© {new Date().getFullYear()} Society Tracker. All rights reserved.</p>
            <p></p>
          </div>
        </div>
      </footer>
    </div>
  );
}