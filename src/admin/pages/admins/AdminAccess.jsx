// src/parkpanel/pages/admins/AdminAccess.jsx
import React from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import toast from 'react-hot-toast';

const MODULE_PERMISSIONS = [
  { key: 'analytics', label: 'Analytics & Reports', desc: 'View analytics dashboard and reports' },
  { key: 'bookings', label: 'Bookings', desc: 'View and manage bookings' },
  { key: 'offers', label: 'Offers', desc: 'Create and manage offers' },
  { key: 'dynamic_pricing', label: 'Dynamic Pricing', desc: 'Manage dynamic pricing rules' },
];

function ResourceSection({ title, items, sel, setSel, disabled }) {
  const safeSel = Array.isArray(sel) ? sel : [];
  const allIds = items.map((it) => it.id);
  const hasAll = safeSel.includes('*') || (allIds.length > 0 && allIds.every((id) => safeSel.includes(id)));

  const toggle = (id) => {
    if (disabled || safeSel.includes('*')) return;
    const next = safeSel.includes(id) ? safeSel.filter((x) => x !== id) : [...safeSel, id];
    setSel(next);
  };

  const toggleAll = () => {
    if (disabled) return;
    setSel(hasAll ? [] : ['*']);
  };

  return (
    <div className="rounded-2xl border p-4 dark:border-neutral-800 dark:bg-neutral-900/60 bg-white/70">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="font-medium text-gray-900 dark:text-neutral-100">{title}</div>
        <label className={[
          'inline-flex items-center gap-2 rounded-xl border px-3 py-1 text-xs font-medium transition-colors cursor-pointer',
          hasAll ? 'bg-emerald-600 text-white border-emerald-600' : 'text-blue-600 border-blue-500 hover:bg-blue-50 dark:hover:bg-neutral-800',
          disabled ? 'opacity-60 cursor-not-allowed' : '',
        ].join(' ')}>
          <input type="checkbox" className="accent-white" checked={hasAll} onChange={toggleAll} disabled={disabled} />
          <span>Full Access</span>
        </label>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {items.map((it) => (
          <label key={it.id} className={[
            'flex items-center gap-2 text-sm rounded-xl border px-3 py-2 cursor-pointer transition-colors',
            disabled || safeSel.includes('*') ? 'opacity-60 cursor-not-allowed' : 'hover:border-blue-400 dark:hover:border-blue-500',
            safeSel.includes(it.id) ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-neutral-700',
          ].join(' ')}>
            <input
              type="checkbox"
              disabled={disabled || safeSel.includes('*')}
              checked={safeSel.includes(it.id) || safeSel.includes('*')}
              onChange={() => toggle(it.id)}
            />
            <span className="truncate">{it.label}</span>
          </label>
        ))}
        {!items.length && <div className="text-xs text-gray-500 col-span-full">No items available</div>}
      </div>
    </div>
  );
}

const EMPTY_ACCESS = Object.freeze({ attraction: [], combo: [] });
const EMPTY_LISTS = Object.freeze({ attractions: [], combos: [] });

export default function AdminAccess() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const nav = useNavigate();

  const forcedAdminId = params?.id || '';
  const [admins, setAdmins] = React.useState([]);
  const [selectedAdminId, setSelectedAdminId] = React.useState(
    forcedAdminId || searchParams.get('adminId') || ''
  );
  const [access, setAccess] = React.useState(EMPTY_ACCESS);
  const [modulePerms, setModulePerms] = React.useState([]);
  const [lists, setLists] = React.useState(EMPTY_LISTS);
  const [selectedAdmin, setSelectedAdmin] = React.useState(null);

  const [loadingBase, setLoadingBase] = React.useState(true);
  const [loadingAccess, setLoadingAccess] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [notice, setNotice] = React.useState('');

  // Load admins + resource lists
  React.useEffect(() => {
    (async () => {
      try {
        setErr('');
        setLoadingBase(true);
        const [adminList, atts, cmbs] = await Promise.all([
          adminApi.get('/api/parkpanel/admins', { limit: 200 }),
          adminApi.get('/api/parkpanel/attractions', { limit: 200 }),
          adminApi.get('/api/parkpanel/combos', { active: true }),
        ]);
        setAdmins(Array.isArray(adminList) ? adminList : []);
        setLists({
          attractions: (atts?.data || atts || []).map((a) => ({
            id: a.attraction_id,
            label: a.title || `Attraction #${a.attraction_id}`,
          })),
          combos: (cmbs?.data || cmbs || []).map((c) => ({
            id: c.combo_id,
            label: c.title || `Combo #${c.combo_id}`,
          })),
        });
      } catch (e) {
        setErr(e.message || 'Failed to load data');
      } finally {
        setLoadingBase(false);
      }
    })();
  }, []);

  // Load access for selected admin
  React.useEffect(() => {
    if (!selectedAdminId) {
      setAccess(EMPTY_ACCESS);
      setModulePerms([]);
      setSelectedAdmin(null);
      return;
    }

    const found = admins.find((a) => String(a.user_id) === String(selectedAdminId));
    setSelectedAdmin(found || null);

    let cancelled = false;
    (async () => {
      try {
        setErr('');
        setNotice('');
        setLoadingAccess(true);
        const acc = await adminApi.get(`/api/parkpanel/admins/${selectedAdminId}/access`);
        if (cancelled) return;
        setAccess({
          attraction: acc?.access?.attraction || [],
          combo: acc?.access?.combo || [],
        });
        setModulePerms(Array.isArray(acc?.module_permissions) ? acc.module_permissions : []);
      } catch (e) {
        if (!cancelled) setErr(e.message || 'Failed to load access');
      } finally {
        if (!cancelled) setLoadingAccess(false);
      }
    })();

    return () => { cancelled = true; };
  }, [selectedAdminId, admins]);

  const save = async () => {
    if (!selectedAdminId) return setErr('Select an admin to grant access.');
    try {
      setErr('');
      setNotice('');
      setSaving(true);
      await adminApi.put(`/api/parkpanel/admins/${selectedAdminId}/access`, {
        access,
        module_permissions: modulePerms,
      });
      toast.success('Access saved!');
      setNotice('Access updated successfully.');
      if (forcedAdminId) nav('/parkpanel/admins');
    } catch (e) {
      setErr(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleModulePerm = (key) => {
    setModulePerms((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const makeSectionSetter = React.useCallback(
    (field) => (updater) =>
      setAccess((prev) => {
        const prev2 = Array.isArray(prev[field]) ? prev[field] : [];
        const next = typeof updater === 'function' ? updater(prev2) : updater;
        return { ...prev, [field]: Array.isArray(next) ? next : [] };
      }),
    []
  );

  // Detect if selected admin is a staff role
  const isStaffAdmin = React.useMemo(() => {
    if (!selectedAdmin) return false;
    const roles = Array.isArray(selectedAdmin.roles) ? selectedAdmin.roles : [];
    return roles.some((r) => {
      const n = (typeof r === 'string' ? r : String(r.role_name || r)).toLowerCase();
      return n === 'staff' || n === 'subadmin';
    });
  }, [selectedAdmin]);

  if (loadingBase) return <div className="p-6 text-sm text-gray-500">Loading…</div>;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-neutral-100">Grant Access</h1>
        <p className="text-sm text-gray-600 dark:text-neutral-400 mt-1">
          Scope staff members to specific attractions and combos. They will only see data for what you assign here.
        </p>
      </div>

      {err && <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-300">{err}</div>}
      {notice && <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">{notice}</div>}

      {/* Admin selector */}
      <div className="rounded-2xl border bg-white dark:bg-neutral-900 p-5 space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <label className="text-sm font-medium w-full md:w-48 text-gray-900 dark:text-neutral-200">Select Admin</label>
          <select
            className="flex-1 rounded-xl border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-900 text-sm"
            value={selectedAdminId}
            onChange={(e) => setSelectedAdminId(e.target.value)}
            disabled={!!forcedAdminId}
          >
            <option value="">Pick an admin…</option>
            {admins.map((admin) => (
              <option key={admin.user_id} value={admin.user_id}>
                {admin.name || admin.email || `Admin #${admin.user_id}`} — {Array.isArray(admin.roles) ? admin.roles.join(', ') : ''}
              </option>
            ))}
          </select>
          <Link to="/parkpanel/admins/new" className="text-sm font-medium text-blue-600 hover:text-blue-500 whitespace-nowrap">
            + Create Admin
          </Link>
        </div>
        {forcedAdminId && <p className="text-xs text-gray-500">Granting access for admin #{forcedAdminId}. Selection locked.</p>}
      </div>

      {selectedAdminId && (
        <>
          {/* Info banner */}
          <div className="rounded-xl border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-500/10 p-4 text-sm text-gray-700 dark:text-neutral-200">
            <strong>{selectedAdmin?.name || 'This admin'}</strong> will only see analytics, bookings, and catalog items for the attractions and combos checked below.
            {!isStaffAdmin && (
              <span className="block mt-1 text-xs text-amber-600 dark:text-amber-400">
                ⚠ This admin's role may not be "Staff" — scoping only applies to staff accounts.
              </span>
            )}
          </div>

          {/* Resource access */}
          <ResourceSection
            title="Attractions"
            items={lists.attractions}
            sel={access.attraction}
            setSel={makeSectionSetter('attraction')}
            disabled={loadingAccess}
          />
          <ResourceSection
            title="Combos"
            items={lists.combos}
            sel={access.combo}
            setSel={makeSectionSetter('combo')}
            disabled={loadingAccess}
          />

          {/* Module permissions (staff only) */}
          {isStaffAdmin && (
            <div className="rounded-2xl border p-5 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <h3 className="font-semibold text-gray-900 dark:text-neutral-100 mb-1">Module Permissions</h3>
              <p className="text-xs text-gray-500 dark:text-neutral-400 mb-4">
                Choose which modules this staff member can access within their scoped attractions.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {MODULE_PERMISSIONS.map((m) => {
                  const active = modulePerms.includes(m.key);
                  return (
                    <label
                      key={m.key}
                      className={[
                        'flex items-start gap-3 rounded-xl border-2 p-3 cursor-pointer transition-all',
                        active ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-neutral-700 hover:border-blue-300',
                      ].join(' ')}
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 accent-blue-500"
                        checked={active}
                        onChange={() => toggleModulePerm(m.key)}
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-neutral-100">{m.label}</div>
                        <div className="text-xs text-gray-500 dark:text-neutral-400">{m.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
              onClick={save}
              disabled={loadingAccess || saving}
            >
              {saving ? 'Saving…' : 'Save Access'}
            </button>
            <button
              className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-neutral-700 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800"
              onClick={() => forcedAdminId ? nav('/parkpanel/admins') : setSelectedAdminId('')}
            >
              Cancel
            </button>
          </div>
        </>
      )}

      {!selectedAdminId && (
        <div className="rounded-2xl border border-dashed bg-white/50 dark:bg-neutral-900/40 p-8 text-center text-sm text-gray-500">
          Select an admin above to start granting scoped access.
        </div>
      )}
    </div>
  );
}
