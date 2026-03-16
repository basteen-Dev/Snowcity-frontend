import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import RawEditor from '../../components/common/RawEditor';
import RichText from '../../components/common/RichText';
import GalleryField from '../../components/common/GalleryField';
import BulkImageUploader from '../../components/common/BulkImageUploader';
import ImageUploader from '../../components/common/ImageUploader';
import useCatalogTargets from '../../hooks/useCatalogTargets';
import SaveOverlay from '../../components/common/SaveOverlay';
import toast from 'react-hot-toast';

const SECTION_TARGETS = [
  { key: 'section_more_info', label: 'More Info Accordion (Home page)' },
  { key: 'section_attraction', label: 'Attraction Detail Page' },
  { key: 'section_combo', label: 'Combo Detail Page' },
];

export default function SectionForm() {
  const nav = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = React.useState({
    title: '',
    active: true,
    editor_mode: 'rich',
    content: '',
    raw_html: '',
    raw_css: '',
    raw_js: '',
    placement: 'section_more_info',
    placement_ref_id: null,
    gallery: [],
    bulk_images: [],
    faq_items: [],
    head_schema: '',
    nav_order: 0,
  });
  const [err, setErr] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const row = await adminApi.get(`/api/parkpanel/pages/${id}`);
        setForm((f) => ({
          ...f,
          ...row,
          editor_mode: row.editor_mode || 'rich',
          placement: row.placement || 'section_more_info',
          placement_ref_id: row.placement_ref_id || null,
          faq_items: Array.isArray(row.faq_items) ? row.faq_items : [],
          head_schema: typeof row.head_schema === 'object' ? JSON.stringify(row.head_schema, null, 2) : (row.head_schema || ''),
          nav_order: row.nav_order ?? 0,
        }));
      } catch (e) {
        setErr(e.message || 'Failed to load section');
      }
    })();
  }, [id, isEdit]);

  const onChange = (patch) => setForm((f) => ({ ...f, ...patch }));

  const { attractions = [], combos = [], status: targetsStatus } = useCatalogTargets();
  const attractionOptions = React.useMemo(
    () => attractions.map((a) => ({ value: a.attraction_id || a.id, label: a.title || a.name || `Attraction #${a.attraction_id || a.id}` })),
    [attractions]
  );
  const comboOptions = React.useMemo(
    () => combos.map((c) => ({ value: c.combo_id || c.id, label: c.title || c.name || `Combo #${c.combo_id || c.id}` })),
    [combos]
  );

  const needsRef = form.placement === 'section_attraction' || form.placement === 'section_combo';

  const save = async (e) => {
    e.preventDefault();
    setErr('');
    setSaving(true);
    const loadingToast = toast.loading(isEdit ? 'Updating section...' : 'Creating section...');
    try {
      const normalizeId = (val) => {
        const num = Number(val);
        return Number.isFinite(num) ? num : null;
      };

      const payload = {
        title: form.title,
        slug: null,
        active: form.active,
        editor_mode: form.editor_mode,
        content: form.content || '',
        raw_html: form.raw_html || '',
        raw_css: form.raw_css || '',
        raw_js: form.raw_js || '',
        placement: form.placement,
        placement_ref_id: needsRef ? normalizeId(form.placement_ref_id) : null,
        gallery: form.gallery || [],
        nav_group: null,
        nav_order: Number.isFinite(Number(form.nav_order)) ? Number(form.nav_order) : 0,
        section_type: 'none',
        section_ref_id: null,
        meta_title: null,
        meta_description: null,
        meta_keywords: null,
        faq_items: form.faq_items || [],
        head_schema: form.head_schema || '',
      };

      if (isEdit) {
        await adminApi.put(`/api/parkpanel/pages/${id}`, payload);
      } else {
        await adminApi.post('/api/parkpanel/pages', payload);
      }
      toast.success(isEdit ? 'Section updated' : 'Section created', { id: loadingToast });
      nav('/parkpanel/catalog/sections');
    } catch (e) {
      toast.error(e.message || 'Save failed', { id: loadingToast });
      setErr(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-800 relative">
      <SaveOverlay visible={saving} label={isEdit ? 'Updating section…' : 'Saving section…'} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">
                {isEdit ? 'Edit Section' : 'Create New Section'}
              </h1>
              <p className="text-gray-600 dark:text-neutral-400 mt-1">
                Sections display content directly in the accordion on the home page or on attraction/combo detail pages.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => nav('/parkpanel/catalog/sections')}
                className="px-4 py-2 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-300 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="section-form"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save Section'}
              </button>
            </div>
          </div>
        </div>

        {err && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm">{err}</div>
        )}

        <form id="section-form" onSubmit={save} className="space-y-6">
          {/* Title & Target */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-4">Section Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Section Title *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
                  value={form.title}
                  onChange={(e) => onChange({ title: e.target.value })}
                  placeholder="e.g. Park Highlights, Safety Info..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Display In *
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
                  value={form.placement}
                  onChange={(e) => onChange({ placement: e.target.value, placement_ref_id: null })}
                >
                  {SECTION_TARGETS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </div>
            </div>

            {/* Attraction/Combo selector when needed */}
            {needsRef && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  {form.placement === 'section_attraction' ? 'Select Attraction' : 'Select Combo'}
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-neutral-100"
                  value={form.placement_ref_id || ''}
                  onChange={(e) => onChange({ placement_ref_id: e.target.value ? Number(e.target.value) : null })}
                  disabled={targetsStatus === 'loading'}
                >
                  <option value="">{targetsStatus === 'loading' ? 'Loading…' : 'Choose...'}</option>
                  {(form.placement === 'section_attraction' ? attractionOptions : comboOptions).map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="mt-4 flex items-center gap-6">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={!!form.active}
                  onChange={(e) => onChange({ active: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-neutral-300">Active</span>
              </label>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700 dark:text-neutral-300">Order:</label>
                <input
                  type="number"
                  className="w-20 px-2 py-1 border border-gray-300 dark:border-neutral-600 rounded-lg dark:bg-neutral-700 dark:text-neutral-100 text-sm"
                  value={form.nav_order ?? 0}
                  onChange={(e) => onChange({ nav_order: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          {/* Editor Mode Toggle */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600 p-6">
            <div className="flex items-center gap-3 text-sm">
              <label className="inline-flex items-center gap-2">
                <input type="radio" checked={form.editor_mode === 'rich'} onChange={() => onChange({ editor_mode: 'rich' })} />
                Visual editor
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="radio" checked={form.editor_mode === 'raw'} onChange={() => onChange({ editor_mode: 'raw' })} />
                Raw (HTML/CSS/JS)
              </label>
            </div>
          </div>

          {/* Content Editor */}
          {form.editor_mode === 'raw' ? (
            <RawEditor
              value={{ raw_html: form.raw_html, raw_css: form.raw_css, raw_js: form.raw_js }}
              onChange={(v) => onChange(v)}
            />
          ) : (
            <>
              <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600 p-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Content</label>
                <RichText
                  value={form.content || ''}
                  onChange={(v) => onChange({ content: v })}
                  gallery={form.bulk_images && form.bulk_images.length ? form.bulk_images : form.gallery}
                />
              </div>
              <GalleryField
                label="Content gallery"
                helper="Upload multiple inline assets to reuse inside the visual editor."
                value={form.gallery || []}
                onChange={(gallery) => onChange({ gallery })}
              />
            </>
          )}
          
          {/* Bulk Image Upload */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-4">Bulk Image Upload</h2>
            <BulkImageUploader
              label="Upload Multiple Images"
              value={form.bulk_images || []}
              onChange={(urls) => onChange({ bulk_images: urls })}
              folder="sections"
              maxFiles={20}
            />
            <p className="text-sm text-gray-600 dark:text-neutral-400 mt-2">
              Upload multiple images at once. These images will be available for use in your visual editor.
            </p>
          </div>

          {/* FAQ Section */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">FAQ Section</h2>
                <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">Add questions and answers for display within this section</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const currentItems = Array.isArray(form.faq_items) ? form.faq_items : [];
                  onChange({ faq_items: [...currentItems, { question: '', answer: '' }] });
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                + Add FAQ
              </button>
            </div>
            {(form.faq_items || []).map((faq, idx) => (
              <div key={idx} className="mb-4 p-4 border border-gray-200 dark:border-neutral-600 rounded-lg bg-gray-50 dark:bg-neutral-700/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-neutral-300">FAQ #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const items = [...form.faq_items];
                      items.splice(idx, 1);
                      onChange({ faq_items: items });
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
                      className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-neutral-100 text-sm"
                      value={faq.question || ''}
                      onChange={(e) => {
                        const items = [...form.faq_items];
                        items[idx] = { ...items[idx], question: e.target.value };
                        onChange({ faq_items: items });
                      }}
                      placeholder="What is the question?"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Answer</label>
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-neutral-100 text-sm"
                      rows={3}
                      value={faq.answer || ''}
                      onChange={(e) => {
                        const items = [...form.faq_items];
                        items[idx] = { ...items[idx], answer: e.target.value };
                        onChange({ faq_items: items });
                      }}
                      placeholder="Provide the answer..."
                    />
                  </div>
                </div>
              </div>
            ))}
            {(!form.faq_items || !form.faq_items.length) && (
              <p className="text-sm text-gray-400 dark:text-neutral-500 italic">No FAQ items yet. Click "+ Add FAQ" to get started.</p>
            )}
          </div>

          {/* Schema Markup */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-2">Custom Schema / Scripts</h2>
            <p className="text-sm text-gray-500 dark:text-neutral-400 mb-4">Paste your schema markup or custom scripts here. It will be added to the page head when this section is active.</p>
            <div>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-neutral-100 text-sm"
                rows={10}
                value={form.head_schema || ''}
                onChange={(e) => onChange({ head_schema: e.target.value })}
                placeholder='<script type="application/ld+json">...</script>'
              />
            </div>
          </div>

          {/* Save */}
          <div className="flex gap-2 pb-10">
            <button type="submit" className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50" disabled={saving}>
              {saving ? 'Saving…' : 'Save Section'}
            </button>
            <button className="px-4 py-2 rounded-lg border border-gray-300 dark:border-neutral-600" type="button" onClick={() => nav('/parkpanel/catalog/sections')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
