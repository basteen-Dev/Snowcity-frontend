// src/admin/pages/Dashboard.jsx
import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import adminApi from '../services/adminApi';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import useReportDownload from '../hooks/useReportDownload';

const RANGES = [
  { key: 'all', label: 'All Time', get: () => ({ from: undefined, to: undefined }) },
  { key: 'today', label: 'Today', get: () => ({ from: dayjs().format('YYYY-MM-DD'), to: dayjs().format('YYYY-MM-DD') }) },
  { key: 'yesterday', label: 'Yesterday', get: () => ({ from: dayjs().subtract(1, 'day').format('YYYY-MM-DD'), to: dayjs().subtract(1, 'day').format('YYYY-MM-DD') }) },
  { key: 'past7', label: 'Past Week', get: () => ({ from: dayjs().subtract(7, 'day').format('YYYY-MM-DD'), to: dayjs().format('YYYY-MM-DD') }) },
  { key: 'thisMonth', label: 'This Month', get: () => ({ from: dayjs().startOf('month').format('YYYY-MM-DD'), to: dayjs().endOf('month').format('YYYY-MM-DD') }) },
];

const COLORS = ['#2563eb','#10b981','#f59e0b','#ef4444','#8b5cf6','#14b8a6','#e11d48','#22c55e','#f97316','#3b82f6'];

const metricConfig = [
  { key: 'total_bookings', label: 'Confirmed Bookings', accent: 'from-blue-500 to-indigo-600', formatter: (v) => Number(v || 0).toLocaleString(), note: 'Paid orders' },
  { key: 'pending_bookings', label: 'Pending Bookings', accent: 'from-amber-400 to-orange-500', formatter: (v) => Number(v || 0).toLocaleString(), note: 'Awaiting payment' },
  { key: 'total_revenue', label: 'Revenue (Paid)', accent: 'from-emerald-500 to-green-600', formatter: (v) => formatCurrency(v || 0), note: 'Captured revenue' },
  { key: 'pending_revenue', label: 'Pending Revenue', accent: 'from-rose-500 to-pink-500', formatter: (v) => formatCurrency(v || 0), note: 'Held in cart / unpaid' },
  { key: 'total_people', label: 'Tickets (People)', accent: 'from-slate-500 to-slate-700', formatter: (v) => Number(v || 0).toLocaleString() },
  { key: 'unique_users', label: 'Unique Users', accent: 'from-teal-500 to-cyan-500', formatter: (v) => Number(v || 0).toLocaleString() },
  { key: 'today_bookings', label: 'Today', accent: 'from-purple-500 to-fuchsia-500', formatter: (v) => Number(v || 0).toLocaleString(), note: 'Paid today' },
];

const numberFmt = (v = 0) => Number(v || 0).toLocaleString();

const SectionCard = ({ title, subtitle, children, className = '' }) => (
  <div className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:bg-neutral-900 dark:border-neutral-800 ${className}`}>
    <div className="flex items-start justify-between mb-4">
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-neutral-100">{title}</p>
        {subtitle ? <p className="text-xs text-gray-500">{subtitle}</p> : null}
      </div>
    </div>
    {children}
  </div>
);

const MetricCard = ({ label, value, note, accent }) => (
  <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 dark:bg-neutral-900 dark:border-neutral-800">
    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</div>
    <div className={`mt-3 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${accent}`}>{value}</div>
    {note ? <div className="text-xs text-gray-500 mt-2">{note}</div> : null}
  </div>
);

export default function Dashboard() {
  const [rangeKey, setRangeKey] = React.useState('all');
  const [month, setMonth] = React.useState(dayjs().format('YYYY-MM'));
  const [loading, setLoading] = React.useState(false);
  const [summary, setSummary] = React.useState(null);
  const [trend, setTrend] = React.useState([]);
  const [attractions, setAttractions] = React.useState([]);
  const { download, downloading, error: downloadError } = useReportDownload();

  const computeRange = () => {
    if (rangeKey === 'customMonth') {
      const base = dayjs(`${month}-01`);
      return { from: base.startOf('month').format('YYYY-MM-DD'), to: base.endOf('month').format('YYYY-MM-DD') };
    }
    const r = RANGES.find((x) => x.key === rangeKey) || RANGES[0];
    return r.get();
  };

  async function load() {
    setLoading(true);
    try {
      const { from, to } = computeRange();
      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;

      const overview = await adminApi.get('/api/admin/analytics/overview', params);
      setSummary(overview?.summary || overview);

      const t = await adminApi.get('/api/admin/analytics/trend', { ...params, granularity: 'day' });
      setTrend(Array.isArray(t) ? t : (t?.data || []));

      const topA = await adminApi.get('/api/admin/analytics/top-attractions', { ...params, limit: 10 });
      setAttractions(Array.isArray(topA) ? topA : (topA?.data || []));
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); /* eslint-disable-next-line */ }, [rangeKey, month]);

  const { from, to } = computeRange();
  const downloadFormats = [
    { label: 'CSV', ext: 'csv' },
    { label: 'Excel', ext: 'xlsx' },
    { label: 'PDF', ext: 'pdf' }
  ];
  const handleDownload = (type, ext) => () => download({ type, ext, params: { from, to } });

  const paid = Number(summary?.total_revenue || 0);
  const pending = Number(summary?.pending_revenue || 0);
  const totalRevenue = paid + pending;
  const paidPct = totalRevenue ? Math.round((paid / totalRevenue) * 100) : 0;

  const attractionList = useMemo(() => (attractions || []).slice(0, 6), [attractions]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <SectionCard title="Performance Filters" subtitle="Quickly slice data by period" className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRangeKey(r.key)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${rangeKey === r.key ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-700 hover:border-gray-400'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRangeKey('customMonth')}
              className={`px-3 py-1.5 rounded-full text-sm border ${rangeKey === 'customMonth' ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-700 hover:border-gray-400'}`}
            >
              Month
            </button>
            <input
              type="month"
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:ring-2 focus:ring-gray-900"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            {downloadFormats.map((fmt) => (
              <button
                key={`trend-${fmt.ext}`}
                type="button"
                className="px-3 py-1.5 rounded-full border text-sm disabled:opacity-50"
                onClick={handleDownload('trend', fmt.ext)}
                disabled={downloading}
              >
                Trend {fmt.label}
              </button>
            ))}
            {downloadFormats.map((fmt) => (
              <button
                key={`attr-${fmt.ext}`}
                type="button"
                className="px-3 py-1.5 rounded-full border text-sm disabled:opacity-50"
                onClick={handleDownload('top-attractions', fmt.ext)}
                disabled={downloading}
              >
                Attractions {fmt.label}
              </button>
            ))}
          </div>
        </div>
        {downloadError && (
          <p className="text-xs text-red-600 mt-2">{downloadError.message || 'Failed to download report.'}</p>
        )}
      </SectionCard>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {metricConfig.map((metric) => (
          <MetricCard
            key={metric.key}
            label={metric.label}
            value={metric.formatter(summary?.[metric.key])}
            note={metric.note}
            accent={metric.accent}
          />
        ))}
      </div>

      {/* Trend + Revenue Split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <SectionCard title="Daily Momentum" subtitle="Confirmed bookings vs visitors" className="xl:col-span-2">
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="bucket" tickFormatter={(v) => dayjs(v).format('MM-DD')} />
                <YAxis />
                <Tooltip labelFormatter={(v) => dayjs(v).format('YYYY-MM-DD')} />
                <Legend />
                <Line type="monotone" dataKey="bookings" stroke="#2563eb" name="Bookings" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="people" stroke="#10b981" name="People" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
        <SectionCard title="Revenue Mix" subtitle="Paid vs pending inflows">
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Paid</span>
                <span>{formatCurrency(paid)}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${paidPct}%` }} />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Pending</span>
              <span>{formatCurrency(pending)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-emerald-50 p-3">
                <p className="text-xs text-emerald-600 uppercase">Conversion</p>
                <p className="text-2xl font-semibold text-emerald-700">{paidPct}%</p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3">
                <p className="text-xs text-amber-600 uppercase">Open Value</p>
                <p className="text-2xl font-semibold text-amber-700">{formatCurrency(pending)}</p>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Attraction Performance & Share */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Top Attractions" subtitle="Ranked by paid bookings">
          <div className="space-y-3">
            {attractionList.length === 0 && <p className="text-sm text-gray-500">No data available.</p>}
            {attractionList.map((attr, idx) => {
              const progress = attr.bookings ? Math.min(100, (attr.bookings / (attractionList[0]?.bookings || 1)) * 100) : 0;
              return (
                <div key={attr.attraction_id || idx} className="p-3 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between text-sm font-medium text-gray-800">
                    <span>{idx + 1}. {attr.title}</span>
                    <span>{numberFmt(attr.bookings)} bookings</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 mt-2">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                    <span>People: {numberFmt(attr.people)}</span>
                    <span>Revenue: {formatCurrency(attr.revenue)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title="Share of Bookings" subtitle="Top 10 attractions">
          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={attractions || []} dataKey="bookings" nameKey="title" innerRadius={70} outerRadius={110} paddingAngle={2}>
                  {(attractions || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value, name, props) => [`${value} bookings`, props?.payload?.title || name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      {loading ? <div className="text-sm text-gray-500">Refreshing analytics…</div> : null}
    </div>
  );
}