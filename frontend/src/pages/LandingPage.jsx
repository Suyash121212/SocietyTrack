import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const FEATURES = [
  { icon: '⚡', title: 'Instant complaint tracking', desc: 'Submit, monitor, and resolve maintenance requests with full transparency.' },
  { icon: '🔔', title: 'Automated notifications', desc: 'Residents get email updates the moment their complaint status changes.' },
  { icon: '📊', title: 'Admin dashboard', desc: 'Real-time stats, priority management, and overdue alerts in one view.' },
  { icon: '📣', title: 'Society notices', desc: 'Broadcast important announcements to all residents instantly.' },
  { icon: '🕐', title: 'Overdue detection', desc: 'Hourly checks flag unresolved complaints past the threshold automatically.' },
  { icon: '🔐', title: 'Role-based security', desc: 'JWT authentication with strict resident and admin access separation.' },
];

const STEPS = [
  { num: '01', title: 'Register', desc: 'Create your resident account with your flat number in under 60 seconds.' },
  { num: '02', title: 'Submit', desc: 'Raise a complaint with category, description and optional photo.' },
  { num: '03', title: 'Track', desc: 'Admin reviews, assigns priority and moves it through workflow stages.' },
  { num: '04', title: 'Resolve', desc: 'Get notified by email at every update until the issue is closed.' },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">

      {/* Navbar */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-200 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white text-xs font-bold shadow-sm">S</div>
            <span className="font-bold text-gray-900 tracking-tight">Society Tracker</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            {[['Home', '#home'], ['Features', '#features'], ['How it works', '#how-it-works'], ['About', '#about']].map(([label, href]) => (
              <a key={href} href={href} className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">{label}</a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              Sign in
            </Link>
            <Link to="/register" className="text-sm font-semibold bg-primary text-white px-5 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
              Get started
            </Link>
          </div>

          <button className="md:hidden text-gray-500 hover:text-gray-900" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-3 shadow-lg">
            {[['Home', '#home'], ['Features', '#features'], ['How it works', '#how-it-works'], ['About', '#about']].map(([label, href]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)} className="block text-sm font-medium text-gray-600 hover:text-primary py-1">{label}</a>
            ))}
            <div className="flex gap-3 pt-3 border-t border-gray-100">
              <Link to="/login" className="flex-1 text-center text-sm font-medium border border-gray-200 py-2.5 rounded-xl text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition">Sign in</Link>
              <Link to="/register" className="flex-1 text-center text-sm font-semibold bg-primary text-white py-2.5 rounded-xl hover:bg-blue-700 transition">Get started</Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="home" className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/60 via-white to-white pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-blue-100/40 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Built for residential societies
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.08] text-gray-900 mb-6">
            Society maintenance,
            <br />
            <span className="text-primary">finally organised.</span>
          </h1>

          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Give every resident a direct line to raise complaints. Give your management team the tools to track, prioritise, and resolve them — with zero follow-up required.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
            <Link to="/register"
              className="inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-200">
              Start for free
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <a href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-medium px-8 py-3.5 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all shadow-sm">
              See how it works
            </a>
          </div>

          {/* Stats row */}
          <div className="inline-flex items-center divide-x divide-gray-200 bg-white border border-gray-100 rounded-2xl shadow-sm px-2">
            {[
              { val: '100%', label: 'Transparent' },
              { val: 'Real-time', label: 'Status updates' },
              { val: 'Zero', label: 'Lost complaints' },
            ].map((s) => (
              <div key={s.label} className="px-8 py-4 text-center">
                <p className="text-xl font-bold text-gray-900">{s.val}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-primary text-xs font-bold uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Everything in one platform</h2>
            <p className="text-gray-500 max-w-lg mx-auto text-sm leading-relaxed">
              From submission to resolution — every tool your society needs, built into a single clean interface.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div key={f.title}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-blue-100 hover:shadow-md transition-all group">
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-xl mb-5 group-hover:bg-blue-100 transition-colors">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-primary text-xs font-bold uppercase tracking-widest mb-3">Process</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Simple four-step workflow</h2>
            <p className="text-gray-500 max-w-lg mx-auto text-sm leading-relaxed">
              From complaint submission to full resolution in a structured, accountable flow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-blue-100 to-transparent" />
            {STEPS.map((s) => (
              <div key={s.num} className="relative text-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 border-2 border-blue-100 flex items-center justify-center text-primary font-extrabold text-lg mx-auto mb-5 relative z-10 shadow-sm">
                  {s.num}
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-2">{s.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-primary text-xs font-bold uppercase tracking-widest mb-3">About</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                Built to eliminate<br />maintenance chaos.
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-4">
                Maintenance complaints disappearing into WhatsApp threads. Residents with no visibility. Managers with no system. Society Tracker was built to fix exactly that.
              </p>
              <p className="text-gray-500 text-sm leading-relaxed">
                Residents get real-time updates. Admins get a structured dashboard. Nothing gets lost.
              </p>
            </div>
            <div className="space-y-3">
              {[
                { icon: '🏗️', title: 'Designed for real workflows', desc: 'Built around how society management actually works, not a generic ticketing system.' },
                { icon: '📱', title: 'Works on all devices', desc: 'Fully responsive — works on phones, tablets and desktops for everyone.' },
                { icon: '🔐', title: 'Secure by design', desc: 'JWT auth, bcrypt passwords, role-based access — security built in from day one.' },
              ].map((item) => (
                <div key={item.title} className="flex gap-4 p-5 rounded-2xl bg-white border border-gray-100 hover:border-blue-100 hover:shadow-sm transition-all">
                  <div className="text-2xl shrink-0">{item.icon}</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-0.5">{item.title}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-primary">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
            Ready to get organised?
          </h2>
          <p className="text-blue-100 mb-8 text-sm leading-relaxed max-w-md mx-auto">
            Join your society on Society Tracker. Registration takes less than two minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register"
              className="inline-flex items-center justify-center gap-2 bg-white text-primary font-semibold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-all shadow-sm">
              Create your account →
            </Link>
            <Link to="/login"
              className="inline-flex items-center justify-center border border-blue-400 text-white font-medium px-8 py-3.5 rounded-xl hover:bg-blue-600 transition-all">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white text-xs font-bold">S</div>
                <span className="font-bold text-white">Society Tracker</span>
              </div>
              <p className="text-sm text-gray-500 max-w-xs">
                Modern maintenance management for residential societies.
              </p>
            </div>

            <div className="flex gap-10">
              <div>
                <p className="text-white text-xs font-semibold mb-3 uppercase tracking-wide">Navigation</p>
                <div className="space-y-2">
                  {[['Home', '#home'], ['Features', '#features'], ['How it works', '#how-it-works'], ['About', '#about']].map(([label, href]) => (
                    <a key={href} href={href} className="block text-sm text-gray-500 hover:text-white transition-colors">{label}</a>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-white text-xs font-semibold mb-3 uppercase tracking-wide">Account</p>
                <div className="space-y-2">
                  <Link to="/login" className="block text-sm text-gray-500 hover:text-white transition-colors">Sign in</Link>
                  <Link to="/register" className="block text-sm text-gray-500 hover:text-white transition-colors">Register</Link>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
            <p>© {new Date().getFullYear()} Society Tracker. All rights reserved.</p>
            <p>Built with React, Node.js, PostgreSQL &amp; Prisma</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
