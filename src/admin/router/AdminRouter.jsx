// src/admin/router/AdminRouter.jsx
import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

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
const UserEdit = lazy(() => import('../pages/users/UserEdit'));

const RolesList = lazy(() => import('../pages/rbac/RolesList'));
const RoleForm = lazy(() => import('../pages/rbac/RoleForm'));
// Permissions UI removed -> keep roles/users only

// Analytics pages
const AnalyticsOverview = lazy(() => import('../pages/analytics/Overview.jsx'));
const AnalyticsAttractions = lazy(() => import('../pages/analytics/Attractions.jsx'));
const AnalyticsDaily = lazy(() => import('../pages/analytics/Daily.jsx'));
const AnalyticsCustom = lazy(() => import('../pages/analytics/Custom.jsx'));
const AnalyticsPeople = lazy(() => import('../pages/analytics/People.jsx'));
const AnalyticsViews = lazy(() => import('../pages/analytics/Views.jsx'));
const AnalyticsSplit = lazy(() => import('../pages/analytics/Split.jsx'));
const AnalyticsTop = lazy(() => import('../pages/analytics/TopAttractions')); // optional/legacy
const ConversionDashboard = lazy(() => import('../pages/analytics/ConversionDashboard'));

// Revenue pages
const AttractionsRevenue = lazy(() => import('../pages/revenue/AttractionRevenue'));
const ComboRevenue = lazy(() => import('../pages/revenue/ComboRevenue'));

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

export default function AdminRouter() {
  // IMPORTANT: This router should be mounted at path="/admin/*" in your App router.
  // All paths here are relative to /admin.
  return (
    <Routes>
      {/* Public admin auth routes */}
      <Route path="login" element={<Login />} />
      <Route path="forgot-password" element={<ForgotPassword />} />
      <Route path="reset-password" element={<ResetPassword />} />

      {/* Protected admin area (everything under /admin/*) */}
      <Route
        path="/"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        {/* Wrap all lazy children in one Suspense boundary */}
        <Route element={<SuspenseOutlet />}>
          {/* Dashboard (index) */}
          <Route index element={<Dashboard />} />

          {/* Profile */}
          <Route path="profile" element={<AdminProfile />} />

          {/* Analytics */}
          <Route path="analytics" element={<SuspenseOutlet />}>
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

          {/* Bookings */}
          <Route path="bookings" element={<BookingsList />} />
          <Route path="bookings/:id" element={<BookingDetails />} />

          {/* Catalog */}
          <Route path="catalog/attractions" element={<AttractionsList />} />
          <Route path="catalog/attractions/new" element={<AttractionForm />} />
          <Route path="catalog/attractions/:id" element={<AttractionForm />} />

          <Route path="catalog/slots" element={<SlotsList />} />
          <Route path="catalog/slots/bulk" element={<SlotBulk />} />
          <Route path="catalog/slots/new" element={<SlotForm />} />
          <Route path="catalog/slots/:id" element={<SlotForm />} />

          <Route path="catalog/addons" element={<AddonsList />} />
          <Route path="catalog/addons/new" element={<AddonForm />} />
          <Route path="catalog/addons/:id" element={<AddonForm />} />

          <Route path="catalog/offers" element={<OffersList />} />
          <Route path="catalog/offers/new" element={<OfferForm />} />
          <Route path="catalog/offers/:id" element={<OfferForm />} />

          <Route path="catalog/dynamic-pricing" element={<DynamicPricing />} />

          <Route path="catalog/coupons" element={<CouponsList />} />
          <Route path="catalog/coupons/new" element={<CouponForm />} />
          <Route path="catalog/coupons/:id" element={<CouponForm />} />

          <Route path="catalog/combo-slots" element={<ComboSlotList />} />
          <Route path="catalog/combo-slots/new" element={<ComboSlotForm />} />
          <Route path="catalog/combo-slots/:id" element={<ComboSlotForm />} />
          <Route path="catalog/combo-slots/bulk" element={<ComboSlotBulk />} />

          <Route path="catalog/attraction-slots" element={<AttractionSlotList />} />

          <Route path="catalog/banners" element={<BannersList />} />
          <Route path="catalog/banners/new" element={<BannerForm />} />
          <Route path="catalog/banners/:id" element={<BannerForm />} />

          <Route path="catalog/pages" element={<PagesList />} />
          <Route path="catalog/pages/new" element={<PageForm />} />
          <Route path="catalog/pages/:id" element={<PageForm />} />

          <Route path="catalog/blogs" element={<BlogsList />} />
          <Route path="catalog/blogs/new" element={<BlogForm />} />
          <Route path="catalog/blogs/:id" element={<BlogForm />} />

          <Route path="catalog/combos" element={<CombosList />} />
          <Route path="catalog/combos/new" element={<ComboForm />} />
          <Route path="catalog/combos/:id" element={<ComboForm />} />

          {/* Gallery */}
          <Route path="catalog/gallery" element={<GalleryManager />} />
          <Route path="catalog/gallery/new" element={<GalleryForm />} />
          <Route path="catalog/gallery/:id" element={<GalleryForm />} />

          {/* Users */}
          <Route path="users" element={<UsersList />} />
          <Route path="users/:id" element={<UserEdit />} />

          {/* RBAC */}
          <Route path="roles" element={<RolesList />} />
          <Route path="roles/new" element={<RoleForm />} />
          <Route path="roles/:id" element={<RoleForm />} />
          <Route path="admins" element={<AdminsList />} />
          <Route path="admins/new" element={<AdminNew />} />
          <Route path="admins/access" element={<AdminAccess />} />
          <Route path="admins/:id/access" element={<AdminAccess />} />

          {/* Revenue */}
          <Route path="revenue/attractions" element={<AttractionsRevenue />} />
          <Route path="revenue/combos" element={<ComboRevenue />} />

          {/* Fallback within /admin */}
          <Route path="*" element={<Navigate to="." replace />} />
        </Route>
      </Route>

      {/* Global fallback */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}