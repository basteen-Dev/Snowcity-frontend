import React from 'react';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import AdminTable from '../../components/common/AdminTable';
import { useNavigate } from 'react-router-dom';

export default function OffersList() {
  const navigate = useNavigate();
  const [state, setState] = React.useState({
    status: 'idle',
    items: [],
    error: null,
    q: '',
    active: '',
    page: 1,
    limit: 20,
    meta: null
  });
  const [slotInspector, setSlotInspector] = React.useState({
    open: false,
    status: 'idle',
    offer: null,
    slots: [],
    error: null,
  });

  const load = async (page = 1) => {
    setState((s) => ({ ...s, status: 'loading', error: null, page }));
    try {
      const res = await adminApi.get(A.offers(), {
        params: { q: state.q || undefined, active: state.active || undefined, page, limit: state.limit }
      });
      const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setState((s) => ({ ...s, status: 'succeeded', items, meta: res?.meta || null, page }));
    } catch (err) {
      setState((s) => ({ ...s, status: 'failed', error: err }));
    }
  };

  const viewSlots = async (row, e) => {
    e?.stopPropagation?.();
    const id = row.offer_id || row.id;
    setSlotInspector({ open: true, status: 'loading', offer: row, slots: [], error: null });
    try {
      const res = await adminApi.get(`${A.offers()}/${id}/slots`, { params: { limit: 1000 } });
      const slots = Array.isArray(res?.slots) ? res.slots : [];
      setSlotInspector({ open: true, status: 'succeeded', offer: res?.offer || row, slots, error: null });
    } catch (err) {
      setSlotInspector((s) => ({ ...s, status: 'failed', error: err }));
    }
  };

  const closeSlotInspector = () => setSlotInspector({ open: false, status: 'idle', offer: null, slots: [], error: null });

  React.useEffect(() => { load(1); /* eslint-disable-line */ }, []);

  const toggleActive = async (row, e) => {
    e?.stopPropagation?.();
    try {
      const id = row.offer_id || row.id;
      await adminApi.put(`${A.offers()}/${id}`, { active: !row.active });
      setState((s) => ({
        ...s,
        items: s.items.map((it) => ((it.offer_id || it.id) === id ? { ...it, active: !row.active } : it))
      }));
    } catch (err) {
      alert(err?.message || 'Failed to update');
    }
  };

  const remove = async (row, e) => {
    e?.stopPropagation?.();
    if (!window.confirm(`Delete offer "${row.title}"? This cannot be undone.`)) return;
    try {
      const id = row.offer_id || row.id;
      await adminApi.delete(`${A.offers()}/${id}`);
      setState((s) => ({ ...s, items: s.items.filter((it) => (it.offer_id || it.id) !== id) }));
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
        <h1 className="text-xl font-semibold">Offers</h1>
        <button className="rounded-md bg-gray-900 text-white px-3 py-2 text-sm" onClick={() => navigate('/admin/catalog/offers/new')}>
          New Offer
        </button>
      </div>

      <div className="mb-3 grid grid-cols-1 md:grid-cols-4 gap-2">
        <input className="rounded-md border px-3 py-2" placeholder="Search title" value={state.q} onChange={(e) => setState((s) => ({ ...s, q: e.target.value }))} />
        <select className="rounded-md border px-3 py-2" value={state.active} onChange={(e) => setState((s) => ({ ...s, active: e.target.value }))}>
          <option value="">Active: All</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button className="rounded-md border px-3 py-2 text-sm" onClick={() => load(1)}>Filter</button>
      </div>

      <AdminTable
        keyField="offer_id"
        columns={[
          { key: 'title', title: 'Title' },
          {
            key: 'discount_summary',
            title: 'Discount',
            render: (row) => {
              const type = (row.discount_type || 'percent').toLowerCase();
              const value = Number(row.discount_value ?? row.discount_percent ?? 0);
              if (!value) return '—';
              return type === 'amount' ? `₹${value}` : `${value}%`;
            }
          },
          { key: 'rule_type', title: 'Rule' },
          {
            key: 'rule_count',
            title: 'Rules',
            render: (row) => Number(row.rule_count ?? 0)
          },
          { key: 'valid_from', title: 'From' },
          { key: 'valid_to', title: 'To' },
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
                <button className={`rounded-md px-2 py-1 text-xs ${row.active ? 'border text-red-600' : 'bg-blue-600 text-white'}`} onClick={(e) => toggleActive(row, e)}>
                  {row.active ? 'Deactivate' : 'Activate'}
                </button>
                <button className="rounded-md border px-2 py-1 text-xs" onClick={(e) => viewSlots(row, e)}>
                  View Slots
                </button>
                <button className="rounded-md border px-2 py-1 text-xs text-red-600" onClick={(e) => remove(row, e)}>
                  Delete
                </button>
              </div>
            )
          }
        ]}
        rows={state.items}
        onRowClick={(row) => navigate(`/admin/catalog/offers/${row.offer_id || row.id}`)}
        empty={state.status === 'loading' ? 'Loading…' : 'No offers found'}
      />

      <div className="mt-3 flex items-center gap-2">
        <button className="rounded-md border px-3 py-1 text-sm" onClick={() => canPrev && load(state.page - 1)} disabled={!canPrev || state.status === 'loading'}>Prev</button>
        <div className="text-sm text-gray-600">Page {meta.page || state.page}</div>
        <button className="rounded-md border px-3 py-1 text-sm" onClick={() => canNext && load(state.page + 1)} disabled={!canNext || state.status === 'loading'}>Next</button>
      </div>

      {slotInspector.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b dark:border-neutral-800">
              <div>
                <h2 className="text-lg font-semibold">Offer Slots – {slotInspector.offer?.title}</h2>
                <p className="text-xs text-gray-500">Showing slots matched by current rules</p>
              </div>
              <button className="text-sm text-gray-500 hover:text-gray-800" onClick={closeSlotInspector}>Close</button>
            </div>
            <div className="p-4 space-y-4">
              {slotInspector.status === 'loading' && <div className="text-sm text-gray-500">Loading slots…</div>}
              {slotInspector.status === 'failed' && (
                <div className="text-sm text-red-600">{slotInspector.error?.message || 'Failed to load slots'}</div>
              )}
              {slotInspector.status === 'succeeded' && (
                <>
                  <div className="text-sm text-gray-600">{slotInspector.slots.length} slots matched</div>
                  <div className="overflow-auto border rounded-xl">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-neutral-800">
                        <tr>
                          <th className="px-3 py-2 text-left">Type</th>
                          <th className="px-3 py-2 text-left">Target</th>
                          <th className="px-3 py-2 text-left">Date</th>
                          <th className="px-3 py-2 text-left">Time</th>
                          <th className="px-3 py-2 text-right">Capacity</th>
                          <th className="px-3 py-2 text-right">Price</th>
                          <th className="px-3 py-2 text-left">Rule</th>
                        </tr>
                      </thead>
                      <tbody>
                        {slotInspector.slots.map((slot, idx) => (
                          <tr key={`offer-slot-${idx}`} className="border-t">
                            <td className="px-3 py-2 capitalize">{slot._match?.type || 'attraction'}</td>
                            <td className="px-3 py-2">{slot.attraction_title || slot.combo_name || slot.combo_id || slot.attraction_id || '—'}</td>
                            <td className="px-3 py-2">{slot.start_date}{slot.end_date && slot.end_date !== slot.start_date ? ` → ${slot.end_date}` : ''}</td>
                            <td className="px-3 py-2">{slot.start_time} – {slot.end_time}</td>
                            <td className="px-3 py-2 text-right">{slot.capacity ?? '—'}</td>
                            <td className="px-3 py-2 text-right">{slot.price == null ? '—' : `₹${Number(slot.price).toLocaleString()}`}</td>
                            <td className="px-3 py-2 text-xs text-gray-500">Rule #{slot._match?.rule_id}</td>
                          </tr>
                        ))}
                        {!slotInspector.slots.length && (
                          <tr>
                            <td className="px-3 py-4 text-center text-gray-500" colSpan={7}>No slots matched this offer</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}