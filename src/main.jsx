import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// GTM dataLayer initialisation
window.dataLayer = window.dataLayer || [];

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);