import React from 'react';
import dayjs from 'dayjs';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import { urlWithQuery } from '../../../services/endpoints';
import { formatCurrency } from '../../../utils/formatters';

// Dynamic loader for Recharts (works fine with React 19)
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

const MetricCard = ({ label, value, note, accent = 'from-gray-500 to-gray-700' }) => (
  <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 dark:bg-neutral-900 dark:border-neutral-800">
    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</div>
    <div className={`mt-3 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${accent}`}>{value}</div>
    {note ? <div className="text-xs text-gray-500 mt-2">{note}</div> : null}
  </div>
);

function MiniOverviewChart({ data }) {
  const [lib, setLib] = React.useState(null);
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const m = await import('recharts');
        if (!mounted) return;
        setLib({
          ResponsiveContainer: m.ResponsiveContainer,
          AreaChart: m.AreaChart,
          Area: m.Area,
          CartesianGrid: m.CartesianGrid,
          XAxis: m.XAxis,
          YAxis: m.YAxis,
          Tooltip: m.Tooltip
        });
      } catch (e) {
        console.warn('Recharts not available; showing fallback', e);
        if (mounted) setLib(false);
      }
    })();
    return () => { mounted = false; };
  }, []);
  if (lib === null) return <div className="h-60 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-3 animate-pulse" />;
  if (lib === false) {
    return (
      <div className="h-60 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-3 text-sm text-gray-600 dark:text-neutral-300 flex items-center justify-center">
        Charts unavailable (install: npm i recharts --legacy-peer-deps)
      </div>
    );
  }
  const { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } = lib;
  return (
    <div className="h-60 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-3">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
          <XAxis dataKey="bucket" />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="bookings" stroke="#2563eb" fill="#93c5fd" name="Bookings" />
          <Area type="monotone" dataKey="revenue" stroke="#16a34a" fill="#86efac" name="Revenue" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function MiniPieChart({ data }) {
  const [lib, setLib] = React.useState(null);
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const m = await import('recharts');
        if (!mounted) return;
        setLib({
          ResponsiveContainer: m.ResponsiveContainer,
          PieChart: m.PieChart,
          Pie: m.Pie,
          Cell: m.Cell,
          Tooltip: m.Tooltip,
          Legend: m.Legend
        });
      } catch (e) {
        console.warn('Recharts not available; showing fallback', e);
        if (mounted) setLib(false);
      }
    })();
    return () => { mounted = false; };
  }, []);
  if (lib === null) return <div className="h-60 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-3 animate-pulse" />;
  if (lib === false) {
    return (
      <div className="h-60 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-3 text-sm text-gray-600 dark:text-neutral-300 flex items-center justify-center">
        Charts unavailable (install: npm i recharts --legacy-peer-deps)
      </div>
    );
  }
  const { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } = lib;
  const palette = ['#60a5fa','#f59e0b','#10b981','#ef4444','#a78bfa','#f472b6'];
  const series = Array.isArray(data) ? data.map((r) => ({ name: String(r.booking_status || r.name), value: Number(r.count || r.value || 0) })) : [];
  return (
    <div className="h-60 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-3">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={series} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
            {series.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={palette[index % palette.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Overview() {
  const [state, setState] = React.useState({
    status: 'idle',
    error: null,
    main: null,
    breakdown: [],
    attractions: [],
    attractionId: '',
    trend: [],
    from: '',
    to: ''
  });

  React.useEffect(() => {
    (async () => {
      setState((s) => ({ ...s, status: 'loading', error: null }));
      try {
        // Load filters (attractions for dropdown)
        const [attrs, ov] = await Promise.all([
          adminApi.get(A.attractions(), { params: { limit: 200 } }).catch(() => []),
          adminApi.get(A.analyticsOverview(), { params: { ...(state.from && { from: state.from }), ...(state.to && { to: state.to }), attraction_id: state.attractionId || undefined } })
        ]);
        const main = ov?.summary || ov || null;
        const breakdown = ov?.statusBreakdown || [];
        const tr = ov?.trend || [];
        setState((s) => ({ ...s, status: 'succeeded', main, breakdown, trend: tr, attractions: Array.isArray(attrs?.data) ? attrs.data : Array.isArray(attrs) ? attrs : [] }));
      } catch (err) {
        setState((s) => ({ ...s, status: 'failed', error: err }));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reload = async () => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const ov = await adminApi.get(A.analyticsOverview(), { params: { ...(state.from && { from: state.from }), ...(state.to && { to: state.to }), attraction_id: state.attractionId || undefined } });
      const main = ov?.summary || ov || null;
      const breakdown = ov?.statusBreakdown || [];
      const tr = ov?.trend || [];
      setState((s) => ({ ...s, status: 'succeeded', main, breakdown, trend: tr }));
    } catch (err) {
      setState((s) => ({ ...s, status: 'failed', error: err }));
    }
  };

  const setQuick = (key) => {
    const today = dayjs();
    if (key === 'all') {
      setState((s) => ({ ...s, from: '', to: '' }));
    } else if (key === 'today') {
      setState((s) => ({ ...s, from: today.format('YYYY-MM-DD'), to: today.format('YYYY-MM-DD') }));
    } else if (key === 'tomorrow') {
      const t = today.add(1, 'day');
      setState((s) => ({ ...s, from: t.format('YYYY-MM-DD'), to: t.format('YYYY-MM-DD') }));
    } else if (key === 'week') {
      const dow = today.day();
      const start = today.subtract(dow, 'day');
      const end = start.add(6, 'day');
      setState((s) => ({ ...s, from: start.format('YYYY-MM-DD'), to: end.format('YYYY-MM-DD') }));
    }
  };

  if (state.status === 'loading' && !state.main) return <div>Loading…</div>;
  if (state.status === 'failed') return <div className="text-red-600">{state.error?.message || 'Failed to load'}</div>;

  const d = state.main || {};
  const statusData = state.breakdown || [];
  const attractions = state.attractions || [];
  const paidRevenue = Number(d.total_revenue || 0);
  const pendingRevenue = Number(d.pending_revenue || 0);
  const totalRevenue = paidRevenue + pendingRevenue;
  const paidPct = totalRevenue ? Math.round((paidRevenue / totalRevenue) * 100) : 0;

  const metricConfig = [
    { key: 'total_bookings', label: 'Confirmed', note: 'Paid bookings', accent: 'from-blue-500 to-indigo-600', formatter: (v) => Number(v || 0).toLocaleString() },
    { key: 'pending_bookings', label: 'Pending', note: 'Awaiting payment', accent: 'from-amber-400 to-orange-500', formatter: (v) => Number(v || 0).toLocaleString() },
    { key: 'total_revenue', label: 'Revenue (Paid)', accent: 'from-emerald-500 to-green-600', formatter: (v) => formatCurrency(v || 0) },
    { key: 'pending_revenue', label: 'Revenue (Pending)', accent: 'from-rose-500 to-pink-500', formatter: (v) => formatCurrency(v || 0) },
    { key: 'total_people', label: 'Tickets Sold', accent: 'from-slate-500 to-slate-700', formatter: (v) => Number(v || 0).toLocaleString() },
    { key: 'unique_users', label: 'Unique Users', accent: 'from-teal-500 to-cyan-500', formatter: (v) => Number(v || 0).toLocaleString() },
    { key: 'today_bookings', label: 'Today', note: 'Paid bookings', accent: 'from-purple-500 to-fuchsia-500', formatter: (v) => Number(v || 0).toLocaleString() }
  ];

  return (
    <div className="space-y-6">
      <SectionCard title="Analytics Filters" subtitle="Deep dive by attraction and timeframe" className="p-4">
        <div className="flex flex-col lg:flex-row lg:items-end gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Attraction</label>
            <select
              className="rounded-md border px-3 py-2 min-w-[220px]"
              value={state.attractionId}
              onChange={(e) => setState((s) => ({ ...s, attractionId: e.target.value }))}
            >
              <option value="">All attractions</option>
              {attractions.map((a) => (
                <option key={a.attraction_id || a.id} value={a.attraction_id || a.id}>{a.title || a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">From</label>
            <input type="date" className="rounded-md border px-3 py-2" value={state.from} onChange={(e) => setState((s) => ({ ...s, from: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">To</label>
            <input type="date" className="rounded-md border px-3 py-2" value={state.to} onChange={(e) => setState((s) => ({ ...s, to: e.target.value }))} />
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-full border px-3 py-1.5 text-sm" onClick={() => setQuick('all')}>All Time</button>
            <button className="rounded-full border px-3 py-1.5 text-sm" onClick={() => setQuick('today')}>Today</button>
            <button className="rounded-full border px-3 py-1.5 text-sm" onClick={() => setQuick('tomorrow')}>Tomorrow</button>
            <button className="rounded-full border px-3 py-1.5 text-sm" onClick={() => setQuick('week')}>This Week</button>
            <button className="rounded-full bg-gray-900 text-white px-4 py-1.5 text-sm" onClick={reload}>Apply</button>
          </div>
          <div className="flex gap-2 ml-auto">
            <a
              className="rounded-full border px-3 py-1.5 text-sm"
              href={urlWithQuery('/api/admin/analytics/report.csv', { type: 'bookings', from: state.from, to: state.to, attraction_id: state.attractionId || undefined })}
              target="_blank" rel="noopener noreferrer"
            >Download CSV</a>
            <a
              className="rounded-full border px-3 py-1.5 text-sm"
              href={urlWithQuery('/api/admin/analytics/report.pdf', { type: 'bookings', from: state.from, to: state.to, attraction_id: state.attractionId || undefined })}
              target="_blank" rel="noopener noreferrer"
            >PDF</a>
          </div>
        </div>
      </SectionCard>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {metricConfig.map((m) => (
          <MetricCard
            key={m.key}
            label={m.label}
            value={m.formatter ? m.formatter(d[m.key]) : d[m.key] ?? '—'}
            note={m.note}
            accent={m.accent}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Momentum" subtitle="Bookings vs revenue trend">
          <MiniOverviewChart data={state.trend} />
        </SectionCard>
        <SectionCard title="Booking Status" subtitle="Distribution across payment statuses">
          <MiniPieChart data={statusData} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Revenue Mix" subtitle="Paid vs pending collections">
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Paid</span>
                <span>{formatCurrency(paidRevenue)}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 mt-2">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${paidPct}%` }} />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Pending</span>
              <span>{formatCurrency(pendingRevenue)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-emerald-50 p-3">
                <p className="text-xs text-emerald-600 uppercase">Conversion</p>
                <p className="text-2xl font-semibold text-emerald-700">{paidPct}%</p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3">
                <p className="text-xs text-amber-600 uppercase">Open Value</p>
                <p className="text-2xl font-semibold text-amber-700">{formatCurrency(pendingRevenue)}</p>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Recent Status Breakdown" subtitle="Top ticket states">
          <div className="space-y-3">
            {statusData.length === 0 && <p className="text-sm text-gray-500">No records in range.</p>}
            {statusData.map((row) => (
              <div key={row.booking_status} className="flex items-center justify-between text-sm">
                <div className="font-semibold text-gray-800">
                  {row.booking_status}
                </div>
                <div className="text-gray-500">{row.count} bookings</div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}