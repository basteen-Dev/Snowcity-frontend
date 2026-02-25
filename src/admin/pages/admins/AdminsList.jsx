// src/admin/pages/admins/AdminsList.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';

const formatRoles = (roles) => {
  if (!roles) return '';
  if (Array.isArray(roles)) {
    return roles
      .map((role) => {
        if (!role) return null;
        if (typeof role === 'string') return role;
        if (typeof role === 'object') return role.role_name || role.name || null;
        return String(role);
      })
      .filter(Boolean)
      .join(', ');
  }
  if (typeof roles === 'object') return roles.role_name || roles.name || '';
  return String(roles);
};

export default function AdminsList() {
  const [rows, setRows] = React.useState([]);
  const [q, setQ] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await adminApi.get('/api/admin/admins', { search: q });
      setRows(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <div>
      <PageHeader title="Admin Team" subtitle="Manage administrators and their access">
        <Link
          to="/admin/admins/new"
          className="rounded-lg bg-gray-900 dark:bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 dark:hover:bg-blue-700 transition-colors inline-flex items-center"
        >
          + Create Admin
        </Link>
      </PageHeader>

      <FilterBar onApply={load} loading={loading} columns={3}>
        <input
          className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm dark:text-neutral-200 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
          placeholder="Search by name, email, or phone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </FilterBar>

      <div className="rounded-2xl border border-gray-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-neutral-800/60 border-b border-gray-200 dark:border-neutral-700">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-400">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-400">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-400">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-400">Roles</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {rows.map((r, i) => (
                <tr key={r.user_id} className={`transition-colors hover:bg-blue-50/50 dark:hover:bg-neutral-800/60 ${i % 2 === 0 ? '' : 'bg-gray-50/40 dark:bg-neutral-800/20'}`}>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-neutral-100">{r.name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-neutral-300">{r.email}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-neutral-300">{r.phone || '—'}</td>
                  <td className="px-4 py-3">
                    {formatRoles(r.roles) ? (
                      <div className="flex flex-wrap gap-1">
                        {formatRoles(r.roles).split(', ').map((role) => (
                          <span key={role} className="inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-indigo-600/20">
                            {role}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">No roles</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      className="inline-flex items-center rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                      to={`/admin/admins/${r.user_id}/access`}
                    >
                      Manage Access
                    </Link>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td className="px-4 py-10 text-center text-gray-400 dark:text-neutral-500" colSpan={5}>
                    {loading ? 'Loading…' : 'No admins found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}