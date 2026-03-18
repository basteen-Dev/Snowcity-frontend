// src/parkpanel/pages/catalog/SectionsList.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import TablePagination from '../../components/common/TablePagination';

const PLACEMENT_LABELS = {
  section_more_info: 'More Info (Home)',
  section_attraction: 'Attraction Detail',
  section_combo: 'Combo Detail',
};

export default function SectionsList() {
  const [rows, setRows] = React.useState([]);
  const [q, setQ] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const [total, setTotal] = React.useState(0);
  const [err, setErr] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const fetchList = async () => {
    try {
      setLoading(true);
      setErr('');
      const params = { q, page, limit, placement: 'section_more_info,section_attraction,section_combo' };
      const res = await adminApi.get('/api/parkpanel/pages', { params });
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      const meta = res?.meta || null;
      // filter only section placements client-side as a fallback
      const sections = list.filter(r => r.placement?.startsWith('section_'));
      setRows(sections);
      setTotal(meta?.total ?? sections.length);
    } catch (e) {
      setErr(e.message || 'Failed to load sections');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const onSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchList();
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this section?')) return;
    try {
      await adminApi.delete(`/api/parkpanel/pages/${id}`);
      fetchList();
    } catch (e) {
      alert(e.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <form onSubmit={onSearch} className="flex items-center gap-2">
          <input
            className="rounded-md border px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-600"
            placeholder="Search title"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="px-3 py-2 rounded-md border text-sm" type="submit">
            Search
          </button>
        </form>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/catalog/sections/new" className="px-5 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">
            New Section
          </Link>
        </div>
      </div>

      {err ? <div className="text-sm text-red-600">{err}</div> : null}

      <div className="rounded-lg border bg-white dark:bg-slate-800 dark:border-slate-700 overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-neutral-800">
            <tr>
              <th className="px-3 py-2 text-left">Title</th>
              <th className="px-3 py-2 text-left">Display In</th>
              <th className="px-3 py-2 text-left">Order</th>
              <th className="px-3 py-2 text-left">Active</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.page_id} className="border-t dark:border-slate-700">
                <td className="px-3 py-2 font-medium">{r.title}</td>
                <td className="px-3 py-2">
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {PLACEMENT_LABELS[r.placement] || r.placement}
                  </span>
                  {r.placement_ref_id ? <span className="ml-1 text-xs text-gray-500">#{r.placement_ref_id}</span> : null}
                </td>
                <td className="px-3 py-2">{r.nav_order ?? 0}</td>
                <td className="px-3 py-2">
                  <span className={`inline-block h-2 w-2 rounded-full ${r.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="ml-1">{r.active ? 'Yes' : 'No'}</span>
                </td>
                <td className="px-3 py-2 text-right space-x-2">
                  <Link className="px-2 py-1 rounded-md border text-xs hover:bg-gray-50" to={`/catalog/sections/${r.page_id}`}>
                    Edit
                  </Link>
                  <button className="px-2 py-1 rounded-md border text-xs text-red-600 hover:bg-red-50" onClick={() => onDelete(r.page_id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length && !loading && (
              <tr>
                <td className="px-3 py-8 text-center text-gray-500" colSpan={5}>
                  No sections yet. Click "New Section" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <TablePagination
        count={total}
        page={page}
        rowsPerPage={limit}
        onPageChange={(p) => setPage(p)}
        onRowsPerPageChange={(l) => {
          setLimit(l);
          setPage(1);
        }}
      />

      {loading ? <div className="text-sm text-gray-500">Loading…</div> : null}
    </div>
  );
}
