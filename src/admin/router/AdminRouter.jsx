// src/admin/router/AdminRouter.jsx
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

const AttractionsList = lazy(() => import('../pages/catalog/AttractionsList'));
const AttractionForm = lazy(() => import('../pages/catalog/AttractionForm'));

const SlotsList = lazy(() => import('../pages/catalog/SlotList'));
const SlotForm = lazy(() => import('../pages/catalog/SlotForm'));
const SlotBulk = lazy(() => import('../pages/catalog/SlotBulk'));

const AddonsList = lazy(() => import('../pages/catalog/AddonsList'));
const AddonForm = lazy(() => import('../pages/catalog/AddonForm'));

const OffersList = lazy(() => import('../pages/catalog/OffersList'));
const OfferForm = lazy(() => import('../pages/catalog/OfferForm'));


const CouponsList = lazy(() => import('../pages/catalog/CouponsList'));
const CouponForm = lazy(() => import('../pages/catalog/CouponForm'));

const BannersList = lazy(() => import('../pages/catalog/BannersList'));
const BannerForm = lazy(() => import('../pages/catalog/BannerForm'));

const PagesList = lazy(() => import('../pages/catalog/PagesList'));
const PageForm = lazy(() => import('../pages/catalog/PageForm'));

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
const ConversionDashboard = lazy(() => import('../pages/analytics/ConversionDashboard'));

// Revenue pages
const AttractionsRevenue = lazy(() => import('../pages/revenue/AttractionRevenue'));
const ComboRevenue = lazy(() => import('../pages/revenue/ComboRevenue'));

// Site Settings
const SiteSettings = lazy(() => import('../pages/settings/SiteSettings'));

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
function RequireRole({ allowed, children }) {
  const {
    isSuperAdmin, isGM, isStaff, isEditor,
  } = useAdminRole();

  const roleMap = { superadmin: isSuperAdmin, gm: isGM, staff: isStaff, editor: isEditor };

  // SuperAdmin always passes
  if (isSuperAdmin) return children;

  // Check if any of the allowed roles match
  const ok = (allowed || []).some((r) => {
    const key = r.toLowerCase().replace(/\s+/g, '');
    return roleMap[key];
  });

  if (!ok) {
    // Editors go to catalog, others to admin root
    return <Navigate to={isEditor ? '/admin/catalog/attractions' : '/admin'} replace />;
  }
  return children;
}

/**
 * Dashboard index — editors are redirected to catalog since they have no dashboard access.
 */
function DashboardIndex() {
  const { isEditor } = useAdminRole();
  if (isEditor) return <Navigate to="/admin/catalog/attractions" replace />;
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
            <RequireRole allowed={['superadmin', 'gm', 'staff']}>
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
            <Route path="conversion" element={<ConversionDashboard />} />
          </Route>

          {/* ──── Bookings — SuperAdmin + GM + Staff ──── */}
          <Route path="bookings" element={
            <RequireRole allowed={['superadmin', 'gm', 'staff']}>
              <BookingsList />
            </RequireRole>
          } />
          <Route path="bookings/:id" element={
            <RequireRole allowed={['superadmin', 'gm', 'staff']}>
              <BookingDetails />
            </RequireRole>
          } />

          {/* ──── Catalog — all roles (content varies by sidebar filtering) ──── */}
          <Route path="catalog/attractions" element={<AttractionsList />} />
          <Route path="catalog/attractions/new" element={<AttractionForm />} />
          <Route path="catalog/attractions/:id" element={<AttractionForm />} />

          <Route path="catalog/slots" element={<SlotsList />} />
          <Route path="catalog/slots/bulk" element={<SlotBulk />} />
          <Route path="catalog/slots/new" element={<SlotForm />} />
          <Route path="catalog/slots/:id" element={<SlotForm />} />

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
            <RequireRole allowed={['superadmin', 'gm', 'staff']}>
              <OffersList />
            </RequireRole>
          } />
          <Route path="catalog/offers/new" element={
            <RequireRole allowed={['superadmin', 'gm', 'staff']}>
              <OfferForm />
            </RequireRole>
          } />
          <Route path="catalog/offers/:id" element={
            <RequireRole allowed={['superadmin', 'gm', 'staff']}>
              <OfferForm />
            </RequireRole>
          } />

          {/* Dynamic Pricing — SuperAdmin + GM + Staff */}
          <Route path="catalog/dynamic-pricing" element={
            <RequireRole allowed={['superadmin', 'gm', 'staff']}>
              <DynamicPricing />
            </RequireRole>
          } />

          {/* Coupons — SuperAdmin + GM only */}
          <Route path="catalog/coupons" element={
            <RequireRole allowed={['superadmin', 'gm']}>
              <CouponsList />
            </RequireRole>
          } />
          <Route path="catalog/coupons/new" element={
            <RequireRole allowed={['superadmin', 'gm']}>
              <CouponForm />
            </RequireRole>
          } />
          <Route path="catalog/coupons/:id" element={
            <RequireRole allowed={['superadmin', 'gm']}>
              <CouponForm />
            </RequireRole>
          } />

          {/* Combos — all roles with catalog access */}
          <Route path="catalog/combos" element={<CombosList />} />
          <Route path="catalog/combos/new" element={<ComboForm />} />
          <Route path="catalog/combos/:id" element={<ComboForm />} />

          <Route path="catalog/combo-slots" element={<ComboSlotList />} />
          <Route path="catalog/combo-slots/new" element={<ComboSlotForm />} />
          <Route path="catalog/combo-slots/:id" element={<ComboSlotForm />} />
          <Route path="catalog/combo-slots/bulk" element={<ComboSlotBulk />} />

          <Route path="catalog/attraction-slots" element={<AttractionSlotList />} />

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
            <RequireRole allowed={['superadmin', 'gm']}>
              <UsersList />
            </RequireRole>
          } />
          <Route path="users/new" element={
            <RequireRole allowed={['superadmin', 'gm']}>
              <UserNew />
            </RequireRole>
          } />
          <Route path="users/:id" element={
            <RequireRole allowed={['superadmin', 'gm']}>
              <UserEdit />
            </RequireRole>
          } />

          {/* ──── RBAC — SuperAdmin + GM (read) ──── */}
          <Route path="roles" element={
            <RequireRole allowed={['superadmin', 'gm']}>
              <RolesList />
            </RequireRole>
          } />
          <Route path="roles/new" element={
            <RequireRole allowed={['superadmin']}>
              <RoleForm />
            </RequireRole>
          } />
          <Route path="roles/:id" element={
            <RequireRole allowed={['superadmin']}>
              <RoleForm />
            </RequireRole>
          } />
          <Route path="roles/:id/permissions" element={
            <RequireRole allowed={['superadmin']}>
              <RolePermissions />
            </RequireRole>
          } />

          {/* ──── Admin Management — SuperAdmin only for create ──── */}
          <Route path="admins" element={
            <RequireRole allowed={['superadmin', 'gm']}>
              <AdminsList />
            </RequireRole>
          } />
          <Route path="admins/new" element={
            <RequireRole allowed={['superadmin']}>
              <AdminNew />
            </RequireRole>
          } />
          <Route path="admins/access" element={
            <RequireRole allowed={['superadmin']}>
              <AdminAccess />
            </RequireRole>
          } />
          <Route path="admins/:id/access" element={
            <RequireRole allowed={['superadmin']}>
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
            <RequireRole allowed={['superadmin', 'gm']}>
              <SiteSettings />
            </RequireRole>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="." replace />} />
        </Route>
      </Route>

      {/* Global fallback */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}