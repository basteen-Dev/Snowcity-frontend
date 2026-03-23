import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import ImageUploader from '../../components/common/ImageUploader';
import SaveOverlay from '../../components/common/SaveOverlay';
import toast from 'react-hot-toast';

export default function PromoCardForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [state, setState] = React.useState({
    status: isEdit ? 'loading' : 'idle',
    error: null,
    form: {
      link_url: '',
      image_url: '',
      active: true
    }
  });

  React.useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const res = await adminApi.get(`${A.promoCards()}/${id}`);
        const c = res || {};
        setState((s) => ({
          ...s, status: 'idle', form: {
            link_url: c.link_url || '',
            image_url: c.image_url || '',
            active: !!c.active
          }
        }));
      } catch (err) {
        setState((s) => ({ ...s, status: 'failed', error: err }));
      }
    })();
  }, [id, isEdit]);

  const [saving, setSaving] = React.useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setState((s) => ({ ...s, error: null }));
    const loadingToast = toast.loading(isEdit ? 'Updating promo card...' : 'Creating promo card...');
    try {
      const payload = { ...state.form };
      if (isEdit) await adminApi.put(`${A.promoCards()}/${id}`, payload);
      else await adminApi.post(A.promoCards(), payload);

      toast.success(isEdit ? 'Promo Card updated successfully' : 'Promo Card created successfully', { id: loadingToast });
      navigate('/catalog/promo-cards');
    } catch (err) {
      toast.error(err.message || 'Save failed', { id: loadingToast });
      setState((s) => ({ ...s, error: err }));
    } finally {
      setSaving(false);
    }
  };

  if (state.status === 'loading') return <div>Loading…</div>;
  if (state.status === 'failed') return <div className="text-red-600">{state.error?.message || 'Failed to load'}</div>;

  const f = state.form;

  return (
    <div className="relative">
      <SaveOverlay visible={saving} label={isEdit ? 'Updating promo card…' : 'Saving promo card…'} />
      <form onSubmit={save} className="max-w-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
        <h1 className="text-xl font-semibold mb-4">{isEdit ? 'Edit' : 'New'} Promo Card</h1>
        {state.error ? (
          <div className="mb-3 text-sm text-red-600">{state.error?.message || 'Save failed'}</div>
        ) : null}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Destination URL</label>
            <input
              className="w-full rounded-md border px-3 py-2 dark:bg-slate-800 dark:border-slate-600 dark:text-neutral-200"
              value={f.link_url}
              onChange={(e) => setState((s) => ({
                ...s,
                form: {
                  ...s.form,
                  link_url: e.target.value,
                }
              }))}
              placeholder="/tickets-offers or https://..."
              required
            />
          </div>

          <div className="md:col-span-2">
            <ImageUploader 
              label="Promo Image" 
              value={f.image_url} 
              onChange={(url) => setState((s) => ({ ...s, form: { ...s.form, image_url: url } }))} 
              folder="promo_cards" 
              requiredPerm="uploads:write" 
            />
          </div>

          <div className="flex items-center gap-2 md:col-span-2">
            <input id="active" type="checkbox" checked={!!f.active} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, active: e.target.checked } }))} />
            <label htmlFor="active" className="text-sm text-gray-700 dark:text-neutral-200">Active</label>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button type="submit" disabled={saving} className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed">{saving ? 'Saving…' : 'Save'}</button>
          <button type="button" className="rounded-md border px-4 py-2 text-sm" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
