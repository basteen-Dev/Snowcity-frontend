import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import ImageUploader from '../../components/common/ImageUploader';
import RawEditor from '../../components/common/RawEditor';
import RichText from '../../components/common/RichText';
import GalleryField from '../../components/common/GalleryField';
import BulkImageUploader from '../../components/common/BulkImageUploader';
import SaveOverlay from '../../components/common/SaveOverlay';

export default function BlogForm() {
  const nav = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = React.useState({
    title: '',
    slug: '',
    author: '',
    active: true,
    image_url: '',
    image_alt: '',
    editor_mode: 'rich',
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
  });
  const [err, setErr] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const row = await adminApi.get(`/api/admin/blogs/${id}`);
        setForm((f) => ({ ...f, ...row, editor_mode: row.editor_mode || 'rich' }));
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
    try {
      const payload = { ...form };
      if (isEdit) {
        await adminApi.put(`/api/admin/blogs/${id}`, payload);
      } else {
        await adminApi.post('/api/admin/blogs', payload);
      }
      nav('/admin/catalog/blogs');
    } catch (e) {
      setErr(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const preview = async () => {
    try {
      const out = await adminApi.post('/api/admin/blogs/preview', form);
      const win = window.open('', '_blank');
      if (!win) return;
      let htmlDoc = '';
      if (form.editor_mode === 'raw') {
        htmlDoc = `
<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>${form.raw_css || ''}</style>
<title>${form.title || ''}</title></head><body>
${form.raw_html || ''}
<script>${form.raw_js || ''}<\/script></body></html>`;
      } else {
        htmlDoc = `
<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${form.title || ''}</title></head><body>${form.content || ''}</body></html>`;
      }
      win.document.open(); win.document.write(htmlDoc); win.document.close();
    } catch (e) { alert(e.message || 'Preview failed'); }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 relative">
      <SaveOverlay visible={saving} label={isEdit ? 'Updating blog…' : 'Saving blog…'} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700 p-6 mb-6">
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
              <button
                type="button"
                onClick={() => nav('/admin/catalog/blogs')}
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
                  value={form.image_url}
                  onChange={(url) => onChange({ image_url: url })}
                  altText={form.image_alt}
                  onAltChange={(alt) => onChange({ image_alt: alt })}
                  folder="blogs"
                />
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
                <span className="ml-2 text-sm text-gray-700 dark:text-neutral-300">Publish immediately</span>
              </label>
            </div>
          </div>

          {/* Content Editor */}
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700 p-6">
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
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700 p-6">
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
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-4">SEO Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Meta Title
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
                  value={form.meta_title || ''}
                  onChange={(e) => onChange({ meta_title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Meta Description
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
                  value={form.meta_description || ''}
                  onChange={(e) => onChange({ meta_description: e.target.value })}
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
        </form>
      </div>
    </div>
  );
}