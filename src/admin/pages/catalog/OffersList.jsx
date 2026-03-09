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
  const totalCount = meta.total || meta.count || meta.totalCount || meta.total_items || state.items.length;

  return (
    <div>
      <PageHeader title="Offers" subtitle="Manage promotions and discounts">
        <button
          className="rounded-lg bg-gray-900 dark:bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 dark:hover:bg-blue-700 transition-colors"
          onClick={() => navigate('/parkpanel/catalog/offers/new')}
        >
          + New Offer
        </button>
      </PageHeader>

      <FilterBar onApply={() => load(1)} onReset={() => { setState((s) => ({ ...s, q: '', active: '' })); setTimeout(() => load(1), 0); }} loading={state.status === 'loading'}>
        <input
          className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm dark:text-neutral-200 focus:ring-1 focus:ring-blue-500 placeholder:text-gray-400"
          placeholder="Search by title…"
          value={state.q}
          onChange={(e) => setState((s) => ({ ...s, q: e.target.value }))}
        />
        <select
          className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm dark:text-neutral-200 focus:ring-1 focus:ring-blue-500"
          value={state.active}
          onChange={(e) => setState((s) => ({ ...s, active: e.target.value }))}
        >
          <option value="">Status: All</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </FilterBar>

      <div className="mt-8">
        <AdminTable
          keyField="offer_id"
          columns={[
            {
              key: 'image_url',
              title: 'Image',
              render: (row) => (
                <img
                  src={imgSrc(row)}
                  alt={row.title || 'Offer'}
                  className="w-10 h-10 object-cover rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700"
                  onError={(e) => { e.target.src = '/placeholder-image.png'; }}
                />
              )
            },
            { key: 'title', title: 'Title' },
            {
              key: 'discount_summary',
              title: 'Discount',
              render: (row) => {
                if ((row.rule_type || '').toLowerCase() === 'buy_x_get_y') {
                  const r = Array.isArray(row.rules) && row.rules[0] ? row.rules[0] : null;
                  if (!r) return 'Buy X get Y';
                  const buyQty = r.buy_qty || 1;
                  const getQty = r.get_qty || 1;
                  const getType = (r.get_target_type || 'attraction');
                  const getId = r.get_target_id || '';
                  const discountType = r.get_discount_type || '';
                  const discountVal = r.get_discount_value || '';
                  const targetLabel = getType + (getId ? ` #${getId}` : '');
                  if (!discountType) return `Buy ${buyQty} get ${getQty} ${targetLabel} (Free)`;
                  if (discountType === 'amount') return `Buy ${buyQty} get ${getQty} ${targetLabel} (₹${discountVal})`;
                  return `Buy ${buyQty} get ${getQty} ${targetLabel} (${discountVal}%)`;
                }
                const type = (row.discount_type || 'percent').toLowerCase();
                const value = Number(row.discount_value ?? row.discount_percent ?? 0);
                if (!value) return '—';
                return type === 'amount' ? `₹${value}` : `${value}%`;
              }
            },
            { key: 'rule_type', title: 'Rule' },
            { key: 'valid_from', title: 'From' },
            { key: 'valid_to', title: 'To' },
            {
              title: 'Status',
              render: (row) => <StatusBadge status={row?.active ? 'active' : 'inactive'} />
            },
            {
              key: '__actions',
              title: 'Actions',
              render: (row) => (
                <div className="flex items-center gap-1.5">
                  <button
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${row.active ? 'border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    onClick={(e) => toggleActive(row, e)}
                  >
                    {row.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    className="rounded-lg border border-gray-300 dark:border-neutral-700 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                    onClick={(e) => viewSlots(row, e)}
                  >
                    Slots
                  </button>
                  <button
                    className="rounded-lg border border-red-200 dark:border-red-800 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    onClick={(e) => remove(row, e)}
                  >
                    Delete
                  </button>
                </div>
              )
            }
          ]}
          rows={state.items}
          onRowClick={(row) => navigate(`/parkpanel/catalog/offers/${row.offer_id || row.id}`)}
          empty={state.status === 'loading' ? 'Loading…' : 'No offers found'}
        />

        <TablePagination
          count={totalCount}
          page={state.page}
          rowsPerPage={state.limit}
          onPageChange={(p) => load(p)}
          onRowsPerPageChange={(l) => { setState((s) => ({ ...s, limit: l })); setTimeout(() => load(1), 0); }}
        />
      </div>

      {/* Slot Inspector Modal */}
      {slotInspector.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-auto border border-gray-200 dark:border-neutral-800">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-800/50 rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-neutral-100">Offer Slots – {slotInspector.offer?.title}</h2>
                <p className="text-xs text-gray-500 dark:text-neutral-400">Showing slots matched by current rules</p>
              </div>
              <button
                className="rounded-lg border border-gray-300 dark:border-neutral-700 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                onClick={closeSlotInspector}
              >
                Close
              </button>
            </div>
            <div className="p-6">
              {slotInspector.status === 'loading' && <div className="text-sm text-gray-500">Loading slots…</div>}
              {slotInspector.status === 'failed' && (
                <div className="text-sm text-red-600">{slotInspector.error?.message || 'Failed to load slots'}</div>
              )}
              {slotInspector.status === 'succeeded' && (
                <>
                  <div className="text-sm text-gray-500 mb-3">{slotInspector.slots.length} slots matched</div>
                  <div className="rounded-2xl border border-gray-200 dark:border-neutral-800 overflow-hidden">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50/80 dark:bg-neutral-800/60 border-b border-gray-200 dark:border-neutral-700">
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Type</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Target</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Time</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Capacity</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Price</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Rule</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                        {slotInspector.slots.map((slot, idx) => (
                          <tr key={`offer-slot-${idx}`} className={idx % 2 === 0 ? '' : 'bg-gray-50/40 dark:bg-neutral-800/20'}>
                            <td className="px-4 py-3 capitalize">{slot._match?.type || 'attraction'}</td>
                            <td className="px-4 py-3">{slot.attraction_title || slot.combo_name || slot.combo_id || slot.attraction_id || '—'}</td>
                            <td className="px-4 py-3">{slot.start_date}{slot.end_date && slot.end_date !== slot.start_date ? ` → ${slot.end_date}` : ''}</td>
                            <td className="px-4 py-3">{slot.start_time} – {slot.end_time}</td>
                            <td className="px-4 py-3 text-right">{slot.capacity ?? '—'}</td>
                            <td className="px-4 py-3 text-right">{slot.price == null ? '—' : `₹${Number(slot.price).toLocaleString()}`}</td>
                            <td className="px-4 py-3 text-xs text-gray-500">Rule #{slot._match?.rule_id}</td>
                          </tr>
                        ))}
                        {!slotInspector.slots.length && (
                          <tr>
                            <td className="px-4 py-8 text-center text-gray-400" colSpan={7}>No slots matched this offer</td>
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
