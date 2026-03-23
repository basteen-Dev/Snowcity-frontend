import React from 'react';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import AdminTable from '../../components/common/AdminTable';
import { useNavigate } from 'react-router-dom';
import { imgSrc } from '../../../utils/media';

export default function PromoCardsList() {
  const navigate = useNavigate();
  const [state, setState] = React.useState({
    status: 'idle',
    items: [],
    error: null,
    active: '',
    page: 1,
    limit: 20,
    meta: null,
  });

  const load = async (page = 1) => {
    setState((s) => ({ ...s, status: 'loading', error: null, page }));
    try {
      const res = await adminApi.get(A.promoCards(), { params: { active: state.active || undefined, page, limit: state.limit } });
      const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setState((s) => ({ ...s, status: 'succeeded', items, meta: res?.meta || null, page }));
    } catch (err) {
      setState((s) => ({ ...s, status: 'failed', error: err }));
    }
  };

  React.useEffect(() => { load(1); /* eslint-disable-line */ }, []);

  const remove = async (row, e) => {
    e?.stopPropagation?.();
    if (!window.confirm(`Delete promo card linking to "${row.link_url || ''}"? This cannot be undone.`)) return;
    try {
      const id = row.id;
      await adminApi.delete(`${A.promoCards()}/${id}`);
      setState((s) => ({ ...s, items: s.items.filter((it) => it.id !== id) }));
    } catch (err) {
      alert(err?.message || 'Delete failed');
    }
  };

  const meta = state.meta || {};
  const canPrev = state.page > 1;
  const canNext = meta.page ? (meta.page < (meta.totalPages || meta.total_pages || 1)) : false;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold">Promo Cards</h1>
        <div className="flex items-center gap-2">
          <button className="rounded-md bg-gray-900 text-white px-3 py-2 text-sm" onClick={() => navigate('/catalog/promo-cards/new')}>
            New Promo Card
          </button>
        </div>
      </div>

      <div className="mb-3 flex gap-2">
        <select className="rounded-md border px-3 py-2" value={state.active} onChange={(e) => setState((s) => ({ ...s, active: e.target.value }))}>
          <option value="">Active: All</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button className="rounded-md border px-3 py-2 text-sm" onClick={() => load(1)}>Filter</button>
      </div>

      <AdminTable
        keyField="id"
        columns={[
          {
            key: 'image_url',
            title: 'Image',
            render: (row) => (
              <img
                src={imgSrc({ web_image: row.image_url })}
                alt="Promo Card"
                className="w-16 h-8 object-cover rounded shadow-sm border dark:border-slate-600"
                onError={(e) => { e.target.src = '/placeholder-image.png'; }}
              />
            )
          },
          { key: 'link_url', title: 'Link URL' },
          {
            key: 'active',
            title: 'Active',
            render: (row) => String(row?.active)
          },
          {
            key: '__actions',
            title: 'Actions',
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                <button className="rounded-md border px-2 py-1 text-xs text-red-600" onClick={(e) => remove(row, e)}>
                  Delete
                </button>
              </div>
            )
          }
        ]}
        rows={state.items}
        onRowClick={(row) => navigate(`/catalog/promo-cards/${row.id}`)}
        empty={state.status === 'loading' ? 'Loading…' : 'No promo cards'}
      />

      <div className="mt-3 flex items-center gap-2">
        <button className="rounded-md border px-3 py-1 text-sm" onClick={() => canPrev && load(state.page - 1)} disabled={!canPrev || state.status === 'loading'}>Prev</button>
        <div className="text-sm text-gray-600">Page {meta.page || state.page}</div>
        <button className="rounded-md border px-3 py-1 text-sm" onClick={() => canNext && load(state.page + 1)} disabled={!canNext || state.status === 'loading'}>Next</button>
      </div>
    </div>
  );
}
