// src/admin/pages/admins/AdminAccess.jsx
import React from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import adminApi from '../../services/adminApi';

const MODULE_ALL_PREFIX = '__module_all__';
const moduleTokenFor = (type) => `${MODULE_ALL_PREFIX}:${type}`;

const EMPTY_ACCESS = Object.freeze({
  attraction: [],
  combo: [],
  banner: [],
  page: [],
  blog: [],
  gallery: [],
});

const EMPTY_LISTS = Object.freeze({
  attractions: [],
  combos: [],
  banners: [],
  pages: [],
  blogs: [],
  gallery: [],
});

function Section({ title, items, sel, setSel, disabled, moduleLabel, moduleValue }) {
  const safeSel = Array.isArray(sel) ? sel : [];
  const allIds = items.map((it) => it.id);
  const hasModuleToken = moduleValue ? safeSel.includes(moduleValue) : false;
  const hasFullModule = moduleValue
    ? hasModuleToken
    : Boolean(moduleLabel && (allIds.length === 0 || allIds.every((id) => safeSel.includes(id))));

  const toggle = (id) => {
    if (disabled) return;
    if (hasModuleToken) return; // module-level override active
    const next = safeSel.includes(id) ? safeSel.filter((x) => x !== id) : [...safeSel, id];
    setSel(next);
  };

  const toggleModule = () => {
    if (disabled || !moduleLabel) return;
    if (moduleValue) {
      setSel(hasModuleToken ? [] : [moduleValue]);
    } else {
      const next = hasFullModule ? [] : allIds;
      setSel(next);
    }
  };

  return (
    <div className="rounded-xl border p-4 dark:border-neutral-800 dark:bg-neutral-900/60 bg-white/70">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="font-medium text-gray-900 dark:text-neutral-100">{title}</div>
        {moduleLabel ? (
          <label
            className={[
              'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              hasFullModule
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'text-blue-600 border-blue-500 hover:bg-blue-50 dark:hover:bg-neutral-800',
              disabled ? 'opacity-60 cursor-not-allowed' : '',
            ].join(' ')}
          >
            <input
              type="checkbox"
              className="accent-white"
              checked={hasFullModule}
              onChange={toggleModule}
              disabled={disabled || (!moduleValue && !allIds.length && !hasFullModule)}
            />
            <span>{moduleLabel}</span>
          </label>
        ) : null}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {items.map((it) => (
          <label
            key={it.id}
            className={[
              'flex items-center gap-2 text-sm rounded-lg border px-3 py-2',
              disabled || hasModuleToken ? 'opacity-60 cursor-not-allowed' : 'hover:border-blue-400 dark:hover:border-blue-500',
            ].join(' ')}
          >
            <input
              type="checkbox"
              disabled={disabled || hasModuleToken}
              checked={safeSel.includes(it.id)}
              onChange={() => toggle(it.id)}
            />
            <span className="truncate">{it.label}</span>
          </label>
        ))}
        {!items.length && <div className="text-xs text-gray-500">No items</div>}
      </div>
    </div>
  );
}

export default function AdminAccess() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const nav = useNavigate();

  const forcedAdminId = params?.id || '';
  const [admins, setAdmins] = React.useState([]);
  const [selectedAdminId, setSelectedAdminId] = React.useState(forcedAdminId || searchParams.get('adminId') || '');

  const [access, setAccess] = React.useState(EMPTY_ACCESS);
  const [lists, setLists] = React.useState(EMPTY_LISTS);

  const [loadingBase, setLoadingBase] = React.useState(true);
  const [loadingAccess, setLoadingAccess] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const [showPreview, setShowPreview] = React.useState(false);
  const [previewAccess, setPreviewAccess] = React.useState(EMPTY_ACCESS);

  React.useEffect(() => {
    (async () => {
      try {
        setErr('');
        setLoadingBase(true);
        const [adminList, atts, cmbs, bnrs, pgs, blgs, gll] = await Promise.all([
          adminApi.get('/api/admin/admins', { limit: 200 }),
          adminApi.get('/api/admin/attractions', { limit: 200 }),
          adminApi.get('/api/admin/combos', { active: true }),
          adminApi.get('/api/admin/banners', { limit: 200 }),
          adminApi.get('/api/admin/pages', { limit: 200 }),
          adminApi.get('/api/admin/blogs', { limit: 200 }),
          adminApi.get('/api/admin/gallery', { limit: 200 }),
        ]);
        setAdmins(Array.isArray(adminList) ? adminList : []);
        setLists({
          attractions: (atts?.data || atts || []).map((a) => ({
            id: a.attraction_id,
            label: a.title || `Attraction #${a.attraction_id}`,
          })),
          combos: (cmbs?.data || cmbs || []).map((c) => ({
            id: c.combo_id,
            label: c.title || `${c.attraction_1_id}+${c.attraction_2_id}`,
          })),
          banners: (bnrs?.data || bnrs || []).map((b) => ({
            id: b.banner_id,
            label: b.title || `Banner #${b.banner_id}`,
          })),
          pages: (pgs?.data || pgs || []).map((p) => ({ id: p.page_id, label: p.title })),
          blogs: (blgs?.data || blgs || []).map((b) => ({ id: b.blog_id, label: b.title })),
          gallery: (gll?.data || gll || []).map((g) => ({
            id: g.gallery_item_id,
            label: g.title || g.url,
          })),
        });
      } catch (e) {
        setErr(e.message || 'Failed to load Grant Access data');
      } finally {
        setLoadingBase(false);
      }
    })();
  }, []);

  React.useEffect(() => {
    if (!selectedAdminId) {
      setAccess(EMPTY_ACCESS);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setErr('');
        setNotice('');
        setLoadingAccess(true);
        const acc = await adminApi.get(`/api/admin/admins/${selectedAdminId}/access`);
        if (cancelled) return;
        setAccess({
          attraction: acc?.access?.attraction || [],
          combo: acc?.access?.combo || [],
          banner: acc?.access?.banner || [],
          page: acc?.access?.page || [],
          blog: acc?.access?.blog || [],
          gallery: acc?.access?.gallery || [],
        });
      } catch (e) {
        if (!cancelled) setErr(e.message || 'Failed to load admin access');
      } finally {
        if (!cancelled) setLoadingAccess(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedAdminId]);

  const save = async () => {
    if (!selectedAdminId) {
      setErr('Select an admin to grant access.');
      return;
    }
    try {
      setErr('');
      setNotice('');
      setSaving(true);
      await adminApi.put(`/api/admin/admins/${selectedAdminId}/access`, { access });
      setNotice('Access updated successfully.');
      if (forcedAdminId) {
        // If we came via legacy route, send user back to the Admin Team list.
        nav('/admin/admins');
      }
    } catch (e) {
      setErr(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const previewCurrentAccess = async () => {
    if (!selectedAdminId) return;
    try {
      setLoadingAccess(true);
      const acc = await adminApi.get(`/api/admin/admins/${selectedAdminId}/access`);
      setPreviewAccess({
        attraction: acc?.access?.attraction || [],
        combo: acc?.access?.combo || [],
        banner: acc?.access?.banner || [],
        page: acc?.access?.page || [],
        blog: acc?.access?.blog || [],
        gallery: acc?.access?.gallery || [],
      });
      setShowPreview(true);
    } catch (e) {
      setErr(e.message || 'Failed to load access preview');
    } finally {
      setLoadingAccess(false);
    }
  };

  const revokeAccess = async (resourceType) => {
    if (!selectedAdminId) return;
    if (!confirm(`Revoke all ${resourceType} access for ${selectedAdmin?.name || `Admin #${selectedAdminId}`}?`)) return;
    try {
      setErr('');
      setNotice('');
      const newAccess = { ...previewAccess, [resourceType]: [] };
      await adminApi.put(`/api/admin/admins/${selectedAdminId}/access`, { access: newAccess });
      setPreviewAccess(newAccess);
      setNotice(`${resourceType} access revoked successfully.`);
      // Also update local access state if it matches the admin being previewed
      if (String(selectedAdminId) === String(selectedAdminId)) {
        setAccess(prev => ({ ...prev, [resourceType]: [] }));
      }
    } catch (e) {
      setErr(e.message || 'Revoke failed');
    }
  };

  const makeSectionSetter = React.useCallback(
    (field) => (updater) => {
      setAccess((prev) => {
        const previous = Array.isArray(prev[field]) ? prev[field] : [];
        const next = typeof updater === 'function' ? updater(previous) : updater;
        return { ...prev, [field]: Array.isArray(next) ? next : [] };
      });
    },
    []
  );

  if (loadingBase) return <div className="p-3 text-sm">Loading Grant Access module…</div>;

  const selectedAdmin = admins.find((a) => String(a.user_id) === String(selectedAdminId));
  const canEdit = Boolean(selectedAdminId) && !loadingAccess;

  return (
    <div className="space-y-4">
      <div>
        <div className="text-lg font-semibold">Grant Access</div>
        <p className="text-sm text-gray-600 dark:text-neutral-400">
          Root & Super Admins can scope sub-admins to specific attractions, combos, and content. Sub-admins will only
          see revenue, bookings, offers, promos, and creatives tied to what you select here.
        </p>
      </div>

      {err ? <div className="text-sm text-red-600">{err}</div> : null}
      {notice ? <div className="text-sm text-emerald-600">{notice}</div> : null}

      <div className="rounded-xl border bg-white dark:bg-neutral-900 p-4 space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <label className="text-sm font-medium w-full md:w-64 text-gray-900 dark:text-neutral-200">
            Select Sub Admin
          </label>
          <select
            className="flex-1 rounded-lg border px-3 py-2 bg-white dark:bg-neutral-900"
            value={selectedAdminId}
            onChange={(e) => setSelectedAdminId(e.target.value)}
            disabled={!!forcedAdminId}
          >
            <option value="">Pick an admin…</option>
            {admins.map((admin) => (
              <option key={admin.user_id} value={admin.user_id}>
                {admin.name || admin.email || `Admin #${admin.user_id}`}
              </option>
            ))}
          </select>
          <Link
            to="/admin/admins/new"
            className="text-sm font-medium text-blue-600 hover:text-blue-500 whitespace-nowrap"
          >
            + Create Admin
          </Link>
        </div>
        {forcedAdminId ? (
          <p className="text-xs text-gray-500">Granting access for admin #{forcedAdminId}. Selection locked.</p>
        ) : (
          <p className="text-xs text-gray-500">
            Need a fresh sub-admin for SnowCity or combos? Create them first, then grant access here.
          </p>
        )}
      </div>

      {selectedAdminId ? (
        <>
          <div className="rounded-xl border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-500/10 p-4 text-sm text-gray-700 dark:text-neutral-200">
            {selectedAdmin?.name || 'This sub-admin'} will only see dashboards, revenue, bookings, offers, banners, pages,
            blogs, and gallery items tied to the attractions/combos you check below. Select Snow City & Snow City Together
            Combo to limit them to those modules.
          </div>

          <Section
            title="Attractions (bookings / revenue scope)"
            items={lists.attractions}
            sel={access.attraction}
            setSel={makeSectionSetter('attraction')}
            disabled={loadingAccess}
            moduleLabel="attractions module"
            moduleValue={moduleTokenFor('attraction')}
          />
          <Section
            title="Combos"
            items={lists.combos}
            sel={access.combo}
            setSel={makeSectionSetter('combo')}
            disabled={loadingAccess}
            moduleLabel="combos module"
            moduleValue={moduleTokenFor('combo')}
          />
          <Section
            title="Banners"
            items={lists.banners}
            sel={access.banner}
            setSel={makeSectionSetter('banner')}
            disabled={loadingAccess}
            moduleLabel="banners module"
            moduleValue={moduleTokenFor('banner')}
          />
          <Section
            title="Pages"
            items={lists.pages}
            sel={access.page}
            setSel={makeSectionSetter('page')}
            disabled={loadingAccess}
            moduleLabel="pages module"
            moduleValue={moduleTokenFor('page')}
          />
          <Section
            title="Blogs"
            items={lists.blogs}
            sel={access.blog}
            setSel={makeSectionSetter('blog')}
            disabled={loadingAccess}
            moduleLabel="blog module"
            moduleValue={moduleTokenFor('blog')}
          />
          <Section
            title="Gallery"
            items={lists.gallery}
            sel={access.gallery}
            setSel={makeSectionSetter('gallery')}
            disabled={loadingAccess}
            moduleLabel="gallery module"
            moduleValue={moduleTokenFor('gallery')}
          />
        </>
      ) : (
        <div className="rounded-xl border border-dashed bg-white/50 dark:bg-neutral-900/40 p-6 text-center text-sm text-gray-500">
          Select an admin above to start granting scoped access.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          className="px-4 py-2 rounded-lg bg-gray-900 text-white disabled:bg-gray-400"
          onClick={save}
          disabled={!canEdit || saving}
        >
          {saving ? 'Saving…' : 'Save Access'}
        </button>
        <button
          className="px-4 py-2 rounded-lg border border-blue-500 text-blue-600 dark:text-blue-400"
          onClick={previewCurrentAccess}
          disabled={!selectedAdminId || loadingAccess}
        >
          Preview Access
        </button>
        <button
          className="px-4 py-2 rounded-lg border"
          onClick={() => {
            if (forcedAdminId) {
              nav('/admin/admins');
            } else {
              setSelectedAdminId('');
            }
          }}
        >
          Cancel
        </button>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto p-6">
            <h3 className="text-lg font-semibold mb-4">Current Access for {selectedAdmin?.name || `Admin #${selectedAdminId}`}</h3>
            <div className="space-y-3 text-sm">
              {Object.entries(previewAccess).map(([type, items]) => (
                <div key={type} className="border rounded-lg p-3">
                  <div className="font-medium capitalize mb-1 flex items-center justify-between">
                    <span>{type}</span>
                    {items.length > 0 && (
                      <button
                        className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                        onClick={() => revokeAccess(type)}
                      >
                        Revoke All
                      </button>
                    )}
                  </div>
                  {items.length === 0 ? (
                    <div className="text-gray-500">No access</div>
                  ) : items.includes('*') ? (
                    <div className="text-green-600 font-medium">Full module access</div>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {items.map(id => (
                        <span key={id} className="px-2 py-1 bg-gray-100 dark:bg-neutral-800 rounded text-xs">
                          {id}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 rounded-lg border"
                onClick={() => setShowPreview(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}