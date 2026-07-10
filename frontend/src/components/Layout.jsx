import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_RESIDENT = [
  { label: 'My Complaints', href: '/complaints', icon: '📋' },
  { label: 'Raise Complaint', href: '/complaints/new', icon: '➕' },
  { label: 'Notice Board', href: '/notices', icon: '📣' },
];

const NAV_ADMIN = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
  { label: 'Complaints', href: '/admin/complaints', icon: '📋' },
  { label: 'Notices', href: '/admin/notices', icon: '📣' },
  { label: 'Settings', href: '/admin/config', icon: '⚙️' },
];

// Shared app shell with sidebar navigation for all authenticated pages
export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = isAdmin() ? NAV_ADMIN : NAV_RESIDENT;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar — visible on md+ screens */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-100 fixed inset-y-0 z-10">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-white text-xs font-bold">S</div>
            <span className="font-semibold text-gray-900 text-sm">Society Tracker</span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-50 text-primary'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-3 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
            <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-xs font-semibold text-gray-600 uppercase shrink-0">
              {user?.name?.[0] ?? 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-800 truncate">{user?.name}</p>
              <p className="text-xs text-neutral truncate">{user?.flatNo ?? 'Admin'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-1 w-full text-left px-3 py-1.5 text-xs text-neutral hover:text-danger rounded-lg hover:bg-red-50 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center text-white text-xs font-bold">S</div>
          <span className="font-semibold text-gray-900 text-sm">Society Tracker</span>
        </div>
        <button onClick={handleLogout} className="text-xs text-neutral hover:text-danger">Sign out</button>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-10 bg-white border-t border-gray-100 flex">
        {navItems.map((item) => {
          const active = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors ${
                active ? 'text-primary' : 'text-neutral hover:text-gray-700'
              }`}
            >
              <span className="text-lg leading-none mb-0.5">{item.icon}</span>
              {item.label.split(' ')[0]}
            </Link>
          );
        })}
      </nav>

      {/* Main content area */}
      <main className="flex-1 md:ml-60 pt-14 md:pt-0 pb-16 md:pb-0">
        {children}
      </main>
    </div>
  );
}
