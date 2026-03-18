import React from 'react';
import { Helmet } from 'react-helmet-async';
import AppRouter from './router/AppRouter';

export default function App() {
  return (
    <>
      <Helmet>
        <title>Snow City Bangalore | Best indoor snow theme park of India</title>
        {/* Security meta tags to complement server-side Helmet */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </Helmet>
      <AppRouter />
    </>
  );
}