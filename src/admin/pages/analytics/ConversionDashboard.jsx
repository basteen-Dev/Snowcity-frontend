// src/admin/pages/analytics/ConversionDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import { formatCurrency } from '../../../utils/formatters';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid, Legend, PieChart, Pie, Cell
} from 'recharts';
import {
    TrendingUp, Users, ShoppingCart, DollarSign,
    Plus, Trash2, Loader2, RefreshCw
} from 'lucide-react';

/* ─── Date Presets ─── */
const RANGES = [
    { label: 'Today', get: () => ({ from: dayjs().startOf('day').toISOString(), to: dayjs().endOf('day').toISOString() }) },
    { label: '7 Days', get: () => ({ from: dayjs().subtract(7, 'day').startOf('day').toISOString(), to: dayjs().endOf('day').toISOString() }) },
    { label: '30 Days', get: () => ({ from: dayjs().subtract(30, 'day').startOf('day').toISOString(), to: dayjs().endOf('day').toISOString() }) },
    { label: '90 Days', get: () => ({ from: dayjs().subtract(90, 'day').startOf('day').toISOString(), to: dayjs().endOf('day').toISOString() }) },
    { label: 'All Time', get: () => ({ from: null, to: null }) },
];

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#e11d48', '#3b82f6', '#f97316', '#06b6d4'];

/* ─── Sub-Components ─── */
function MetricCard({ icon: Icon, label, value, note, accent = 'blue' }) {
    const gradients = {
        blue: 'from-blue-500 to-indigo-600',
        green: 'from-emerald-500 to-teal-600',
        amber: 'from-amber-500 to-orange-600',
        purple: 'from-purple-500 to-violet-600',
    };
    return (
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 border border-gray-200/60 dark:border-neutral-800 shadow-sm p-5">
            <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradients[accent]} text-white shadow-lg`}>
                    <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wide">{label}</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white truncate">{value}</p>
                    {note && <p className="mt-0.5 text-xs text-gray-400 dark:text-neutral-500">{note}</p>}
                </div>
            </div>
        </div>
    );
}

function SectionCard({ title, children, action, className = '' }) {
    return (
        <div className={`rounded-2xl bg-white dark:bg-neutral-900 border border-gray-200/60 dark:border-neutral-800 shadow-sm ${className}`}>
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
                {action}
            </div>
            <div className="px-6 pb-6">{children}</div>
        </div>
    );
}

/* ─── Main Dashboard ─── */
export default function ConversionDashboard() {
    const [rangeIdx, setRangeIdx] = useState(2); // default: 30 days
    const [data, setData] = useState(null);
    const [adSpendList, setAdSpendList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddSpend, setShowAddSpend] = useState(false);
    const [spendForm, setSpendForm] = useState({ source: '', campaign: '', spend: '' });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const range = RANGES[rangeIdx].get();
            const params = {};
            if (range.from) params.from = range.from;
            if (range.to) params.to = range.to;

            const [summary, adSpend] = await Promise.all([
                adminApi.get(A.conversionSummary(), { params }),
                adminApi.get(A.conversionAdSpend()),
            ]);
            setData(summary);
            setAdSpendList(adSpend);
        } catch (err) {
            console.error('Failed to load conversion data:', err);
        } finally {
            setLoading(false);
        }
    }, [rangeIdx]);

    useEffect(() => { load(); }, [load]);

    const handleAddSpend = async (e) => {
        e.preventDefault();
        if (!spendForm.source || !spendForm.spend) return;
        try {
            await adminApi.post(A.conversionAdSpend(), {
                source: spendForm.source,
                campaign: spendForm.campaign || null,
                spend: Number(spendForm.spend),
            });
            setSpendForm({ source: '', campaign: '', spend: '' });
            setShowAddSpend(false);
            load();
        } catch (err) {
            console.error('Failed to add spend:', err);
        }
    };

    const handleDeleteSpend = async (id) => {
        if (!window.confirm('Delete this ad spend entry?')) return;
        try {
            await adminApi.delete(A.conversionAdSpendById(id));
            load();
        } catch (err) {
            console.error('Failed to delete spend:', err);
        }
    };

    const totals = data?.totals || {};
    const sources = data?.sources || [];

    const fmtNum = (n) => Number(n || 0).toLocaleString('en-IN');
    const fmtCurr = (n) => formatCurrency ? formatCurrency(n) : `₹${Number(n || 0).toLocaleString('en-IN')}`;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Conversion Tracking</h1>
                    <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">
                        Traffic sources, booking attribution & ROAS
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {RANGES.map((r, i) => (
                        <button
                            key={r.label}
                            onClick={() => setRangeIdx(i)}
                            className={[
                                'px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                                i === rangeIdx
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                                    : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-700',
                            ].join(' ')}
                        >
                            {r.label}
                        </button>
                    ))}
                    <button
                        onClick={load}
                        className="p-2 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-700"
                        title="Refresh"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {loading && !data ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
            ) : (
                <>
                    {/* Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard icon={Users} label="Total Visitors" value={fmtNum(totals.total_visitors)} accent="blue" />
                        <MetricCard icon={ShoppingCart} label="Total Bookings" value={fmtNum(totals.total_bookings)} accent="green" />
                        <MetricCard icon={DollarSign} label="Total Revenue" value={fmtCurr(totals.total_revenue)} accent="amber" />
                        <MetricCard
                            icon={TrendingUp}
                            label="Conversion Rate"
                            value={`${totals.conversion_rate || 0}%`}
                            accent="purple"
                            note={totals.total_visitors > 0 ? `${totals.total_bookings} of ${totals.total_visitors} visitors` : 'No data yet'}
                        />
                    </div>

                    {/* Revenue by Source Chart */}
                    {sources.length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <SectionCard title="Revenue by Source">
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={sources} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                            <XAxis dataKey="source" tick={{ fontSize: 12 }} />
                                            <YAxis
                                                tick={{ fontSize: 12 }}
                                                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`}
                                            />
                                            <Tooltip
                                                formatter={(v) => fmtCurr(v)}
                                                contentStyle={{
                                                    borderRadius: '12px',
                                                    border: '1px solid #e5e7eb',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                                }}
                                            />
                                            <Bar dataKey="revenue" fill="url(#revenueGrad)" radius={[6, 6, 0, 0]} />
                                            <defs>
                                                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#6366f1" />
                                                    <stop offset="100%" stopColor="#818cf8" />
                                                </linearGradient>
                                            </defs>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </SectionCard>

                            <SectionCard title="Visitor Distribution">
                                <div className="h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={sources}
                                                dataKey="visitors"
                                                nameKey="source"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={90}
                                                innerRadius={50}
                                                paddingAngle={3}
                                                label={({ source, percent }) => `${source} ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {sources.map((_, i) => (
                                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(v) => fmtNum(v)} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </SectionCard>
                        </div>
                    )}

                    {/* Source Breakdown Table */}
                    <SectionCard title="Source Breakdown">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-neutral-800">
                                        {['Source', 'Visitors', 'Bookings', 'Revenue', 'Conv %', 'Ad Spend', 'ROAS'].map((h) => (
                                            <th key={h} className="py-3 px-4 text-left font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide text-xs">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {sources.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-12 text-center text-gray-400 dark:text-neutral-500">
                                                No conversion data yet. Visits with UTM params will appear here.
                                            </td>
                                        </tr>
                                    ) : (
                                        sources.map((row, i) => (
                                            <tr
                                                key={row.source}
                                                className="border-b border-gray-100 dark:border-neutral-800/50 hover:bg-gray-50 dark:hover:bg-neutral-800/30 transition-colors"
                                            >
                                                <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className="h-2.5 w-2.5 rounded-full shrink-0"
                                                            style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                                        />
                                                        {row.source || 'direct'}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-gray-700 dark:text-neutral-300">{fmtNum(row.visitors)}</td>
                                                <td className="py-3 px-4 text-gray-700 dark:text-neutral-300">{fmtNum(row.bookings)}</td>
                                                <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">{fmtCurr(row.revenue)}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${row.conversion_rate >= 10
                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                            : row.conversion_rate >= 5
                                                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                                : 'bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-neutral-400'
                                                        }`}>
                                                        {row.conversion_rate}%
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-gray-700 dark:text-neutral-300">
                                                    {row.spend > 0 ? fmtCurr(row.spend) : '—'}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {row.roas != null ? (
                                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${row.roas >= 3
                                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                                : row.roas >= 1
                                                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                            }`}>
                                                            {row.roas}x
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 dark:text-neutral-500">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </SectionCard>

                    {/* Ad Spend Management */}
                    <SectionCard
                        title="Ad Spend"
                        action={
                            <button
                                onClick={() => setShowAddSpend(!showAddSpend)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Add Spend
                            </button>
                        }
                    >
                        {/* Add Form */}
                        {showAddSpend && (
                            <form onSubmit={handleAddSpend} className="mb-4 p-4 rounded-xl bg-gray-50 dark:bg-neutral-800/50 border border-gray-200 dark:border-neutral-700">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <input
                                        type="text"
                                        placeholder="Source (e.g. facebook)"
                                        value={spendForm.source}
                                        onChange={(e) => setSpendForm({ ...spendForm, source: e.target.value })}
                                        className="rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="Campaign (optional)"
                                        value={spendForm.campaign}
                                        onChange={(e) => setSpendForm({ ...spendForm, campaign: e.target.value })}
                                        className="rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="Spend (₹)"
                                            value={spendForm.spend}
                                            onChange={(e) => setSpendForm({ ...spendForm, spend: e.target.value })}
                                            className="flex-1 rounded-xl border border-gray-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/40 focus:outline-none"
                                            required
                                        />
                                        <button
                                            type="submit"
                                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/30"
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}

                        {/* Spend List */}
                        {adSpendList.length === 0 ? (
                            <p className="text-sm text-gray-400 dark:text-neutral-500 text-center py-6">
                                No ad spend entries yet. Add your ad spend to calculate ROAS.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-neutral-800">
                                            {['Source', 'Campaign', 'Spend', 'Period', ''].map((h) => (
                                                <th key={h} className="py-3 px-4 text-left font-semibold text-gray-500 dark:text-neutral-400 uppercase tracking-wide text-xs">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {adSpendList.map((entry) => (
                                            <tr
                                                key={entry.id}
                                                className="border-b border-gray-100 dark:border-neutral-800/50 hover:bg-gray-50 dark:hover:bg-neutral-800/30 transition-colors"
                                            >
                                                <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{entry.source}</td>
                                                <td className="py-3 px-4 text-gray-700 dark:text-neutral-300">{entry.campaign || '—'}</td>
                                                <td className="py-3 px-4 font-semibold text-gray-900 dark:text-white">{fmtCurr(entry.spend)}</td>
                                                <td className="py-3 px-4 text-gray-500 dark:text-neutral-400 text-xs">
                                                    {entry.period_start && entry.period_end
                                                        ? `${dayjs(entry.period_start).format('DD MMM')} – ${dayjs(entry.period_end).format('DD MMM YYYY')}`
                                                        : '—'}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <button
                                                        onClick={() => handleDeleteSpend(entry.id)}
                                                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </SectionCard>
                </>
            )}
        </div>
    );
}
