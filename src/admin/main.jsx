import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import AdminApp from './AdminApp';
import '../index.css';
import './AdminStyles.css';

ReactDOM.createRoot(document.getElementById('admin-root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter basename="/parkpanel">
        <AdminApp />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
