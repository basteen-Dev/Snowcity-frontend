import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { adminLogout } from '../../features/auth/adminAuthSlice';
import ThemeToggle from '../common/ThemeToggle';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Menu, LogOut, User } from 'lucide-react';

const quickLinks = [
  { label: 'Reports', to: '/analytics/overview' },
  { label: 'Bookings', to: '/bookings' },
];

// Simple breadcrumb from path
function useBreadcrumbs() {
  const { pathname } = useLocation();
  const parts = pathname.replace(/^\/admin\/?/, '').split('/').filter(Boolean);
  return parts.map((p, i) => ({
    label: p.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    to: '/' + parts.slice(0, i + 1).join('/'),
    isLast: i === parts.length - 1,
  }));
}

export default function AdminTopbar({ onToggleSidebar, onToggleMobile }) {
  const user = useSelector((s) => s.adminAuth?.user);
  const dispatch = useDispatch();
  const initial = (user?.name || user?.email || 'A').charAt(0).toUpperCase();
  const [open, setOpen] = React.useState(false);

  const profileRef = React.useRef(null);
  const breadcrumbs = useBreadcrumbs();

  React.useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border-b border-gray-200/80 dark:border-slate-700">
      <div className="h-16 px-4 md:px-6 flex items-center justify-between gap-4">
        {/* Left: Toggle + Branding */}
        <div className="flex items-center gap-3">
          <button
            className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
            onClick={onToggleMobile}
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
          <button
            className="hidden md:inline-flex items-center justify-center h-9 w-9 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>
          {/* Breadcrumbs */}
          <nav className="hidden md:flex items-center gap-1 text-sm" aria-label="Breadcrumb">
            <Link to="/" className="text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300 transition-colors">
              Home
            </Link>
            {breadcrumbs.map((crumb) => (
              <React.Fragment key={crumb.to}>
                <span className="text-gray-300 dark:text-neutral-600 mx-1">/</span>
                {crumb.isLast ? (
                  <span className="font-medium text-gray-700 dark:text-neutral-200 truncate max-w-[160px]">{crumb.label}</span>
                ) : (
                  <Link to={crumb.to} className="text-gray-400 dark:text-neutral-500 hover:text-gray-600 dark:hover:text-neutral-300 transition-colors truncate max-w-[120px]">
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>

        <div className="flex-1" />
        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <ThemeToggle compact />
          </div>
          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-sm font-semibold shadow-sm hover:shadow-md transition-shadow"
              title={user?.name || user?.email || 'Profile'}
              onClick={() => setOpen((v) => !v)}
            >
              {initial}
            </button>
            {open && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="px-4 py-3 bg-gray-50 dark:bg-neutral-800/50">
                  <p className="text-sm font-semibold text-gray-900 dark:text-neutral-50 truncate">{user?.name || 'Admin'}</p>
                  <p className="text-xs text-gray-500 dark:text-neutral-400 truncate">{user?.email}</p>
                </div>

                <div className="border-t border-gray-100 dark:border-slate-700 py-1">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                    onClick={() => setOpen(false)}
                  >
                    <User className="h-4 w-4 text-gray-400" />
                    Profile & Settings
                  </Link>
                  <button
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    onClick={() => { setOpen(false); dispatch(adminLogout()); }}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
