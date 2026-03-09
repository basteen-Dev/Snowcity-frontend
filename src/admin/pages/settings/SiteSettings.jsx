import React from 'react';
import adminApi from '../../services/adminApi';
import SaveOverlay from '../../components/common/SaveOverlay';
import toast from 'react-hot-toast';

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

    React.useEffect(() => {
        (async () => {
            try {
                const res = await adminApi.get('/api/parkpanel/site-settings/seo');
                setState((s) => ({
                    ...s,
                    status: 'idle',
                    form: {
                        head_schema: res.head_schema || '',
                        body_schema: res.body_schema || '',
                        footer_schema: res.footer_schema || '',
                        organization_schema: res.organization_schema || '',
                    }
                }));
            } catch (err) {
                setState((s) => ({ ...s, status: 'failed', error: err }));
            }
        })();
    }, []);

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

    if (state.status === 'loading') return <div>Loading settings…</div>;
    if (state.status === 'failed') return <div className="text-red-600">{state.error?.message || 'Failed to load'}</div>;

    const f = state.form;

    return (
        <div className="relative">
            <SaveOverlay visible={saving} label="Saving settings…" />
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Site Settings (SEO)</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">Global scripts and schemas injected across all pages.</p>
                </div>
                <button
                    type="button"
                    onClick={preview}
                    className="px-4 py-2 bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 rounded-lg hover:bg-gray-200 dark:hover:bg-neutral-600 transition-colors text-sm font-medium"
                >
                    Preview
                </button>
            </div>

            <form onSubmit={save} className="max-w-4xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
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
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50 dark:bg-neutral-950 dark:border-neutral-700 dark:text-neutral-200 focus:ring-2 focus:ring-blue-500"
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
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50 dark:bg-neutral-950 dark:border-neutral-700 dark:text-neutral-200 focus:ring-2 focus:ring-blue-500"
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
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50 dark:bg-neutral-950 dark:border-neutral-700 dark:text-neutral-200 focus:ring-2 focus:ring-blue-500"
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
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50 dark:bg-neutral-950 dark:border-neutral-700 dark:text-neutral-200 focus:ring-2 focus:ring-blue-500"
                            rows={4}
                            value={f.footer_schema}
                            onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, footer_schema: e.target.value } }))}
                            placeholder={"<script src=\"https://example.com/chatbot.js\"></script>"}
                        />
                    </div>
                </div>

                <div className="mt-8 flex gap-3 pt-4 border-t border-gray-200 dark:border-neutral-800">
                    <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-white px-6 py-2.5 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed">
                        {saving ? 'Saving Changes…' : 'Save Site Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
}
