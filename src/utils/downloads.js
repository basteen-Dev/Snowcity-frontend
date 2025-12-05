const API_BASE = (import.meta.env?.VITE_ADMIN_API_BASE_URL || import.meta.env?.VITE_API_BASE_URL || '').replace(/\/$/, '');

const buildQuery = (params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    qs.append(key, value);
  });
  return qs.toString();
};

const absoluteUrl = (path) => {
  if (/^https?:\/\//i.test(path) || !API_BASE) return path;
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
};

const buildDownloadLinks = (type, params = {}, options = {}) => {
  const queryString = buildQuery({ type, ...params });
  const prefix = options.prefix || '';
  const target = options.target || '_blank';
  const rel = options.rel || 'noopener noreferrer';

  const make = (ext, label) => ({
    label,
    href: absoluteUrl(`/api/admin/analytics/report.${ext}${queryString ? `?${queryString}` : ''}`),
    target,
    rel,
    ext,
    type
  });

  return [
    make('csv', `${prefix ? `${prefix} ` : ''}CSV`),
    make('xlsx', `${prefix ? `${prefix} ` : ''}Excel`),
    make('pdf', `${prefix ? `${prefix} ` : ''}PDF`)
  ];
};

export { buildDownloadLinks };
export default buildDownloadLinks;
