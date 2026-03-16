import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AdminApp from './AdminApp';
import '../index.css';
import './AdminStyles.css';

ReactDOM.createRoot(document.getElementById('admin-root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/parkpanel">
      <AdminApp />
    </BrowserRouter>
  </React.StrictMode>
);
