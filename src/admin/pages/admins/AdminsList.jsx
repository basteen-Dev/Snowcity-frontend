// src/admin/pages/admins/AdminsList.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import { useAdminRole } from '../../hooks/useAdminRole';

const ROLE_COLORS = {
  superadmin: 'bg-red-100 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400',
  root: 'bg-red-100 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-400',
  gm: 'bg-purple-100 text-purple-700 ring-purple-600/20 dark:bg-purple-900/30 dark:text-purple-400',
  admin: 'bg-purple-100 text-purple-700 ring-purple-600/20 dark:bg-purple-900/30 dark:text-purple-400',
  staff: 'bg-blue-100 text-blue-700 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400',
  subadmin: 'bg-blue-100 text-blue-700 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400',
  editor: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const ROLE_LABELS = {
  superadmin: 'Super Admin',
  root: 'Root',
  gm: 'GM',
  admin: 'Admin',
  staff: 'Staff',
  subadmin: 'Sub-admin',
  editor: 'Editor',
};

const normalizeRoleName = (r) => {
  if (!r) return '';
  if (typeof r === 'string') return r.toLowerCase().replace(/\s+/g, '');
  if (typeof r === 'object') return (r.role_name || r.name || '').toLowerCase().replace(/\s+/g, '');
  return String(r).toLowerCase();
};

const getRoleDisplay = (r) => {
  const norm = normalizeRoleName(r);
  return {
    key: norm,
    label: ROLE_LABELS[norm] || (typeof r === 'string' ? r : norm),
    colorClass: ROLE_COLORS[norm] || 'bg-gray-100 text-gray-700 ring-gray-600/20 dark:bg-neutral-800 dark:text-neutral-400',
  };
};

export default function AdminsList() {
  const [rows, setRows] = React.useState([]);
  const [q, setQ] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const { canManageAdmins } = useAdminRole();

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
      <PageHeader title="Admin Team" subtitle="Manage administrators and their access levels">
        {canManageAdmins && (
          <Link
            to="/admin/admins/new"
            className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all inline-flex items-center shadow-lg shadow-blue-500/25"
          >
            + Create Admin
          </Link>
        )}
      </PageHeader>

      <FilterBar onApply={load} loading={loading} columns={3}>
        <input
          className="w-full rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm dark:text-neutral-200 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
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
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-400">Role</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
              {rows.map((r, i) => {
                const rolesList = Array.isArray(r.roles) ? r.roles : [];
                return (
                  <tr key={r.user_id} className={`transition-colors hover:bg-blue-50/50 dark:hover:bg-neutral-800/60 ${i % 2 === 0 ? '' : 'bg-gray-50/40 dark:bg-neutral-800/20'}`}>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-neutral-100">{r.name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-neutral-300">{r.email}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-neutral-300">{r.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {rolesList.length > 0 ? rolesList.map((role) => {
                          const display = getRoleDisplay(role);
                          return (
                            <span
                              key={display.key}
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${display.colorClass}`}
                            >
                              {display.label}
                            </span>
                          );
                        }) : (
                          <span className="text-gray-400">No roles</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        className="inline-flex items-center rounded-xl border border-gray-300 dark:border-neutral-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                        to={`/admin/admins/${r.user_id}/access`}
                      >
                        Manage Access
                      </Link>
                    </td>
                  </tr>
                );
              })}
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