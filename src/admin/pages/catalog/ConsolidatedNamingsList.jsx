import React from 'react';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import AdminTable from '../../components/common/AdminTable';
import PageHeader from '../../components/common/PageHeader';
import TablePagination from '../../components/common/TablePagination';
import { useNavigate } from 'react-router-dom';
import { Trash2, Edit } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ConsolidatedNamingsList() {
  const navigate = useNavigate();
  const [state, setState] = React.useState({
    status: 'idle',
    items: [],
    error: null,
    page: 1,
    limit: 20,
    meta: null,
  });

  const load = async (page = 1) => {
    setState((s) => ({ ...s, status: 'loading', error: null, page }));
    try {
      const res = await adminApi.get(A.consolidatedNamings(), {
        params: { page, limit: state.limit }
      });
      const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setState((s) => ({ ...s, status: 'succeeded', items, meta: res?.meta || null, page }));
    } catch (err) {
      setState((s) => ({ ...s, status: 'failed', error: err }));
    }
  };

  React.useEffect(() => { load(1); }, []);

  const remove = async (id, e) => {
    e?.stopPropagation?.();
    if (!window.confirm('Are you sure you want to delete this pricing reference?')) return;
    try {
      await adminApi.delete(A.consolidatedNamingById(id));
      toast.success('Deleted successfully');
      load(state.page);
    } catch (err) {
      toast.error(err?.message || 'Delete failed');
    }
  };

  const meta = state.meta || {};
  const totalCount = meta.total || meta.count || state.items.length;

  return (
    <div>
      <PageHeader title="Consolidated Namings" subtitle="Reference prices for third-party reports">
        <button
          className="rounded-lg bg-gray-900 dark:bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 dark:hover:bg-blue-700 transition-colors"
          onClick={() => navigate('/catalog/consolidated-namings/new')}
        >
          + Add Multi-Product Reference
        </button>
      </PageHeader>

      <AdminTable
        keyField="id"
        columns={[
          { key: 'product_type', title: 'Product Type' },
          { key: 'price_card_name', title: 'Price Card' },
          { key: 'product_name', title: 'Product Name' },
          { key: 'ref_price', title: 'Ref Price', render: (row) => `₹${row.ref_price}` },
          {
            key: '__actions',
            title: 'Actions',
            render: (row) => (
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/catalog/consolidated-namings/${row.id}`);
                  }}
                  className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                  title="Edit"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={(e) => remove(row.id, e)}
                  className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )
          }
        ]}
        rows={state.items}
        onRowClick={(row) => navigate(`/catalog/consolidated-namings/${row.id}`)}
        empty={state.status === 'loading' ? 'Loading…' : 'No reference prices found'}
      />

      <TablePagination
        count={totalCount}
        page={state.page}
        rowsPerPage={state.limit}
        onPageChange={(p) => load(p)}
        onRowsPerPageChange={(l) => { setState((s) => ({ ...s, limit: l })); setTimeout(() => load(1), 0); }}
      />
    </div>
  );
}
