import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, CalendarClock, Ticket, SquareStack, Gift, BadgePercent,
  Image as ImageIcon, FileText, Newspaper, Users, ShieldCheck, KeyRound, Network,
  BarChart3, TrendingUp, SplitSquareHorizontal, UserCog, ChevronDown, DollarSign,
  Building2, Eye, Settings, Boxes, Tag, Layers, Megaphone
} from 'lucide-react';
import { useAdminRole } from '../../hooks/useAdminRole';

const NavItem = ({ to, end, icon: Icon, label, badge, collapsed, onClick }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
    onClick={onClick}
    title={collapsed ? label : undefined}
  >
    <Icon />
    <span className="nav-label-text">{label}</span>
    {!collapsed && badge != null && <span className="nav-badge">{badge}</span>}
  </NavLink>
);

export default function AdminSidebar({ collapsed, mobileOpen, onCloseMobile, onToggleCollapse }) {
  const location = useLocation();
  const {
    isSuperAdmin, isGM, isStaff, isEditor,
    canManageAdmins, canListAdmins, canSeeAnalytics,
    canSeeBookings, canSeeRevenue, canSeeSettings,
    canSeeUsers, canSeeFullCatalog, canSeeScopedCatalog, canSeeEditorCatalog,
  } = useAdminRole();

  const handleNavClick = () => { if (typeof onCloseMobile === 'function') onCloseMobile(); };

  const NAV_SECTIONS = [];

  if (!isEditor) {
    NAV_SECTIONS.push({
      key: 'Dashboard',
      isLink: true,
      to: '/admin', end: true, label: 'Dashboard', icon: LayoutDashboard
    });
  }

  if (canSeeBookings) {
    NAV_SECTIONS.push({
      key: 'Bookings',
      isLink: true,
      to: '/admin/bookings', end: false, label: 'Bookings', icon: CalendarClock
    });

    NAV_SECTIONS.push({
      key: 'Reports', label: 'Reports',
      items: [
        { to: '/admin/reports/transactions', label: 'Transaction Report', icon: FileText },
        { to: '/admin/reports/guests', label: 'Guest Report', icon: Users },
      ],
    });
  }

  if (canSeeAnalytics) {
    const items = [
      { to: '/admin/analytics/overview', label: 'Overview', icon: BarChart3 },
      { to: '/admin/analytics/daily', label: 'Daily Trend', icon: TrendingUp },
    ];
    if (canSeeBookings) items.push({ to: '/admin/bookings/analytics', label: 'Booking Analytics', icon: BarChart3 });
    if (isSuperAdmin || isGM) {
      items.push(
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
    NAV_SECTIONS.push({ key: 'Analytics', label: 'Analytics', items });
  }

  if (isSuperAdmin || isGM) {
    NAV_SECTIONS.push({
      key: 'Catalog', label: 'Catalog',
      items: [
        { to: '/admin/catalog/attractions', label: 'Attractions', icon: Gift },
        { to: '/admin/catalog/combos', label: 'Combos', icon: Boxes },
        { to: '/admin/catalog/addons', label: 'Add-ons', icon: Gift },
        { to: '/admin/catalog/offers', label: 'Offers', icon: BadgePercent },
        { to: '/admin/catalog/announcements', label: 'Announcements', icon: Megaphone },
        { to: '/admin/catalog/dynamic-pricing', label: 'Dynamic Pricing', icon: DollarSign },
        { to: '/admin/catalog/coupons', label: 'Coupons', icon: Ticket },
        { to: '/admin/catalog/banners', label: 'Banners', icon: ImageIcon },
        { to: '/admin/catalog/gallery', label: 'Gallery', icon: ImageIcon },
        { to: '/admin/catalog/pages', label: 'Pages', icon: FileText },
        { to: '/admin/catalog/blogs', label: 'Blogs', icon: Newspaper },
      ]
    });
  } else if (isStaff) {
    NAV_SECTIONS.push({
      key: 'Catalog', label: 'Catalog',
      items: [
        { to: '/admin/catalog/attractions', label: 'Attractions', icon: Gift },
        { to: '/admin/catalog/combos', label: 'Combos', icon: Boxes },
        { to: '/admin/catalog/offers', label: 'Offers', icon: BadgePercent },
        { to: '/admin/catalog/announcements', label: 'Announcements', icon: Megaphone },
        { to: '/admin/catalog/dynamic-pricing', label: 'Dynamic Pricing', icon: DollarSign },
      ]
    });
  } else if (isEditor) {
    NAV_SECTIONS.push({
      key: 'Catalog', label: 'Catalog',
      items: [
        { to: '/admin/catalog/attractions', label: 'Attractions', icon: Gift },
        { to: '/admin/catalog/combos', label: 'Combos', icon: Boxes },
        { to: '/admin/catalog/addons', label: 'Add-ons', icon: Gift },
        { to: '/admin/catalog/announcements', label: 'Announcements', icon: Megaphone },
        { to: '/admin/catalog/banners', label: 'Banners', icon: ImageIcon },
        { to: '/admin/catalog/gallery', label: 'Gallery', icon: ImageIcon },
        { to: '/admin/catalog/pages', label: 'Pages', icon: FileText },
        { to: '/admin/catalog/blogs', label: 'Blogs', icon: Newspaper },
      ]
    });
  }

  if (canListAdmins) {
    const items = [
      { to: '/admin/users', label: 'Customers', icon: Users },
      { to: '/admin/roles', label: 'Admin Roles', icon: ShieldCheck },
      { to: '/admin/admins', label: 'Admin Team', icon: UserCog },
    ];
    if (canManageAdmins) {
      items.push(
        { to: '/admin/admins/new', label: 'Create Admin', icon: UserCog },
        { to: '/admin/admins/access', label: 'Grant Access', icon: KeyRound }
      );
    }
    NAV_SECTIONS.push({ key: 'People', label: 'People', items });
  }

  if (canSeeSettings) {
    NAV_SECTIONS.push({
      key: 'Settings', label: 'Settings',
      items: [{ to: '/admin/site-settings', label: 'Site Settings (SEO)', icon: Settings }]
    });
  }

  let badgeStr = '';
  if (isSuperAdmin) badgeStr = 'Super Admin';
  else if (isGM) badgeStr = 'General Manager';
  else if (isStaff) badgeStr = 'Staff';
  else if (isEditor) badgeStr = 'Editor';
  else badgeStr = 'Admin';

  const sidebarClass = `sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`;

  return (
    <aside className={sidebarClass} id="sidebar">
      <div className="sidebar-head">
        <div className="logo-wrap">
          <div className="logo-icon">SP</div>
          <div className="logo-text">
            <div className="logo-title">Snow Park Panel</div>
            <span className="logo-badge">{badgeStr}</span>
          </div>
        </div>

        {/* Mobile close button inside header if mobile open */}
        {mobileOpen && (
          <button className="collapse-btn md:hidden" onClick={onCloseMobile} title="Close">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        )}

        {/* Desktop collapse toggle */}
        <button className="collapse-btn hidden md:flex" onClick={onToggleCollapse} title="Toggle Sidebar">
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>

      <div className="nav-body">
        {NAV_SECTIONS.map((section) => {
          if (section.isLink) {
            return (
              <NavItem
                key={section.key}
                to={section.to}
                end={section.end}
                icon={section.icon}
                label={section.label}
                collapsed={collapsed && !mobileOpen}
                onClick={handleNavClick}
              />
            );
          }

          if (!section.items?.length) return null;

          return (
            <React.Fragment key={section.key}>
              <div className="nav-section-label">{section.label}</div>
              {section.items.map(item => (
                <NavItem
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  icon={item.icon}
                  label={item.label}
                  collapsed={collapsed && !mobileOpen}
                  onClick={handleNavClick}
                />
              ))}
            </React.Fragment>
          );
        })}
      </div>
    </aside>
  );
}