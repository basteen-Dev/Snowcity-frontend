import React from 'react';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import AdminTable from '../../components/common/AdminTable';
import { useNavigate } from 'react-router-dom';
import { imgSrc } from '../../../utils/media';

const ensureArray = (val) => {
  if (Array.isArray(val)) return val;
  return [];
};

const parseGalleryResponse = (res) => {
  if (!res) return { items: [], meta: null };
  if (Array.isArray(res)) return { items: res, meta: null };
  if (Array.isArray(res?.data)) return { items: res.data, meta: res.meta || null };
  if (res?.data && typeof res.data === 'object') {
    if (Array.isArray(res.data.data)) {
      return { items: res.data.data, meta: res.data.meta || res.meta || null };
    }
  }
  return { items: ensureArray(res.items || res.list), meta: res.meta || null };
};

export default function GalleryManager() {
  const navigate = useNavigate();
  const [state, setState] = React.useState({
    status: 'idle',
    items: [],
    error: null,
  });
  const [filters, setFilters] = React.useState({ q: '', type: '', category: 'all', target_ref_id: '' });
  const [attractions, setAttractions] = React.useState([]);
  const [combos, setCombos] = React.useState([]);
  const [targetsLoading, setTargetsLoading] = React.useState(false);
  const [selectedItems, setSelectedItems] = React.useState([]);
  const [deleteStatus, setDeleteStatus] = React.useState({ loading: false, error: null });

  const load = React.useCallback(async (nextFilters = filters) => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const params = {
        q: nextFilters.q || undefined,
        type: nextFilters.type || undefined,
      };
      
      // Add category-specific filtering
      if (nextFilters.category === 'attraction' && nextFilters.target_ref_id) {
        params.target_type = 'attraction';
        params.target_ref_id = nextFilters.target_ref_id;
      } else if (nextFilters.category === 'combo' && nextFilters.target_ref_id) {
        params.target_type = 'combo';
        params.target_ref_id = nextFilters.target_ref_id;
      } else if (nextFilters.category === 'common') {
        params.target_type = 'none';
      }
      
      const res = await adminApi.get(A.gallery(), { params });
      const { items } = parseGalleryResponse(res);
      setState({ status: 'succeeded', items, error: null });
      setSelectedItems([]);
    } catch (err) {
      setState((s) => ({ ...s, status: 'failed', error: err }));
    }
  }, [filters]);

  React.useEffect(() => { load(filters); }, [load, filters]);

  // Load attractions and combos for filtering
  React.useEffect(() => {
    const loadTargets = async () => {
      setTargetsLoading(true);
      try {
        const [attractionsRes, combosRes] = await Promise.all([
          adminApi.get(A.attractions()),
          adminApi.get(A.combos())
        ]);
        setAttractions(Array.isArray(attractionsRes) ? attractionsRes : []);
        setCombos(Array.isArray(combosRes) ? combosRes : []);
      } catch (err) {
        console.error('Failed to load targets:', err);
      } finally {
        setTargetsLoading(false);
      }
    };
    loadTargets();
  }, []);

  const handleDelete = async (item) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${item.title || 'this item'}"?`);
    if (!confirmDelete) return;

    setDeleteStatus({ loading: true, error: null });
    try {
      const itemId = item?.gallery_item_id ?? item?.gallery_id ?? item?.id;
      await adminApi.delete(A.galleryDelete(itemId));
      await load(filters);
    } catch (err) {
      setDeleteStatus({ loading: false, error: err });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    
    const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedItems.length} selected items?`);
    if (!confirmDelete) return;

    setDeleteStatus({ loading: true, error: null });
    try {
      await adminApi.post(A.galleryBulkDelete(), { ids: selectedItems });
      await load(filters);
    } catch (err) {
      setDeleteStatus({ loading: false, error: err });
    }
  };

  const columns = [
    {
      key: 'preview',
      title: 'Preview',
      render: (row) => {
        const isVideo = row.media_type === 'video' || (row.url && row.url.match(/\.(mp4|webm|ogg)$/i));
        const isPdf = row.media_type === 'pdf' || (row.url && row.url.match(/\.pdf$/i));
        
        return (
          <div className="w-20 h-14 rounded-md overflow-hidden bg-gray-100">
            {isVideo ? (
              <video src={row.url} className="w-full h-full object-cover" muted />
            ) : isPdf ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                PDF
              </div>
            ) : (
              <img src={imgSrc(row) || row.url} alt={row.title || 'Gallery media'} className="w-full h-full object-cover" loading="lazy" />
            )}
          </div>
        );
      }
    },
    { key: 'title', title: 'Title' },
    { key: 'media_type', title: 'Type' },
    { 
      key: 'target', 
      title: 'Linked To',
      render: (row) => {
        if (!row.target_type || row.target_type === 'none') return 'Common Gallery';
        if (row.target_type === 'attraction') {
          const attraction = attractions.find(a => (a.attraction_id || a.id) === row.target_ref_id);
          return attraction ? `Attraction: ${attraction.title || attraction.name}` : `Attraction #${row.target_ref_id}`;
        }
        if (row.target_type === 'combo') {
          const combo = combos.find(c => (c.combo_id || c.id) === row.target_ref_id);
          return combo ? `Combo: ${combo.title || combo.name}` : `Combo #${row.target_ref_id}`;
        }
        return row.target_type;
      }
    },
    { key: 'status', title: 'Status' },
    { key: 'priority', title: 'Priority' },
    { key: 'created_at', title: 'Created' },
    { key: 'updated_at', title: 'Updated' },
  ];

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-semibold">Gallery</h1>
          <p className="text-sm text-gray-600">Manage homepage and gallery media assets.</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-md border px-3 py-2 text-sm" onClick={() => navigate('/admin/catalog/banners')}>
            Manage Banners
          </button>
          <button className="rounded-md bg-gray-900 text-white px-3 py-2 text-sm" onClick={() => navigate('/admin/catalog/gallery/new')}>
            Add Media
          </button>
          {selectedItems.length > 0 && (
            <button 
              className="rounded-md bg-red-600 text-white px-3 py-2 text-sm disabled:opacity-50" 
              onClick={handleBulkDelete}
              disabled={deleteStatus.loading}
            >
              {deleteStatus.loading ? 'Deleting...' : `Delete Selected (${selectedItems.length})`}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4">
        <input
          className="rounded-md border px-3 py-2"
          placeholder="Search title"
          value={filters.q}
          onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
        />
        <select
          className="rounded-md border px-3 py-2"
          value={filters.type}
          onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
        >
          <option value="">Type: All</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
          <option value="pdf">PDFs</option>
        </select>
        <select
          className="rounded-md border px-3 py-2"
          value={filters.category}
          onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value, target_ref_id: '' }))}
        >
          <option value="all">All Gallery</option>
          <option value="common">Common Gallery</option>
          <option value="attraction">Attraction Gallery</option>
          <option value="combo">Combo Gallery</option>
        </select>
        {filters.category === 'attraction' && (
          <select
            className="rounded-md border px-3 py-2"
            value={filters.target_ref_id}
            onChange={(e) => setFilters((f) => ({ ...f, target_ref_id: e.target.value }))}
            disabled={targetsLoading}
          >
            <option value="">Select attraction</option>
            {attractions.map((attr) => (
              <option key={attr.attraction_id || attr.id} value={attr.attraction_id || attr.id}>
                {attr.title || attr.name || `Attraction #${attr.attraction_id || attr.id}`}
              </option>
            ))}
          </select>
        )}
        {filters.category === 'combo' && (
          <select
            className="rounded-md border px-3 py-2"
            value={filters.target_ref_id}
            onChange={(e) => setFilters((f) => ({ ...f, target_ref_id: e.target.value }))}
            disabled={targetsLoading}
          >
            <option value="">Select combo</option>
            {combos.map((combo) => (
              <option key={combo.combo_id || combo.id} value={combo.combo_id || combo.id}>
                {combo.title || combo.name || `Combo #${combo.combo_id || combo.id}`}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="flex gap-2 mb-4">
        <button className="rounded-md border px-3 py-2 text-sm" onClick={() => load(filters)} disabled={state.status === 'loading'}>
          Apply
        </button>
        <button
          className="rounded-md border px-3 py-2 text-sm"
          onClick={() => {
            setFilters({ q: '', type: '', category: 'all', target_ref_id: '' });
            load({ q: '', type: '', category: 'all', target_ref_id: '' });
          }}
        >
          Reset
        </button>
      </div>

      {state.status === 'failed' && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          Failed to load gallery items. {state.error?.message || ''}
        </div>
      )}

      {deleteStatus.error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          Delete failed. {deleteStatus.error?.message || ''}
        </div>
      )}

      <AdminTable
        keyField="gallery_item_id"
        columns={columns}
        rows={state.items}
        showSelection={true}
        selectedItems={selectedItems}
        onSelectionChange={setSelectedItems}
        actions={[
          {
            label: 'Delete',
            onClick: handleDelete,
            className: 'bg-red-100 hover:bg-red-200 text-red-700',
            title: 'Delete this item'
          }
        ]}
        onRowClick={(row) => {
          const galleryId = row?.gallery_item_id ?? row?.gallery_id ?? row?.id;
          if (galleryId == null) return;
          navigate(`/admin/catalog/gallery/${galleryId}`);
        }}
        empty={state.status === 'loading' ? 'Loading…' : 'No media found'}
      />
    </div>
  );
}
