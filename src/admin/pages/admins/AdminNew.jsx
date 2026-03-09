// src/parkpanel/pages/admins/AdminNew.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import toast from 'react-hot-toast';
import { useAdminRole } from '../../hooks/useAdminRole';

// Role display config
const ROLE_CONFIG = {
  gm: { label: 'General Manager', color: 'from-purple-500 to-violet-600', desc: 'All modules except creating admins' },
  staff: { label: 'Staff', color: 'from-blue-500 to-cyan-600', desc: 'Scoped to specific attraction(s)' },
  editor: { label: 'Editor', color: 'from-green-500 to-emerald-600', desc: 'Catalog only (no offers/coupons/pricing)' },
};

// Roles superadmin can assign (not superadmin itself)
const ASSIGNABLE_ROLES = ['gm', 'staff', 'editor'];

export default function AdminNew() {
  const nav = useNavigate();
  const { isSuperAdmin } = useAdminRole();
  const [form, setForm] = React.useState({
    name: '', email: '', phone: '', password: '', role: 'staff',
  });
  const [saving, setSaving] = React.useState(false);

  // Redirect if not superadmin
  React.useEffect(() => {
    if (!isSuperAdmin) {
      toast.error('Only Super Admins can create admin accounts');
      nav('/parkpanel/admins');
    }
  }, [isSuperAdmin, nav]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Name, email, and password are required');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    const loadingToast = toast.loading('Creating admin...');
    try {
      const res = await adminApi.post('/api/parkpanel/admins', {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        password: form.password,
        roles: [form.role],
      });
      toast.success('Admin created successfully', { id: loadingToast });
      // For staff, redirect to access grant page so scopes can be assigned
      if (form.role === 'staff' && res?.user_id) {
        nav(`/parkpanel/admins/${res.user_id}/access`);
      } else {
        nav('/parkpanel/admins');
      }
    } catch (e) {
      toast.error(e.message || 'Create failed', { id: loadingToast });
    } finally {
      setSaving(false);
    }
  };

  const roleConf = ROLE_CONFIG[form.role] || ROLE_CONFIG.staff;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-gray-200 dark:border-neutral-700 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">Create Admin</h1>
            <p className="text-gray-600 dark:text-neutral-400 mt-1">Add a new team member to the admin panel</p>
          </div>
          <button
            type="button"
            onClick={() => nav('/parkpanel/admins')}
            className="px-4 py-2 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-300 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors text-sm"
          >
            ← Back
          </button>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {/* Basic info */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-gray-200 dark:border-neutral-700 p-6 space-y-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-neutral-100">Personal Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Full Name *</label>
              <input
                type="text" required
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Riya Sharma"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Email *</label>
              <input
                type="email" required
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="riya@snowcity.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Phone</label>
              <input
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Password *</label>
              <input
                type="password" required minLength={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Minimum 6 characters"
              />
            </div>
          </div>
        </div>

        {/* Role selector */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-gray-200 dark:border-neutral-700 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-neutral-100 mb-4">Assign Role</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {ASSIGNABLE_ROLES.map((r) => {
              const conf = ROLE_CONFIG[r];
              const selected = form.role === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm({ ...form, role: r })}
                  className={[
                    'relative p-4 rounded-2xl border-2 text-left transition-all',
                    selected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-neutral-700 hover:border-blue-300 dark:hover:border-neutral-500',
                  ].join(' ')}
                >
                  <div className={`inline-flex items-center px-2 py-0.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r ${conf.color} mb-2`}>
                    {conf.label}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-neutral-400">{conf.desc}</p>
                  {selected && (
                    <div className="absolute top-3 right-3 h-5 w-5 rounded-xl bg-blue-500 flex items-center justify-center">
                      <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {form.role === 'staff' && (
            <div className="mt-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300">
              ℹ️ After creating, you'll be redirected to the <strong>Grant Access</strong> page to assign specific attractions.
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium shadow-lg shadow-blue-500/30"
          >
            {saving ? 'Creating…' : 'Create Admin'}
          </button>
          <button
            type="button"
            onClick={() => nav('/parkpanel/admins')}
            className="px-4 py-2.5 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-300 rounded-xl hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
