// src/parkpanel/pages/catalog/PagesList.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import TablePagination from '../../components/common/TablePagination';
import { imgSrc } from '../../../utils/media';

export default function PagesList() {
  const [rows, setRows] = React.useState([]);
  const [q, setQ] = React.useState('');
  const [active, setActive] = React.useState(''); // '' | 'true' | 'false'
  const [page, setPage] = React.useState(1);
  const [limit, setLimit] = React.useState(20);
  const [total, setTotal] = React.useState(0);
  const [err, setErr] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const fetchList = async () => {
    try {
      setLoading(true);
      setErr('');
      const params = { q, page, limit };
      if (active) params.active = active; // only send if user picked
      const res = await adminApi.get('/api/parkpanel/pages', { params });
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      const meta = res?.meta || null;
      setRows(list);
      setTotal(meta?.total ?? list.length);
    } catch (e) {
      setErr(e.message || 'Failed to load pages');
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

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <form onSubmit={onSearch} className="flex items-center gap-2">
          <input
            className="rounded-md border px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-600"
            placeholder="Search title/slug"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="rounded-md border px-2 py-2 text-sm dark:bg-slate-800 dark:border-slate-600"
            value={active}
            onChange={(e) => setActive(e.target.value)}
          >
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button className="px-3 py-2 rounded-md border text-sm" type="submit">
            Search
          </button>
        </form>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/catalog/pages/new" className="px-5 py-2 rounded-md bg-gray-900 text-white text-sm font-semibold">
            New Page
          </Link>
        </div>
      </div>

      {err ? <div className="text-sm text-red-600">{err}</div> : null}

      <div className="rounded-lg border bg-white dark:bg-slate-800 dark:border-slate-700 overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-neutral-800">
            <tr>
              <th className="px-3 py-2 text-left">Hero</th>
              <th className="px-3 py-2 text-left">Title</th>
              <th className="px-3 py-2 text-left">Slug</th>
              <th className="px-3 py-2 text-left">Nav</th>
              <th className="px-3 py-2 text-left">Placement</th>
              <th className="px-3 py-2 text-left">Active</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.page_id} className="border-t dark:border-slate-700">
                <td className="px-3 py-2">
                  <div className="h-10 w-16 overflow-hidden rounded bg-gray-100 dark:bg-neutral-800">
                    <img
                      src={imgSrc(r.hero_image)}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=No+Image'; }}
                    />
                  </div>
                </td>
                <td className="px-3 py-2">{r.title}</td>
                <td className="px-3 py-2">{r.slug}</td>
                <td className="px-3 py-2">{r.nav_group || '-'}</td>
                <td className="px-3 py-2">
                  {r.placement === 'none' ? '-' :
                    r.placement === 'home_bottom' ? 'Home: bottom' :
                      r.placement === 'attraction_details' ? `Attraction details (${r.placement_ref_id || '-'})` :
                        r.placement}
                </td>
                <td className="px-3 py-2">{r.active ? 'Yes' : 'No'}</td>
                <td className="px-3 py-2 text-right">
                  <Link className="px-2 py-1 rounded-md border text-xs" to={`/catalog/pages/${r.page_id}`}>
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {!rows.length && !loading && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={7}>
                  No pages
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
