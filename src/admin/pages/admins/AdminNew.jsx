// src/admin/pages/admins/AdminNew.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import toast from 'react-hot-toast';

export default function AdminNew() {
  const nav = useNavigate();
  const [form, setForm] = React.useState({ name: '', email: '', phone: '', password: '', roles: ['subadmin'] });
  const [saving, setSaving] = React.useState(false);
  const [roles, setRoles] = React.useState([]);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await adminApi.get('/api/admin/roles');
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setRoles(list);
      } catch { /* ignore */ }
    })();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Name, email, and password are required');
      return;
    }
    setSaving(true);
    const loadingToast = toast.loading('Creating admin...');
    try {
      await adminApi.post('/api/admin/admins', {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        password: form.password,
        roles: form.roles,
      });
      toast.success('Admin created successfully', { id: loadingToast });
      nav('/admin/admins');
    } catch (e) {
      toast.error(e.message || 'Create failed', { id: loadingToast });
    } finally {
      setSaving(false);
    }
  };

  const toggleRole = (roleName) => {
    const normalized = roleName.toLowerCase();
    setForm((f) => {
      const current = f.roles || [];
      if (current.includes(normalized)) {
        return { ...f, roles: current.filter((r) => r !== normalized) };
      }
      return { ...f, roles: [...current, normalized] };
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">Create Admin</h1>
            <p className="text-gray-600 dark:text-neutral-400 mt-1">Add a new admin or sub-admin to the team</p>
          </div>
          <button
            type="button"
            onClick={() => nav('/admin/admins')}
            className="px-4 py-2 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-300 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </div>

      <form onSubmit={submit} className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700 p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Name *</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Email *</label>
            <input
              type="email"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="admin@example.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Phone</label>
            <input
              type="tel"
              className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 XXXXX XXXXX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Password *</label>
            <input
              type="password"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Minimum 6 characters"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">Roles</label>
          <div className="flex flex-wrap gap-2">
            {roles.length > 0 ? roles.map((r) => {
              const name = (r.role_name || r.name || '').toLowerCase();
              if (!name) return null;
              const selected = (form.roles || []).includes(name);
              return (
                <button
                  key={r.role_id || name}
                  type="button"
                  onClick={() => toggleRole(name)}
                  className={[
                    'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                    selected
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 border-gray-300 dark:border-neutral-600 hover:bg-gray-50 dark:hover:bg-neutral-600',
                  ].join(' ')}
                >
                  {r.role_name || r.name}
                </button>
              );
            }) : (
              <span className="text-sm text-gray-400">Loading roles…</span>
            )}
          </div>
          <p className="mt-1.5 text-xs text-gray-500 dark:text-neutral-400">Select one or more roles. Defaults to "subadmin" if none selected.</p>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-neutral-700 flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {saving ? 'Creating…' : 'Create Admin'}
          </button>
          <button
            type="button"
            onClick={() => nav('/admin/admins')}
            className="px-4 py-2.5 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-300 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}