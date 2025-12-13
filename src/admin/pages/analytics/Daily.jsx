// src/admin/pages/analytics/Daily.jsx
import React from 'react';
import dayjs from 'dayjs';
import adminApi from '../../services/adminApi';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, BarChart, Bar } from 'recharts';

const quickRanges = [
  { key: '7d', label: '7 days', from: () => dayjs().subtract(7, 'day'), to: () => dayjs() },
  { key: '30d', label: '30 days', from: () => dayjs().subtract(30, 'day'), to: () => dayjs() },
  { key: 'thisMonth', label: 'Month to date', from: () => dayjs().startOf('month'), to: () => dayjs() },
  { key: 'year', label: 'Year to date', from: () => dayjs().startOf('year'), to: () => dayjs() },
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

const Stat = ({ label, value, subtitle }) => (
  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
    <p className="text-xs text-gray-500 uppercase font-semibold">{label}</p>
    <p className="text-lg font-semibold text-gray-900">{value}</p>
    {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
  </div>
);

export default function Daily() {
  const [from, setFrom] = React.useState(dayjs().subtract(30, 'day').startOf('day').toISOString());
  const [to, setTo] = React.useState(dayjs().endOf('day').toISOString());
  const [data, setData] = React.useState([]);
  const [rangeKey, setRangeKey] = React.useState('30d');
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [attractions, setAttractions] = React.useState([]);
  const [combos, setCombos] = React.useState([]);
  const [selectedAttraction, setSelectedAttraction] = React.useState('');
  const [selectedCombo, setSelectedCombo] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  // Fetch attractions and combos
  React.useEffect(() => {
    (async () => {
      try {
        const [attractionsData, combosData] = await Promise.all([
          adminApi.get('/api/admin/attractions'),
          adminApi.get('/api/admin/combos')
        ]);
        setAttractions(Array.isArray(attractionsData) ? attractionsData : []);
        setCombos(Array.isArray(combosData) ? combosData : []);
      } catch (error) {
        console.error('Error fetching attractions/combos:', error);
      }
    })();
  }, []);

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = { from, to };
        if (selectedAttraction) params.attraction_id = selectedAttraction;
        if (selectedCombo) params.combo_id = selectedCombo;
        
        const rows = await adminApi.get('/api/admin/analytics/daily', params);
        setData(Array.isArray(rows) ? rows : []);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [from, to, selectedAttraction, selectedCombo]);

  const csvUrl = `/api/admin/analytics/report.csv?type=daily&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}${selectedAttraction ? `&attraction_id=${selectedAttraction}` : ''}${selectedCombo ? `&combo_id=${selectedCombo}` : ''}`;

  const totals = React.useMemo(() => {
    return data.reduce(
      (acc, row) => {
        acc.completed_bookings += Number(row.completed_bookings || 0);
        acc.pending_bookings += Number(row.pending_bookings || 0);
        acc.total_bookings += Number(row.total_bookings || 0);
        acc.total_people += Number(row.total_people || 0);
        acc.revenue += Number(row.revenue || 0);
        acc.pending_revenue += Number(row.pending_revenue || 0);
        acc.slots_used += Number(row.slots_used || 0);
        acc.hours_booked += Number(row.hours_booked || 0);
        acc.bookings_with_offers += Number(row.bookings_with_offers || 0);
        acc.total_discounts += Number(row.total_discounts || 0);
        return acc;
      },
      { 
        completed_bookings: 0, 
        pending_bookings: 0, 
        total_bookings: 0, 
        total_people: 0, 
        revenue: 0, 
        pending_revenue: 0,
        slots_used: 0,
        hours_booked: 0,
        bookings_with_offers: 0,
        total_discounts: 0
      }
    );
  }, [data]);

  const applyRange = (key) => {
    const cfg = quickRanges.find((r) => r.key === key);
    if (!cfg) return;
    setRangeKey(key);
    setFrom(cfg.from().startOf('day').toISOString());
    setTo(cfg.to().endOf('day').toISOString());
  };

  const formatCurrency = (amount) => `₹${Number(amount).toLocaleString()}`;

  const getHourlyChartData = (item) => {
    if (!item.hourly_data || !Array.isArray(item.hourly_data)) return [];
    return item.hourly_data.map(hour => ({
      hour: `${hour.hour}:00`,
      bookings: hour.completed_bookings,
      revenue: hour.revenue
    }));
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Daily Analytics Filters" subtitle="Detailed attraction/combo performance metrics">
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
          <input type="datetime-local" className="rounded-lg border px-3 py-2 text-sm" value={dayjs(from).format('YYYY-MM-DDTHH:mm')} onChange={(e) => setFrom(dayjs(e.target.value).toISOString())} />
          <input type="datetime-local" className="rounded-lg border px-3 py-2 text-sm" value={dayjs(to).format('YYYY-MM-DDTHH:mm')} onChange={(e) => setTo(dayjs(e.target.value).toISOString())} />
          
          <select 
            className="rounded-lg border px-3 py-2 text-sm" 
            value={selectedAttraction} 
            onChange={(e) => {
              setSelectedAttraction(e.target.value);
              setSelectedCombo(''); // Clear combo when attraction is selected
            }}
          >
            <option value="">All Attractions</option>
            {attractions.map(attraction => (
              <option key={attraction.id} value={attraction.id}>{attraction.name}</option>
            ))}
          </select>
          
          <select 
            className="rounded-lg border px-3 py-2 text-sm" 
            value={selectedCombo} 
            onChange={(e) => {
              setSelectedCombo(e.target.value);
              setSelectedAttraction(''); // Clear attraction when combo is selected
            }}
          >
            <option value="">All Combos</option>
            {combos.map(combo => (
              <option key={combo.id} value={combo.id}>{combo.name}</option>
            ))}
          </select>
          
          <a href={csvUrl} className="rounded-lg border px-3 py-2 text-sm text-center flex items-center justify-center">Download CSV</a>
        </div>
        {loading && <div className="text-sm text-gray-500">Loading data...</div>}
      </SectionCard>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Completed Bookings" value={totals.completed_bookings.toLocaleString()} />
        <Stat label="Pending Bookings" value={totals.pending_bookings.toLocaleString()} />
        <Stat label="Total People" value={totals.total_people.toLocaleString()} />
        <Stat label="Revenue" value={formatCurrency(totals.revenue)} />
        <Stat label="Pending Revenue" value={formatCurrency(totals.pending_revenue)} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Slots Used" value={totals.slots_used.toLocaleString()} />
        <Stat label="Hours Booked" value={totals.hours_booked.toFixed(1)} />
        <Stat label="Bookings with Offers" value={totals.bookings_with_offers.toLocaleString()} />
        <Stat label="Total Discounts" value={formatCurrency(totals.total_discounts)} />
        <Stat label="Avg Booking Value" value={totals.completed_bookings > 0 ? formatCurrency(totals.revenue / totals.completed_bookings) : '₹0'} />
      </div>

      {/* Detailed Table */}
      <SectionCard title="Daily Breakdown by Attraction/Combo" subtitle="Click on a row to see hourly details">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2">Date</th>
                <th className="text-left py-2 px-2">Type</th>
                <th className="text-left py-2 px-2">Name</th>
                <th className="text-right py-2 px-2">Completed</th>
                <th className="text-right py-2 px-2">Pending</th>
                <th className="text-right py-2 px-2">People</th>
                <th className="text-right py-2 px-2">Revenue</th>
                <th className="text-right py-2 px-2">Slots Used</th>
                <th className="text-right py-2 px-2">Hours</th>
                <th className="text-right py-2 px-2">Offers</th>
                <th className="text-right py-2 px-2">Discounts</th>
                {(selectedAttraction || selectedCombo) && <th className="text-right py-2 px-2">Base Price</th>}
                {(selectedAttraction || selectedCombo) && <th className="text-right py-2 px-2">Potential Revenue</th>}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr 
                  key={index} 
                  className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${selectedItem === row ? 'bg-blue-50' : ''}`}
                  onClick={() => setSelectedItem(selectedItem === row ? null : row)}
                >
                  <td className="py-2 px-2">{dayjs(row.booking_date).format('MMM DD, YYYY')}</td>
                  <td className="py-2 px-2 capitalize">{row.type}</td>
                  <td className="py-2 px-2 font-medium">{row.name}</td>
                  <td className="py-2 px-2 text-right">{row.completed_bookings}</td>
                  <td className="py-2 px-2 text-right">{row.pending_bookings}</td>
                  <td className="py-2 px-2 text-right">{row.total_people}</td>
                  <td className="py-2 px-2 text-right">{formatCurrency(row.revenue)}</td>
                  <td className="py-2 px-2 text-right">{row.slots_used}</td>
                  <td className="py-2 px-2 text-right">{Number(row.hours_booked).toFixed(1)}</td>
                  <td className="py-2 px-2 text-right">{row.bookings_with_offers}</td>
                  <td className="py-2 px-2 text-right">{formatCurrency(row.total_discounts)}</td>
                  {(selectedAttraction || selectedCombo) && (
                    <td className="py-2 px-2 text-right">{formatCurrency(row.base_price || 0)}</td>
                  )}
                  {(selectedAttraction || selectedCombo) && (
                    <td className="py-2 px-2 text-right">
                      {row.slot_hour_data ? formatCurrency(row.slot_hour_data.reduce((sum, slot) => sum + (slot.potential_revenue || 0), 0)) : 'N/A'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Hourly Breakdown Chart */}
      {selectedItem && !selectedItem.slot_hour_data && (
        <SectionCard title={`Hourly Breakdown - ${selectedItem.name} (${dayjs(selectedItem.booking_date).format('MMM DD, YYYY')})`}>
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getHourlyChartData(selectedItem)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="bookings" fill="#2563eb" name="Bookings" />
                <Bar dataKey="revenue" fill="#10b981" name="Revenue (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      )}

      {/* Slot-wise/Hour-wise Detailed Breakdown */}
      {selectedItem && selectedItem.slot_hour_data && (
        <SectionCard title={`Slot-wise Revenue Analysis - ${selectedItem.name} (${dayjs(selectedItem.booking_date).format('MMM DD, YYYY')})`}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <Stat 
                label="Base Price per Slot" 
                value={formatCurrency(selectedItem.base_price || 0)} 
              />
              <Stat 
                label="Total Potential Revenue" 
                value={formatCurrency(selectedItem.slot_hour_data.reduce((sum, slot) => sum + (slot.potential_revenue || 0), 0))} 
              />
              <Stat 
                label="Actual Revenue" 
                value={formatCurrency(selectedItem.revenue)} 
              />
              <Stat 
                label="Revenue Lost to Offers" 
                value={formatCurrency(selectedItem.total_discounts)} 
              />
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-2">Time Slot</th>
                    <th className="text-right py-2 px-2">Completed</th>
                    <th className="text-right py-2 px-2">Pending</th>
                    <th className="text-right py-2 px-2">People</th>
                    <th className="text-right py-2 px-2">Actual Revenue</th>
                    <th className="text-right py-2 px-2">Potential Revenue</th>
                    <th className="text-right py-2 px-2">Revenue/Hour</th>
                    <th className="text-right py-2 px-2">Lost to Offers</th>
                    <th className="text-right py-2 px-2">Slot Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItem.slot_hour_data.map((slot, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 px-2">
                        {slot.start_time ? dayjs(slot.start_time).format('HH:mm') : `${slot.hour}:00`} - 
                        {slot.end_time ? dayjs(slot.end_time).format('HH:mm') : `${(slot.hour + 1) % 24}:00`}
                      </td>
                      <td className="py-2 px-2 text-right">{slot.completed_bookings}</td>
                      <td className="py-2 px-2 text-right">{slot.pending_bookings}</td>
                      <td className="py-2 px-2 text-right">{slot.total_people}</td>
                      <td className="py-2 px-2 text-right">{formatCurrency(slot.actual_revenue)}</td>
                      <td className="py-2 px-2 text-right">{formatCurrency(slot.potential_revenue)}</td>
                      <td className="py-2 px-2 text-right">{formatCurrency(slot.actual_revenue)}</td>
                      <td className="py-2 px-2 text-right">{formatCurrency(slot.lost_to_offers)}</td>
                      <td className="py-2 px-2 text-right">
                        {slot.total_slots > 0 ? `${slot.booked_slots}/${slot.total_slots} (${Math.round((slot.booked_slots / slot.total_slots) * 100)}%)` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Revenue Analysis Chart */}
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={selectedItem.slot_hour_data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="hour" 
                    tickFormatter={(v) => `${v}:00`}
                  />
                  <YAxis tickFormatter={(v) => `₹${v.toLocaleString()}`} />
                  <Tooltip 
                    labelFormatter={(v) => `${v}:00 - ${(v + 1) % 24}:00`}
                    formatter={(value, name) => [formatCurrency(value), name]}
                  />
                  <Legend />
                  <Bar dataKey="actual_revenue" fill="#10b981" name="Actual Revenue" />
                  <Bar dataKey="potential_revenue" fill="#e5e7eb" name="Potential Revenue" />
                  <Bar dataKey="lost_to_offers" fill="#ef4444" name="Lost to Offers" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Revenue Trend Chart */}
      <SectionCard title="Revenue Trend" subtitle="Daily revenue by attraction/combo">
        <div style={{ height: 360 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="booking_date" tickFormatter={(v) => dayjs(v).format('MM-DD')} />
              <YAxis tickFormatter={(v) => `₹${v.toLocaleString()}`} />
              <Tooltip 
                labelFormatter={(v) => dayjs(v).format('YYYY-MM-DD')}
                formatter={(value, name) => [name === 'revenue' ? formatCurrency(value) : value, name]}
              />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#2563eb" name="Revenue" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>
    </div>
  );
}