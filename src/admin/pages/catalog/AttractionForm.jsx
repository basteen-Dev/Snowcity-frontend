import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import ImageUploader from '../../components/common/ImageUploader';
import SaveOverlay from '../../components/common/SaveOverlay';
import RichText from '../../components/common/RichText';
import toast from 'react-hot-toast';

export default function AttractionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [state, setState] = React.useState({
    status: isEdit ? 'loading' : 'idle',
    error: null,
    form: { title: '', slug: '', image_url: '', image_alt: '', desktop_image_url: '', desktop_image_alt: '', base_price: 0, active: true, time_slot_enabled: true, stop_booking: false, description: '', meta_title: '', short_description: '', faq_items: [], head_schema: '', day_rule_type: 'all_days', custom_days: [] }
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
            image_alt: a.image_alt || '',
            desktop_image_url: a.desktop_image_url || '',
            desktop_image_alt: a.desktop_image_alt || '',
            base_price: a.base_price || 0,
            active: !!a.active,
            time_slot_enabled: a.time_slot_enabled !== false,
            stop_booking: !!a.stop_booking,
            description: a.description || '',
            meta_title: a.meta_title || '',
            short_description: a.short_description || '',
            faq_items: Array.isArray(a.faq_items) ? a.faq_items : [],
            head_schema: a.head_schema || '',
            day_rule_type: a.day_rule_type || 'all_days',
            custom_days: Array.isArray(a.custom_days) ? a.custom_days : [],
          }
        }));
      } catch (err) { setState((s) => ({ ...s, status: 'failed', error: err })); }
    })();
  }, [id, isEdit]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setState((s) => ({ ...s, error: null }));
    const loadingToast = toast.loading(isEdit ? 'Updating attraction...' : 'Creating attraction...');
    try {
      if (isEdit) await adminApi.put(A.attractionById(id), state.form);
      else await adminApi.post(A.attractions(), state.form);

      toast.success(isEdit ? 'Attraction updated successfully' : 'Attraction created successfully (slots generating in background)', { id: loadingToast });
      navigate('/catalog/attractions');
    } catch (err) {
      toast.error(err.message || 'Save failed', { id: loadingToast });
      setState((s) => ({ ...s, error: err }));
    }
    finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete attraction "${state.form.title}"? This cannot be undone.`)) return;
    setSaving(true);
    const loadingToast = toast.loading('Deleting attraction...');
    try {
      await adminApi.delete(A.attractionById(id));
      toast.success('Attraction deleted successfully', { id: loadingToast });
      navigate('/catalog/attractions');
    } catch (err) {
      toast.error(err.message || 'Delete failed', { id: loadingToast });
      setSaving(false);
    }
  };

  if (state.status === 'loading') return <div>Loading…</div>;
  if (state.status === 'failed') return <div className="text-red-600">{state.error?.message || 'Failed to load'}</div>;

  const f = state.form;
  return (
    <div className="relative">
      <SaveOverlay visible={saving} label={isEdit ? 'Updating attraction…' : 'Saving attraction…'} />
      <form onSubmit={save} className="max-w-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
        <h1 className="text-xl font-semibold mb-4">{isEdit ? 'Edit' : 'New'} Attraction</h1>
        {state.error ? <div className="mb-3 text-sm text-red-600">{state.error?.message || 'Save failed'}</div> : null}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Title</label>
            <input className="w-full rounded-md border px-3 py-2 dark:bg-slate-800 dark:border-slate-600 dark:text-neutral-200" value={f.title} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, title: e.target.value } }))} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Slug (URL-friendly identifier)</label>
            <input className="w-full rounded-md border px-3 py-2 dark:bg-slate-800 dark:border-slate-600 dark:text-neutral-200" value={f.slug} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, slug: e.target.value } }))} placeholder="auto-generated-from-title" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Short Description (for lists/previews)</label>
            <textarea className="w-full rounded-md border px-3 py-2 dark:bg-slate-800 dark:border-slate-600 dark:text-neutral-200" rows={2} value={f.short_description} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, short_description: e.target.value } }))} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Meta Title (SEO title)</label>
            <input className="w-full rounded-md border px-3 py-2 dark:bg-slate-800 dark:border-slate-600 dark:text-neutral-200" value={f.meta_title} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, meta_title: e.target.value } }))} placeholder="Custom page title for SEO" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Base Price</label>
            <input type="number" className="w-full rounded-md border px-3 py-2 dark:bg-slate-800 dark:border-slate-600 dark:text-neutral-200" value={f.base_price} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, base_price: Number(e.target.value || 0) } }))} />
          </div>
          <div className="md:col-span-2">
            <ImageUploader label="Image" value={f.image_url} onChange={(url) => setState((s) => ({ ...s, form: { ...s.form, image_url: url } }))} altText={f.image_alt} onAltChange={(alt) => setState((s) => ({ ...s, form: { ...s.form, image_alt: alt } }))} folder="attractions" requiredPerm="uploads:write" />
          </div>
          <div className="md:col-span-2">
            <ImageUploader label="Desktop Image (optional)" value={f.desktop_image_url} onChange={(url) => setState((s) => ({ ...s, form: { ...s.form, desktop_image_url: url } }))} altText={f.desktop_image_alt} onAltChange={(alt) => setState((s) => ({ ...s, form: { ...s.form, desktop_image_alt: alt } }))} folder="attractions" requiredPerm="uploads:write" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Long Description (HTML content)</label>
            <textarea className="w-full rounded-md border px-3 py-2 dark:bg-slate-800 dark:border-slate-600 dark:text-neutral-200" rows={6} value={f.description} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, description: e.target.value } }))} />
          </div>
          <div className="flex items-center gap-2">
            <input id="active" type="checkbox" checked={!!f.active} onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, active: e.target.checked } }))} />
            <label htmlFor="active" className="text-sm text-gray-700 dark:text-neutral-200">Active</label>
          </div>

          {/* Time Slot & Stop Booking Controls */}
          <div className="md:col-span-2 mt-2 p-4 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-neutral-800">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-neutral-200 mb-3">Booking Settings</h3>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!f.time_slot_enabled}
                  onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, time_slot_enabled: e.target.checked } }))}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-neutral-200">Enable Time Slots</span>
                <span className="text-xs text-gray-400">(uncheck for per-ticket pricing without hourly slots)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!f.stop_booking}
                  onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, stop_booking: e.target.checked } }))}
                  className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-red-600 dark:text-red-400 font-medium">Stop Booking</span>
                <span className="text-xs text-gray-400">(temporarily make this attraction unavailable for booking)</span>
              </label>
            </div>
            {!f.time_slot_enabled && (
              <p className="mt-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded">
                ⚠ Time slots disabled — customers will only select date and quantity (no hourly slots). Price is per ticket, not per hour.
              </p>
            )}
            {f.stop_booking && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded">
                🛑 Booking is stopped — this attraction will show as "Unavailable" on the public booking page.
              </p>
            )}

            {/* Day Rules */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-600">
              <label className="block text-sm font-semibold text-gray-700 dark:text-neutral-200 mb-2">Bookable Days</label>
              <select
                className="w-full rounded-md border px-3 py-2 dark:bg-slate-800 dark:border-slate-600 dark:text-neutral-200 mb-2"
                value={f.day_rule_type}
                onChange={(e) => {
                  const val = e.target.value;
                  let days = [];
                  if (val === 'weekends') days = [0, 6];
                  else if (val === 'weekdays') days = [1, 2, 3, 4, 5];
                  setState(s => ({ ...s, form: { ...s.form, day_rule_type: val, custom_days: days } }));
                }}
              >
                <option value="all_days">All Days (Default)</option>
                <option value="weekends">Weekends Only (Sat & Sun)</option>
                <option value="weekdays">Weekdays Only (Mon–Fri)</option>
                <option value="custom_days">Custom Days</option>
              </select>
              {f.day_rule_type === 'custom_days' && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayLabel, dayNum) => {
                    const selected = (f.custom_days || []).includes(dayNum);
                    return (
                      <button
                        key={dayNum}
                        type="button"
                        onClick={() => {
                          const current = f.custom_days || [];
                          const next = selected ? current.filter(d => d !== dayNum) : [...current, dayNum].sort();
                          setState(s => ({ ...s, form: { ...s.form, custom_days: next } }));
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          selected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-neutral-200 border-gray-300 dark:border-slate-500 hover:border-blue-400'
                        }`}
                      >
                        {dayLabel}
                      </button>
                    );
                  })}
                </div>
              )}
              {f.day_rule_type !== 'all_days' && (
                <p className="mt-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded">
                  📅 This attraction will only be bookable on {f.day_rule_type === 'weekends' ? 'weekends (Sat & Sun)' : f.day_rule_type === 'weekdays' ? 'weekdays (Mon–Fri)' : `selected days: ${(f.custom_days || []).map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ') || 'none'}`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">FAQ Section</h2>
              <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">Add questions and answers for FAQ structured data (helps SEO)</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const currentItems = Array.isArray(f.faq_items) ? f.faq_items : [];
                setState(s => ({ ...s, form: { ...s.form, faq_items: [...currentItems, { question: '', answer: '' }] } }));
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              + Add FAQ
            </button>
          </div>
          {(f.faq_items || []).map((faq, idx) => (
            <div key={idx} className="mb-4 p-4 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-neutral-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-neutral-300">FAQ #{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => {
                    const items = [...f.faq_items];
                    items.splice(idx, 1);
                    setState(s => ({ ...s, form: { ...s.form, faq_items: items } }));
                  }}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Question</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-neutral-100 text-sm"
                    value={faq.question || ''}
                    onChange={(e) => {
                      const items = [...f.faq_items];
                      items[idx] = { ...items[idx], question: e.target.value };
                      setState(s => ({ ...s, form: { ...s.form, faq_items: items } }));
                    }}
                    placeholder="What is the question?"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Answer</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-neutral-100 text-sm"
                    rows={3}
                    value={faq.answer || ''}
                    onChange={(e) => {
                      const items = [...f.faq_items];
                      items[idx] = { ...items[idx], answer: e.target.value };
                      setState(s => ({ ...s, form: { ...s.form, faq_items: items } }));
                    }}
                    placeholder="Provide the answer..."
                  />
                </div>
              </div>
            </div>
          ))}
          {(!f.faq_items || !f.faq_items.length) && (
            <p className="text-sm text-gray-400 dark:text-neutral-500 italic">No FAQ items yet. Click "+ Add FAQ" to get started.</p>
          )}
        </div>

        {/* Schema Markup */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-2">Custom Schema / Scripts</h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mb-4">Paste your schema markup or custom scripts here. It will be added exactly as provided to the attraction page head.</p>
          <div>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-neutral-100 text-sm"
              rows={10}
              value={f.head_schema || ''}
              onChange={(e) => setState(s => ({ ...s, form: { ...s.form, head_schema: e.target.value } }))}
              placeholder='<script type="application/ld+json">...</script>'
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-gray-200 dark:border-slate-700 pt-5">
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="rounded-md bg-gray-900 dark:bg-blue-600 text-white px-4 py-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed">{saving ? 'Saving…' : 'Save'}</button>
            <button type="button" className="rounded-md border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm text-gray-700 dark:text-neutral-300" onClick={() => navigate(-1)}>Cancel</button>
          </div>
          {isEdit && (
            <button type="button" onClick={handleDelete} disabled={saving} className="rounded-md border border-red-200 bg-red-50 text-red-600 px-4 py-2 text-sm hover:bg-red-100 transition-colors disabled:opacity-50">
              Delete Attraction
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
