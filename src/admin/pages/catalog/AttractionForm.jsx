import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import ImageUploader from '../../components/common/ImageUploader';
import SaveOverlay from '../../components/common/SaveOverlay';

export default function AttractionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [state, setState] = React.useState({
    status: isEdit ? 'loading' : 'idle',
    error: null,
    form: { title: '', slug: '', image_url: '', desktop_image_url: '', base_price: 0, active: true, description: '', meta_title: '', short_description: '' }
  });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const res = await adminApi.get(A.attractionById(id));
        const a = res?.attraction || res || {};
        setState((s) => ({
          ...s,
          status: 'idle',
          form: {
            title: a.title || '',
            slug: a.slug || '',
            image_url: a.image_url || '',
            desktop_image_url: a.desktop_image_url || '',
            base_price: a.base_price || 0,
            active: !!a.active,
            description: a.description || '',
            meta_title: a.meta_title || '',
            short_description: a.short_description || ''
          }
        }));
      } catch (err) { setState((s) => ({ ...s, status: 'failed', error: err })); }
    })();
  }, [id, isEdit]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setState((s) => ({ ...s, error: null }));
    try {
      if (isEdit) await adminApi.put(A.attractionById(id), state.form);
      else await adminApi.post(A.attractions(), state.form);
      navigate('/admin/catalog/attractions');
    } catch (err) { setState((s) => ({ ...s, error: err })); }
    finally {
      setSaving(false);
    }
  };

  if (state.status === 'loading') return <div>Loading…</div>;
  if (state.status === 'failed') return <div className="text-red-600">{state.error?.message || 'Failed to load'}</div>;

  const f = state.form;
  return (
    <div className="relative">
      <SaveOverlay visible={saving} label={isEdit ? 'Updating attraction…' : 'Saving attraction…'} />
      <form onSubmit={save} className="max-w-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-4">
        <h1 className="text-xl font-semibold mb-4">{isEdit ? 'Edit' : 'New'} Attraction</h1>
        {state.error ? <div className="mb-3 text-sm text-red-600">{state.error?.message || 'Save failed'}</div> : null}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Title</label>
            <input className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.title} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, title: e.target.value } }))} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Slug (URL-friendly identifier)</label>
            <input className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.slug} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, slug: e.target.value } }))} placeholder="auto-generated-from-title" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Short Description (for lists/previews)</label>
            <textarea className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" rows={2} value={f.short_description} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, short_description: e.target.value } }))} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Meta Title (SEO title)</label>
            <input className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.meta_title} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, meta_title: e.target.value } }))} placeholder="Custom page title for SEO" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Base Price</label>
            <input type="number" className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.base_price} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, base_price: Number(e.target.value || 0) } }))} />
          </div>
          <div className="md:col-span-2">
            <ImageUploader label="Image" value={f.image_url} onChange={(url) => setState((s) => ({ ...s, form: { ...s.form, image_url: url } }))} folder="attractions" requiredPerm="uploads:write" />
          </div>
          <div className="md:col-span-2">
            <ImageUploader label="Desktop Image (optional)" value={f.desktop_image_url} onChange={(url) => setState((s) => ({ ...s, form: { ...s.form, desktop_image_url: url } }))} folder="attractions" requiredPerm="uploads:write" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Long Description (HTML content)</label>
            <textarea className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" rows={6} value={f.description} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, description: e.target.value } }))} />
          </div>
          <div className="flex items-center gap-2">
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