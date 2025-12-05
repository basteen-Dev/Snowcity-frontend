import React from 'react';
import adminApi from '../services/adminApi';

const buildQuery = (params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    qs.append(key, value);
  });
  return qs.toString();
};

const defaultFileName = (type, ext) => {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  return `analytics_${type || 'report'}_${ts}.${ext}`;
};

export default function useReportDownload() {
  const [downloading, setDownloading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const download = React.useCallback(async ({ type = 'bookings', ext = 'csv', params = {}, filename } = {}) => {
    setDownloading(true);
    setError(null);
    try {
      const query = buildQuery({ type, ...params });
      const url = `/api/admin/analytics/report.${ext}${query ? `?${query}` : ''}`;
      const response = await adminApi.get(url, { responseType: 'blob', fullResponse: true });
      const blob = response?.data;
      if (!blob) throw new Error('No data returned');
      const file = filename || defaultFileName(type, ext);
      const href = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = file;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(href);
      return true;
    } catch (err) {
      setError(err);
      return false;
    } finally {
      setDownloading(false);
    }
  }, []);

  return { download, downloading, error };
}
