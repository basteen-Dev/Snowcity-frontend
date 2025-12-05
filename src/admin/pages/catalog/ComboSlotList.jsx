import React from 'react';
import dayjs from 'dayjs';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import adminApi from '../../services/adminApi';

const formatTime12Hour = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  if (Number.isNaN(hour)) return time24;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : 'N/A');

const normalizeTimeToDb = (value) => {
  if (!value) return undefined;
  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) return value;
  if (/^\d{1,2}:\d{2}$/.test(value)) {
    const parts = value.split(':');
    return `${parts[0].padStart(2, '0')}:${parts[1]}:00`;
  }
  if (/\s/.test(value)) {
    const d = new Date(`1970-01-01T${value}`);
    if (!Number.isNaN(d.getTime())) {
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');
      return `${hh}:${mm}:${ss}`;
    }
  }
  return undefined;
};

const timesMatch = (lhs, rhs) => {
  if (!lhs || !rhs) return false;
  return lhs.slice(0, 5) === rhs.slice(0, 5);
};

const bookingMatchesSlot = (booking = {}, slot = {}) => {
  if (!booking || !slot) return false;
  if (booking.booking_date && slot.start_date && booking.booking_date !== slot.start_date) {
    return false;
  }

  const slotStart = normalizeTimeToDb(slot.start_time);
  const slotEnd = normalizeTimeToDb(slot.end_time);
  const bookingStart = booking.slot_start_time || booking.booking_time;
  const bookingEnd = booking.slot_end_time || null;

  const sameTimes = slotStart && slotEnd
    ? timesMatch(slotStart, bookingStart || '') && (!slotEnd || timesMatch(slotEnd, bookingEnd || slotEnd))
    : true;

  const sameSlotId = booking.combo_slot_id && slot.combo_slot_id && String(booking.combo_slot_id) === String(slot.combo_slot_id);

  return sameSlotId || sameTimes;
};

const comboBadge = (booking) => {
  if (!booking) return null;
  if (booking.item_type === 'Combo' && !booking.parent_booking_id) {
    return <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">Combo parent</span>;
  }
  if (booking.parent_booking_id) {
    return <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Combo child</span>;
  }
  return null;
};

export default function ComboSlotList() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const [combos, setCombos] = React.useState([]);
  const [comboId, setComboId] = React.useState('');
  const [startDate, setStartDate] = React.useState(dayjs().format('YYYY-MM-DD'));
  const [endDate, setEndDate] = React.useState(dayjs().add(1, 'year').format('YYYY-MM-DD'));
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [selectedSlot, setSelectedSlot] = React.useState(null);
  const [bookings, setBookings] = React.useState([]);
  const [datePages, setDatePages] = React.useState([]);
  const [dateIndex, setDateIndex] = React.useState(0);

  React.useEffect(() => {
    (async () => {
      try {
        const data = await adminApi.get('/api/admin/combos', { active: true });
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setCombos(list);
        
        // Auto-select combo if provided in URL
        const urlComboId = searchParams.get('combo_id');
        if (urlComboId) {
          setComboId(urlComboId);
        }
      } catch (e) {
        // ignore
      }
    })();
  }, [searchParams]);

  async function load() {
    console.log('🔍 ComboSlotList load() called');
    console.log('📋 comboId:', comboId);
    console.log('📋 comboId type:', typeof comboId);
    console.log('📋 startDate:', startDate);
    console.log('📋 endDate:', endDate);
    
    // Better validation for comboId
    if (!comboId || comboId === 'undefined' || comboId === 'null' || comboId === '' || isNaN(Number(comboId))) {
      console.log('❌ Invalid or missing comboId:', comboId);
      setRows([]);
      setErr('Please select a combo to view slots.');
      return;
    }
    
    console.log('✅ comboId is valid, making API call');
    try {
      setLoading(true);
      setErr('');
      const out = await adminApi.get('/api/admin/combo-slots', {
        params: {
          start_date: startDate || null,
          end_date: endDate || null,
          combo_id: Number(comboId),
        }
      });
      console.log('✅ API call successful:', out);
      const list = Array.isArray(out?.data) ? out.data : Array.isArray(out) ? out : [];
      setRows(list);
      const dates = Array.from(new Set(list.map((item) => item.start_date))).sort();
      setDatePages(dates);
      const idx = dates.indexOf(startDate);
      setDateIndex(idx >= 0 ? idx : 0);
    } catch (e) {
      console.error('❌ Failed to load combo slots:', e);
      console.error('❌ Error response:', e.response);
      console.error('❌ Error status:', e.response?.status);
      console.error('❌ Error data:', e.response?.data);
      
      if (e.response?.status === 400) {
        setErr('Invalid combo ID. Please select a valid combo.');
      } else {
        setErr(e.message || 'Failed to load');
      }
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { 
    console.log('🔄 ComboSlotList useEffect triggered');
    console.log('📋 Current comboId:', comboId);
    console.log('📋 Dependencies changed:', { comboId, startDate, endDate });
    
    // Better validation for comboId
    if (comboId && comboId !== 'undefined' && comboId !== 'null' && comboId !== '' && !isNaN(Number(comboId))) {
      console.log('✅ comboId is valid, calling load()');
      load(); 
    } else {
      console.log('❌ No valid comboId, skipping load()');
      setRows([]);
      setErr('Please select a combo to view slots.');
    }
    /* eslint-disable-next-line */ 
  }, [comboId, startDate, endDate]);

  React.useEffect(() => {
    if (!datePages.length) return;
    const idx = datePages.indexOf(startDate);
    if (idx >= 0) setDateIndex(idx);
  }, [startDate, datePages]);

  const extendSlotRange = () => {
    if (!comboId || comboId === 'undefined' || comboId === 'null') {
      alert('Select a combo before extending slots.');
      return;
    }
    const baseEnd = endDate ? dayjs(endDate) : dayjs().add(1, 'year');
    const newEnd = baseEnd.add(1, 'year');
    setEndDate(newEnd.format('YYYY-MM-DD'));
  };

  async function onDelete(id) {
    // Check if this is a dynamic slot (virtual ID)
    if (typeof id === 'string' && id.includes('-')) {
      alert('Dynamic slots cannot be deleted. They are generated automatically based on calendar.');
      return;
    }
    
    if (!window.confirm('Delete this combo slot?')) return;
    try {
      await adminApi.delete(`/api/admin/combo-slots/${id}`);
      setRows((prev) => prev.filter((r) => r.combo_slot_id !== id));
    } catch (e) {
      alert(e.message || 'Delete failed');
    }
  }

  async function onSlotClick(slot) {
    setSelectedSlot(slot);
    try {
      const res = await adminApi.get('/api/admin/bookings', {
        params: {
          combo_id: slot.combo_id,
          booking_date: slot.start_date,
          combo_slot_id: slot.combo_slot_id,
          slot_start_time: normalizeTimeToDb(slot.start_time),
          slot_end_time: normalizeTimeToDb(slot.end_time),
          limit: 200
        }
      });

      const bookingList = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      const filtered = bookingList.filter((booking) => bookingMatchesSlot(booking, slot));
      console.log('🔍 Combo slot inspector match stats:', {
        combo_slot_id: slot.combo_slot_id,
        bookingCount: bookingList.length,
        matchedCount: filtered.length,
      });
      setBookings(filtered.length ? filtered : bookingList);
    } catch (e) {
      console.error('Failed to fetch bookings:', e);
      setBookings([]);
    }
  }

  function closeSlotDetails() {
    setSelectedSlot(null);
    setBookings([]);
  }

  const comboName = (cid) => {
    const c = combos.find((x) => x.combo_id === cid);
    if (!c) return `#${cid}`;
    return c.title || `Combo #${cid}`;
  };

  const currentDate = datePages[dateIndex];
  const visibleRows = currentDate ? rows.filter((r) => r.start_date === currentDate) : rows;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <select
          className="rounded-md border px-2 py-2 text-sm dark:bg-neutral-900 dark:border-neutral-700"
          value={comboId}
          onChange={(e) => setComboId(e.target.value)}
        >
          <option value="">All combos</option>
          {combos.map((c) => (
            <option key={c.combo_id} value={c.combo_id}>
              {c.title || `Combo #${c.combo_id}`}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="rounded-md border px-2 py-2 text-sm dark:bg-neutral-900 dark:border-neutral-700"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <input
          type="date"
          className="rounded-md border px-2 py-2 text-sm dark:bg-neutral-900 dark:border-neutral-700"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <button
          className="px-3 py-2 rounded-md border text-sm" onClick={load}
        >
          Filter
        </button>
        <button
          className="px-3 py-2 rounded-md border text-sm"
          onClick={extendSlotRange}
          disabled={!comboId}
        >
          Generate Next Year
        </button>
      </div>

      {err ? <div className="text-sm text-red-600">{err}</div> : null}

      <div className="rounded-lg border bg-white dark:bg-neutral-900 dark:border-neutral-800 overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-neutral-800">
            <tr>
              <th className="px-3 py-2 text-left">Combo</th>
              <th className="px-3 py-2 text-left">Date Range</th>
              <th className="px-3 py-2 text-left">Time</th>
              <th className="px-3 py-2 text-right">Capacity</th>
              <th className="px-3 py-2 text-right">Price</th>
              <th className="px-3 py-2 text-left">Available</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((r) => (
              <tr 
                key={r.combo_slot_id} 
                className="border-t dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800 cursor-pointer"
                onClick={() => onSlotClick(r)}
              >
                <td className="px-3 py-2">{r.combo_name || comboName(r.combo_id)}</td>
                <td className="px-3 py-2">
                  {r.start_date} {r.end_date && r.end_date !== r.start_date ? `→ ${r.end_date}` : ''}
                </td>
                <td className="px-3 py-2">
                  {formatTime12Hour(r.start_time)} → {formatTime12Hour(r.end_time)}
                </td>
                <td className="px-3 py-2 text-right">{r.capacity}</td>
                <td className="px-3 py-2 text-right">{r.price == null ? '-' : `₹ ${Number(r.price).toLocaleString()}`}</td>
                <td className="px-3 py-2">{r.available ? 'Yes' : 'No'}</td>
                <td className="px-3 py-2 text-right space-x-2">
                  <button 
                    className="px-2 py-1 rounded-md border text-xs" 
                    onClick={(e) => {
                      e.stopPropagation();
                      nav(`/admin/catalog/combo-slots/${r.combo_slot_id}`);
                    }}
                  >
                    Edit
                  </button>
                  <button 
                    className="px-2 py-1 rounded-md border text-xs" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(r.combo_slot_id);
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {!visibleRows.length && !loading && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={7}>
                  {comboId ? 'No combo slots for this date' : 'Select a combo to view slots'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {datePages.length > 1 && (
        <div className="flex items-center gap-3 text-sm">
          <button
            className="rounded-md border px-3 py-1"
            onClick={() => setDateIndex((idx) => Math.max(0, idx - 1))}
            disabled={dateIndex === 0}
          >
            Prev Date
          </button>
          <div className="text-gray-600">
            {currentDate ? dayjs(currentDate).format('DD MMM YYYY') : '—'} ({dateIndex + 1} / {datePages.length})
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

      {loading ? <div className="text-sm text-gray-500">Loading…</div> : null}

      {/* Booking Details Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Slot Details & Bookings</h2>
              <button 
                onClick={closeSlotDetails}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            {/* Slot Information */}
            <div className="bg-gray-50 dark:bg-neutral-800 p-4 rounded-lg mb-4">
              <h3 className="font-medium mb-2">Slot Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Combo:</strong> {selectedSlot.combo_name || comboName(selectedSlot.combo_id)}</div>
                <div><strong>Date:</strong> {selectedSlot.start_date}</div>
                <div><strong>Time:</strong> {formatTime12Hour(selectedSlot.start_time)} → {formatTime12Hour(selectedSlot.end_time)}</div>
                <div><strong>Capacity:</strong> {selectedSlot.capacity}</div>
                <div><strong>Price:</strong> {selectedSlot.price == null ? 'N/A' : `₹${Number(selectedSlot.price).toLocaleString()}`}</div>
                <div><strong>Available:</strong> {selectedSlot.available ? 'Yes' : 'No'}</div>
              </div>
            </div>

            {/* Bookings */}
            <div>
              <h3 className="font-medium mb-2">Bookings ({bookings.length})</h3>
              {bookings.length > 0 ? (
                <div className="border rounded-lg overflow-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-neutral-800">
                      <tr>
                        <th className="px-3 py-2 text-left">Booking ID</th>
                        <th className="px-3 py-2 text-left">Customer</th>
                        <th className="px-3 py-2 text-left">Email</th>
                        <th className="px-3 py-2 text-left">Qty</th>
                        <th className="px-3 py-2 text-left">Status</th>
                        <th className="px-3 py-2 text-right">Amount</th>
                        <th className="px-3 py-2 text-left">Booking Time</th>
                        <th className="px-3 py-2 text-left">Booked At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((booking) => (
                        <tr key={booking.booking_id} className="border-t dark:border-neutral-800">
                          <td className="px-3 py-2">
                            #{booking.booking_id}
                            {booking.parent_booking_id ? (
                              <div className="text-[11px] text-gray-500">Parent #{booking.parent_booking_id}</div>
                            ) : null}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-col">
                              <span>{booking.customer_name || booking.user_name || 'N/A'}</span>
                              <span className="text-xs text-gray-500">{booking.item_title || booking.combo_title || booking.attraction_title || '—'}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            {booking.customer_email || booking.user_email || 'N/A'}
                          </td>
                          <td className="px-3 py-2">
                            {booking.quantity ? `${booking.quantity}` : '1'}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-col gap-1">
                              <span className={`px-2 py-1 text-xs rounded ${
                                booking.booking_status === 'Confirmed' || booking.booking_status === 'Booked' ? 'bg-green-100 text-green-800' :
                                booking.booking_status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                booking.booking_status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {booking.booking_status || 'Unknown'}
                              </span>
                              {comboBadge(booking)}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right">
                            ₹{Number(booking.total_amount || booking.amount || 0).toLocaleString()}
                          </td>
                          <td className="px-3 py-2">
                            {formatTime12Hour(booking.slot_start_time || booking.booking_time)}
                          </td>
                          <td className="px-3 py-2">
                            {formatDateTime(booking.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-gray-500 text-center py-4">
                  No bookings found for this slot
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}