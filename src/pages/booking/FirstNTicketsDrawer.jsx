import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, ShoppingCart, ShoppingBag, AlertCircle, AlertTriangle, Minus, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { addCartItem, setActiveCartItem, setStep } from '../../features/bookings/bookingsSlice';
import api from '../../services/apiClient';
import endpoints from '../../services/endpoints';
import { getPrice, getSlotUnitPrice } from '../../utils/pricing';
import { formatCurrency } from '../../utils/formatters';

const toYMD = (d) => dayjs(d).format('YYYY-MM-DD');
const getAttrId = (a) => a?.attraction_id ?? a?.id ?? a?._id ?? null;

const formatTime12Hour = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const getSlotLabel = (s) => {
  if (s?.label) return s.label;
  const start = formatTime12Hour(s?.start_time);
  const end = formatTime12Hour(s?.end_time);
  if (start && end) return `${start} - ${end}`;
  if (start) return start;
  return `Slot #${s?.id || s?.slot_id || '?'}`;
};

const getSlotKey = (s, idx) =>
  String(s?.id ?? s?._id ?? s?.slot_id ?? `${s?.start_time || ''}-${s?.end_time || ''}-${idx}`);

const isSlotEligible = (slot, date) => {
  if (!slot || !date) return true;
  const now = dayjs();
  const selectedDay = dayjs(date);
  if (selectedDay.format('YYYY-MM-DD') === now.format('YYYY-MM-DD')) {
    const slotTime = slot.start_time;
    if (!slotTime) return true;
    const [hours, minutes] = slotTime.split(':');
    const slotMinutes = parseInt(hours, 10) * 60 + parseInt(minutes, 10);
    const nowMinutes = now.hour() * 60 + now.minute();
    return slotMinutes >= nowMinutes + 60;
  }
  return true;
};

const slotHasCapacity = (slot) => {
  if (!slot) return true;
  if (slot.available === false) return false;
  const cap = Number(slot.capacity ?? slot.available_capacity ?? slot.available);
  if (Number.isNaN(cap)) return true;
  if (slot.booked != null) {
    const booked = Number(slot.booked);
    if (!Number.isNaN(booked)) return cap - booked > 0;
  }
  return cap > 0;
};

export default function FirstNTicketsDrawer({
  isOpen,
  onClose,
  offer,
  attractions = [],
  initialDate,
}) {
  const dispatch = useDispatch();
  const [date, setDate] = useState('');
  const [attractionId, setAttractionId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [slots, setSlots] = useState([]);
  const [slotsStatus, setSlotsStatus] = useState('idle');
  const [slotKey, setSlotKey] = useState('');
  const [availability, setAvailability] = useState(null);
  const [availLoading, setAvailLoading] = useState(false);

  const rule = useMemo(() => {
    if (!offer) return null;
    if (Array.isArray(offer.rules) && offer.rules.length) return offer.rules[0];
    if (Array.isArray(offer.offer_rules) && offer.offer_rules.length) return offer.offer_rules[0];
    return null;
  }, [offer]);

  const ticketLimit = rule?.ticket_limit || null;
  const offerPrice = rule?.offer_price || 0;
  const targetId = rule?.target_id ? String(rule.target_id) : '';
  const appliesToAll = !!rule?.applies_to_all;

  // Selected attraction
  const selectedAttraction = useMemo(() => {
    if (!attractionId) return null;
    return attractions.find(a => String(getAttrId(a)) === String(attractionId)) || null;
  }, [attractionId, attractions]);

  const hasTimeSlots = selectedAttraction?.time_slot_enabled;

  // Filter attractions matching the offer target
  const eligibleAttractions = useMemo(() => {
    if (appliesToAll) return attractions;
    if (targetId) return attractions.filter(a => String(getAttrId(a)) === targetId);
    return attractions;
  }, [appliesToAll, targetId, attractions]);

  // Reset on offer change
  useEffect(() => {
    if (!offer || !isOpen) return;
    setQuantity(1);
    setSlots([]);
    setSlotKey('');
    setSlotsStatus('idle');

    // Auto-select if single target
    if (targetId && !appliesToAll) {
      setAttractionId(targetId);
    } else {
      setAttractionId('');
    }

    // Find first valid date (prior-date booking only, skip today)
    const nextValid = getNextValidDate(offer, rule);
    if (nextValid) setDate(nextValid);
    else setDate('');
  }, [offer, isOpen, rule, targetId, appliesToAll]);

  // Fetch availability when date changes
  useEffect(() => {
    if (!offer || !date) return;
    const offerId = offer.offer_id ?? offer.id;
    setAvailLoading(true);
    api.get(`/offers/${offerId}/availability`, { params: { date } })
      .then((res) => {
        const avail = res?.data || res || {};
        setAvailability(avail);
      })
      .catch(() => setAvailability(null))
      .finally(() => setAvailLoading(false));
  }, [offer, date]);

  // Fetch slots when attraction or date changes
  useEffect(() => {
    if (!attractionId || !date) {
      setSlots([]);
      setSlotsStatus('idle');
      return;
    }
    if (!hasTimeSlots) {
      setSlots([]);
      setSlotsStatus('idle');
      return;
    }
    setSlotsStatus('loading');
    setSlotKey('');
    api.get(endpoints.attractions.slotsByAttraction(attractionId), { params: { date: toYMD(date) } })
      .then((res) => {
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setSlots(list);
        setSlotsStatus('succeeded');
      })
      .catch(() => {
        setSlots([]);
        setSlotsStatus('failed');
      });
  }, [attractionId, date, hasTimeSlots]);

  // Clamp quantity to remaining tickets
  useEffect(() => {
    if (availability && availability.tickets_remaining != null && availability.tickets_remaining > 0) {
      if (quantity > availability.tickets_remaining) {
        setQuantity(availability.tickets_remaining);
      }
    }
  }, [availability, quantity]);

  const isSoldOut = availability?.is_sold_out === true;
  const maxQty = availability?.tickets_remaining != null
    ? Math.min(10, availability.tickets_remaining)
    : 10;

  const isReady = date && attractionId && quantity > 0 && !isSoldOut
    && (hasTimeSlots ? !!slotKey : true);

  const totalPrice = offerPrice * quantity;

  const handleCheckout = (isDirectBuy) => {
    if (!isReady || !offer || !selectedAttraction) return;
    const offerId = offer.offer_id ?? offer.id ?? null;
    const offerRuleId = rule?.rule_id ?? null;

    const slot = hasTimeSlots
      ? slots.find((s, sIdx) => getSlotKey(s, sIdx) === slotKey) || null
      : null;

    const payload = {
      key: `offer_fnt_${offerId}_${Date.now()}`,
      merge: false,
      item_type: 'Attraction',
      title: selectedAttraction?.title || selectedAttraction?.name || 'Attraction',
      slotLabel: slot ? getSlotLabel(slot) : '',
      quantity,
      booking_date: toYMD(date),
      booking_time: slot?.start_time || null,
      unitPrice: offerPrice,
      dateLabel: dayjs(date).format('DD-MMM-YYYY'),
      slot_id: slot?.id || slot?.slot_id || null,
      combo_slot_id: null,
      attraction_id: getAttrId(selectedAttraction),
      combo_id: null,
      slot: slot || null,
      offer_id: offerId,
      offer_rule_id: offerRuleId,
      offerDescription: offer.description || `First ${ticketLimit} tickets at ₹${offerPrice}`,
    };
    dispatch(addCartItem(payload));
    dispatch(setActiveCartItem(payload.key));
    onClose();
    if (isDirectBuy) dispatch(setStep(2));
  };

  if (!isOpen || !offer) return null;

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const validDaysLabel = rule?.day_type === 'custom' && Array.isArray(rule.specific_days)
    ? rule.specific_days.map(d => dayNames[d]).join(', ')
    : rule?.day_type === 'weekday' ? 'Weekdays (Mon-Fri)'
    : rule?.day_type === 'weekend' ? 'Weekends (Sat-Sun)'
    : 'All days';

  return (
    <div className="fixed inset-0 z-[160] flex justify-end items-end md:items-stretch bg-black/40 backdrop-blur-[2px] md:bg-black/20">
      <div className="flex-1 hidden md:block" onClick={onClose} />
      <div className="w-full md:w-[520px] bg-white rounded-t-3xl md:rounded-l-3xl shadow-2xl flex flex-col h-[85vh] md:h-screen md:max-h-screen">
        <div className="md:hidden flex justify-center pt-2 pb-1">
          <div className="h-1.5 w-12 rounded-xl bg-gray-300" />
        </div>
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 pt-4 pb-2 border-b border-gray-100 bg-white md:rounded-tl-3xl">
          <h2 className="text-lg font-semibold text-sky-700 pr-3 truncate">
            {offer.title || 'Limited Offer'}
          </h2>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* How it works */}
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col gap-2">
            <div className="flex items-center gap-2 text-amber-800 font-bold">
              <AlertCircle size={18} className="text-amber-600" />
              <span>Limited Offer</span>
            </div>
            <p className="text-sm text-amber-700">
              Get tickets at <strong>₹{offerPrice}</strong> each! Only available for <strong>{validDaysLabel}</strong>.
              {ticketLimit && <> Limited to first <strong>{ticketLimit}</strong> tickets per day.</>}
              {' '}Prior-date booking only — no same-day bookings.
            </p>
          </div>

          {/* Sold Out Banner */}
          {isSoldOut && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center gap-3">
              <AlertTriangle size={20} className="text-red-600 shrink-0" />
              <div>
                <div className="font-bold text-red-700">Sold Out</div>
                <div className="text-sm text-red-600">All {ticketLimit} tickets have been sold for this date.</div>
              </div>
            </div>
          )}

          {/* Date Selection */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date of Visit</p>
            <div className="flex flex-wrap gap-2">
              {(() => {
                // Generate next 4 valid dates
                const validDates = [];
                for (let i = 1; i <= 60 && validDates.length < 4; i++) {
                  const candidate = dayjs().add(i, 'day').format('YYYY-MM-DD');
                  if (isDateAllowed(candidate, offer, rule)) validDates.push(candidate);
                }
                return validDates.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDate(d)}
                    className={`px-4 py-2 rounded-xl text-xs font-medium border transition-colors ${date === d
                      ? 'bg-sky-600 text-white border-sky-600'
                      : 'bg-white text-gray-800 border-gray-200 hover:border-sky-300'}`}
                  >
                    {dayjs(d).format('ddd, DD MMM')}
                  </button>
                ));
              })()}
            </div>
            {availability && !isSoldOut && (
              <div className="text-xs text-emerald-700 font-medium mt-1">
                🎫 {availability.tickets_remaining} of {availability.ticket_limit} tickets remaining
              </div>
            )}
          </div>

          {/* Attraction Selection */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Attraction</p>
            {eligibleAttractions.length === 1 ? (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800">
                {eligibleAttractions[0]?.title || eligibleAttractions[0]?.name}
              </div>
            ) : (
              <select
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 text-sm font-medium"
                value={attractionId}
                onChange={(e) => {
                  setAttractionId(e.target.value);
                  setSlotKey('');
                  setQuantity(1);
                }}
                disabled={!date || isSoldOut}
              >
                <option value="">Select an attraction</option>
                {eligibleAttractions.map((a) => (
                  <option key={getAttrId(a)} value={getAttrId(a)}>
                    {a.title || a.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Time Slot Selection */}
          {attractionId && hasTimeSlots && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Time Slot</p>
              {slotsStatus === 'loading' ? (
                <div className="text-sm text-gray-500 animate-pulse">Loading time slots...</div>
              ) : slots.length === 0 ? (
                <div className="text-sm text-gray-500">No time slots available for this date.</div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {slots.map((s, sIdx) => {
                    const sid = getSlotKey(s, sIdx);
                    const disabled = !slotHasCapacity(s) || !isSlotEligible(s, date);
                    const selected = slotKey === sid;
                    return (
                      <button
                        key={sid}
                        type="button"
                        onClick={() => !disabled && setSlotKey(sid)}
                        disabled={disabled}
                        className={`p-3 rounded-xl text-sm font-medium border transition-all ${
                          disabled
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : selected
                              ? 'bg-sky-600 text-white border-sky-600'
                              : 'bg-white text-gray-800 border-gray-200 hover:border-sky-400'
                        }`}
                      >
                        {getSlotLabel(s)}
                        {disabled && <span className="block text-[10px]">Unavailable</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Quantity */}
          {attractionId && !isSoldOut && (!hasTimeSlots || slotKey) && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Quantity</p>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={quantity <= 1}
                >
                  <Minus size={16} />
                </button>
                <span className="text-xl font-bold text-gray-900 tabular-nums w-8 text-center">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                  className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={quantity >= maxQty}
                >
                  <Plus size={16} />
                </button>
                {maxQty < 10 && (
                  <span className="text-xs text-amber-600 font-medium">Max: {maxQty}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-6 py-4 bg-white flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Total</div>
            <div className="text-lg font-bold text-sky-700 tabular-nums">
              {isSoldOut ? 'Sold Out' : formatCurrency(totalPrice)}
            </div>
            {!isSoldOut && quantity > 1 && (
              <div className="text-[11px] text-gray-400">{quantity} × ₹{offerPrice}</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCheckout(false)}
              disabled={!isReady}
              className={`px-3 py-2 rounded-xl text-white font-semibold shadow-lg active:scale-[0.98] transition-all flex items-center gap-2 ${!isReady ? 'bg-gray-300 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700'}`}
            >
              <ShoppingCart size={18} />
              Add to Cart
            </button>
            <button
              type="button"
              onClick={() => handleCheckout(true)}
              disabled={!isReady}
              className={`px-3 py-2 rounded-xl text-white font-semibold shadow-lg active:scale-[0.98] transition-all flex items-center gap-2 ${!isReady ? 'bg-gray-300 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700'}`}
            >
              <ShoppingBag size={18} />
              Buy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function isDateAllowed(dateValue, offer, rule) {
  if (!dateValue) return false;
  const date = dayjs(dateValue).format('YYYY-MM-DD');
  const today = dayjs().format('YYYY-MM-DD');
  // Prior-date booking only — block today
  if (date <= today) return false;
  if (offer?.valid_from && date < String(offer.valid_from).slice(0, 10)) return false;
  if (offer?.valid_to && date > String(offer.valid_to).slice(0, 10)) return false;
  if (rule?.specific_date && date !== String(rule.specific_date).slice(0, 10)) return false;
  if (rule?.date_from && date < String(rule.date_from).slice(0, 10)) return false;
  if (rule?.date_to && date > String(rule.date_to).slice(0, 10)) return false;
  if (rule?.day_type) {
    const dayIndex = dayjs(date).day();
    const dayType = String(rule.day_type).toLowerCase();
    if (dayType === 'weekday' && (dayIndex < 1 || dayIndex > 5)) return false;
    if (dayType === 'weekend' && !(dayIndex === 0 || dayIndex === 6)) return false;
    if (dayType === 'custom' && Array.isArray(rule.specific_days)) {
      if (!rule.specific_days.map(Number).includes(dayIndex)) return false;
    }
  }
  return true;
}

function getNextValidDate(offer, rule, lookAheadDays = 60) {
  // Start from tomorrow (prior-date booking)
  const start = dayjs().add(1, 'day');
  for (let i = 0; i < lookAheadDays; i += 1) {
    const candidate = start.add(i, 'day').format('YYYY-MM-DD');
    if (isDateAllowed(candidate, offer, rule)) return candidate;
  }
  return '';
}
