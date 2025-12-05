import React from 'react';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import AdminTable from '../../components/common/AdminTable';
import { useNavigate } from 'react-router-dom';

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
      
      // Fetch slot counts for each combo
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
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold">Combos</h1>
        <button className="rounded-md bg-gray-900 text-white px-3 py-2 text-sm" onClick={() => navigate('/admin/catalog/combos/new')}>
          New Combo
        </button>
      </div>

      <div className="mb-3 flex gap-2">
        <select className="rounded-md border px-3 py-2" value={state.active} onChange={(e) => setState({ ...state, active: e.target.value })}>
          <option value="">Active: All</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button className="rounded-md border px-3 py-2 text-sm" onClick={load}>Filter</button>
      </div>

      <AdminTable
        keyField="combo_id"
        columns={[
          { key: 'combo_id', title: 'ID' },
          { key: 'name', title: 'Combo Name', render: (r) => r.name || `Combo #${r.combo_id}` },
          { 
            key: 'attractions', 
            title: 'Attractions', 
            render: (r) => {
              if (!r.attraction_ids || !Array.isArray(r.attraction_ids) || r.attraction_ids.length === 0) {
                return 'No attractions';
              }
              
              const attractionNames = r.attraction_ids
                .map(id => {
                  const attraction = state.attractions.find(a => a.attraction_id === id);
                  return attraction?.title || `Attraction #${id}`;
                })
                .filter(Boolean);
              
              return attractionNames.length > 0 
                ? attractionNames.join(', ') 
                : 'Unknown attractions';
            }
          },
          { key: 'total_price', title: 'Total Price', render: (r) => `₹${(r?.total_price ?? 0).toFixed(2)}` },
          { key: 'discount_percent', title: 'Discount %', render: (r) => `${r?.discount_percent ?? 0}%` },
          { 
            key: 'slots', 
            title: 'Slots', 
            render: (r) => {
              const slotCount = state.slotCounts[r.combo_id] || 0;
              return (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{slotCount} slots</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/catalog/combo-slots?combo_id=${r.combo_id}`);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm underline"
                  >
                    View
                  </button>
                </div>
              );
            }
          },
          { 
            key: 'image_url', 
            title: 'Image', 
            render: (r) => r.image_url ? (
              <img 
                src={r.image_url} 
                alt={r.name} 
                className="w-8 h-8 object-cover rounded"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : 'No image'
          },
          { key: 'active', title: 'Active', render: (r) => (
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 text-xs rounded ${
                r?.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {r?.active ? 'Active' : 'Inactive'}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!window.confirm(`Are you sure you want to delete "${r.name || `Combo #${r.combo_id}`}"? This will also delete all associated slots.`)) return;
                  
                  adminApi.delete(A.comboById(r.combo_id))
                    .then(() => load())
                    .catch(error => alert(error.message || 'Failed to delete combo'));
                }}
                className="text-red-600 hover:text-red-800 text-sm underline"
                title="Delete combo"
              >
                Delete
              </button>
            </div>
          )}
        ]}
        rows={state.items}
        onRowClick={(r) => navigate(`/admin/catalog/combos/${r.combo_id}`)}
        empty={state.status === 'loading' ? 'Loading…' : 'No combos'}
      />
    </div>
  );
}