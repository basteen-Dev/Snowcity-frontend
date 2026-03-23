import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import ImageUploader from '../../components/common/ImageUploader';
import SaveOverlay from '../../components/common/SaveOverlay';
import toast from 'react-hot-toast';

export default function BannerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [state, setState] = React.useState({
    status: isEdit ? 'loading' : 'idle',
    error: null,
    form: {
      title: '',
      description: '',
      cta_text: '',
      link_url: '',
      web_image: '',
      web_image_alt: '',
      mobile_image: '',
      mobile_image_alt: '',
      active: true
    }
  });

  // Load banner if edit
  React.useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const res = await adminApi.get(`${A.banners()}/${id}`);
        const b = res?.banner || res || {};
        setState((s) => ({
          ...s, status: 'idle', form: {
            title: b.title || '',
            description: b.description || '',
            cta_text: b.cta_text || '',
            link_url: b.link_url || '',
            web_image: b.web_image || '',
            web_image_alt: b.web_image_alt || '',
            mobile_image: b.mobile_image || '',
            mobile_image_alt: b.mobile_image_alt || '',
            active: !!b.active
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
    const loadingToast = toast.loading(isEdit ? 'Updating banner...' : 'Creating banner...');
    try {
        const payload = {
          ...state.form,
          linked_attraction_id: null,
          linked_offer_id: null
        };
      if (isEdit) await adminApi.put(`${A.banners()}/${id}`, payload);
      else await adminApi.post(A.banners(), payload);

      toast.success(isEdit ? 'Banner updated successfully' : 'Banner created successfully', { id: loadingToast });
      navigate('/catalog/banners');
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
      <SaveOverlay visible={saving} label={isEdit ? 'Updating banner…' : 'Saving banner…'} />
      <form onSubmit={save} className="max-w-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
        <h1 className="text-xl font-semibold mb-4">{isEdit ? 'Edit' : 'New'} Banner</h1>
        {state.error ? (
          <div className="mb-3 text-sm text-red-600">{state.error?.message || 'Save failed'}</div>
        ) : null}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Title</label>
            <input className="w-full rounded-md border px-3 py-2 dark:bg-slate-800 dark:border-slate-600 dark:text-neutral-200" value={f.title} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, title: e.target.value } }))} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Description</label>
            <textarea rows={3} className="w-full rounded-md border px-3 py-2 dark:bg-slate-800 dark:border-slate-600 dark:text-neutral-200" value={f.description} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, description: e.target.value } }))} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">CTA Text</label>
            <input className="w-full rounded-md border px-3 py-2 dark:bg-slate-800 dark:border-slate-600 dark:text-neutral-200" value={f.cta_text} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, cta_text: e.target.value } }))} placeholder="Book Your Snow Day" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">CTA Link</label>
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
            />
          </div>

          <div className="md:col-span-2">
            <ImageUploader label="Web Image" value={f.web_image} onChange={(url) => setState((s) => ({ ...s, form: { ...s.form, web_image: url } }))} altText={f.web_image_alt} onAltChange={(alt) => setState((s) => ({ ...s, form: { ...s.form, web_image_alt: alt } }))} folder="banners" requiredPerm="uploads:write" />
          </div>
          <div className="md:col-span-2">
            <ImageUploader label="Mobile Image" value={f.mobile_image} onChange={(url) => setState((s) => ({ ...s, form: { ...s.form, mobile_image: url } }))} altText={f.mobile_image_alt} onAltChange={(alt) => setState((s) => ({ ...s, form: { ...s.form, mobile_image_alt: alt } }))} folder="banners" requiredPerm="uploads:write" />
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
