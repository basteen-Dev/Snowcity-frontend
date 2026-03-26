import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import PageHeader from '../../components/common/PageHeader';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';

export default function ConsolidatedNamingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState({
    product_type: '',
    price_card_name: '',
    products: [{ product_name: '', ref_price: '' }]
  });

  React.useEffect(() => {
    if (isEdit) {
      const load = async () => {
        setLoading(true);
        try {
          const res = await adminApi.get(A.consolidatedNamingById(id));
          setData({
            product_type: res.product_type,
            price_card_name: res.price_card_name,
            products: [{ product_name: res.product_name, ref_price: res.ref_price }]
          });
        } catch (err) {
          toast.error(err?.message || 'Failed to load data');
        } finally {
          setLoading(false);
        }
      };
      load();
    }
  }, [id, isEdit]);

  const addProduct = () => {
    setData(prev => ({
      ...prev,
      products: [...prev.products, { product_name: '', ref_price: '' }]
    }));
  };

  const removeProduct = (idx) => {
    if (data.products.length <= 1) return;
    setData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== idx)
    }));
  };

  const updateProduct = (idx, field, value) => {
    setData(prev => {
      const next = [...prev.products];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, products: next };
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        const p = data.products[0];
        await adminApi.put(A.consolidatedNamingById(id), {
          product_type: data.product_type,
          price_card_name: data.price_card_name,
          product_name: p.product_name,
          ref_price: p.ref_price
        });
        toast.success('Updated successfully');
      } else {
        await adminApi.post(A.consolidatedNamings(), data);
        toast.success('Created successfully');
      }
      navigate('/catalog/consolidated-namings');
    } catch (err) {
      toast.error(err?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) return <div className="p-8">Loading…</div>;

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={isEdit ? 'Edit Reference' : 'Add Multi-Product Reference'}
        subtitle={isEdit ? 'Update pricing reference' : 'Add multiple products for one price card'}
      >
        <button
          onClick={() => navigate('/catalog/consolidated-namings')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={16} /> Back to List
        </button>
      </PageHeader>

      <form onSubmit={submit} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">Product Type</label>
            <input
              required
              className="w-full rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-900 px-3 py-2 text-sm"
              value={data.product_type}
              onChange={e => setData(s => ({ ...s, product_type: e.target.value }))}
              placeholder="e.g. SNOW PARK / MAD LAB"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">Price Card Name</label>
            <input
              required
              className="w-full rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-900 px-3 py-2 text-sm"
              value={data.price_card_name}
              onChange={e => setData(s => ({ ...s, price_card_name: e.target.value }))}
              placeholder="e.g. ADULT WEEKDAY"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-bold text-gray-700 dark:text-neutral-300 mb-3 border-b pb-2">Products & Split Prices</label>
          <div className="space-y-3">
            {data.products.map((p, idx) => (
              <div key={idx} className="flex flex-col md:flex-row gap-3 items-end md:items-center bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg border border-gray-100 dark:border-slate-700">
                <div className="flex-1 w-full">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Product Name</label>
                  <input
                    required
                    className="w-full rounded-md border border-gray-200 dark:border-slate-600 dark:bg-slate-800 px-3 py-1.5 text-sm"
                    value={p.product_name}
                    onChange={e => updateProduct(idx, 'product_name', e.target.value)}
                    placeholder="e.g. Entry Ticket"
                  />
                </div>
                <div className="w-full md:w-32">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Price (₹)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    className="w-full rounded-md border border-gray-200 dark:border-slate-600 dark:bg-slate-800 px-3 py-1.5 text-sm"
                    value={p.ref_price}
                    onChange={e => updateProduct(idx, 'ref_price', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                {data.products.length > 1 && !isEdit && (
                  <button
                    type="button"
                    onClick={() => removeProduct(idx)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {!isEdit && (
            <button
              type="button"
              onClick={addProduct}
              className="mt-4 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              <Plus size={16} /> Add Another Product
            </button>
          )}
        </div>

        <div className="mt-8 flex items-center justify-end gap-3 border-t pt-6">
          <button
            type="button"
            onClick={() => navigate('/catalog/consolidated-namings')}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-gray-900 dark:bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {loading ? 'Saving…' : 'Save Reference'}
          </button>
        </div>
      </form>
    </div>
  );
}
