import React from 'react';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import AdminTable from '../../components/common/AdminTable';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import RichText from '../../components/common/RichText';
import { Plus, Trash2, Edit2, Megaphone, Save, X } from 'lucide-react';

export default function AnnouncementsList() {
    const [state, setState] = React.useState({
        status: 'idle',
        items: [],
        error: null,
    });

    const [form, setForm] = React.useState({
        open: false,
        editingId: null,
        content: '',
        priority: 0,
        active: true,
        saving: false
    });

    const load = async () => {
        setState((s) => ({ ...s, status: 'loading', error: null }));
        try {
            const res = await adminApi.get(A.announcements());
            const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
            setState((s) => ({ ...s, status: 'succeeded', items }));
        } catch (err) {
            setState((s) => ({ ...s, status: 'failed', error: err }));
        }
    };

    React.useEffect(() => { load(); }, []);

    const openAdd = () => setForm({ open: true, editingId: null, content: '', priority: 0, active: true, saving: false });
    const openEdit = (row) => setForm({
        open: true,
        editingId: row.id,
        content: row.content,
        priority: row.priority || 0,
        active: row.active !== false,
        saving: false
    });
    const closeForm = () => setForm({ ...form, open: false });

    const save = async (e) => {
        e.preventDefault();
        if (!form.content.trim()) return;
        setForm(s => ({ ...s, saving: true }));
        try {
            const payload = { content: form.content, priority: form.priority, active: form.active };
            if (form.editingId) {
                await adminApi.put(A.announcementById(form.editingId), payload);
            } else {
                await adminApi.post(A.announcements(), payload);
            }
            load();
            closeForm();
        } catch (err) {
            alert(err.message || 'Failed to save');
            setForm(s => ({ ...s, saving: false }));
        }
    };

    const remove = async (id, e) => {
        e?.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this announcement?')) return;
        try {
            await adminApi.delete(A.announcementById(id));
            load();
        } catch (err) {
            alert(err.message || 'Failed to delete');
        }
    };

    const toggleActive = async (row, e) => {
        e?.stopPropagation();
        try {
            await adminApi.put(A.announcementById(row.id), { active: !row.active });
            setState(s => ({
                ...s,
                items: s.items.map(it => it.id === row.id ? { ...it, active: !row.active } : it)
            }));
        } catch (err) {
            alert(err.message || 'Failed to toggle status');
        }
    };

    const columns = [
        {
            key: 'content',
            title: 'Announcement Content',
            render: (row) => (
                <div className="max-w-[500px]">
                    <div
                        className={`text-sm ${!row.active ? 'text-gray-400 line-through' : 'text-gray-900 font-medium'}`}
                        dangerouslySetInnerHTML={{ __html: row.content }}
                    />
                </div>
            )
        },
        {
            key: 'priority',
            title: 'Priority',
            className: 'w-24 text-center',
            render: (row) => <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{row.priority}</span>
        },
        {
            key: 'active',
            title: 'Status',
            className: 'w-32',
            render: (row) => (
                <button onClick={(e) => toggleActive(row, e)}>
                    <StatusBadge status={row.active ? 'active' : 'inactive'} />
                </button>
            )
        },
        {
            key: 'actions',
            title: '',
            className: 'w-24 text-right',
            render: (row) => (
                <div className="flex justify-end gap-2">
                    <button
                        onClick={() => openEdit(row)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="Edit"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => remove(row.id, e)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="p-6 max-w-7xl mx-auto min-h-screen bg-slate-50/50">
            <PageHeader
                title="Marquee Announcements"
                subtitle="Manage the rolling text announcements displayed on the homepage marquee."
            >
                <button
                    onClick={openAdd}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl font-semibold shadow-lg shadow-blue-500/25 transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    New Announcement
                </button>
            </PageHeader>

            <div className="mt-8 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <AdminTable
                    columns={columns}
                    rows={state.items}
                    loading={state.status === 'loading'}
                    onRowClick={openEdit}
                />

                {state.status === 'succeeded' && state.items.length === 0 && (
                    <div className="py-20 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Megaphone className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">No announcements found</h3>
                        <p className="text-slate-500 max-w-xs mx-auto mt-2">Create your first announcement to display in the homepage marquee.</p>
                        <button onClick={openAdd} className="mt-6 text-blue-600 font-bold hover:underline">Add Announcement</button>
                    </div>
                )}
            </div>

            {/* Editor Modal */}
            {form.open && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl shadow-slate-900/20 overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
                            <h3 className="text-xl font-bold text-slate-900">
                                {form.editingId ? 'Edit Announcement' : 'New Announcement'}
                            </h3>
                            <button
                                onClick={closeForm}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={save} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1">Announcement Text</label>
                                <RichText
                                    value={form.content}
                                    onChange={(val) => setForm(s => ({ ...s, content: val }))}
                                    placeholder="Enter the message to display..."
                                    height={200}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Priority</label>
                                    <input
                                        type="number"
                                        value={form.priority}
                                        onChange={(e) => setForm(s => ({ ...s, priority: parseInt(e.target.value) || 0 }))}
                                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3 text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                                    />
                                    <p className="text-[10px] text-slate-400 ml-1">Higher numbers show first</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Status</label>
                                    <button
                                        type="button"
                                        onClick={() => setForm(s => ({ ...s, active: !s.active }))}
                                        className={`w-full flex items-center justify-between rounded-2xl border px-5 py-3 text-sm font-bold transition-all ${form.active
                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                            : 'bg-slate-50 border-slate-200 text-slate-500'
                                            }`}
                                    >
                                        <span>{form.active ? 'Active' : 'Hidden'}</span>
                                        <div className={`w-2 h-2 rounded-full ${form.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={form.saving || !form.content.trim()}
                                    className="flex-[2] py-3.5 rounded-2xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                                >
                                    {form.saving ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Save className="w-5 h-5" />
                                    )}
                                    {form.editingId ? 'Update Message' : 'Publish Announcement'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
