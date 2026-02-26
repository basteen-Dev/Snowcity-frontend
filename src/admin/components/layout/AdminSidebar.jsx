import React from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarClock,
  Ticket,
  SquareStack,
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
  TrendingUp,
  SplitSquareHorizontal,
  UserCog,
  ChevronDown,
  DollarSign,
  Building2,
  Eye,
  Settings,
  Boxes,
  Tag,
  Layers,
} from 'lucide-react';
import { useAdminRole } from '../../hooks/useAdminRole';

const baseLinkClasses =
  'group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors';

const STORE_KEY = 'sc_admin_sidebar_open_sections';

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
    try { localStorage.setItem(STORE_KEY, JSON.stringify(next)); } catch { }
  }, []);

  const setOne = React.useCallback(
    (key, val) => save({ ...openMap, [key]: !!val }),
    [openMap, save]
  );

  return [openMap, setOne];
}

export default function AdminSidebar({ collapsed, onClose }) {
  const location = useLocation();
  const {
    isSuperAdmin,
    isGM,
    isStaff,
    isEditor,
    canManageAdmins,
    canListAdmins,
    canSeeAnalytics,
    canSeeBookings,
    canSeeRevenue,
    canSeeSettings,
    canSeeUsers,
    canSeeFullCatalog,
    canSeeScopedCatalog,
    canSeeEditorCatalog,
  } = useAdminRole();

  const [navFilter, setNavFilter] = React.useState('');

  const handleNavClick = () => { if (typeof onClose === 'function') onClose(); };

  const NAV_SECTIONS = React.useMemo(() => {
    const sections = [];

    // ─────────────────────────────────────────────────
    // 1. Dashboard — everyone except Editor
    // ─────────────────────────────────────────────────
    if (!isEditor) {
      sections.push({
        key: 'Dashboard',
        label: 'Overview',
        items: [{ to: '/admin', end: true, label: 'Executive Dashboard', icon: LayoutDashboard }],
      });
    }

    // ─────────────────────────────────────────────────
    // 2. Analytics — SuperAdmin, GM, Staff
    // ─────────────────────────────────────────────────
    if (canSeeAnalytics) {
      const analyticsItems = [
        { to: '/admin/analytics/overview', label: 'Overview', icon: BarChart3 },
        { to: '/admin/analytics/daily', label: 'Daily Trend', icon: TrendingUp },
      ];
      // Full analytics (non-scoped)  — SuperAdmin + GM only
      if (isSuperAdmin || isGM) {
        analyticsItems.push(
          { to: '/admin/analytics/attractions', label: 'Attractions', icon: Building2 },
          { to: '/admin/analytics/split', label: 'Split Analysis', icon: SplitSquareHorizontal },
          { to: '/admin/analytics/custom', label: 'Custom Report', icon: FileText },
          { to: '/admin/analytics/people', label: 'People', icon: Users },
          { to: '/admin/analytics/views', label: 'Views', icon: Eye },
          { to: '/admin/analytics/conversion', label: 'Conversion', icon: TrendingUp },
          { to: '/admin/revenue/attractions', label: 'Attraction Revenue', icon: DollarSign },
          { to: '/admin/revenue/combos', label: 'Combo Revenue', icon: DollarSign },
        );
      }
      sections.push({ key: 'Analytics', label: 'Analytics', items: analyticsItems });
    }

    // ─────────────────────────────────────────────────
    // 3. Bookings — SuperAdmin, GM, Staff
    // ─────────────────────────────────────────────────
    if (canSeeBookings) {
      sections.push({
        key: 'Bookings',
        label: 'Bookings',
        items: [{ to: '/admin/bookings', label: 'All Bookings', icon: CalendarClock }],
      });
    }

    // ─────────────────────────────────────────────────
    // 4. Catalog sections vary by role
    // ─────────────────────────────────────────────────

    if (isSuperAdmin || isGM) {
      // Full catalog
      sections.push({
        key: 'Catalog',
        label: 'Catalog',
        items: [
          { to: '/admin/catalog/attractions', label: 'Attractions', icon: Gift },
          { to: '/admin/catalog/combos', label: 'Combos', icon: Boxes },
          { to: '/admin/catalog/addons', label: 'Add-ons', icon: Gift },
          { to: '/admin/catalog/offers', label: 'Offers', icon: BadgePercent },
          { to: '/admin/catalog/dynamic-pricing', label: 'Dynamic Pricing', icon: DollarSign },
          { to: '/admin/catalog/coupons', label: 'Coupons', icon: Ticket },
          { to: '/admin/catalog/banners', label: 'Banners', icon: ImageIcon },
          { to: '/admin/catalog/gallery', label: 'Gallery', icon: ImageIcon },
          { to: '/admin/catalog/pages', label: 'Pages', icon: FileText },
          { to: '/admin/catalog/blogs', label: 'Blogs', icon: Newspaper },
        ],
      });
    } else if (isStaff) {
      // Staff — attractions, combos (scoped), offers, dynamic pricing
      sections.push({
        key: 'Catalog',
        label: 'Catalog',
        items: [
          { to: '/admin/catalog/attractions', label: 'Attractions', icon: Gift },
          { to: '/admin/catalog/combos', label: 'Combos', icon: Boxes },
          { to: '/admin/catalog/offers', label: 'Offers', icon: BadgePercent },
          { to: '/admin/catalog/dynamic-pricing', label: 'Dynamic Pricing', icon: DollarSign },
        ],
      });
    } else if (isEditor) {
      // Editor — catalog only, NO offers/coupons/dynamic pricing
      sections.push({
        key: 'Catalog',
        label: 'Catalog',
        items: [
          { to: '/admin/catalog/attractions', label: 'Attractions', icon: Gift },
          { to: '/admin/catalog/combos', label: 'Combos', icon: Boxes },
          { to: '/admin/catalog/addons', label: 'Add-ons', icon: Gift },
          { to: '/admin/catalog/banners', label: 'Banners', icon: ImageIcon },
          { to: '/admin/catalog/gallery', label: 'Gallery', icon: ImageIcon },
          { to: '/admin/catalog/pages', label: 'Pages', icon: FileText },
          { to: '/admin/catalog/blogs', label: 'Blogs', icon: Newspaper },
        ],
      });
    }

    // ─────────────────────────────────────────────────
    // 5. People — SuperAdmin (full) + GM (read-only)
    // ─────────────────────────────────────────────────
    if (canListAdmins) {
      const peopleItems = [
        { to: '/admin/users', label: 'Customers', icon: Users },
        { to: '/admin/roles', label: 'Admin Roles', icon: ShieldCheck },
        { to: '/admin/admins', label: 'Admin Team', icon: UserCog },
      ];
      if (canManageAdmins) {
        peopleItems.push(
          { to: '/admin/admins/new', label: 'Create Admin', icon: UserCog },
          { to: '/admin/admins/access', label: 'Grant Access', icon: KeyRound },
        );
      }
      sections.push({ key: 'People', label: 'People', items: peopleItems });
    }

    // ─────────────────────────────────────────────────
    // 6. Settings — SuperAdmin + GM
    // ─────────────────────────────────────────────────
    if (canSeeSettings) {
      sections.push({
        key: 'Settings',
        label: 'Settings',
        items: [
          { to: '/admin/site-settings', label: 'Site Settings (SEO)', icon: Settings },
        ],
      });
    }

    // Filter by search
    if (!navFilter.trim()) return sections;
    const term = navFilter.trim().toLowerCase();
    return sections
      .map((s) => {
        const items = s.items.filter((it) => it.label.toLowerCase().includes(term));
        return items.length ? { ...s, items } : null;
      })
      .filter(Boolean);
  }, [
    isSuperAdmin, isGM, isStaff, isEditor,
    canManageAdmins, canListAdmins, canSeeAnalytics,
    canSeeBookings, canSeeSettings, navFilter,
  ]);

  const defaults = React.useMemo(() => ({
    Dashboard: true,
    Analytics: false,
    Bookings: true,
    Catalog: true,
    People: false,
    Settings: false,
  }), []);

  const [openMap, setOpen] = usePersistedSections(defaults);

  React.useEffect(() => {
    const path = location.pathname || '';
    for (const s of NAV_SECTIONS) {
      if (s.items.some((it) => path.startsWith(it.to)) && !openMap[s.key]) {
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

  // Role badge for the info panel
  const roleBadge = React.useMemo(() => {
    if (isSuperAdmin) return { label: 'Super Admin', color: 'from-red-500 to-rose-600' };
    if (isGM) return { label: 'General Manager', color: 'from-purple-500 to-violet-600' };
    if (isStaff) return { label: 'Staff', color: 'from-blue-500 to-cyan-600' };
    if (isEditor) return { label: 'Editor', color: 'from-green-500 to-emerald-600' };
    return { label: 'Admin', color: 'from-gray-500 to-gray-600' };
  }, [isSuperAdmin, isGM, isStaff, isEditor]);

  return (
    <aside
      className={[
        'h-screen sticky top-0 border-r border-white/20 dark:border-neutral-900/60 bg-gradient-to-b from-white/90 via-white to-white/60 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900 backdrop-blur-xl transition-[width] duration-200 ease-in-out shadow-[0_10px_40px_rgba(15,23,42,0.08)] dark:shadow-none',
        collapsed ? 'w-20' : 'w-72',
      ].join(' ')}
      aria-label="Admin navigation"
    >
      {/* Logo */}
      <div className="px-4 py-5 flex items-center justify-between border-b border-gray-200/50 dark:border-neutral-900/60">
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${roleBadge.color} text-white font-semibold shadow-lg`}>
            SC
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-neutral-100">SnowCity Admin</p>
              <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full text-white bg-gradient-to-r ${roleBadge.color}`}>
                {roleBadge.label}
              </span>
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

      {/* Search */}
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

      {/* Nav */}
      <nav className="px-3 pb-4 h-[calc(100vh-160px)] overflow-y-auto">
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
                {collapsed && <span className="font-medium" aria-hidden="true">{section.label.charAt(0)}</span>}
                <ChevronDown
                  className={['h-4 w-4 shrink-0 transition-transform', isOpen ? 'rotate-180' : ''].join(' ')}
                />
              </button>

              <div
                id={`section-${section.key}`}
                className={['overflow-hidden transition-all', isOpen ? 'max-h-[1200px] ease-in' : 'max-h-0 ease-out'].join(' ')}
              >
                <div className="mt-1 space-y-1">
                  {section.items.map(({ to, end, label, icon: Icon }) => (
                    <div className="relative" key={to}>
                      <NavLink
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
                      {isLinkActive(to, end) && !collapsed && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom panel */}
      <div className="px-4 pb-5">
        <div className={`rounded-2xl bg-gradient-to-br ${roleBadge.color.replace('from-', 'from-').replace('to-', 'to-')} text-white p-4 shadow-lg`}
          style={{ background: 'linear-gradient(135deg, #1e3a5f, #1e40af)' }}>
          <p className="text-sm font-semibold mb-1">Quick Access</p>
          <p className="text-xs text-white/80 mb-3">Jump to bookings or reach support.</p>
          <div className="flex flex-col gap-2">
            {canSeeBookings && (
              <Link
                to="/admin/bookings"
                className="inline-flex items-center justify-center rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20"
                onClick={handleNavClick}
              >
                Go to Bookings
              </Link>
            )}
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