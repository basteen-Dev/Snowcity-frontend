import React from 'react';
import { Helmet } from 'react-helmet-async';
import AppRouter from './router/AppRouter';

export default function App() {
  return (
    <>
      <Helmet>
        <title>Snow City Bangalore | Best indoor snow theme park of India</title>
      </Helmet>
      <AppRouter />
    </>
  );
}