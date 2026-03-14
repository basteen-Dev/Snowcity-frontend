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

const NAV_GROUPS = [
  { key: '', label: 'No nav' },
  { key: 'visitors_guide', label: 'Visitors Guide' },
];

const PLACEMENTS = [
  { key: 'none', label: 'No special placement' },
  { key: 'home_bottom', label: 'Home - Bottom section' },
  { key: 'more_info', label: 'Home - More info accordion' },
  { key: 'attraction_details', label: 'Attraction - Details section (select attraction)' },
];

export default function PageForm() {
  const nav = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = React.useState({
    title: '',
    slug: '',
    active: true,
    editor_mode: 'rich', // 'rich' | 'raw'
    content: '',
    raw_html: '',
    raw_css: '',
    raw_js: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    section_type: 'none',
    section_ref_id: null,
    gallery: [],
    bulk_images: [],
    nav_group: '',
    nav_order: 0,
    placement: 'none',
    placement_ref_id: null,
    hero_image: '',
    hero_image_alt: '',
    faq_items: [],
    head_schema: '',
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
          nav_group: row.nav_group || '',
          nav_order: row.nav_order ?? 0,
          placement: row.placement || 'none',
          placement_ref_id: row.placement_ref_id || null,
          faq_items: Array.isArray(row.faq_items) ? row.faq_items : [],
          head_schema: typeof row.head_schema === 'object' ? JSON.stringify(row.head_schema, null, 2) : (row.head_schema || ''),
        }));
      } catch (e) {
        setErr(e.message || 'Failed to load page');
      }
    })();
  }, [id, isEdit]);

  const onChange = (patch) => setForm((f) => ({ ...f, ...patch }));

  const save = async (e) => {
    e.preventDefault();
    setErr('');
    setSaving(true);
    const loadingToast = toast.loading(isEdit ? 'Updating page...' : 'Creating page...');
    try {
      const normalizeId = (val) => {
        const num = Number(val);
        return Number.isFinite(num) ? num : null;
      };

      const payload = { ...form };
      if (payload.placement === 'more_info' && !payload.slug) {
        payload.slug = null;
      }
      payload.section_type = form.section_type || 'none';
      payload.section_ref_id = payload.section_type === 'none' ? null : normalizeId(form.section_ref_id);
      payload.placement_ref_id = form.placement === 'attraction_details' ? normalizeId(form.placement_ref_id) : null;
      payload.nav_order = Number.isFinite(Number(form.nav_order)) ? Number(form.nav_order) : 0;
      // Parse schema JSON fields
      payload.nav_order = Number.isFinite(Number(form.nav_order)) ? Number(form.nav_order) : 0;
      if (payload.editor_mode === 'raw') {
        // Ensure raw fields present; content not needed
        payload.content = payload.content || '';
      }
      if (isEdit) {
        await adminApi.put(`/api/parkpanel/pages/${id}`, payload);
      } else {
        await adminApi.post('/api/parkpanel/pages', payload);
      }
      toast.success(isEdit ? 'Page updated successfully' : 'Page created successfully', { id: loadingToast });
      nav('/parkpanel/catalog/pages');
    } catch (e) {
      toast.error(e.message || 'Save failed', { id: loadingToast });
      setErr(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const { attractions = [], combos = [], status: targetsStatus } = useCatalogTargets();
  const attractionOptions = React.useMemo(
    () => attractions.map((a) => ({ value: a.attraction_id || a.id, label: a.title || a.name || `Attraction #${a.attraction_id || a.id}` })),
    [attractions]
  );
  const comboOptions = React.useMemo(
    () => combos.map((c) => ({ value: c.combo_id || c.id, label: c.title || c.name || `Combo #${c.combo_id || c.id}` })),
    [combos]
  );

  const preview = async () => {
    try {
      const payload = { ...form };
      // Custom schema is raw string

      const apiBase = adminApi.defaults.baseURL || '';
      const rootBase = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;
      const response = await fetch(`${rootBase}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminApi.defaults.headers.common['Authorization']?.split(' ')[1] || ''}`
        },
        body: JSON.stringify(payload)
      });

      const htmlDoc = await response.text();
      const win = window.open('', '_blank');
      if (win) {
        win.document.open();
        win.document.write(htmlDoc);
        win.document.close();
      }
    } catch (e) {
      alert(e.message || 'Preview failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 relative">
      <SaveOverlay visible={saving} label={isEdit ? 'Updating page…' : 'Saving page…'} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">
                {isEdit ? 'Edit Page' : 'Create New Page'}
              </h1>
              <p className="text-gray-600 dark:text-neutral-400 mt-1">
                {isEdit ? 'Update your page content and settings' : 'Create custom pages for your website'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={preview}
                className="px-4 py-2 bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors"
              >
                Preview
              </button>
              {isEdit && (
                <a
                  href={`${window.location.origin}/${form.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-2"
                >
                  View Live
                </a>
              )}
              <button
                type="button"
                onClick={() => nav('/parkpanel/catalog/pages')}
                className="px-4 py-2 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-300 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="page-form"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save Page'}
              </button>
            </div>
          </div>
        </div>

        <form id="page-form" onSubmit={save}>
          {/* Basic Info */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
                  value={form.title}
                  onChange={(e) => onChange({ title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Slug {form.placement === 'more_info' ? '' : '*'}
                </label>
                <input
                  type="text"
                  required={form.placement !== 'more_info'}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
                  value={form.slug || ''}
                  onChange={(e) => onChange({ slug: e.target.value })}
                  placeholder={form.placement === 'more_info' ? 'Optional for home accordion' : 'my-custom-page'}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-neutral-400">
                  Live URL: <span className="text-blue-600 dark:text-blue-400">{window.location.origin}/{form.slug || (form.placement === 'more_info' ? 'no-slug' : 'slug')}</span>
                </p>
              </div>
            </div>
            <div className="mt-4">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={!!form.active}
                  onChange={(e) => onChange({ active: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-neutral-300">Publish page</span>
              </label>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Hero Image
                </label>
                <div className="max-w-[200px]">
                  <ImageUploader
                    value={form.hero_image}
                    onChange={(url) => onChange({ hero_image: url })}
                    folder="pages"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Hero Image Alt Text
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
                  value={form.hero_image_alt || ''}
                  onChange={(e) => onChange({ hero_image_alt: e.target.value })}
                  placeholder="Alt text for hero image"
                />
              </div>
            </div>
          </div>

          {/* Navigation & Placement */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-4">Navigation & Placement</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Navigation Group
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
                  value={form.nav_group || ''}
                  onChange={(e) => onChange({ nav_group: e.target.value })}
                >
                  {NAV_GROUPS.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Navigation Order
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
                  value={form.nav_order ?? 0}
                  onChange={(e) => onChange({ nav_order: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Special Placement
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
                  value={form.placement}
                  onChange={(e) => onChange({ placement: e.target.value })}
                >
                  {PLACEMENTS.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Section Type
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
                  value={form.section_type || 'none'}
                  onChange={(e) => onChange({ section_type: e.target.value, section_ref_id: null })}
                >
                  <option value="none">None</option>
                  <option value="attraction">Attraction</option>
                  <option value="combo">Combo</option>
                </select>
              </div>

              {form.section_type !== 'none' && (
                <div>
                  <label className="block text-sm">{form.section_type === 'attraction' ? 'Select attraction' : 'Select combo'}</label>
                  <select
                    className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700"
                    value={form.section_ref_id || ''}
                    onChange={(e) => onChange({ section_ref_id: e.target.value ? Number(e.target.value) : null })}
                    disabled={targetsStatus === 'loading'}
                  >
                    <option value="">{targetsStatus === 'loading' ? 'Loading…' : 'Choose option'}</option>
                    {(form.section_type === 'attraction' ? attractionOptions : comboOptions).map((opt) => (
                      <option key={`section-${opt.value}`} value={opt.value || ''}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {form.placement === 'attraction_details' && (
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700 p-6">
              <label className="block text-sm">Attraction (for placement)</label>
              <select
                className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700"
                value={form.placement_ref_id || ''}
                onChange={(e) => onChange({ placement_ref_id: e.target.value ? Number(e.target.value) : null })}
                disabled={targetsStatus === 'loading'}
              >
                <option value="">{targetsStatus === 'loading' ? 'Loading…' : 'Select attraction'}</option>
                {attractionOptions.map((opt) => (
                  <option key={`placement-${opt.value}`} value={opt.value || ''}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700 p-6">
            <div className="flex items-center gap-3 text-sm">
              <label className="inline-flex items-center gap-2">
                <input type="radio" checked={form.editor_mode === 'rich'} onChange={() => onChange({ editor_mode: 'rich' })} />
                Visual editor
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="radio" checked={form.editor_mode === 'raw'} onChange={() => onChange({ editor_mode: 'raw' })} />
                Raw (HTML/CSS/JS)
              </label>
              <button type="button" className="ml-auto px-3 py-1 rounded-md border text-sm" onClick={preview}>
                Preview
              </button>
            </div>
          </div>

          {form.editor_mode === 'raw' ? (
            <RawEditor
              value={{ raw_html: form.raw_html, raw_css: form.raw_css, raw_js: form.raw_js }}
              onChange={(v) => onChange(v)}
            />
          ) : (
            <>
              <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700 p-6">
                <label className="block text-sm">Content</label>
                <RichText
                  value={form.content || ''}
                  onChange={(v) => onChange({ content: v })}
                  gallery={form.bulk_images && form.bulk_images.length ? form.bulk_images : form.gallery}
                />
              </div>
              <GalleryField
                label="Content gallery"
                helper="Upload multiple inline assets to reuse inside the visual editor or elsewhere in the page."
                value={form.gallery || []}
                onChange={(gallery) => onChange({ gallery })}
              />
            </>
          )}

          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700 p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm">Meta title</label>
                <input className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700"
                  value={form.meta_title || ''} onChange={(e) => onChange({ meta_title: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm">Meta description</label>
                <input className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700"
                  value={form.meta_description || ''} onChange={(e) => onChange({ meta_description: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm">Meta keywords</label>
                <input className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700"
                  value={form.meta_keywords || ''} onChange={(e) => onChange({ meta_keywords: e.target.value })} />
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">FAQ Section</h2>
                <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">Add questions and answers for FAQPage structured data (helps SEO)</p>
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
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-2">Custom Schema / Scripts</h2>
            <p className="text-sm text-gray-500 dark:text-neutral-400 mb-4">Paste your schema markup or custom scripts here. It will be added exactly as provided to the page head.</p>
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

          <div className="flex gap-2">
            <button type="submit" className="px-3 py-2 rounded-md bg-gray-900 text-white" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button className="px-3 py-2 rounded-md border" type="button" onClick={() => nav('/parkpanel/catalog/pages')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
