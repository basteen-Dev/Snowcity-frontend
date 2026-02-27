import React from 'react';
import dayjs from 'dayjs';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import { FileText, FileSpreadsheet, Search, Filter, TrendingUp, DollarSign, Calendar, Ticket, RotateCcw } from 'lucide-react';

/* ─── UI helpers ─────────────────────────────────────────── */
const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString()}`;
const formatNumber = (v) => Number(v || 0).toLocaleString();

const inputClasses = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all placeholder:text-gray-400';
const selectClasses = `${inputClasses} appearance-none cursor-pointer`;
const btnPrimary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 text-sm font-semibold shadow-sm shadow-blue-500/20 hover:shadow-md hover:shadow-blue-500/30 transition-all';
const btnSecondary = 'inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800 transition-all';

const SummaryCard = ({ icon, label, value, note, accent = 'from-blue-500 to-indigo-600' }) => (
    <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm p-5 dark:bg-neutral-900 dark:border-neutral-800 group hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
            <div className="space-y-1">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</div>
                <div className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${accent}`}>{value}</div>
                {note && <div className="text-xs text-gray-500 dark:text-neutral-400">{note}</div>}
            </div>
            {icon && <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-neutral-800 text-gray-400">{icon}</div>}
        </div>
        <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-r ${accent} opacity-5 group-hover:opacity-10 transition-opacity`} />
    </div>
);

const SectionCard = ({ title, subtitle, children, className = '' }) => (
    <div className={`rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:bg-neutral-900 dark:border-neutral-800 ${className}`}>
        {title && (
            <div className="px-5 pt-5 pb-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-neutral-100">{title}</p>
                {subtitle && <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">{subtitle}</p>}
            </div>
        )}
        <div className="px-5 pb-5">{children}</div>
    </div>
);

const normalizeOptionList = (res) => {
    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.items)) return res.items;
    if (Array.isArray(res.results)) return res.results;
    if (res.data && Array.isArray(res.data.items)) return res.data.items;
    if (res.data && Array.isArray(res.data.results)) return res.data.results;
    if (res.data && Array.isArray(res.data.data)) return res.data.data;
    return [];
};

const quickRanges = [
    { key: 'today', label: 'Today', from: () => dayjs().startOf('day'), to: () => dayjs().endOf('day') },
    { key: 'yesterday', label: 'Yesterday', from: () => dayjs().subtract(1, 'day').startOf('day'), to: () => dayjs().subtract(1, 'day').endOf('day') },
    { key: 'thisWeek', label: 'This Week', from: () => dayjs().startOf('week'), to: () => dayjs().endOf('week') },
    { key: 'thisMonth', label: 'This Month', from: () => dayjs().startOf('month'), to: () => dayjs().endOf('month') },
    { key: 'last7', label: 'Last 7 days', from: () => dayjs().subtract(6, 'day').startOf('day'), to: () => dayjs().endOf('day') },
    { key: 'last30', label: 'Last 30 days', from: () => dayjs().subtract(29, 'day').startOf('day'), to: () => dayjs().endOf('day') },
    { key: 'all', label: 'All time', from: () => null, to: () => null }
];

/* ─── Main Component ─────────────────────────────────────── */

export default function BookingsAnalytics() {
    const [activeRange, setActiveRange] = React.useState('all');
    const [dateFilters, setDateFilters] = React.useState({ from: '', to: '' });
    const [overview, setOverview] = React.useState({ status: 'idle', trend: [], summary: null });
    const [revenueData, setRevenueData] = React.useState({
        attraction: { status: 'idle', data: null },
        combo: { status: 'idle', data: null }
    });
    const [revenueFilters, setRevenueFilters] = React.useState({
        attraction: { from: '', to: '', attraction_id: '' },
        combo: { from: '', to: '', attraction_id: '', combo_id: '' },
    });
    const [options, setOptions] = React.useState({ status: 'idle', attractions: [], combos: [] });

    React.useEffect(() => {
        loadOverview();
        loadRevenueData('both');
        loadOptions();
    }, []);

    const loadOptions = async () => {
        setOptions(s => ({ ...s, status: 'loading' }));
        try {
            const [aRes, cRes] = await Promise.all([
                adminApi.get(A.attractions(), { params: { limit: 1000 } }),
                adminApi.get(A.combos(), { params: { limit: 1000 } }),
            ]);
            setOptions({
                status: 'succeeded',
                attractions: normalizeOptionList(aRes),
                combos: normalizeOptionList(cRes),
            });
        } catch {
            setOptions(s => ({ ...s, status: 'failed' }));
        }
    };

    const loadOverview = async () => {
        setOverview(s => ({ ...s, status: 'loading' }));
        try {
            const res = await adminApi.get(A.analyticsOverview(), {
                params: { from: dateFilters.from || undefined, to: dateFilters.to || undefined }
            });
            setOverview({ status: 'succeeded', trend: Array.isArray(res?.trend) ? res.trend : [], summary: res?.summary || res });
        } catch {
            setOverview(s => ({ ...s, status: 'failed' }));
        }
    };

    const loadRevenueData = async (target = 'both') => {
        const targets = target === 'both' ? ['attraction', 'combo'] : [target];
        for (const t of targets) {
            const f = revenueFilters[t];
            setRevenueData(prev => ({ ...prev, [t]: { status: 'loading', data: null } }));
            try {
                const endpoint = t === 'attraction' ? A.analyticsAttractionRevenue() : A.analyticsComboRevenue();
                const res = await adminApi.get(endpoint, {
                    params: {
                        from: f.from || dateFilters.from || undefined,
                        to: f.to || dateFilters.to || undefined,
                        attraction_id: f.attraction_id || undefined,
                        ...(t === 'combo' ? { combo_id: f.combo_id || undefined } : {})
                    }
                });
                setRevenueData(prev => ({ ...prev, [t]: { status: 'succeeded', data: res } }));
            } catch {
                setRevenueData(prev => ({ ...prev, [t]: { status: 'failed', data: null } }));
            }
        }
    };

    const downloadReport = (type, format) => {
        try {
            const f = revenueFilters[type === 'attraction-revenue' ? 'attraction' : 'combo'];
            const params = {
                type,
                from: f?.from || dateFilters.from || undefined,
                to: f?.to || dateFilters.to || undefined,
                attraction_id: f?.attraction_id || undefined,
                combo_id: type === 'combo-revenue' ? f?.combo_id || undefined : undefined
            };
            window.open(`${A.analyticsReport(format)}?${new URLSearchParams(params).toString()}`, '_blank');
        } catch { alert('Failed to download report'); }
    };

    const applyQuickRange = (key) => {
        const range = quickRanges.find(r => r.key === key);
        if (!range) return;
        const from = range.from();
        const to = range.to();
        setDateFilters({
            from: from ? from.format('YYYY-MM-DD') : '',
            to: to ? to.format('YYYY-MM-DD') : ''
        });
        setActiveRange(key);
        // Reload after state update
        setTimeout(() => { loadOverview(); loadRevenueData('both'); }, 0);
    };

    const handleRevenueFilterChange = (card, field, value) => {
        setRevenueFilters(prev => ({ ...prev, [card]: { ...prev[card], [field]: value } }));
    };

    return (
        <div className="space-y-5">
            {/* ── Header ── */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">Bookings Analytics</h1>
                    <p className="text-sm text-gray-500 dark:text-neutral-400 mt-0.5">Revenue, trends & performance</p>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                    {quickRanges.map((range) => (
                        <button
                            key={range.key}
                            onClick={() => applyQuickRange(range.key)}
                            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-all ${activeRange === range.key
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-sm shadow-blue-500/20'
                                : 'border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800'}`}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Summary Cards ── */}
            {overview.summary && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <SummaryCard label="Paid Bookings" value={formatNumber(overview.summary.total_bookings)} note="Confirmed" icon={<Ticket className="h-5 w-5" />} />
                    <SummaryCard label="Pending" value={formatNumber(overview.summary.pending_bookings)} note="Awaiting payment" accent="from-amber-400 to-orange-500" icon={<Calendar className="h-5 w-5" />} />
                    <SummaryCard label="Attraction Revenue" value={formatCurrency(revenueData.attraction.data?.attraction_revenue)} note={`${formatNumber(revenueData.attraction.data?.attraction_bookings)} bookings`} accent="from-cyan-500 to-blue-600" icon={<TrendingUp className="h-5 w-5" />} />
                    <SummaryCard label="Combo Revenue" value={formatCurrency(overview.summary.combo_revenue)} note={`${overview.summary.combo_bookings || 0} combos`} accent="from-indigo-500 to-purple-600" icon={<DollarSign className="h-5 w-5" />} />
                </div>
            )}

            {/* ── Revenue Cards ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Attraction Revenue */}
                <SectionCard title="Attraction Revenue" subtitle="Completed attraction bookings & revenue">
                    <div className="flex flex-wrap gap-2 mb-3">
                        <input type="date" className={`${inputClasses} flex-1 min-w-[120px]`} value={revenueFilters.attraction.from} onChange={(e) => handleRevenueFilterChange('attraction', 'from', e.target.value)} />
                        <input type="date" className={`${inputClasses} flex-1 min-w-[120px]`} value={revenueFilters.attraction.to} onChange={(e) => handleRevenueFilterChange('attraction', 'to', e.target.value)} />
                        <select className={`${selectClasses} flex-1 min-w-[140px]`} value={revenueFilters.attraction.attraction_id} onChange={(e) => handleRevenueFilterChange('attraction', 'attraction_id', e.target.value)}>
                            <option value="">{options.status === 'loading' ? 'Loading...' : 'All attractions'}</option>
                            {options.attractions.map((a) => (
                                <option key={a.attraction_id || a.id} value={a.attraction_id || a.id}>{a.title || a.name || `#${a.attraction_id || a.id}`}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <button className={btnPrimary} onClick={() => loadRevenueData('attraction')}>Apply</button>
                        <button className={btnSecondary} onClick={() => { setRevenueFilters(p => ({ ...p, attraction: { from: '', to: '', attraction_id: '' } })); loadRevenueData('attraction'); }}>Reset</button>
                        <div className="flex-1" />
                        <button className={btnSecondary} onClick={() => downloadReport('attraction-revenue', 'csv')}><FileSpreadsheet className="h-4 w-4" />CSV</button>
                        <button className={btnSecondary} onClick={() => downloadReport('attraction-revenue', 'pdf')}><FileText className="h-4 w-4" />PDF</button>
                    </div>
                    <div className="rounded-xl border border-gray-100 dark:border-neutral-800 p-4 bg-gray-50/50 dark:bg-neutral-800/30">
                        {revenueData.attraction.status === 'loading' ? (
                            <div className="text-sm text-gray-500">Loading…</div>
                        ) : revenueData.attraction.status === 'failed' ? (
                            <div className="text-sm text-red-600">Failed to load data</div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="text-gray-500 uppercase text-xs tracking-wider">Bookings</div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-neutral-100 mt-1">{formatNumber(revenueData.attraction.data?.attraction_bookings)}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500 uppercase text-xs tracking-wider">Revenue</div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-neutral-100 mt-1">{formatCurrency(revenueData.attraction.data?.attraction_revenue)}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </SectionCard>

                {/* Combo Revenue */}
                <SectionCard title="Combo Revenue" subtitle="Combo bookings & linked revenue">
                    <div className="flex flex-wrap gap-2 mb-3">
                        <input type="date" className={`${inputClasses} flex-1 min-w-[120px]`} value={revenueFilters.combo.from} onChange={(e) => handleRevenueFilterChange('combo', 'from', e.target.value)} />
                        <input type="date" className={`${inputClasses} flex-1 min-w-[120px]`} value={revenueFilters.combo.to} onChange={(e) => handleRevenueFilterChange('combo', 'to', e.target.value)} />
                        <select className={`${selectClasses} flex-1 min-w-[140px]`} value={revenueFilters.combo.attraction_id} onChange={(e) => handleRevenueFilterChange('combo', 'attraction_id', e.target.value)}>
                            <option value="">{options.status === 'loading' ? 'Loading...' : 'All attractions'}</option>
                            {options.attractions.map((a) => (
                                <option key={a.attraction_id || a.id} value={a.attraction_id || a.id}>{a.title || a.name || `#${a.attraction_id || a.id}`}</option>
                            ))}
                        </select>
                        <select className={`${selectClasses} flex-1 min-w-[140px]`} value={revenueFilters.combo.combo_id} onChange={(e) => handleRevenueFilterChange('combo', 'combo_id', e.target.value)}>
                            <option value="">{options.status === 'loading' ? 'Loading...' : 'All combos'}</option>
                            {options.combos.map((c) => (
                                <option key={c.combo_id || c.id} value={c.combo_id || c.id}>{c.title || c.name || `Combo #${c.combo_id || c.id}`}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <button className={btnPrimary} onClick={() => loadRevenueData('combo')}>Apply</button>
                        <button className={btnSecondary} onClick={() => { setRevenueFilters(p => ({ ...p, combo: { from: '', to: '', attraction_id: '', combo_id: '' } })); loadRevenueData('combo'); }}>Reset</button>
                        <div className="flex-1" />
                        <button className={btnSecondary} onClick={() => downloadReport('combo-revenue', 'csv')}><FileSpreadsheet className="h-4 w-4" />CSV</button>
                        <button className={btnSecondary} onClick={() => downloadReport('combo-revenue', 'pdf')}><FileText className="h-4 w-4" />PDF</button>
                    </div>
                    <div className="rounded-xl border border-gray-100 dark:border-neutral-800 p-4 bg-gray-50/50 dark:bg-neutral-800/30">
                        {revenueData.combo.status === 'loading' ? (
                            <div className="text-sm text-gray-500">Loading…</div>
                        ) : revenueData.combo.status === 'failed' ? (
                            <div className="text-sm text-red-600">Failed to load data</div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="text-gray-500 uppercase text-xs tracking-wider">Bookings</div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-neutral-100 mt-1">{formatNumber(revenueData.combo.data?.combo_bookings)}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500 uppercase text-xs tracking-wider">Revenue</div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-neutral-100 mt-1">{formatCurrency(revenueData.combo.data?.combo_revenue)}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </SectionCard>
            </div>

            {/* ── Trend Chart ── */}
            <SectionCard title="Bookings Trend" subtitle="Paid bookings vs revenue over time">
                <div style={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={overview.trend || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                            <Legend />
                            <Line type="monotone" dataKey="bookings" stroke="#2563eb" name="Bookings" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="revenue" stroke="#16a34a" name="Revenue" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </SectionCard>
        </div>
    );
}
