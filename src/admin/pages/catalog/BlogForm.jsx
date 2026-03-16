import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import ImageUploader from '../../components/common/ImageUploader';
import RawEditor from '../../components/common/RawEditor';
import RichText from '../../components/common/RichText';
import GalleryField from '../../components/common/GalleryField';
import BulkImageUploader from '../../components/common/BulkImageUploader';
import SaveOverlay from '../../components/common/SaveOverlay';
import toast from 'react-hot-toast';

export default function BlogForm() {
  const nav = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = React.useState({
    title: '',
    slug: '',
    author: '',
    author_image_url: '',
    author_description: '',
    active: true,
    featured_image: '',
    image_alt: '',
    editor_mode: 'rich',
    content: '',
    raw_html: '',
    raw_css: '',
    raw_js: '',
    seo_title: '',
    seo_description: '',
    meta_keywords: '',
    section_type: 'none',
    section_ref_id: null,
    gallery: [],
    bulk_images: [],
    faq_items: [],
    head_schema: '',
  });
  const [err, setErr] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const row = await adminApi.get(`/api/parkpanel/blogs/${id}`);
        setForm((f) => ({
          ...f,
          ...row,
          editor_mode: row.editor_mode || 'rich',
          faq_items: Array.isArray(row.faq_items) ? row.faq_items : [],
          head_schema: typeof row.head_schema === 'object' ? JSON.stringify(row.head_schema, null, 2) : (row.head_schema || ''),
        }));
      } catch (e) {
        setErr(e.message || 'Failed to load blog');
      }
    })();
  }, [id, isEdit]);

  const onChange = (patch) => setForm((f) => ({ ...f, ...patch }));

  const save = async (e) => {
    e.preventDefault();
    setErr('');
    setSaving(true);
    const loadingToast = toast.loading(isEdit ? 'Updating blog...' : 'Creating blog...');
    try {
      const payload = { ...form };
      // head_schema is raw string
      if (isEdit) {
        await adminApi.put(`/api/parkpanel/blogs/${id}`, payload);
      } else {
        await adminApi.post('/api/parkpanel/blogs', payload);
      }
      toast.success(isEdit ? 'Blog updated successfully' : 'Blog created successfully', { id: loadingToast });
      nav('/parkpanel/catalog/blogs');
    } catch (e) {
      toast.error(e.message || 'Save failed', { id: loadingToast });
      setErr(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const preview = async () => {
    try {
      const payload = { ...form };
      // head_schema is raw string

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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-800 relative">
      <SaveOverlay visible={saving} label={isEdit ? 'Updating blog…' : 'Saving blog…'} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">
                {isEdit ? 'Edit Blog Post' : 'Create New Blog Post'}
              </h1>
              <p className="text-gray-600 dark:text-neutral-400 mt-1">
                {isEdit ? 'Update your blog post content and settings' : 'Create engaging content for your audience'}
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
                  className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-2 text-sm"
                >
                  View Live
                </a>
              )}
              <button
                type="button"
                onClick={() => nav('/parkpanel/catalog/blogs')}
                className="px-4 py-2 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-300 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="blog-form"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save Blog'}
              </button>
            </div>
          </div>
        </div>

        <form id="blog-form" onSubmit={save} className="space-y-6">
          {/* Basic Info */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600 p-6">
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
                  value={form.title ?? ''}
                  onChange={(e) => onChange({ title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Slug *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
                  value={form.slug ?? ''}
                  onChange={(e) => onChange({ slug: e.target.value })}
                  placeholder="my-awesome-blog-post"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-neutral-400">
                  Live URL: <span className="text-blue-600 dark:text-blue-400">{window.location.origin}/{form.slug || 'slug'}</span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Author
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
                  value={form.author ?? ''}
                  onChange={(e) => onChange({ author: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Featured Image
                </label>
                <ImageUploader
                  value={form.featured_image}
                  onChange={(url) => onChange({ featured_image: url })}
                  altText={form.image_alt}
                  onAltChange={(alt) => onChange({ image_alt: alt })}
                  folder="blogs"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-100 dark:border-slate-600">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Author Profile Image
                </label>
                <ImageUploader
                  value={form.author_image_url}
                  onChange={(url) => onChange({ author_image_url: url })}
                  folder="authors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Author Bio / Description
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
                  rows={4}
                  value={form.author_description || ''}
                  onChange={(e) => onChange({ author_description: e.target.value })}
                  placeholder="A short bio about the author..."
                />
              </div>
            </div>
            <div className="mt-6">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={!!form.active}
                  onChange={(e) => onChange({ active: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-neutral-300">Publish immediately</span>
              </label>
            </div>
          </div>

          {/* Content Editor */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-4">Content</h2>
            <div className="mb-4">
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    checked={form.editor_mode === 'rich'}
                    onChange={() => onChange({ editor_mode: 'rich' })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-neutral-300">Rich Text Editor</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    checked={form.editor_mode === 'raw'}
                    onChange={() => onChange({ editor_mode: 'raw' })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-neutral-300">HTML/CSS/JS Editor</span>
                </label>
              </div>
            </div>

            {form.editor_mode === 'raw' ? (
              <RawEditor
                value={{ raw_html: form.raw_html, raw_css: form.raw_css, raw_js: form.raw_js }}
                onChange={(v) => onChange(v)}
              />
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                    Content
                  </label>
                  <RichText
                    value={form.content || ''}
                    onChange={(v) => onChange({ content: v })}
                    gallery={form.bulk_images && form.bulk_images.length ? form.bulk_images : form.gallery}
                  />
                </div>
                <GalleryField
                  label="Content Gallery"
                  helper="Upload multiple images to use within your blog post content."
                  value={form.gallery || []}
                  onChange={(gallery) => onChange({ gallery })}
                />
              </div>
            )}
          </div>

          {/* Bulk Image Upload */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-4">Bulk Image Upload</h2>
            <BulkImageUploader
              label="Upload Multiple Images"
              value={form.bulk_images || []}
              onChange={(urls) => onChange({ bulk_images: urls })}
              folder="blogs"
              maxFiles={20}
            />
            <p className="text-sm text-gray-600 dark:text-neutral-400 mt-2">
              Upload multiple images at once. These images will be available for use in your content editor.
            </p>
          </div>

          {/* SEO Settings */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-4">SEO Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Meta Title
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
                  value={form.seo_title || ''}
                  onChange={(e) => onChange({ seo_title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Meta Description
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
                  value={form.seo_description || ''}
                  onChange={(e) => onChange({ seo_description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Meta Keywords
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
                  value={form.meta_keywords || ''}
                  onChange={(e) => onChange({ meta_keywords: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600 p-6">
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
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-2">Custom Schema / Scripts</h2>
            <p className="text-sm text-gray-500 dark:text-neutral-400 mb-4">Paste your schema markup or custom scripts here. It will be added exactly as provided to the blog post head.</p>
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
        </form>
      </div>
    </div>
  );
}
