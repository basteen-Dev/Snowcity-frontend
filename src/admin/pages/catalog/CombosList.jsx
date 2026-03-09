import React from 'react';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import AdminTable from '../../components/common/AdminTable';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import { useNavigate } from 'react-router-dom';
import { imgSrc } from '../../../utils/media';

export default function CombosList() {
  const navigate = useNavigate();
  const [state, setState] = React.useState({ status: 'idle', items: [], error: null, active: '', attractions: [], slotCounts: {} });

  const load = async () => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const [combosRes, attractionsRes] = await Promise.all([
        adminApi.get(A.combos(), { params: { active: state.active || undefined } }),
        adminApi.get(A.attractions())
      ]);

      const items = Array.isArray(combosRes?.data) ? combosRes.data : Array.isArray(combosRes) ? combosRes : [];
      const attractions = Array.isArray(attractionsRes?.data) ? attractionsRes.data : Array.isArray(attractionsRes) ? attractionsRes : [];

      const slotCounts = {};
      await Promise.all(
        items.map(async (combo) => {
          try {
            const slotsRes = await adminApi.get(A.comboSlots(), { params: { combo_id: combo.combo_id } });
            const slots = Array.isArray(slotsRes?.data) ? slotsRes.data : Array.isArray(slotsRes) ? slotsRes : [];
            slotCounts[combo.combo_id] = slots.length;
          } catch (e) {
            slotCounts[combo.combo_id] = 0;
          }
        })
      );

      setState((s) => ({ ...s, status: 'succeeded', items, attractions, slotCounts }));
    } catch (err) { setState((s) => ({ ...s, status: 'failed', error: err })); }
  };

  React.useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  return (
    <div>
      <PageHeader title="Combos" subtitle="Manage attraction combos and bundles">
        <button
          className="rounded-lg bg-gray-900 dark:bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 dark:hover:bg-blue-700 transition-colors"
          onClick={() => navigate('/parkpanel/catalog/combos/new')}
        >
          + New Combo
        </button>
      </PageHeader>

      <FilterBar onApply={load} onReset={() => { setState((s) => ({ ...s, active: '' })); setTimeout(load, 0); }} loading={state.status === 'loading'} columns={3}>
        <select
          className="w-full rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm dark:text-neutral-200 focus:ring-1 focus:ring-blue-500"
          value={state.active}
          onChange={(e) => setState({ ...state, active: e.target.value })}
        >
          <option value="">Status: All</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </FilterBar>

      <AdminTable
        keyField="combo_id"
        columns={[
          {
            key: 'image_url',
            title: 'Image',
            render: (r) => (
              <img
                src={imgSrc(r)}
                alt={r.name || `Combo #${r.combo_id}`}
                className="w-10 h-10 object-cover rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700"
                onError={(e) => { e.target.src = '/placeholder-image.png'; }}
              />
            )
          },
          { key: 'name', title: 'Combo Name', render: (r) => r.name || `Combo #${r.combo_id}` },
          {
            key: 'attractions',
            title: 'Attractions',
            render: (r) => {
              if (!r.attraction_ids || !Array.isArray(r.attraction_ids) || r.attraction_ids.length === 0) {
                return <span className="text-gray-400">None</span>;
              }
              const names = r.attraction_ids
                .map(id => {
                  const attr = state.attractions.find(a => a.attraction_id === id);
                  return attr?.title || `#${id}`;
                })
                .filter(Boolean);
              return <span className="text-sm">{names.join(', ')}</span>;
            }
          },
          { key: 'total_price', title: 'Price', render: (r) => `₹${(r?.total_price ?? 0).toFixed(2)}` },
          { key: 'discount_percent', title: 'Discount', render: (r) => `${r?.discount_percent ?? 0}%` },
          {
            key: 'slots',
            title: 'Slots',
            render: (r) => (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/parkpanel/catalog/combo-slots?combo_id=${r.combo_id}`);
                }}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
              >
                {state.slotCounts[r.combo_id] || 0} slots
              </button>
            )
          },
          {
            key: 'active', title: 'Status', render: (r) => (
              <div className="flex items-center gap-2">
                <StatusBadge status={r?.active ? 'active' : 'inactive'} />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!window.confirm(`Delete "${r.name || `Combo #${r.combo_id}`}"?`)) return;
                    adminApi.delete(A.comboById(r.combo_id))
                      .then(() => load())
                      .catch(error => alert(error.message || 'Failed to delete'));
                  }}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            )
          }
        ]}
        rows={state.items}
        onRowClick={(r) => navigate(`/parkpanel/catalog/combos/${r.combo_id}`)}
        empty={state.status === 'loading' ? 'Loading…' : 'No combos found'}
      />
    </div>
  );
}
