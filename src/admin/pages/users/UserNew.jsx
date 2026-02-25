// src/admin/pages/users/UserNew.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import toast from 'react-hot-toast';

export default function UserNew() {
    const nav = useNavigate();
    const [form, setForm] = React.useState({ name: '', email: '', phone: '', password: '' });
    const [saving, setSaving] = React.useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email) {
            toast.error('Name and email are required');
            return;
        }
        setSaving(true);
        const loadingToast = toast.loading('Creating customer...');
        try {
            await adminApi.post('/api/admin/users', {
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim() || null,
                password: form.password || undefined,
            });
            toast.success('Customer created successfully', { id: loadingToast });
            nav('/admin/users');
        } catch (e) {
            toast.error(e.message || 'Create failed', { id: loadingToast });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-gray-200 dark:border-neutral-700 p-6 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">Create Customer</h1>
                        <p className="text-gray-600 dark:text-neutral-400 mt-1">Add a new customer user</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => nav('/admin/users')}
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
                            placeholder="customer@example.com"
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
                        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1.5">Password</label>
                        <input
                            type="password"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            placeholder="Optional — leave blank if not needed"
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-neutral-700 flex gap-3">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                        {saving ? 'Creating…' : 'Create Customer'}
                    </button>
                    <button
                        type="button"
                        onClick={() => nav('/admin/users')}
                        className="px-4 py-2.5 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-300 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors text-sm"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
