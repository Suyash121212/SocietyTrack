import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, MessageSquare, Megaphone, Settings2,
  Plus, Bell, LogOut, ChevronRight, Menu, X, Shield,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_RESIDENT = [
  { label: 'My Complaints', href: '/complaints',     Icon: ClipboardList },
  { label: 'New Complaint', href: '/complaints/new', Icon: Plus },
  { label: 'Notice Board',  href: '/notices',        Icon: Bell },
];

const NAV_ADMIN = [
  { label: 'Dashboard',   href: '/admin/dashboard',  Icon: LayoutDashboard },
  { label: 'Complaints',  href: '/admin/complaints', Icon: MessageSquare },
  { label: 'Notices',     href: '/admin/notices',    Icon: Megaphone },
  { label: 'Settings',    href: '/admin/config',     Icon: Settings2 },
];

function NavItem({ item, collapsed }) {
  const location = useLocation();
  const active = location.pathname === item.href ||
    (item.href !== '/' && location.pathname.startsWith(item.href + '/'));

  return (
    <Link
      to={item.href}
      title={collapsed ? item.label : undefined}
      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
        ${active
          ? 'bg-sidebar-active text-white'
          : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'
        }`}
    >
      {active && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute inset-0 rounded-xl bg-brand-600/20"
          transition={{ type: 'spring', stiffness: 380, damping: 36 }}
        />
      )}
      <item.Icon
        size={17}
        strokeWidth={active ? 2.5 : 2}
        className={`relative shrink-0 transition-colors ${active ? 'text-brand-400' : 'text-sidebar-text group-hover:text-slate-300'}`}
      />
      {!collapsed && (
        <span className="relative truncate">{item.label}</span>
      )}
      {!collapsed && active && (
        <ChevronRight size={14} className="relative ml-auto text-brand-400 shrink-0" />
      )}
    </Link>
  );
}

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = isAdmin() ? NAV_ADMIN : NAV_RESIDENT;
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? 'U';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 shrink-0">
          <Shield size={16} className="text-white" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <p className="font-display font-bold text-sm text-white truncate">SocietyTrack</p>
          <p className="text-xs text-sidebar-text truncate">
            {isAdmin() ? 'Admin Panel' : 'Resident Portal'}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-4 space-y-1">
        {navItems.map(item => (
          <NavItem key={item.href} item={item} collapsed={false} />
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-sidebar-border px-3 py-4 space-y-1">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600/20 border border-brand-600/30">
            <span className="text-xs font-bold text-brand-400">{initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-sidebar-text truncate">{user?.flatNo ?? 'Administrator'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-text hover:bg-sidebar-hover hover:text-red-400 transition-colors"
        >
          <LogOut size={16} strokeWidth={2} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-sidebar-bg fixed inset-y-0 z-20 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/50 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -240 }} animate={{ x: 0 }} exit={{ x: -240 }}
              transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              className="fixed inset-y-0 left-0 z-40 w-60 bg-sidebar-bg md:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 inset-x-0 z-20 bg-white border-b border-surface-200 px-4 h-14 flex items-center justify-between shadow-card">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <Shield size={14} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-sm text-ink">SocietyTrack</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="btn-icon"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
      </div>

      {/* Main */}
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 min-h-screen">
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
