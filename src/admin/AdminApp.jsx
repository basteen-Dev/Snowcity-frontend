import React, { Suspense } from 'react';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import adminStore from './app/adminStore';
import AdminRouter from './router/AdminRouter';
import ErrorBoundary from './components/common/ErrorBoundary';

export default function AdminApp() {
  return (
    <Provider store={adminStore}>
      <Helmet>
        <title>Snow City — Park Panel</title>
        {/* Security meta tags for Admin Panel */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </Helmet>
      <ErrorBoundary>
        <Suspense fallback={<div className="p-6">Loading admin…</div>}>
          <AdminRouter />
          <Toaster position="top-right" />
        </Suspense>
      </ErrorBoundary>
    </Provider>
  );
}
