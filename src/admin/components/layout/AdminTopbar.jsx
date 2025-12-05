import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { adminLogout } from '../../features/auth/adminAuthSlice';
import ThemeToggle from '../common/ThemeToggle';
import { Link } from 'react-router-dom';
import { Search, Bell } from 'lucide-react';

const quickLinks = [
  { label: 'Reports', to: '/admin/analytics/overview' },
  { label: 'Offers', to: '/admin/catalog/offers' },
];

export default function AdminTopbar({ onToggleSidebar, onToggleMobile }) {
  const user = useSelector((s) => s.adminAuth?.user);
  const dispatch = useDispatch();
  const initial = (user?.name || user?.email || 'A').charAt(0).toUpperCase();
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const profileRef = React.useRef(null);

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
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-neutral-900/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-gray-200 dark:border-neutral-800">
      <div className="h-16 px-3 md:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button className="md:hidden rounded-xl border border-gray-200 px-3 py-2 text-gray-600" onClick={onToggleMobile} aria-label="Open navigation">
            ☰
          </button>
          <button className="hidden md:inline-flex rounded-xl border border-gray-200 px-3 py-2 text-gray-600" onClick={onToggleSidebar} aria-label="Toggle navigation">
            ☰
          </button>
          <div className="hidden md:flex flex-col">
            <span className="text-xs uppercase tracking-wide text-gray-500">SnowCity Admin</span>
            <span className="text-sm font-semibold text-gray-900">Operations Control</span>
          </div>
        </div>

        <div className="flex-1 flex items-center gap-3 max-w-3xl">
          <label className="flex-1 relative">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bookings, users, offers..."
              className="w-full rounded-full border border-gray-200 bg-white px-10 py-2 text-sm shadow-sm focus:border-gray-400 focus:outline-none"
            />
          </label>
          <div className="hidden lg:flex items-center gap-2">
            {quickLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:border-gray-400"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="hidden md:inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </button>
          <div className="hidden md:block">
            <ThemeToggle compact />
          </div>
          <div className="relative" ref={profileRef}>
            <button
              className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-900 to-gray-700 text-white flex items-center justify-center"
              title={user?.name || user?.email || 'Profile'}
              onClick={() => setOpen((v) => !v)}
            >
              {initial}
            </button>
            {open && (
              <div className="absolute right-0 top-full mt-3 w-64 rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900 dark:text-neutral-50">{user?.name || 'Admin user'}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <div className="border-t border-gray-200 dark:border-neutral-800" />
                <div className="px-4 py-3 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Theme</span>
                  <ThemeToggle />
                </div>
                <div className="border-t border-gray-200 dark:border-neutral-800" />
                <Link
                  to="/admin/profile"
                  className="block px-4 py-3 text-sm text-gray-700 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-800"
                  onClick={() => setOpen(false)}
                >
                  Profile & Settings
                </Link>
                <button
                  className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-neutral-800"
                  onClick={() => { setOpen(false); dispatch(adminLogout()); }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}