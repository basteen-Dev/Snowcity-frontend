import React from 'react';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import AdminTable from '../../components/common/AdminTable';
import { useNavigate } from 'react-router-dom';

export default function SlotsList() {
  const navigate = useNavigate();
  const [state, setState] = React.useState({
    status: 'idle',
    items: [],
    error: null,
    attraction_id: '',
    page: 1,
    limit: 20,
    meta: null
  });
  const [slotBookings, setSlotBookings] = React.useState({
    status: 'idle',
    items: [],
    slot: null,
    error: null
  });
  const [datePages, setDatePages] = React.useState([]);
  const [dateIndex, setDateIndex] = React.useState(0);

  const load = async (page = 1) => {
    setState((s) => ({ ...s, status: 'loading', error: null, page }));
    try {
      const res = await adminApi.get(A.slots(), {
        params: {
          attraction_id: state.attraction_id || undefined,
          page,
          limit: state.limit
        }
      });
      const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setState((s) => ({ ...s, status: 'succeeded', items, meta: res?.meta || null, page }));
      const dates = Array.from(new Set(items.map((item) => item.start_date))).sort();
      setDatePages(dates);
      const idx = dates.indexOf(state.attraction_id ? items.find((i) => i.start_date)?.start_date : undefined);
      setDateIndex(idx >= 0 ? idx : 0);
    } catch (err) {
      setState((s) => ({ ...s, status: 'failed', error: err }));
    }
  };

  React.useEffect(() => { load(1); /* eslint-disable-line */ }, []);

  const toggleAvailable = async (row, e) => {
    e?.stopPropagation?.();
    try {
      const id = row.slot_id || row.id;
      await adminApi.put(A.slotById(id), { available: !row.available });
      setState((s) => ({
        ...s,
        items: s.items.map((it) => ((it.slot_id || it.id) === id ? { ...it, available: !row.available } : it))
      }));
    } catch (err) {
      alert(err?.message || 'Failed to update');
    }
  };

  const remove = async (row, e) => {
    e?.stopPropagation?.();
    if (!window.confirm(`Delete slot #${row.slot_id || row.id}? This cannot be undone.`)) return;
    try {
      const id = row.slot_id || row.id;
      await adminApi.delete(A.slotById(id));
      setState((s) => ({ ...s, items: s.items.filter((it) => (it.slot_id || it.id) !== id) }));
    } catch (err) {
      alert(err?.message || 'Delete failed');
    }
  };

  const loadSlotBookings = async (row) => {
    const slotId = row.slot_id || row.id;
    const normalizeTime = (value) => {
      if (!value) return undefined;
      if (/^\d{2}:\d{2}:\d{2}$/.test(value)) return value;
      if (/^\d{1,2}:\d{2}$/.test(value)) return `${value.length === 4 ? '0' : ''}${value}:00`;
      if (/\s/.test(value)) {
        const d = new Date(`1970-01-01T${value}`);
        if (!isNaN(d.getTime())) {
          const hh = String(d.getHours()).padStart(2, '0');
          const mm = String(d.getMinutes()).padStart(2, '0');
          const ss = String(d.getSeconds()).padStart(2, '0');
          return `${hh}:${mm}:${ss}`;
        }
      }
      return undefined;
    };

    setSlotBookings({ status: 'loading', items: [], slot: row, error: null });
    try {
      const res = await adminApi.get(A.bookings(), {
        params: {
          slot_id: slotId,
          slot_start_time: normalizeTime(row.start_time || row.start_time_12h || row.start_time_24h),
          slot_end_time: normalizeTime(row.end_time || row.end_time_12h || row.end_time_24h),
          limit: 100
        }
      });
      const bookings = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setSlotBookings({ status: 'succeeded', items: bookings, slot: row, error: null });
    } catch (err) {
      setSlotBookings({ status: 'failed', items: [], slot: row, error: err });
    }
  };

  const clearSlotBookings = () => setSlotBookings({ status: 'idle', items: [], slot: null, error: null });

  const meta = state.meta || {};
  const canPrev = state.page > 1;
  const canNext = meta.page ? (meta.page < (meta.totalPages || meta.total_pages || 1)) : false;

  const currentDate = datePages[dateIndex];
  const visibleRows = currentDate ? state.items.filter((row) => row.start_date === currentDate) : state.items;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold">Slots</h1>
        <button className="rounded-md border px-3 py-2 text-sm" onClick={() => navigate('/admin/catalog/combo-slots')}>
          Combo Slots Module
        </button>
      </div>

      <div className="mb-3 grid grid-cols-1 md:grid-cols-3 gap-2">
        <input
          className="rounded-md border px-3 py-2"
          placeholder="Filter by attraction_id"
          value={state.attraction_id}
          onChange={(e) => setState((s) => ({ ...s, attraction_id: e.target.value }))}
        />
        <button className="rounded-md border px-3 py-2 text-sm" onClick={() => load(1)}>
          Filter
        </button>
      </div>

      <AdminTable
        keyField="slot_id"
        columns={[
          { key: 'slot_id', title: 'ID' },
          { key: 'attraction_id', title: 'Attraction' },
          { key: 'start_date', title: 'Start Date' },
          { key: 'end_date', title: 'End Date' },
          { key: 'start_time', title: 'Start Time', render: (r) => r.start_time_12h || r.start_time },
          { key: 'end_time', title: 'End Time', render: (r) => r.end_time_12h || r.end_time },
          { key: 'capacity', title: 'Capacity' },
          {
            key: 'available',
            title: 'Available',
            render: (row) => String(row?.available)
          },
          {
            key: '__actions',
            title: 'Actions',
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                <button
                  className={`rounded-md px-2 py-1 text-xs ${row.available ? 'border text-red-600' : 'bg-blue-600 text-white'}`}
                  onClick={(e) => toggleAvailable(row, e)}
                >
                  {row.available ? 'Disable' : 'Enable'}
                </button>
                <button className="rounded-md border px-2 py-1 text-xs text-red-600" onClick={(e) => remove(row, e)}>
                  Delete
                </button>
                <button className="rounded-md border px-2 py-1 text-xs" onClick={(e) => { e.stopPropagation(); navigate(`/admin/catalog/slots/${row.slot_id || row.id}`); }}>
                  Edit
                </button>
              </div>
            )
          }
        ]}
        rows={visibleRows}
        onRowClick={(row) => loadSlotBookings(row)}
        empty={state.status === 'loading' ? 'Loading…' : 'No slots for this date'}
      />

      {datePages.length > 1 && (
        <div className="mt-3 flex items-center gap-3 text-sm">
          <button
            className="rounded-md border px-3 py-1"
            onClick={() => setDateIndex((idx) => Math.max(0, idx - 1))}
            disabled={dateIndex === 0}
          >
            Prev Date
          </button>
          <div className="text-gray-600">
            {currentDate || '—'} ({dateIndex + 1} / {datePages.length})
          </div>
          <button
            className="rounded-md border px-3 py-1"
            onClick={() => setDateIndex((idx) => Math.min(datePages.length - 1, idx + 1))}
            disabled={dateIndex >= datePages.length - 1}
          >
            Next Date
          </button>
        </div>
      )}

      <div className="mt-6 rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Bookings for selected slot</h2>
          {slotBookings.slot ? (
            <button className="text-sm text-blue-600 hover:underline" onClick={clearSlotBookings}>
              Clear selection
            </button>
          ) : null}
        </div>
        {!slotBookings.slot && <p className="text-sm text-gray-500">Click a slot above to view its bookings.</p>}
        {slotBookings.slot ? (
          slotBookings.status === 'loading' ? (
            <p className="text-sm text-gray-500">Loading bookings…</p>
          ) : slotBookings.status === 'failed' ? (
            <p className="text-sm text-red-600">Failed to load bookings.</p>
          ) : slotBookings.items.length === 0 ? (
            <p className="text-sm text-gray-500">No bookings found for this slot.</p>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="py-2 pr-3">Booking Ref</th>
                    <th className="py-2 pr-3">User</th>
                    <th className="py-2 pr-3">Quantity</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {slotBookings.items.map((b) => (
                    <tr key={b.booking_id} className="border-b last:border-b-0">
                      <td className="py-2 pr-3">{b.booking_ref || `#${b.booking_id}`}</td>
                      <td className="py-2 pr-3">
                        <div>{b.user_email || '—'}</div>
                        <div className="text-gray-500">{b.user_phone || ''}</div>
                      </td>
                      <td className="py-2 pr-3">{b.quantity || 0}</td>
                      <td className="py-2 pr-3">{b.booking_status || '—'}</td>
                      <td className="py-2 pr-3">{b.payment_status || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : null}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button className="rounded-md border px-3 py-1 text-sm" onClick={() => canPrev && load(state.page - 1)} disabled={!canPrev || state.status === 'loading'}>Prev</button>
        <div className="text-sm text-gray-600">Page {meta.page || state.page}</div>
        <button className="rounded-md border px-3 py-1 text-sm" onClick={() => canNext && load(state.page + 1)} disabled={!canNext || state.status === 'loading'}>Next</button>
      </div>
    </div>
  );
}