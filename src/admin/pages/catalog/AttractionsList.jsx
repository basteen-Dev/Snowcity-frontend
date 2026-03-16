import React from 'react';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import AdminTable from '../../components/common/AdminTable';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import TablePagination from '../../components/common/TablePagination';
import { useNavigate } from 'react-router-dom';
import { imgSrc } from '../../../utils/media';

import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

export default function AttractionsList() {
  const navigate = useNavigate();
  const [state, setState] = React.useState({
    status: 'idle',
    items: [],
    error: null,
    page: 1,
    limit: 20,
    meta: null,
    reorder: false,
    saving: false
  });

  const load = async (page = 1) => {
    setState((s) => ({ ...s, status: 'loading', error: null, page }));
    try {
      const res = await adminApi.get(A.attractions(), {
        params: { page, limit: state.limit }
      });
      const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setState((s) => ({ ...s, status: 'succeeded', items, meta: res?.meta || null, page }));
    } catch (err) {
      setState((s) => ({ ...s, status: 'failed', error: err }));
    }
  };

  React.useEffect(() => { load(1); /* eslint-disable-line */ }, []);

  const toggleActive = async (row, e) => {
    e?.stopPropagation?.();
    try {
      const id = row.attraction_id || row.id;
      await adminApi.put(`${A.attractions()}/${id}`, { active: !row.active });
      setState((s) => ({
        ...s,
        items: s.items.map((it) => ((it.attraction_id || it.id) === id ? { ...it, active: !row.active } : it))
      }));
      toast.success(`Attraction ${!row.active ? 'activated' : 'deactivated'}`);
    } catch (err) {
      toast.error(err?.message || 'Failed to update status');
    }
  };

  const onDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setState((s) => {
      const oldIndex = s.items.findIndex((x) => String(x.attraction_id) === String(active.id));
      const newIndex = s.items.findIndex((x) => String(x.attraction_id) === String(over.id));
      const items = arrayMove(s.items, oldIndex, newIndex);
      return { ...s, items };
    });
  };

  const saveOrder = async () => {
    const ids = state.items.map((a) => a.attraction_id);
    setState((s) => ({ ...s, saving: true }));
    try {
      try {
        await adminApi.post(A.attractionsReorder(), { ids });
      } catch {
        await Promise.all(ids.map((id, idx) => adminApi.put(`${A.attractions()}/${id}`, { sort_order: idx })));
      }
      alert('Order saved');
    } catch (err) {
      alert(err?.message || 'Failed to save order');
    } finally {
      setState((s) => ({ ...s, saving: false, reorder: false }));
      load(state.page);
    }
  };

  const meta = state.meta || {};
  const totalCount = meta.total || meta.count || meta.totalCount || meta.total_items || state.items.length;

  return (
    <div>
      <PageHeader title="Attractions" subtitle="Manage your attractions catalog">
        <button
          className="rounded-lg border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          onClick={() => setState((s) => ({ ...s, reorder: !s.reorder }))}
        >
          {state.reorder ? 'Exit Reorder' : 'Reorder'}
        </button>
        {state.reorder ? (
          <button
            className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            onClick={saveOrder}
            disabled={state.saving}
          >
            {state.saving ? 'Saving…' : 'Save Order'}
          </button>
        ) : (
          <button
            className="rounded-lg bg-gray-900 dark:bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 dark:hover:bg-blue-700 transition-colors"
            onClick={() => navigate('/parkpanel/catalog/attractions/new')}
          >
            + New Attraction
          </button>
        )}
      </PageHeader>

      {!state.reorder ? (
        <>

          <AdminTable
            keyField="attraction_id"
            columns={[
              {
                key: 'image_url',
                title: 'Image',
                render: (row) => (
                  <img
                    src={imgSrc(row)}
                    alt={row.title}
                    className="w-10 h-10 object-cover rounded-lg shadow-sm border border-gray-200 dark:border-slate-600"
                    onError={(e) => { e.target.src = '/placeholder-image.png'; }}
                  />
                )
              },
              { key: 'title', title: 'Title' },
              { key: 'base_price', title: 'Base Price', render: (row) => `₹${row?.base_price ?? 0}` },
              {
                key: 'active',
                title: 'Status',
                render: (row) => (
                  <div className="flex items-center gap-2">
                    <StatusBadge status={row?.active ? 'active' : 'inactive'} />
                    <button
                      onClick={(e) => toggleActive(row, e)}
                      className={`text-xs font-medium px-2 py-1 rounded-md transition-colors ${row.active ? 'text-orange-600 hover:bg-orange-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                    >
                      {row.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                )
              },
              {
                key: '__slots',
                title: 'Slots',
                render: (row) => (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/parkpanel/catalog/attraction-slots?attraction_id=${row.attraction_id || row.id}`);
                    }}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                  >
                    View Slots
                  </button>
                )
              },
              {
                key: '__actions',
                title: 'Actions',
                render: (row) => (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/parkpanel/catalog/attractions/${row.attraction_id || row.id}`);
                    }}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                  >
                    Edit
                  </button>
                )
              }
            ]}
            rows={state.items}
            onRowClick={(row) => navigate(`/parkpanel/catalog/attractions/${row.attraction_id || row.id}`)}
            empty={state.status === 'loading' ? 'Loading…' : 'No attractions found'}
          />

          <TablePagination
            count={totalCount}
            page={state.page}
            rowsPerPage={state.limit}
            onPageChange={(p) => load(p)}
            onRowsPerPageChange={(l) => { setState((s) => ({ ...s, limit: l })); setTimeout(() => load(1), 0); }}
          />
        </>
      ) : (
        <div className="rounded-2xl border border-gray-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
          <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={state.items.map((a) => String(a.attraction_id))} strategy={verticalListSortingStrategy}>
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-neutral-800/60 border-b border-gray-200 dark:border-slate-600">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Drag</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Base Price</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                  {state.items.map((r) => (
                    <tr key={r.attraction_id} id={String(r.attraction_id)} className="hover:bg-gray-50 dark:hover:bg-neutral-800/60">
                      <td className="px-4 py-3 cursor-grab text-gray-400">⋮⋮</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-neutral-200">{r.title || '—'}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-neutral-200">₹{r?.base_price ?? 0}</td>
                      <td className="px-4 py-3"><StatusBadge status={r?.active ? 'active' : 'inactive'} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}
