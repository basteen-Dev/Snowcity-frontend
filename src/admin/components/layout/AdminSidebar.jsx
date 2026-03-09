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

  const [expandedSections, setExpandedSections] = React.useState({
    Reports: true,
    Analytics: true,
    Catalog: true,
    People: true,
    Settings: true
  });

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNavClick = () => { if (typeof onCloseMobile === 'function') onCloseMobile(); };

  const NAV_SECTIONS = [];

  if (!isEditor) {
    NAV_SECTIONS.push({
      key: 'Dashboard',
      isLink: true,
      to: '/parkpanel', end: true, label: 'Dashboard', icon: LayoutDashboard
    });
  }

  if (canSeeBookings) {
    NAV_SECTIONS.push({
      key: 'Bookings',
      isLink: true,
      to: '/parkpanel/bookings', end: false, label: 'Bookings', icon: CalendarClock
    });

    NAV_SECTIONS.push({
      key: 'Reports', label: 'Reports',
      items: [
        { to: '/parkpanel/reports/transactions', label: 'Transaction Report', icon: FileText },
        { to: '/parkpanel/reports/guests', label: 'Guest Report', icon: Users },
      ],
    });
  }

  if (canSeeAnalytics) {
    const items = [
      { to: '/parkpanel/analytics/overview', label: 'Overview', icon: BarChart3 },
      { to: '/parkpanel/analytics/daily', label: 'Daily Trend', icon: TrendingUp },
    ];
    if (canSeeBookings) items.push({ to: '/parkpanel/bookings/analytics', label: 'Booking Analytics', icon: BarChart3 });
    if (isSuperAdmin || isGM) {
      items.push(
        { to: '/parkpanel/analytics/attractions', label: 'Attractions', icon: Building2 },
        { to: '/parkpanel/analytics/split', label: 'Split Analysis', icon: SplitSquareHorizontal },
        { to: '/parkpanel/analytics/custom', label: 'Custom Report', icon: FileText },
        { to: '/parkpanel/analytics/people', label: 'People', icon: Users },
        { to: '/parkpanel/analytics/views', label: 'Views', icon: Eye },
        { to: '/parkpanel/analytics/conversion', label: 'Conversion', icon: TrendingUp },
        { to: '/parkpanel/revenue/attractions', label: 'Attraction Revenue', icon: DollarSign },
        { to: '/parkpanel/revenue/combos', label: 'Combo Revenue', icon: DollarSign },
      );
    }
    NAV_SECTIONS.push({ key: 'Analytics', label: 'Analytics', items });
  }

  if (isSuperAdmin || isGM) {
    NAV_SECTIONS.push({
      key: 'Catalog', label: 'Catalog',
      items: [
        { to: '/parkpanel/catalog/attractions', label: 'Attractions', icon: Gift },
        { to: '/parkpanel/catalog/combos', label: 'Combos', icon: Boxes },
        { to: '/parkpanel/catalog/addons', label: 'Add-ons', icon: Gift },
        { to: '/parkpanel/catalog/offers', label: 'Offers', icon: BadgePercent },
        { to: '/parkpanel/catalog/announcements', label: 'Announcements', icon: Megaphone },
        { to: '/parkpanel/catalog/dynamic-pricing', label: 'Dynamic Pricing', icon: DollarSign },
        { to: '/parkpanel/catalog/coupons', label: 'Coupons', icon: Ticket },
        { to: '/parkpanel/catalog/banners', label: 'Banners', icon: ImageIcon },
        { to: '/parkpanel/catalog/gallery', label: 'Gallery', icon: ImageIcon },
        { to: '/parkpanel/catalog/pages', label: 'Pages', icon: FileText },
        { to: '/parkpanel/catalog/blogs', label: 'Blogs', icon: Newspaper },
      ]
    });
  } else if (isStaff) {
    NAV_SECTIONS.push({
      key: 'Catalog', label: 'Catalog',
      items: [
        { to: '/parkpanel/catalog/attractions', label: 'Attractions', icon: Gift },
        { to: '/parkpanel/catalog/combos', label: 'Combos', icon: Boxes },
        { to: '/parkpanel/catalog/offers', label: 'Offers', icon: BadgePercent },
        { to: '/parkpanel/catalog/announcements', label: 'Announcements', icon: Megaphone },
        { to: '/parkpanel/catalog/dynamic-pricing', label: 'Dynamic Pricing', icon: DollarSign },
      ]
    });
  } else if (isEditor) {
    NAV_SECTIONS.push({
      key: 'Catalog', label: 'Catalog',
      items: [
        { to: '/parkpanel/catalog/attractions', label: 'Attractions', icon: Gift },
        { to: '/parkpanel/catalog/combos', label: 'Combos', icon: Boxes },
        { to: '/parkpanel/catalog/addons', label: 'Add-ons', icon: Gift },
        { to: '/parkpanel/catalog/announcements', label: 'Announcements', icon: Megaphone },
        { to: '/parkpanel/catalog/banners', label: 'Banners', icon: ImageIcon },
        { to: '/parkpanel/catalog/gallery', label: 'Gallery', icon: ImageIcon },
        { to: '/parkpanel/catalog/pages', label: 'Pages', icon: FileText },
        { to: '/parkpanel/catalog/blogs', label: 'Blogs', icon: Newspaper },
      ]
    });
  }

  if (canListAdmins) {
    const items = [
      { to: '/parkpanel/users', label: 'Customers', icon: Users },
      { to: '/parkpanel/roles', label: 'Admin Roles', icon: ShieldCheck },
      { to: '/parkpanel/admins', label: 'Admin Team', icon: UserCog },
    ];
    if (canManageAdmins) {
      items.push(
        { to: '/parkpanel/admins/new', label: 'Create Admin', icon: UserCog },
        { to: '/parkpanel/admins/access', label: 'Grant Access', icon: KeyRound }
      );
    }
    NAV_SECTIONS.push({ key: 'People', label: 'People', items });
  }

  if (canSeeSettings) {
    NAV_SECTIONS.push({
      key: 'Settings', label: 'Settings',
      items: [{ to: '/parkpanel/site-settings', label: 'Site Settings (SEO)', icon: Settings }]
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

          const isExpanded = expandedSections[section.key];

          return (
            <React.Fragment key={section.key}>
              <div
                className={`nav-section-label clickable ${isExpanded ? 'active' : ''}`}
                onClick={() => toggleSection(section.key)}
              >
                <span>{section.label}</span>
                {!collapsed && (
                  <ChevronDown
                    size={14}
                    className={`section-arrow ${isExpanded ? 'expanded' : ''}`}
                  />
                )}
              </div>
              <div className={`nav-section-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
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
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </aside>
  );
}
