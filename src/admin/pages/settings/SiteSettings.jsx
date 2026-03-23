import React from 'react';
import adminApi from '../../services/adminApi';
import SaveOverlay from '../../components/common/SaveOverlay';
import toast from 'react-hot-toast';
import { Trash2, Plus, Save } from 'lucide-react';

export default function SiteSettings() {
    const [state, setState] = React.useState({
        status: 'loading',
        error: null,
        form: {
            head_schema: '',
            body_schema: '',
            footer_schema: '',
            organization_schema: '',
        }
    });
    const [saving, setSaving] = React.useState(false);

    // Page SEO state
    const [pageSeoList, setPageSeoList] = React.useState([]);
    const [seoLoading, setSeoLoading] = React.useState(true);
    const [seoForm, setSeoForm] = React.useState({ slug: '', meta_title: '', meta_description: '' });
    const [editingId, setEditingId] = React.useState(null);
    const [seoSaving, setSeoSaving] = React.useState(false);

    const preview = async () => {
        try {
            const payload = {
                title: 'Site Settings Preview',
                meta_title: 'Site Settings Preview',
                meta_description: 'Preview of global SEO scripts and schemas',
                content: '<p style="text-align:center;padding:40px;color:#666;">This is a preview of your global SEO settings.<br/>Inspect the page source to verify injected scripts and schemas.</p>',
                head_schema: state.form.head_schema || '',
                body_schema: state.form.body_schema || '',
                footer_schema: state.form.footer_schema || '',
                organization_schema: state.form.organization_schema || '',
            };

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
            toast.error(e.message || 'Preview failed');
        }
    };

    // Load global SEO settings
    React.useEffect(() => {
        (async () => {
            try {
                const res = await adminApi.get('/api/parkpanel/site-settings/seo');
                // Ensure any parsed JSON objects are stringified back for display in textareas
                const toStr = (v) => {
                    if (v == null || v === '') return '';
                    if (typeof v === 'object') return JSON.stringify(v, null, 2);
                    return String(v);
                };
                setState((s) => ({
                    ...s,
                    status: 'idle',
                    form: {
                        head_schema: toStr(res.head_schema),
                        body_schema: toStr(res.body_schema),
                        footer_schema: toStr(res.footer_schema),
                        organization_schema: toStr(res.organization_schema),
                    }
                }));
            } catch (err) {
                setState((s) => ({ ...s, status: 'failed', error: err }));
            }
        })();
    }, []);

    // Load page SEO list
    const loadPageSeo = React.useCallback(async () => {
        setSeoLoading(true);
        try {
            const res = await adminApi.get('/api/parkpanel/site-settings/page-seo');
            setPageSeoList(res?.data || []);
        } catch (err) {
            console.error('Failed to load page SEO:', err);
        } finally {
            setSeoLoading(false);
        }
    }, []);

    React.useEffect(() => { loadPageSeo(); }, [loadPageSeo]);

    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        setState((s) => ({ ...s, error: null }));
        const loadingToast = toast.loading('Saving site settings...');
        try {
            await adminApi.put('/api/parkpanel/site-settings/seo', state.form);
            toast.success('Site settings updated successfully', { id: loadingToast });
        } catch (err) {
            toast.error(err.message || 'Save failed', { id: loadingToast });
            setState((s) => ({ ...s, error: err }));
        } finally {
            setSaving(false);
        }
    };

    // Page SEO CRUD handlers
    const handleSeoEdit = (item) => {
        setEditingId(item.id);
        setSeoForm({
            slug: item.slug || '',
            meta_title: item.meta_title || '',
            meta_description: item.meta_description || '',
        });
    };

    const handleSeoCancel = () => {
        setEditingId(null);
        setSeoForm({ slug: '', meta_title: '', meta_description: '' });
    };

    const handleSeoSave = async () => {
        if (!seoForm.slug.trim()) {
            toast.error('Slug is required');
            return;
        }
        setSeoSaving(true);
        const loadingToast = toast.loading(editingId ? 'Updating...' : 'Adding...');
        try {
            await adminApi.post('/api/parkpanel/site-settings/page-seo', {
                slug: seoForm.slug.trim().toLowerCase(),
                meta_title: seoForm.meta_title.trim() || null,
                meta_description: seoForm.meta_description.trim() || null,
            });
            toast.success(editingId ? 'Updated successfully' : 'Added successfully', { id: loadingToast });
            handleSeoCancel();
            await loadPageSeo();
        } catch (err) {
            toast.error(err.message || 'Save failed', { id: loadingToast });
        } finally {
            setSeoSaving(false);
        }
    };

    const handleSeoDelete = async (id) => {
        if (!window.confirm('Delete this page SEO entry?')) return;
        const loadingToast = toast.loading('Deleting...');
        try {
            await adminApi.delete(`/api/parkpanel/site-settings/page-seo/${id}`);
            toast.success('Deleted', { id: loadingToast });
            await loadPageSeo();
        } catch (err) {
            toast.error(err.message || 'Delete failed', { id: loadingToast });
        }
    };

    if (state.status === 'loading') return <div>Loading settings…</div>;
    if (state.status === 'failed') return <div className="text-red-600">{state.error?.message || 'Failed to load'}</div>;

    const f = state.form;

    return (
        <div className="relative">
            <SaveOverlay visible={saving} label="Saving settings…" />
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Site Settings (SEO)</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">Global scripts, schemas, and per-page meta title & description management.</p>
                </div>
                <button
                    type="button"
                    onClick={preview}
                    className="px-4 py-2 bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors text-sm font-medium"
                >
                    Preview
                </button>
            </div>

            {/* ===== Page SEO Management Section ===== */}
            <div className="max-w-4xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 shadow-sm mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">Page Meta Titles & Descriptions</h2>
                        <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">
                            Manage SEO meta title and description per page slug. The <strong>"default"</strong> entry applies to pages without a custom entry.
                        </p>
                    </div>
                </div>

                {/* Add / Edit Form */}
                <div className="mb-6 p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-slate-600">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-neutral-300 mb-3">
                        {editingId ? '✏️ Edit Entry' : '➕ Add New Entry'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Slug / Page Path</label>
                            <input
                                type="text"
                                className="w-full rounded-md border px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-neutral-200"
                                value={seoForm.slug}
                                onChange={(e) => setSeoForm(f => ({ ...f, slug: e.target.value }))}
                                placeholder="e.g. default, tickets-offers, about-us"
                                disabled={editingId && seoForm.slug === 'default'}
                            />
                            <p className="text-xs text-gray-400 mt-1">Use "default" for the root/fallback entry</p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Meta Title</label>
                            <input
                                type="text"
                                className="w-full rounded-md border px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-neutral-200"
                                value={seoForm.meta_title}
                                onChange={(e) => setSeoForm(f => ({ ...f, meta_title: e.target.value }))}
                                placeholder="Page title for search engines"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-neutral-400 mb-1">Meta Description</label>
                            <input
                                type="text"
                                className="w-full rounded-md border px-3 py-2 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-neutral-200"
                                value={seoForm.meta_description}
                                onChange={(e) => setSeoForm(f => ({ ...f, meta_description: e.target.value }))}
                                placeholder="Page description for search engines"
                            />
                        </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                        <button
                            type="button"
                            onClick={handleSeoSave}
                            disabled={seoSaving || !seoForm.slug.trim()}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 transition-colors"
                        >
                            <Save className="w-3.5 h-3.5" />
                            {editingId ? 'Update' : 'Add'}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                onClick={handleSeoCancel}
                                className="px-4 py-2 bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 rounded-lg hover:bg-gray-300 text-sm transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </div>

                {/* Table of existing entries */}
                {seoLoading ? (
                    <p className="text-sm text-gray-400">Loading page SEO entries…</p>
                ) : pageSeoList.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">No page SEO entries yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-slate-600">
                                    <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-neutral-300">Slug</th>
                                    <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-neutral-300">Meta Title</th>
                                    <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-neutral-300">Meta Description</th>
                                    <th className="text-right py-2 px-3 font-semibold text-gray-700 dark:text-neutral-300 w-28">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageSeoList.map((item) => (
                                    <tr key={item.id} className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-2.5 px-3">
                                            <code className="text-xs bg-gray-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded text-blue-700 dark:text-blue-300">
                                                {item.slug === 'default' ? '🏠 default' : `/${item.slug}`}
                                            </code>
                                        </td>
                                        <td className="py-2.5 px-3 text-gray-700 dark:text-neutral-300 max-w-[200px] truncate">
                                            {item.meta_title || <span className="text-gray-400 italic">—</span>}
                                        </td>
                                        <td className="py-2.5 px-3 text-gray-600 dark:text-neutral-400 max-w-[250px] truncate">
                                            {item.meta_description || <span className="text-gray-400 italic">—</span>}
                                        </td>
                                        <td className="py-2.5 px-3 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSeoEdit(item)}
                                                    className="px-2.5 py-1 text-xs bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 rounded hover:bg-gray-200 transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                {item.slug !== 'default' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSeoDelete(item.id)}
                                                        className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ===== Global Scripts / Schema Section ===== */}
            <form onSubmit={save} className="max-w-4xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-4">Global Scripts & Schemas</h2>
                {state.error ? <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">{state.error?.message || 'Save failed'}</div> : null}

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-800 dark:text-neutral-200 mb-2">
                            Organization Schema (JSON-LD)
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                            This schema is injected as a <code>&lt;script type="application/ld+json"&gt;</code> in the document head. Do not include the <code>&lt;script&gt;</code> tags yourself.
                        </p>
                        <textarea
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50 dark:bg-slate-900 dark:border-slate-600 dark:text-neutral-200 focus:ring-2 focus:ring-blue-500"
                            rows={8}
                            value={f.organization_schema}
                            onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, organization_schema: e.target.value } }))}
                            placeholder={"{\n  \"@context\": \"https://schema.org\",\n  \"@type\": \"Organization\",\n  \"name\": \"Snowcity\"\n}"}
                        />
                    </div>

                    <div className="h-px bg-gray-200 dark:bg-neutral-800 my-6"></div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-800 dark:text-neutral-200 mb-2">
                            Head Scripts / Meta Tags (Injected inside <code>&lt;head&gt;</code>)
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                            Raw HTML for Google Analytics, Meta Pixel, or other global meta tags. Must include <code>&lt;script&gt;</code> or <code>&lt;meta&gt;</code> tags.
                        </p>
                        <textarea
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50 dark:bg-slate-900 dark:border-slate-600 dark:text-neutral-200 focus:ring-2 focus:ring-blue-500"
                            rows={6}
                            value={f.head_schema}
                            onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, head_schema: e.target.value } }))}
                            placeholder={"<!-- Google Analytics -->\n<script async src=\"https://www.googletagmanager.com/gtag/js?id=G-XXXXX\"></script>"}
                        />
                    </div>

                    <div className="h-px bg-gray-200 dark:bg-neutral-800 my-6"></div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-800 dark:text-neutral-200 mb-2">
                            Body Scripts (Injected directly after <code>&lt;body&gt;</code>)
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                            Raw HTML for scripts that must be placed immediately after the opening body tag (e.g., Google Tag Manager no-script).
                        </p>
                        <textarea
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50 dark:bg-slate-900 dark:border-slate-600 dark:text-neutral-200 focus:ring-2 focus:ring-blue-500"
                            rows={4}
                            value={f.body_schema}
                            onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, body_schema: e.target.value } }))}
                            placeholder={"<!-- Google Tag Manager (noscript) -->\n<noscript><iframe src=\"https://www.googletagmanager.com/ns.html?id=GTM-XXXXX\".../></noscript>"}
                        />
                    </div>

                    <div className="h-px bg-gray-200 dark:bg-neutral-800 my-6"></div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-800 dark:text-neutral-200 mb-2">
                            Footer Scripts (Injected right before <code>&lt;/body&gt;</code>)
                        </label>
                        <p className="text-xs text-gray-500 mb-2">
                            Raw HTML for scripts that load at the end of the page. Must include <code>&lt;script&gt;</code> tags.
                        </p>
                        <textarea
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50 dark:bg-slate-900 dark:border-slate-600 dark:text-neutral-200 focus:ring-2 focus:ring-blue-500"
                            rows={4}
                            value={f.footer_schema}
                            onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, footer_schema: e.target.value } }))}
                            placeholder={"<script src=\"https://example.com/chatbot.js\"></script>"}
                        />
                    </div>
                </div>

                <div className="mt-8 flex gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                    <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-white px-6 py-2.5 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed">
                        {saving ? 'Saving Changes…' : 'Save Site Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
}
