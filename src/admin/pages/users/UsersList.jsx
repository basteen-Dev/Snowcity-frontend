import React from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import AdminTable from '../../components/common/AdminTable';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import TablePagination from '../../components/common/TablePagination';

export default function UsersList() {
  const navigate = useNavigate();
  const [state, setState] = React.useState({
    status: 'idle',
    items: [],
    roles: [],
    role: '',
    q: '',
    error: null,
    page: 1,
    limit: 20,
    meta: null
  });

  const loadRoles = async () => {
    try {
      const res = await adminApi.get(A.roles());
      const roles = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setState((s) => ({ ...s, roles }));
    } catch { }
  };

  const load = async (page = 1) => {
    setState((s) => ({ ...s, status: 'loading', error: null, page }));
    try {
      const res = await adminApi.get(A.users(), { params: { search: state.q || undefined, role: state.role || undefined, page, limit: state.limit } });
      const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setState((s) => ({ ...s, status: 'succeeded', items, meta: res?.meta || { total: items.length, page, limit: s.limit }, page }));
    } catch (err) {
      setState((s) => ({ ...s, status: 'failed', error: err }));
    }
  };

  React.useEffect(() => { loadRoles(); load(1); /* eslint-disable-next-line */ }, []);

  const meta = state.meta || {};
  const totalCount = meta.total || meta.count || meta.totalCount || meta.total_items || state.items.length;

  return (
    <div>
      <PageHeader title="Customers" subtitle="Manage registered users">
        <button
          onClick={() => navigate('/parkpanel/users/new')}
          className="rounded-lg bg-gray-900 dark:bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 dark:hover:bg-blue-700 transition-colors"
        >
          + Create Customer
        </button>
      </PageHeader>

      <FilterBar onApply={() => load(1)} onReset={() => { setState((s) => ({ ...s, q: '', role: '' })); setTimeout(() => load(1), 0); }} loading={state.status === 'loading'}>
        <input
          className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm dark:text-neutral-200 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
          placeholder="Search name, email, or phone…"
          value={state.q}
          onChange={(e) => setState({ ...state, q: e.target.value })}
        />
        <select
          className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm dark:text-neutral-200 focus:ring-1 focus:ring-blue-500"
          value={state.role}
          onChange={(e) => setState({ ...state, role: e.target.value })}
        >
          <option value="">All roles</option>
          {(state.roles || []).map((r) => <option key={r.role_id} value={r.role_name}>{r.role_name}</option>)}
        </select>
      </FilterBar>

      <AdminTable
        keyField="user_id"
        columns={[
          { key: 'name', title: 'Name' },
          { key: 'email', title: 'Email' },
          { key: 'phone', title: 'Phone', render: (r) => r.phone || '—' },
          { key: 'last_login_at', title: 'Last Login', render: (r) => r.last_login_at ? new Date(r.last_login_at).toLocaleDateString() : '—' }
        ]}
        rows={state.items}
        onRowClick={(r) => navigate(`/parkpanel/users/${r.user_id}`)}
        empty={state.status === 'loading' ? 'Loading…' : 'No users found'}
      />

      <TablePagination
        count={totalCount}
        page={state.page}
        rowsPerPage={state.limit}
        onPageChange={(p) => load(p)}
        onRowsPerPageChange={(l) => {
          setState(s => ({ ...s, limit: l }));
          setTimeout(() => load(1), 0);
        }}
      />
    </div>
  );
}
