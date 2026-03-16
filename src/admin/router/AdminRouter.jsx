// src/parkpanel/router/AdminRouter.jsx
import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAdminRole } from '../hooks/useAdminRole';

import AdminLayout from '../components/layout/AdminLayout';
import Login from '../pages/Login';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import AdminProfile from '../pages/account/AdminProfile';


const AdminsList = lazy(() => import('../pages/admins/AdminsList.jsx'));
const AdminNew = lazy(() => import('../pages/admins/AdminNew.jsx'));
const AdminAccess = lazy(() => import('../pages/admins/AdminAccess.jsx'));
// Lazy pages
const Dashboard = lazy(() => import('../pages/Dashboard'));

const BookingsList = lazy(() => import('../pages/bookings/BookingsList'));
const BookingDetails = lazy(() => import('../pages/bookings/BookingDetails'));
const BookingsAnalytics = lazy(() => import('../pages/bookings/BookingsAnalytics'));

const AttractionsList = lazy(() => import('../pages/catalog/AttractionsList'));
const AttractionForm = lazy(() => import('../pages/catalog/AttractionForm'));

const SlotsList = lazy(() => import('../pages/catalog/SlotList'));
const SlotForm = lazy(() => import('../pages/catalog/SlotForm'));
const SlotBulk = lazy(() => import('../pages/catalog/SlotBulk'));

const AddonsList = lazy(() => import('../pages/catalog/AddonsList'));
const AddonForm = lazy(() => import('../pages/catalog/AddonForm'));

const OffersList = lazy(() => import('../pages/catalog/OffersList'));
const OfferForm = lazy(() => import('../pages/catalog/OfferForm'));
const AnnouncementsList = lazy(() => import('../pages/catalog/AnnouncementsList'));


const CouponsList = lazy(() => import('../pages/catalog/CouponsList'));
const CouponForm = lazy(() => import('../pages/catalog/CouponForm'));

const BannersList = lazy(() => import('../pages/catalog/BannersList'));
const BannerForm = lazy(() => import('../pages/catalog/BannerForm'));

const PagesList = lazy(() => import('../pages/catalog/PagesList'));
const PageForm = lazy(() => import('../pages/catalog/PageForm'));

const SectionsList = lazy(() => import('../pages/catalog/SectionsList'));
const SectionForm = lazy(() => import('../pages/catalog/SectionForm'));

const BlogsList = lazy(() => import('../pages/catalog/BlogsList'));
const BlogForm = lazy(() => import('../pages/catalog/BlogForm'));

const CombosList = lazy(() => import('../pages/catalog/CombosList'));
const ComboForm = lazy(() => import('../pages/catalog/ComboForm'));

// Attraction Slots
const AttractionSlotList = lazy(() => import('../pages/catalog/AttractionSlotList.jsx'));

// Gallery manager
const GalleryManager = lazy(() => import('../pages/catalog/GalleryManager.jsx'));
const GalleryForm = lazy(() => import('../pages/catalog/GalleryForm.jsx'));


const ComboSlotList = lazy(() => import('../pages/catalog/ComboSlotList.jsx'));
const ComboSlotForm = lazy(() => import('../pages/catalog/ComboSlotForm.jsx'));
const ComboSlotBulk = lazy(() => import('../pages/catalog/ComboSlotBulk.jsx'));

const DynamicPricing = lazy(() => import('../pages/DynamicPricing'));

const UsersList = lazy(() => import('../pages/users/UsersList'));
const UserNew = lazy(() => import('../pages/users/UserNew'));
const UserEdit = lazy(() => import('../pages/users/UserEdit'));

const RolesList = lazy(() => import('../pages/rbac/RolesList'));
const RoleForm = lazy(() => import('../pages/rbac/RoleForm'));
const RolePermissions = lazy(() => import('../pages/rbac/RolePermissions'));

// Analytics pages
const AnalyticsOverview = lazy(() => import('../pages/analytics/Overview.jsx'));
const AnalyticsAttractions = lazy(() => import('../pages/analytics/Attractions.jsx'));
const AnalyticsDaily = lazy(() => import('../pages/analytics/Daily.jsx'));
const AnalyticsCustom = lazy(() => import('../pages/analytics/Custom.jsx'));
const AnalyticsPeople = lazy(() => import('../pages/analytics/People.jsx'));
const AnalyticsViews = lazy(() => import('../pages/analytics/Views.jsx'));
const AnalyticsSplit = lazy(() => import('../pages/analytics/Split.jsx'));
const AnalyticsTop = lazy(() => import('../pages/analytics/TopAttractions'));

// Revenue pages
const AttractionsRevenue = lazy(() => import('../pages/revenue/AttractionRevenue'));
const ComboRevenue = lazy(() => import('../pages/revenue/ComboRevenue'));

// Site Settings
const SiteSettings = lazy(() => import('../pages/settings/SiteSettings'));

// Report pages
const TransactionReport = lazy(() => import('../pages/reports/TransactionReport'));
const GuestReport = lazy(() => import('../pages/reports/GuestReport'));

function RequireAdmin({ children }) {
  const token = useSelector((s) => s.adminAuth?.token);
  if (!token) return <Navigate to="login" replace />;
  return children;
}

function SuspenseOutlet() {
  return (
    <Suspense fallback={<div className="p-4 text-sm">Loading…</div>}>
      <Outlet />
    </Suspense>
  );
}

/**
 * Route guard — only renders children if the check returns true,
 * otherwise redirects to catalog (for editors) or admin dashboard.
 */
function RequireRole({ allowed, module, children }) {
  const {
    isSuperAdmin, isGM, isStaff, isEditor,
    canSeeAnalytics, canSeeBookings, canSeeOffers, canSeeDynamicPricing,
    canSeeReports, canSeeCatalog,
  } = useAdminRole();
  const { checked, token, profileLoaded } = useSelector((s) => ({
    checked: s.adminAuth?.checked,
    token: s.adminAuth?.token,
    profileLoaded: (s.adminAuth?.roles?.length > 0) || s.adminAuth?.isSuperAdmin || s.adminAuth?.scopes !== null || (s.adminAuth?.perms?.length > 0),
  }));

  // Not authenticated at all yet
  if (!checked && !token) return null;

  // Token exists but profile (roles) haven't loaded yet — show loader briefly
  if (token && !profileLoaded) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-xl h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  const roleMap = { superadmin: isSuperAdmin, gm: isGM, staff: isStaff, editor: isEditor };

  // SuperAdmin always passes
  if (isSuperAdmin) return children;

  // Check if any of the allowed roles match
  const roleOk = (allowed || []).some((r) => {
    const key = r.toLowerCase().replace(/\s+/g, '');
    return roleMap[key];
  });

  if (!roleOk) {
    return <Navigate to={isEditor ? '/parkpanel/catalog/attractions' : '/parkpanel'} replace />;
  }

  // If role is ok, check module permission specifically for staff/gm
  if ((isStaff || isGM) && module) {
    if (module === 'dashboard' && !canSeeDashboard) return <Navigate to="/parkpanel/catalog/attractions" replace />;
    if (module === 'analytics' && !canSeeAnalytics) return <Navigate to="/parkpanel/catalog/attractions" replace />;
    if (module === 'bookings' && !canSeeBookings) return <Navigate to="/parkpanel/catalog/attractions" replace />;
    if (module === 'reports' && !canSeeReports) return <Navigate to="/parkpanel/catalog/attractions" replace />;
    if (module === 'catalog' && !canSeeCatalog) return <Navigate to="/parkpanel" replace />;
    if (module === 'offers' && !canSeeOffers) return <Navigate to="/parkpanel/catalog/attractions" replace />;
    if (module === 'dynamic_pricing' && !canSeeDynamicPricing) return <Navigate to="/parkpanel/catalog/attractions" replace />;
    if (module === 'people' && !canSeeUsers) return <Navigate to="/parkpanel/catalog/attractions" replace />;
    if (module === 'site_settings' && !canSeeSettings) return <Navigate to="/parkpanel/catalog/attractions" replace />;
  }

  return children;
}

/**
 * Dashboard index — editors are redirected to catalog since they have no dashboard access.
 */
function DashboardIndex() {
  const { isEditor, canSeeDashboard, canSeeBookings, canSeeCatalog } = useAdminRole();
  if (isEditor) return <Navigate to="/parkpanel/catalog/attractions" replace />;
  
  // If user cannot see dashboard, redirect to bookings or catalog
  if (!canSeeDashboard) {
    if (canSeeBookings) return <Navigate to="/parkpanel/bookings" replace />;
    if (canSeeCatalog) return <Navigate to="/parkpanel/catalog/attractions" replace />;
    return <div className="p-8 text-center text-sm text-gray-500">You do not have access to any modules.</div>;
  }

  return (
    <Suspense fallback={<div className="p-4 text-sm">Loading…</div>}>
      <Dashboard />
    </Suspense>
  );
}

export default function AdminRouter() {
  return (
    <Routes>
      {/* Public admin auth routes */}
      <Route path="login" element={<Login />} />
      <Route path="forgot-password" element={<ForgotPassword />} />
      <Route path="reset-password" element={<ResetPassword />} />

      {/* Protected admin area */}
      <Route
        path="/"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route element={<SuspenseOutlet />}>
          {/* Dashboard (index) — editors redirect to catalog */}
          <Route index element={<DashboardIndex />} />

          {/* Profile — all roles */}
          <Route path="profile" element={<AdminProfile />} />

          {/* ──── Analytics — SuperAdmin + GM + Staff ──── */}
          <Route path="analytics" element={
            <RequireRole allowed={['superadmin', 'gm', 'staff']} module="analytics">
              <SuspenseOutlet />
            </RequireRole>
          }>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<AnalyticsOverview />} />
            <Route path="attractions" element={<AnalyticsAttractions />} />
            <Route path="daily" element={<AnalyticsDaily />} />
            <Route path="custom" element={<AnalyticsCustom />} />
            <Route path="people" element={<AnalyticsPeople />} />
            <Route path="views" element={<AnalyticsViews />} />
            <Route path="split" element={<AnalyticsSplit />} />
            <Route path="top-attractions" element={<AnalyticsTop />} />
          </Route>

          {/* ──── Bookings — SuperAdmin + GM + Staff ──── */}
          <Route path="bookings" element={
            <RequireRole allowed={['superadmin', 'gm', 'staff']} module="bookings">
              <BookingsList />
            </RequireRole>
          } />
          <Route path="bookings/analytics" element={
            <RequireRole allowed={['superadmin', 'gm', 'staff']} module="bookings">
              <BookingsAnalytics />
            </RequireRole>
          } />
          <Route path="bookings/:id" element={
            <RequireRole allowed={['superadmin', 'gm', 'staff']} module="bookings">
              <BookingDetails />
            </RequireRole>
          } />

          {/* ──── Reports — SuperAdmin + GM + Staff ──── */}
          <Route path="reports/transactions" element={
            <RequireRole allowed={['superadmin', 'gm', 'staff']} module="reports">
              <TransactionReport />
            </RequireRole>
          } />
          <Route path="reports/guests" element={
            <RequireRole allowed={['superadmin', 'gm', 'staff']} module="reports">
              <GuestReport />
            </RequireRole>
          } />

          {/* ──── Catalog — all roles (content varies by sidebar filtering) ──── */}
          <Route path="catalog/attractions" element={
            <RequireRole allowed={['superadmin', 'gm', 'staff', 'editor']} module="catalog">
              <AttractionsList />
            </RequireRole>
          } />
          <Route path="catalog/attractions/new" element={
            <RequireRole allowed={['superadmin', 'gm', 'staff', 'editor']} module="catalog">
              <AttractionForm />
            </RequireRole>
          } />
          <Route path="catalog/attractions/:id" element={
            <RequireRole allowed={['superadmin', 'gm', 'staff', 'editor']} module="catalog">
              <AttractionForm />
            </RequireRole>
          } />

          <Route path="catalog/slots" element={
            <RequireRole allowed={['superadmin', 'gm', 'staff', 'editor']} module="catalog">
              <SlotsList />
            </RequireRole>
          } />
          <Route path="catalog/slots/bulk" element={
            <RequireRole allowed={['superadmin', 'gm', 'staff', 'editor']} module="catalog">
              <SlotBulk />
            </RequireRole>
          } />
          <Route path="catalog/slots/new" element={
            <RequireRole allowed={['superadmin', 'gm', 'staff', 'editor']} module="catalog">
              <SlotForm />
            </RequireRole>
          } />
          <Route path="catalog/slots/:id" element={
            <RequireRole allowed={['superadmin', 'gm', 'staff', 'editor']} module="catalog">
              <SlotForm />
            </RequireRole>
          } />

          <Route path="catalog/addons" element={
            <RequireRole allowed={['superadmin', 'gm', 'editor']}>
              <AddonsList />
            </RequireRole>
          } />
          <Route path="catalog/addons/new" element={
            <RequireRole allowed={['superadmin', 'gm', 'editor']}>
              <AddonForm />
            </RequireRole>
          } />
          <Route path="catalog/addons/:id" element={
            <RequireRole allowed={['superadmin', 'gm', 'editor']}>
              <AddonForm />
            </RequireRole>
          } />

          {/* Offers — SuperAdmin + GM + Staff */}
          <Route path="catalog/offers" element={
            <RequireRole allowed={['superadmin', 'gm', 'staff']} module="offers">
              <OffersList />
            </RequireRole>
          } />
          <Route path="catalog/offers/new" element={
            <RequireRole allowed={['superadmin', 'gm', 'staff']} module="offers">
              <OfferForm />
            </RequireRole>
          } />
          <Route path="catalog/offers/:id" element={
            <RequireRole allowed={['superadmin', 'gm', 'staff']} module="offers">
              <OfferForm />
            </RequireRole>
          } />
          <Route path="catalog/announcements" element={
            <RequireRole allowed={['superadmin', 'gm', 'staff', 'editor']} module="catalog">
              <AnnouncementsList />
            </RequireRole>
          } />

          {/* Dynamic Pricing — SuperAdmin + GM + Staff */}
          <Route path="catalog/dynamic-pricing" element={
            <RequireRole allowed={['superadmin', 'gm', 'staff']} module="dynamic_pricing">
              <DynamicPricing />
            </RequireRole>
          } />

          {/* Coupons — SuperAdmin + GM only */}
          <Route path="catalog/coupons" element={
            <RequireRole allowed={['superadmin', 'gm']} module="catalog">
              <CouponsList />
            </RequireRole>
          } />
          <Route path="catalog/coupons/new" element={
            <RequireRole allowed={['superadmin', 'gm']} module="catalog">
              <CouponForm />
            </RequireRole>
          } />
          <Route path="catalog/coupons/:id" element={
            <RequireRole allowed={['superadmin', 'gm']} module="catalog">
              <CouponForm />
            </RequireRole>
          } />

          {/* Combos — all roles with catalog access */}
          <Route path="catalog/combos" element={
            <RequireRole allowed={['superadmin', 'gm', 'staff', 'editor']} module="catalog">
              <CombosList />
            </RequireRole>
          } />
          <Route path="catalog/combos/new" element={
            <RequireRole allowed={['superadmin', 'gm', 'staff', 'editor']} module="catalog">
              <ComboForm />
            </RequireRole>
          } />
          <Route path="catalog/combos/:id" element={
            <RequireRole allowed={['superadmin', 'gm', 'staff', 'editor']} module="catalog">
              <ComboForm />
            </RequireRole>
          } />

          <Route path="catalog/combo-slots" element={
            <RequireRole allowed={['superadmin', 'gm', 'staff', 'editor']} module="catalog">
              <ComboSlotList />
            </RequireRole>
          } />
          <Route path="catalog/combo-slots/new" element={
            <RequireRole allowed={['superadmin', 'gm', 'staff', 'editor']} module="catalog">
              <ComboSlotForm />
            </RequireRole>
          } />
          <Route path="catalog/combo-slots/:id" element={
            <RequireRole allowed={['superadmin', 'gm', 'staff', 'editor']} module="catalog">
              <ComboSlotForm />
            </RequireRole>
          } />
          <Route path="catalog/combo-slots/bulk" element={
            <RequireRole allowed={['superadmin', 'gm', 'staff', 'editor']} module="catalog">
              <ComboSlotBulk />
            </RequireRole>
          } />

          <Route path="catalog/attraction-slots" element={
            <RequireRole allowed={['superadmin', 'gm', 'staff', 'editor']} module="catalog">
              <AttractionSlotList />
            </RequireRole>
          } />

          {/* Banners, Gallery, Pages, Blogs — SuperAdmin + GM + Editor */}
          <Route path="catalog/banners" element={
            <RequireRole allowed={['superadmin', 'gm', 'editor']}>
              <BannersList />
            </RequireRole>
          } />
          <Route path="catalog/banners/new" element={
            <RequireRole allowed={['superadmin', 'gm', 'editor']}>
              <BannerForm />
            </RequireRole>
          } />
          <Route path="catalog/banners/:id" element={
            <RequireRole allowed={['superadmin', 'gm', 'editor']}>
              <BannerForm />
            </RequireRole>
          } />

          <Route path="catalog/pages" element={
            <RequireRole allowed={['superadmin', 'gm', 'editor']}>
              <PagesList />
            </RequireRole>
          } />
          <Route path="catalog/pages/new" element={
            <RequireRole allowed={['superadmin', 'gm', 'editor']}>
              <PageForm />
            </RequireRole>
          } />
          <Route path="catalog/pages/:id" element={
            <RequireRole allowed={['superadmin', 'gm', 'editor']}>
              <PageForm />
            </RequireRole>
          } />

          <Route path="catalog/sections" element={
            <RequireRole allowed={['superadmin', 'gm', 'editor']}>
              <SectionsList />
            </RequireRole>
          } />
          <Route path="catalog/sections/new" element={
            <RequireRole allowed={['superadmin', 'gm', 'editor']}>
              <SectionForm />
            </RequireRole>
          } />
          <Route path="catalog/sections/:id" element={
            <RequireRole allowed={['superadmin', 'gm', 'editor']}>
              <SectionForm />
            </RequireRole>
          } />

          <Route path="catalog/blogs" element={
            <RequireRole allowed={['superadmin', 'gm', 'editor']}>
              <BlogsList />
            </RequireRole>
          } />
          <Route path="catalog/blogs/new" element={
            <RequireRole allowed={['superadmin', 'gm', 'editor']}>
              <BlogForm />
            </RequireRole>
          } />
          <Route path="catalog/blogs/:id" element={
            <RequireRole allowed={['superadmin', 'gm', 'editor']}>
              <BlogForm />
            </RequireRole>
          } />

          {/* Gallery */}
          <Route path="catalog/gallery" element={
            <RequireRole allowed={['superadmin', 'gm', 'editor']}>
              <GalleryManager />
            </RequireRole>
          } />
          <Route path="catalog/gallery/new" element={
            <RequireRole allowed={['superadmin', 'gm', 'editor']}>
              <GalleryForm />
            </RequireRole>
          } />
          <Route path="catalog/gallery/:id" element={
            <RequireRole allowed={['superadmin', 'gm', 'editor']}>
              <GalleryForm />
            </RequireRole>
          } />

          {/* ──── Users — SuperAdmin + GM ──── */}
          <Route path="users" element={
            <RequireRole allowed={['superadmin', 'gm']} module="people">
              <UsersList />
            </RequireRole>
          } />
          <Route path="users/new" element={
            <RequireRole allowed={['superadmin', 'gm']} module="people">
              <UserNew />
            </RequireRole>
          } />
          <Route path="users/:id" element={
            <RequireRole allowed={['superadmin', 'gm']} module="people">
              <UserEdit />
            </RequireRole>
          } />

          {/* ──── RBAC — SuperAdmin + GM (read) ──── */}
          <Route path="roles" element={
            <RequireRole allowed={['superadmin', 'gm']} module="people">
              <RolesList />
            </RequireRole>
          } />
          <Route path="roles/new" element={
            <RequireRole allowed={['superadmin']} module="people">
              <RoleForm />
            </RequireRole>
          } />
          <Route path="roles/:id" element={
            <RequireRole allowed={['superadmin']} module="people">
              <RoleForm />
            </RequireRole>
          } />
          <Route path="roles/:id/permissions" element={
            <RequireRole allowed={['superadmin']} module="people">
              <RolePermissions />
            </RequireRole>
          } />

          {/* ──── Admin Management — SuperAdmin only for create ──── */}
          <Route path="admins" element={
            <RequireRole allowed={['superadmin', 'gm']} module="people">
              <AdminsList />
            </RequireRole>
          } />
          <Route path="admins/new" element={
            <RequireRole allowed={['superadmin']} module="people">
              <AdminNew />
            </RequireRole>
          } />
          <Route path="admins/access" element={
            <RequireRole allowed={['superadmin']} module="people">
              <AdminAccess />
            </RequireRole>
          } />
          <Route path="admins/:id/access" element={
            <RequireRole allowed={['superadmin']} module="people">
              <AdminAccess />
            </RequireRole>
          } />

          {/* ──── Revenue — SuperAdmin + GM ──── */}
          <Route path="revenue/attractions" element={
            <RequireRole allowed={['superadmin', 'gm']}>
              <AttractionsRevenue />
            </RequireRole>
          } />
          <Route path="revenue/combos" element={
            <RequireRole allowed={['superadmin', 'gm']}>
              <ComboRevenue />
            </RequireRole>
          } />

          {/* ──── Site Settings — SuperAdmin + GM ──── */}
          <Route path="site-settings" element={
            <RequireRole allowed={['superadmin', 'gm']} module="site_settings">
              <SiteSettings />
            </RequireRole>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="." replace />} />
        </Route>
      </Route>

      {/* Global fallback */}
      <Route path="*" element={<Navigate to="/parkpanel" replace />} />
    </Routes>
  );
}
