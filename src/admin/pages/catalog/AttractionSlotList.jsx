import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import dayjs from 'dayjs';

const isNumericId = (value) => {
  if (value === null || value === undefined) return false;
  const num = Number(value);
  return Number.isFinite(num);
};

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString()}`;

const formatTime12Hour = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = String(time24).split(':');
  const hour = parseInt(hours, 10);
  if (Number.isNaN(hour)) return time24;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes ?? '00'} ${ampm}`;
};

const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : 'N/A');

const statusTone = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (['booked', 'confirmed', 'completed', 'redeemed'].includes(normalized)) return 'green';
  if (['pending', 'initiated'].includes(normalized)) return 'amber';
  if (['cancelled', 'failed', 'expired'].includes(normalized)) return 'red';
  return 'gray';
};

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

  const sameSlotId = booking.slot_id && slot.slot_id && String(booking.slot_id) === String(slot.slot_id);

  return sameSlotId || sameTimes;
};

const comboBadge = (booking) => {
  if (!booking) return null;
  if (booking.item_type === 'Combo' && !booking.parent_booking_id) {
    return <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 mr-2">Combo parent</span>;
  }
  if (booking.parent_booking_id) {
    return <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 mr-2">Combo child</span>;
  }
  return null;
};

const normalizeSlotTime = (value) => {
  if (!value) return '';
  const str = String(value);
  return str.length > 5 ? str.slice(0, 5) : str;
};

const buildSlotTimeKey = (date, start, end) => {
  if (!date || !start) return null;
  return `${date}|${normalizeSlotTime(start)}|${normalizeSlotTime(end)}`;
};

const createEmptyBookingMap = () => ({ bySlotId: Object.create(null), byKey: Object.create(null) });

const perUnitPrice = (booking = {}) => {
  const qty = Math.max(1, Number(booking.quantity || 1));
  const total = Number(booking.final_amount ?? booking.total_amount ?? booking.amount ?? 0);
  return qty ? total / qty : total;
};

export default function AttractionSlotList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [attractions, setAttractions] = React.useState([]);
  const [attractionId, setAttractionId] = React.useState('');
  const [startDate, setStartDate] = React.useState(dayjs().format('YYYY-MM-DD'));
  const [endDate, setEndDate] = React.useState(dayjs().add(1, 'year').format('YYYY-MM-DD'));
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [selectedSlot, setSelectedSlot] = React.useState(null);
  const [bookings, setBookings] = React.useState([]);
  const [datePages, setDatePages] = React.useState([]);
  const [dateIndex, setDateIndex] = React.useState(0);
  const [rangeBookingMap, setRangeBookingMap] = React.useState(() => createEmptyBookingMap());
  const [bookingLoading, setBookingLoading] = React.useState(false);
  const [bookingErr, setBookingErr] = React.useState('');

  const normalizedAttractionId = React.useMemo(() => {
    if (!attractionId || attractionId === 'undefined' || attractionId === 'null') return null;
    if (isNaN(Number(attractionId))) return null;
    return Number(attractionId);
  }, [attractionId]);

  React.useEffect(() => {
    (async () => {
      try {
        const data = await adminApi.get('/api/admin/attractions', { active: true });
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setAttractions(list);
        
        // Auto-select attraction if provided in URL
        const urlAttractionId = searchParams.get('attraction_id');
        if (urlAttractionId && list.find(a => (a.attraction_id || a.id) === Number(urlAttractionId))) {
          setAttractionId(urlAttractionId);
        }
      } catch (e) {
        setErr(e.message || 'Failed to load attractions');
      }
    })();
  }, [searchParams]);

  const load = async () => {
    console.log('🔍 AttractionSlotList load() called');
    console.log('📋 attractionId:', attractionId);
    console.log('📋 attractionId type:', typeof attractionId);
    console.log('📋 startDate:', startDate);
    console.log('📋 endDate:', endDate);
    
    // Better validation for attractionId
    if (!normalizedAttractionId) {
      console.log('❌ Invalid or missing attractionId:', attractionId);
      setRows([]);
      setErr('Please select an attraction to view slots.');
      return;
    }
    
    console.log('✅ attractionId is valid, making API call');
    setLoading(true);
    setErr('');
    try {
      const data = await adminApi.get('/api/admin/attraction-slots', {
        params: {
          attraction_id: normalizedAttractionId,
          start_date: startDate,
          end_date: endDate
        }
      });
      console.log('✅ API call successful:', data);
      const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      setRows(list);
      const dates = Array.from(new Set(list.map((item) => item.start_date))).sort();
      setDatePages(dates);
      const idx = dates.indexOf(startDate);
      setDateIndex(idx >= 0 ? idx : 0);
    } catch (e) {
      console.error('❌ Failed to load attraction slots:', e);
      console.error('❌ Error response:', e.response);
      console.error('❌ Error status:', e.response?.status);
      console.error('❌ Error data:', e.response?.data);
      
      if (e.response?.status === 400) {
        setErr('Invalid attraction ID. Please select a valid attraction.');
      } else {
        setErr(e.message || 'Failed to load');
      }
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { 
    console.log('🔄 AttractionSlotList useEffect triggered');
    console.log('📋 Current attractionId:', attractionId);
    console.log('📋 Dependencies changed:', { attractionId, startDate, endDate });
    
    // Better validation for attractionId
    if (normalizedAttractionId) {
      console.log('✅ attractionId is valid, calling load()');
      load(); 
    } else {
      console.log('❌ No valid attractionId, skipping load()');
      setRows([]);
      setErr('Please select an attraction to view slots.');
    }
    /* eslint-disable-next-line */ 
  }, [normalizedAttractionId, startDate, endDate]);

  React.useEffect(() => {
    if (!datePages.length) return;
    const idx = datePages.indexOf(startDate);
    if (idx >= 0) {
      setDateIndex(idx);
    }
  }, [startDate, datePages]);

  React.useEffect(() => {
    if (!normalizedAttractionId) {
      setRangeBookingMap(createEmptyBookingMap());
      setBookingErr('');
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setBookingLoading(true);
        setBookingErr('');
        const res = await adminApi.get('/api/admin/bookings', {
          params: {
            attraction_id: normalizedAttractionId,
            date_from: startDate,
            date_to: endDate,
            limit: 500,
          },
        });
        if (cancelled) return;
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        const filtered = list.filter((b) => (b.booking_status || '').toLowerCase() !== 'cancelled');
        const bySlotId = Object.create(null);
        const byKey = Object.create(null);
        filtered.forEach((booking) => {
          const slotIdKey = booking.slot_id != null ? String(booking.slot_id) : null;
          if (slotIdKey) {
            if (!bySlotId[slotIdKey]) bySlotId[slotIdKey] = [];
            bySlotId[slotIdKey].push(booking);
          }
          const timeKey = buildSlotTimeKey(booking.booking_date, booking.slot_start_time, booking.slot_end_time);
          if (timeKey) {
            if (!byKey[timeKey]) byKey[timeKey] = [];
            byKey[timeKey].push(booking);
          }
        });
        setRangeBookingMap({ bySlotId, byKey });
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load booking context', error);
          setRangeBookingMap(createEmptyBookingMap());
          setBookingErr(error?.message || 'Failed to load booking context');
        }
      } finally {
        if (!cancelled) setBookingLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [normalizedAttractionId, startDate, endDate]);

  const extendSlotRange = () => {
    if (!attractionId || attractionId === 'undefined' || attractionId === 'null') {
      alert('Select an attraction before extending slots.');
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
    
    if (!window.confirm('Delete this attraction slot?')) return;
    try {
      await adminApi.delete(`/api/admin/attraction-slots/${id}`);
      setRows((prev) => prev.filter((r) => r.slot_id !== id));
    } catch (e) {
      alert(e.message || 'Delete failed');
    }
  }

  async function onSlotClick(slot) {
    setSelectedSlot(slot);
    try {
      const res = await adminApi.get('/api/admin/bookings', {
        params: {
          attraction_id: slot.attraction_id,
          date_from: slot.start_date,
          date_to: slot.start_date,
          slot_start_time: normalizeTimeToDb(slot.start_time),
          slot_end_time: normalizeTimeToDb(slot.end_time),
          limit: 200
        }
      });

      const bookingList = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      const filtered = bookingList.filter((booking) => bookingMatchesSlot(booking, slot));
      console.log('🔍 Slot inspector match stats:', {
        slot_id: slot.slot_id,
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

  const attractionName = (aid) => {
    const a = attractions.find((x) => (x.attraction_id || x.id) === aid);
    if (!a) return `#${aid}`;
    return a.title || `Attraction #${aid}`;
  };

  const currentDate = datePages[dateIndex];
  const slotsForDate = React.useMemo(
    () => (currentDate ? rows.filter((r) => r.start_date === currentDate) : rows),
    [rows, currentDate]
  );

  const flatRows = React.useMemo(() => {
    const slotSeen = new Set();
    return slotsForDate.flatMap((slot, slotIndex) => {
      const slotIdKey = slot.slot_id != null ? String(slot.slot_id) : null;
      const timeKey = buildSlotTimeKey(slot.start_date, slot.start_time, slot.end_time);
      const directMatches = slotIdKey ? (rangeBookingMap.bySlotId[slotIdKey] || []) : [];
      const timeMatches = timeKey ? (rangeBookingMap.byKey[timeKey] || []) : [];
      const combined = [...directMatches, ...timeMatches];
      const uniqueBookings = [];
      const bookingIds = new Set();
      combined.forEach((booking) => {
        if (!booking || bookingIds.has(booking.booking_id)) return;
        bookingIds.add(booking.booking_id);
        uniqueBookings.push(booking);
      });

      const combos = uniqueBookings.filter((b) => !!b.parent_booking_id);
      const standalone = uniqueBookings.filter((b) => !b.parent_booking_id);

      const rowsOut = [];
      const basePrice = slot.price ?? slot.attraction_price ?? slot.attraction_details?.price ?? null;
      const slotKey = slotIdKey || timeKey || `${slot.start_date}|${slotIndex}`;

      rowsOut.push({
        key: `${slotKey}-slot`,
        slot,
        variant: 'slot',
        variantLabel: 'Slot Price',
        priceValue: basePrice != null ? Number(basePrice) : null,
        bookingCount: 0,
      });

      if (standalone.length) {
        const price = perUnitPrice(standalone[0]);
        rowsOut.push({
          key: `${slotKey}-standalone`,
          slot,
          variant: 'standalone',
          variantLabel: `Standalone Booking (${standalone.length})`,
          priceValue: price,
          bookingCount: standalone.length,
        });
      }

      if (combos.length) {
        const price = perUnitPrice(combos[0]);
        const comboNames = Array.from(new Set(combos.map((b) => b.combo_title || b.item_title || 'Combo Booking')));
        const label = comboNames.length === 1 ? `Combo: ${comboNames[0]}` : `Combo Bookings (${comboNames.length})`;
        rowsOut.push({
          key: `${slotKey}-combo`,
          slot,
          variant: 'combo',
          variantLabel: `${label} • ${combos.length} booking(s)`,
          priceValue: price,
          bookingCount: combos.length,
        });
      }

      slotSeen.add(slotKey);
      return rowsOut;
    });
  }, [slotsForDate, rangeBookingMap]);

  const tableRows = flatRows;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <select
          className="rounded-md border px-3 py-2"
          value={attractionId}
          onChange={(e) => setAttractionId(e.target.value)}
        >
          <option value="">Select attraction</option>
          {attractions.map((a) => (
            <option key={a.attraction_id || a.id} value={a.attraction_id || a.id}>
              {a.title || `Attraction #${a.attraction_id || a.id}`}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="rounded-md border px-3 py-2"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <input
          type="date"
          className="rounded-md border px-3 py-2"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <button className="rounded-md border px-3 py-2 text-sm" onClick={load}>
          Filter
        </button>
        <button
          className="rounded-md border px-3 py-2 text-sm"
          onClick={extendSlotRange}
          disabled={!attractionId}
        >
          Generate Next Year
        </button>
      </div>

      {attractionId && (
        <div className="mb-3">
          <button
            className="rounded-md bg-blue-600 text-white px-3 py-2 text-sm"
            onClick={() => navigate(`/admin/catalog/attractions/${attractionId}`)}
          >
            Edit Attraction
          </button>
        </div>
      )}

      {err ? <div className="text-sm text-red-600">{err}</div> : null}
      {bookingErr ? <div className="text-xs text-amber-600">Context: {bookingErr}</div> : null}
      {bookingLoading ? <div className="text-xs text-gray-500">Loading booking context…</div> : null}

      <div className="overflow-x-auto rounded-lg border bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-neutral-800 text-gray-600 dark:text-neutral-300">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Time</th>
              <th className="px-3 py-2 text-left">Attraction</th>
              <th className="px-3 py-2 text-left">Context</th>
              <th className="px-3 py-2 text-left">Capacity</th>
              <th className="px-3 py-2 text-left">Price</th>
              <th className="px-3 py-2 text-left">Status / Bookings</th>
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-800 dark:text-neutral-200">
            {tableRows.length > 0 ? tableRows.map((row) => {
              const isSlotRow = row.variant === 'slot';
              const priceDisplay = row.priceValue != null ? formatCurrency(row.priceValue) : '—';
              const slot = row.slot;
              return (
                <tr
                  key={row.key}
                  className={`border-t border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800 cursor-pointer ${!isSlotRow ? 'bg-gray-50/60 dark:bg-neutral-800/40' : ''}`}
                  onClick={() => onSlotClick(slot)}
                >
                  <td className="px-3 py-2">{slot.start_date}</td>
                  <td className="px-3 py-2">{formatTime12Hour(slot.start_time)} → {formatTime12Hour(slot.end_time)}</td>
                  <td className="px-3 py-2">{slot.attraction_name || attractionName(slot.attraction_id)}</td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-2">
                      {row.variant !== 'slot' && <span className="h-1.5 w-1.5 rounded-full bg-gray-400" aria-hidden="true" />}
                      {row.variantLabel}
                    </span>
                  </td>
                  <td className="px-3 py-2">{isSlotRow ? slot.capacity : '—'}</td>
                  <td className="px-3 py-2">{priceDisplay}</td>
                  <td className="px-3 py-2">
                    {isSlotRow ? (
                      <span className={`px-2 py-1 text-xs rounded ${slot.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {slot.available ? 'Available' : 'Unavailable'}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-600 dark:text-neutral-400">Bookings: {row.bookingCount}</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {isSlotRow ? (
                      <button
                        className="rounded-md border px-2 py-1 text-xs text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(slot.slot_id);
                        }}
                      >
                        Delete
                      </button>
                    ) : '—'}
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={8}>
                  {loading ? 'Loading…' : attractionId ? 'No attraction slots for this date' : 'Select an attraction to view slots'}
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
                <div><strong>Attraction:</strong> {selectedSlot.attraction_name || attractionName(selectedSlot.attraction_id)}</div>
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
                              <span className="text-xs text-gray-500">{booking.item_title || booking.attraction_title || booking.combo_title || '—'}</span>
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
