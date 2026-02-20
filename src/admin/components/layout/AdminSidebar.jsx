import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { shallowEqual, useSelector } from 'react-redux';
import {
  LayoutDashboard,
  CalendarClock,
  Ticket,
  SquareStack,
  Clock3,
  Boxes,
  Gift,
  BadgePercent,
  Image as ImageIcon,
  FileText,
  Newspaper,
  Users,
  ShieldCheck,
  KeyRound,
  Network,
  BarChart3,
  PieChart,
  TrendingUp,
  SplitSquareHorizontal,
  UserCog,
  ChevronDown,
  DollarSign,
  Calendar,
  Building2,
  Eye,
} from 'lucide-react';
import PermissionGate from '../common/PermissionGate.jsx';

const baseLinkClasses =
  'group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors';

const STORE_KEY = 'sc_admin_sidebar_open_sections';

function normalizeRoleName(r) {
  if (!r) return '';
  if (typeof r === 'string') return r.toLowerCase().trim();
  // In case roles are objects: { role_name: 'Root' } or { name: 'root' }
  return String(r.role_name || r.name || r).toLowerCase().trim();
}

function usePersistedSections(defaults) {
  const [openMap, setOpenMap] = React.useState(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return defaults;
      const obj = JSON.parse(raw);
      return typeof obj === 'object' && obj ? { ...defaults, ...obj } : defaults;
    } catch {
      return defaults;
    }
  });

  const save = React.useCallback((next) => {
    setOpenMap(next);
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(next));
    } catch { }
  }, []);

  const setOne = React.useCallback(
    (key, val) => {
      save({ ...openMap, [key]: !!val });
    },
    [openMap, save]
  );

  return [openMap, setOne];
}

const EMPTY_ROLES = Object.freeze([]);
const EMPTY_PERMS = Object.freeze([]);

const selectSidebarAuth = (state) => {
  const auth = state.adminAuth || {};
  const user = auth.user || null;
  return {
    roles: Array.isArray(user?.roles) ? user.roles : EMPTY_ROLES,
    perms: Array.isArray(auth.perms) ? auth.perms : EMPTY_PERMS,
    userId: user?.user_id ?? user?.id ?? null,
  };
};

export default function AdminSidebar({ collapsed, onClose }) {
  const location = useLocation();

  // Roles, permissions, and user id from Redux
  const { roles: rolesRaw, perms: permsRaw, userId } = useSelector(selectSidebarAuth, shallowEqual);
  const roles = React.useMemo(() => (rolesRaw || []).map(normalizeRoleName), [rolesRaw]);
  const perms = React.useMemo(() => new Set((permsRaw || []).map((p) => String(p).toLowerCase().trim())), [permsRaw]);
  const isSuperUser = userId != null && Number(userId) === 1;

  // Show “Admin Management” if root/superadmin/superuser OR you granted explicit permission keys
  const canSeeAdminMgmt =
    isSuperUser ||
    roles.includes('root') ||
    roles.includes('superadmin') ||
    perms.has('admin-management:manage') ||
    perms.has('admin-management:write') ||
    perms.has('admin-management:read') ||
    perms.has('admins:manage') ||
    perms.has('admins:write') ||
    perms.has('admins:read');

  const handleNavClick = () => {
    if (typeof onClose === 'function') onClose();
  };

  const [navFilter, setNavFilter] = React.useState('');

  const NAV_SECTIONS = React.useMemo(() => {
    const baseSections = [
      {
        key: 'Dashboard',
        label: 'Overview',
        items: [{ to: '/admin', end: true, label: 'Executive Dashboard', icon: LayoutDashboard }],
      },
      {
        key: 'Analytics',
        label: 'Analytics',
        items: [
          {
            to: '/admin/analytics/overview',
            label: 'Overview',
            icon: BarChart3,
          },
          {
            to: '/admin/analytics/attractions',
            label: 'Attractions',
            icon: Building2,
          },
          {
            to: '/admin/analytics/daily',
            label: 'Daily Trend',
            icon: TrendingUp,
          },
          {
            to: '/admin/analytics/split',
            label: 'Split Analysis',
            icon: SplitSquareHorizontal,
          },
          {
            to: '/admin/analytics/custom',
            label: 'Custom Report',
            icon: FileText,
          },
          {
            to: '/admin/analytics/people',
            label: 'People',
            icon: Users,
          },
          {
            to: '/admin/analytics/views',
            label: 'Views',
            icon: Eye,
          },
          {
            to: '/admin/analytics/conversion',
            label: 'Conversion',
            icon: TrendingUp,
          },
          {
            to: '/admin/revenue/attractions',
            label: 'Attraction Revenue',
            icon: DollarSign,
          },
          {
            to: '/admin/revenue/combos',
            label: 'Combo Revenue',
            icon: DollarSign,
          },
        ],
      },
      {
        key: 'Bookings',
        label: 'Bookings',
        items: [
          { to: '/admin/bookings', label: 'All Bookings', icon: CalendarClock },
          { to: '/admin/bookings/calendar', label: 'Booking Calendar', icon: Calendar },
          { to: '/admin/bookings/slots', label: 'Time Slots', icon: Clock3 },
        ],
      },
      {
        key: 'Catalog',
        label: 'Catalog',
        items: [
          { to: '/admin/catalog/attractions', label: 'Attractions', icon: Gift },
          { to: '/admin/catalog/addons', label: 'Add-ons', icon: Gift },
          { to: '/admin/catalog/combos', label: 'Combos', icon: Boxes },
          { to: '/admin/catalog/offers', label: 'Offers', icon: BadgePercent },
          { to: '/admin/catalog/dynamic-pricing', label: 'Dynamic Pricing', icon: DollarSign },
          { to: '/admin/catalog/coupons', label: 'Coupons', icon: Ticket },
          { to: '/admin/catalog/banners', label: 'Banners', icon: ImageIcon },
          { to: '/admin/catalog/gallery', label: 'Gallery', icon: ImageIcon },
          { to: '/admin/catalog/pages', label: 'Pages', icon: FileText },
          { to: '/admin/catalog/blogs', label: 'Blogs', icon: Newspaper },
        ],
      },
      // Only show People section for admins/root/superadmins, hide for subadmins only
      ...(roles.includes('subadmin') && !roles.includes('admin') && !roles.includes('root') && !roles.includes('superadmin') ? [] : [{
        key: 'AdminManagement',
        label: 'People',
        items: [
          { to: '/admin/users', label: 'Customers', icon: Users },
          { to: '/admin/roles', label: 'Admin Roles', icon: ShieldCheck },
          ...(canSeeAdminMgmt
            ? [
              { to: '/admin/admins', label: 'Admin Team', icon: UserCog, permsAny: ['admin-management:read'] },
              { to: '/admin/admins/access', label: 'Grant Access', icon: KeyRound, permsAny: ['admin-management:write', 'admin-management:manage'] },
            ]
            : []),
        ],
      }]),
    ];

    if (navFilter.trim() === '') return baseSections;
    const term = navFilter.trim().toLowerCase();
    return baseSections
      .map((section) => {
        const items = section.items.filter((item) => item.label.toLowerCase().includes(term));
        if (!items.length) return null;
        return { ...section, items };
      })
      .filter(Boolean);
  }, [canSeeAdminMgmt, navFilter]);

  const defaults = React.useMemo(
    () => ({
      Dashboard: true,
      Analytics: false,
      Bookings: true,
      Catalog: true,
      AdminManagement: true,
      UsersRBAC: false,
    }),
    []
  );

  const [openMap, setOpen] = usePersistedSections(defaults);

  // Auto-open section for current route
  React.useEffect(() => {
    const path = location.pathname || '';
    for (const s of NAV_SECTIONS) {
      const isActiveSection = s.items.some((it) => path.startsWith(it.to));
      if (isActiveSection && !openMap[s.key]) {
        setOpen(s.key, true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, NAV_SECTIONS]);

  const toggleSection = (key) => setOpen(key, !openMap[key]);
  const isLinkActive = React.useCallback(
    (target, exact = false) => {
      if (!target) return false;
      const current = location.pathname || '';
      if (exact) return current === target;
      if (target === '/admin') return current === '/admin';
      return current.startsWith(target);
    },
    [location.pathname]
  );

  return (
    <aside
      className={[
        'h-screen sticky top-0 border-r border-white/20 dark:border-neutral-900/60 bg-gradient-to-b from-white/90 via-white to-white/60 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900 backdrop-blur-xl transition-[width] duration-200 ease-in-out shadow-[0_10px_40px_rgba(15,23,42,0.08)] dark:shadow-none',
        collapsed ? 'w-20' : 'w-72',
      ].join(' ')}
      aria-label="Admin navigation"
    >
      <div className="px-4 py-5 flex items-center justify-between border-b border-gray-200/50 dark:border-neutral-900/60">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-500/30">
            SC
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-neutral-100">SnowCity Admin</p>
              <p className="text-xs text-gray-500 dark:text-neutral-400">Experience Excellence</p>
            </div>
          )}
        </div>
        <button
          className="md:hidden rounded-full p-2 text-gray-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800"
          onClick={onClose}
          aria-label="Close navigation"
        >
          ✕
        </button>
      </div>

      {!collapsed && (
        <div className="px-4 pt-4">
          <label className="relative block">
            <input
              type="search"
              value={navFilter}
              onChange={(e) => setNavFilter(e.target.value)}
              placeholder="Quick find…"
              className="w-full rounded-2xl border border-gray-200/80 bg-white/80 dark:bg-neutral-900 px-3 py-2 text-sm text-gray-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            />
          </label>
        </div>
      )}

      <nav className="px-3 pb-4 h-[calc(100vh-140px)] overflow-y-auto">
        {NAV_SECTIONS.map((section) => {
          if (!section.items?.length) return null;
          const isOpen = !!openMap[section.key];

          return (
            <div key={section.key} className="mt-3 first:mt-0">
              <button
                type="button"
                className={[
                  'w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-semibold tracking-wide uppercase',
                  'text-gray-500 dark:text-neutral-400 hover:bg-gray-100/70 dark:hover:bg-neutral-800/70 backdrop-blur',
                ].join(' ')}
                onClick={() => toggleSection(section.key)}
                aria-expanded={isOpen}
                aria-controls={`section-${section.key}`}
                title={collapsed ? section.label : undefined}
              >
                {!collapsed && <span className="font-medium">{section.label}</span>}
                {collapsed && (
                  <span className="font-medium" aria-hidden="true">
                    {section.label.charAt(0)}
                  </span>
                )}
                <ChevronDown
                  className={[
                    'h-4 w-4 shrink-0 transition-transform',
                    isOpen ? 'rotate-180' : '',
                  ].join(' ')}
                />
              </button>

              <div
                id={`section-${section.key}`}
                className={[
                  'overflow-hidden transition-all',
                  isOpen ? 'max-h-[1200px] ease-in' : 'max-h-0 ease-out',
                ].join(' ')}
              >
                <div className="mt-1 space-y-1">
                  {section.items.map(({ to, end, label, icon: Icon, permsAny, permsAll }) => {
                    const link = (
                      <NavLink
                        key={to}
                        to={to}
                        end={end}
                        title={collapsed ? label : undefined}
                        className={({ isActive }) =>
                          [
                            baseLinkClasses,
                            collapsed ? 'justify-center px-2' : 'justify-start px-3',
                            isActive
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                              : 'text-gray-600 dark:text-neutral-300 hover:bg-gray-100/80 dark:hover:bg-neutral-800',
                          ].join(' ')
                        }
                        onClick={handleNavClick}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                        {!collapsed && <span>{label}</span>}
                      </NavLink>
                    );

                    if (permsAny || permsAll) {
                      return (
                        <PermissionGate key={to} anyOf={permsAny || []} allOf={permsAll || []}>
                          {link}
                        </PermissionGate>
                      );
                    }

                    return (
                      <div className="relative" key={to}>
                        {link}
                        {isLinkActive(to, end) && !collapsed && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      <div className="px-4 pb-5">
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-700 text-white p-4 shadow-lg">
          <p className="text-sm font-semibold mb-1">Need quick access?</p>
          <p className="text-xs text-white/80 mb-3">Jump to bookings or reach support instantly.</p>
          <div className="flex flex-col gap-2">
            <Link
              to="/admin/bookings"
              className="inline-flex items-center justify-center rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20"
              onClick={handleNavClick}
            >
              Go to Bookings
            </Link>
            <a
              href="mailto:support@snowcity.com"
              className="inline-flex items-center justify-center rounded-full bg-white text-slate-900 px-3 py-1.5 text-xs font-semibold"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
}