// src/admin/pages/analytics/People.jsx
import React from 'react';
import dayjs from 'dayjs';
import adminApi from '../../services/adminApi';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const quickRanges = [
  { key: '7d', label: '7 days', from: () => dayjs().subtract(7, 'day'), to: () => dayjs() },
  { key: '30d', label: '30 days', from: () => dayjs().subtract(30, 'day'), to: () => dayjs() },
  { key: 'thisMonth', label: 'MTD', from: () => dayjs().startOf('month'), to: () => dayjs() },
  { key: 'year', label: 'YTD', from: () => dayjs().startOf('year'), to: () => dayjs() },
];

const SectionCard = ({ title, subtitle, children }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
    <div className="mb-4">
      <p className="text-sm font-semibold text-gray-900 dark:text-neutral-100">{title}</p>
      {subtitle ? <p className="text-xs text-gray-500">{subtitle}</p> : null}
    </div>
    {children}
  </div>
);

const Stat = ({ label, value }) => (
  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
    <p className="text-xs text-gray-500 uppercase font-semibold">{label}</p>
    <p className="text-lg font-semibold text-gray-900">{value}</p>
  </div>
);

export default function People() {
  const [from, setFrom] = React.useState(dayjs().subtract(30, 'day').startOf('day').toISOString());
  const [to, setTo] = React.useState(dayjs().endOf('day').toISOString());
  const [data, setData] = React.useState([]);
  const [rangeKey, setRangeKey] = React.useState('30d');

  React.useEffect(() => {
    (async () => {
      const rows = await adminApi.get('/api/admin/analytics/daily', { from, to });
      const withAvg = (rows || []).map((r) => ({ ...r, avg_people_per_booking: r.bookings ? (r.people || 0) / r.bookings : 0 }));
      setData(withAvg);
    })();
  }, [from, to]);

  const csvUrl = `/api/admin/analytics/report.csv?type=daily&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

  const totals = React.useMemo(() => {
    return data.reduce(
      (acc, row) => {
        acc.people += Number(row.people || 0);
        acc.bookings += Number(row.bookings || 0);
        return acc;
      },
      { bookings: 0, people: 0 }
    );
  }, [data]);

  const average = totals.bookings ? (totals.people / totals.bookings).toFixed(2) : '0.00';

  const applyRange = (key) => {
    const cfg = quickRanges.find((r) => r.key === key);
    if (!cfg) return;
    setRangeKey(key);
    setFrom(cfg.from().startOf('day').toISOString());
    setTo(cfg.to().endOf('day').toISOString());
  };

  return (
    <div className="space-y-6">
      <SectionCard title="People Metrics" subtitle="Understand per-booking crowd sizes">
        <div className="flex flex-wrap gap-2 mb-3">
          {quickRanges.map((r) => (
            <button
              key={r.key}
              onClick={() => applyRange(r.key)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${rangeKey === r.key ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input type="datetime-local" className="rounded-lg border px-3 py-2 text-sm" value={dayjs(from).format('YYYY-MM-DDTHH:mm')} onChange={(e) => setFrom(dayjs(e.target.value).toISOString())} />
          <input type="datetime-local" className="rounded-lg border px-3 py-2 text-sm" value={dayjs(to).format('YYYY-MM-DDTHH:mm')} onChange={(e) => setTo(dayjs(e.target.value).toISOString())} />
          <a href={csvUrl} className="rounded-lg border px-3 py-2 text-sm text-center">Download CSV</a>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Stat label="Total People" value={totals.people.toLocaleString()} />
        <Stat label="Total Bookings" value={totals.bookings.toLocaleString()} />
        <Stat label="Avg People / Booking" value={average} />
      </div>

      <SectionCard title="Average People per Booking" subtitle="Daily trend">
        <div style={{ height: 360 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="bucket" tickFormatter={(v) => dayjs(v).format('MM-DD')} />
              <YAxis />
              <Tooltip labelFormatter={(v) => dayjs(v).format('YYYY-MM-DD')} />
              <Legend />
              <Line type="monotone" dataKey="avg_people_per_booking" stroke="#10b981" name="Avg People/Booking" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>
    </div>
  );
}