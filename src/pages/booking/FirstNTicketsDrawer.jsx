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
const getComboId = (c) => c?.combo_id ?? c?.id ?? c?._id ?? null;

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
  const now = dayjs().format('YYYY-MM-DD');
  const selectedDay = dayjs(date).format('YYYY-MM-DD');
  // Use First N Tickets logic: Prior-date booking only. Block same-day regardless of time.
  if (selectedDay === now) return false;
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
  combos = [],
  initialDate,
  dynamicPricingDates = {},
}) {
  const dispatch = useDispatch();
  const [date, setDate] = useState('');
  const [itemId, setItemId] = useState('');
  const [itemType, setItemType] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [slots, setSlots] = useState([]);
  const [slotsStatus, setSlotsStatus] = useState('idle');
  const [slotKey, setSlotKey] = useState('');
  const [availability, setAvailability] = useState(null);
  const [availLoading, setAvailLoading] = useState(false);

  const rule = useMemo(() => {
    if (!offer) return null;
    const rules = Array.isArray(offer.rules) ? offer.rules : (Array.isArray(offer.offer_rules) ? offer.offer_rules : []);
    if (!rules.length) return null;

    // Aggregate all target_id for the first_n_tickets multi-target selection
    const allTargetIds = new Set();
    let appliesToAll = false;

    rules.forEach(r => {
      if (r.applies_to_all) appliesToAll = true;
      if (r.target_id) {
        const type = String(r.target_type || 'attraction').toLowerCase();
        allTargetIds.add(`${type}_${r.target_id}`);
      }
    });

    return {
      ...rules[0],
      allTargetIds: Array.from(allTargetIds),
      appliesToAll,
    };
  }, [offer]);

  const ticketLimit = rule?.ticket_limit || null;
  const offerPrice = rule?.offer_price || 0;
  const allTargetIds = rule?.allTargetIds || [];
  const appliesToAll = !!rule?.appliesToAll;

  // Selected item (Unified)
  const selectedItem = useMemo(() => {
    if (!itemId || !itemType) return null;
    if (itemType === 'Attraction') {
      return attractions.find(a => String(getAttrId(a)) === String(itemId)) || null;
    }
    return combos.find(c => String(getComboId(c)) === String(itemId)) || null;
  }, [itemId, itemType, attractions, combos]);

  const hasTimeSlots = itemType === 'Attraction' ? selectedItem?.time_slot_enabled : !!selectedItem;

  // Unified list of eligible items
  const eligibleItems = useMemo(() => {
    const allAttractions = (attractions || []).map(a => ({ ...a, item_type: 'Attraction', id: getAttrId(a) }));
    const allCombos = (combos || []).map(c => ({ ...c, item_type: 'Combo', id: getComboId(c) }));
    const allCatalog = [...allAttractions, ...allCombos];

    if (appliesToAll) return allCatalog;
    if (allTargetIds.length > 0) {
      return allCatalog.filter(item => {
        const idStr = `${item.item_type.toLowerCase()}_${item.id}`;
        return allTargetIds.includes(idStr);
      });
    }
    return allCatalog;
  }, [appliesToAll, allTargetIds, attractions, combos]);

  // Reset on offer change
  useEffect(() => {
    if (!offer || !isOpen) return;
    setQuantity(1);
    setSlots([]);
    setSlotKey('');
    setSlotsStatus('idle');

    // Auto-select if single target
    if (allTargetIds.length === 1 && !appliesToAll) {
      const parts = allTargetIds[0].split('_');
      if (parts.length === 2) {
        setItemId(parts[1]);
        setItemType(parts[0] === 'attraction' ? 'Attraction' : 'Combo');
      } else {
         // Legacy ID? Assume Attraction
         setItemId(allTargetIds[0]);
         setItemType('Attraction');
      }
    } else {
      setItemId('');
      setItemType('');
    }

    // Find first valid date (prior-date booking only, skip today)
    const nextValid = getNextValidDate(offer, rule);
    if (nextValid) setDate(nextValid);
    else setDate('');
  }, [offer, isOpen, rule, allTargetIds, appliesToAll]);

  // Fetch availability when date changes
  useEffect(() => {
    if (!offer || !date) return;
    const offerId = offer.offer_id ?? offer.id;
    setAvailLoading(true);
    api.get(endpoints.offers.availability(offerId), { params: { date } })
      .then((res) => {
        const avail = res?.data || res || {};
        setAvailability(avail);
      })
      .catch(() => setAvailability(null))
      .finally(() => setAvailLoading(false));
  }, [offer, date]);

  // Fetch slots when item or date changes
  useEffect(() => {
    if (!itemId || !date || !itemType) {
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

    const slotEndpoint = itemType === 'Attraction' 
      ? endpoints.attractions.slotsByAttraction(itemId)
      : endpoints.combos.slots(itemId);

    api.get(slotEndpoint, { params: { date: toYMD(date) } })
      .then((res) => {
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setSlots(list);
        setSlotsStatus('succeeded');
      })
      .catch(() => {
        setSlots([]);
        setSlotsStatus('failed');
      });
  }, [itemId, itemType, date, hasTimeSlots]);

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

  const totalPrice = offerPrice * quantity;

  // Batch-check dynamic pricing for ALL candidate dates when drawer is open
  const [dpCache, setDpCache] = useState({});
  const candidateDates = useMemo(() => {
    const todayStr = dayjs().format('YYYY-MM-DD');
    const dates = [];
    // Start from 1 is tomorrow.
    for (let i = 1; i <= 60 && dates.length < 8; i++) {
      const candidate = dayjs().add(i, 'day').format('YYYY-MM-DD');
      // Extra safety: skip if candidate is today or past
      if (candidate <= todayStr) continue;
      if (isDateAllowed(candidate, offer, rule)) dates.push(candidate);
    }
    return dates;
  }, [offer, rule]);

  // Fetch DP status for each candidate date for ALL eligible attractions
  useEffect(() => {
    if (!candidateDates.length || !eligibleItems.length) return;
    candidateDates.forEach((d) => {
      eligibleItems.forEach((item) => {
        const dpKey = `${item.item_type.toLowerCase()}:${item.id}:${d}`;
        if (dynamicPricingDates[dpKey] !== undefined || dpCache[dpKey] !== undefined) return;
        api.get(endpoints.dynamicPricing.check(), {
          params: { target_type: item.item_type.toLowerCase(), target_id: item.id, date: d },
        })
          .then((res) => {
            const hasDp = !!(res?.hasDynamicPricing || res?.data?.hasDynamicPricing);
            setDpCache((prev) => ({ ...prev, [dpKey]: hasDp }));
          })
          .catch(() => {});
      });
    });
  }, [eligibleItems, candidateDates, dynamicPricingDates]);

  // Helper: is a given date blocked by dynamic pricing for ANY eligible attraction?
  const isDateDpBlocked = (d) => {
    return eligibleItems.some((item) => {
      const dpKey = `${item.item_type.toLowerCase()}:${item.id}:${d}`;
      return !!(dynamicPricingDates[dpKey] || dpCache[dpKey]);
    });
  };

  // Batch-fetch availability for all candidate dates
  const [availByDate, setAvailByDate] = useState({});
  useEffect(() => {
    if (!offer || !candidateDates.length) return;
    const offerId = offer.offer_id ?? offer.id;
    candidateDates.forEach((d) => {
      if (availByDate[d] !== undefined) return;
      api.get(endpoints.offers.availability(offerId), { params: { date: d } })
        .then((res) => {
          const avail = res?.data || res || {};
          setAvailByDate((prev) => ({ ...prev, [d]: avail }));
        })
        .catch(() => {
          setAvailByDate((prev) => ({ ...prev, [d]: null }));
        });
    });
  }, [offer, candidateDates]);

  // Helper: is a date sold out?
  const isDateSoldOut = (d) => {
    const avail = availByDate[d];
    return avail?.is_sold_out === true;
  };

  // Remaining tickets for a date
  const getDateRemaining = (d) => {
    const avail = availByDate[d];
    if (!avail || avail.tickets_remaining == null) return null;
    return avail.tickets_remaining;
  };

  // If current date gets blocked by DP, sold out, OR is today, auto-clear it
  useEffect(() => {
    const today = dayjs().format('YYYY-MM-DD');
    if (date && (isDateDpBlocked(date) || isDateSoldOut(date) || date <= today)) setDate('');
  }, [date, dpCache, dynamicPricingDates, availByDate]);

  // Auto-select initial date: skip DP-blocked and sold-out dates
  useEffect(() => {
    if (!isOpen || !offer || date) return;
    const firstGood = candidateDates.find((d) => !isDateDpBlocked(d) && !isDateSoldOut(d));
    if (firstGood) setDate(firstGood);
  }, [isOpen, offer, candidateDates, dpCache, dynamicPricingDates, availByDate]);

  const isReady = date && !isDateDpBlocked(date) && !isDateSoldOut(date) && itemId && quantity > 0 && !isSoldOut
    && (hasTimeSlots ? !!slotKey : true);

  const handleCheckout = (isDirectBuy) => {
    if (!isReady || !offer || !selectedItem) return;
    const offerId = offer.offer_id ?? offer.id ?? null;
    const offerRuleId = rule?.rule_id ?? null;

    const slotsForIndex = slots || [];
    const slot = hasTimeSlots
      ? slotsForIndex.find((s, sIdx) => getSlotKey(s, sIdx) === slotKey) || null
      : null;

    const payload = {
      key: `offer_fnt_${offerId}_${Date.now()}`,
      merge: false,
      item_type: itemType,
      title: selectedItem?.title || selectedItem?.name || itemType,
      slotLabel: slot ? getSlotLabel(slot) : '',
      quantity,
      booking_date: toYMD(date),
      booking_time: slot?.start_time || null,
      unitPrice: offerPrice,
      dateLabel: dayjs(date).format('DD-MMM-YYYY'),
      slot_id: itemType === 'Attraction' ? (slot?.id || slot?.slot_id || null) : null,
      combo_slot_id: itemType === 'Combo' ? (slot?.combo_slot_id || slot?.id || null) : null,
      attraction_id: itemType === 'Attraction' ? itemId : null,
      combo_id: itemType === 'Combo' ? itemId : null,
      slot: slot || null,
      combo: itemType === 'Combo' ? selectedItem : null,
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

          {/* Date Selection */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date of Visit</p>
            <div className="flex flex-wrap gap-2">
              {(() => {
                // Filter out dates that have dynamic pricing — they don't show at all
                const visibleDates = candidateDates.filter((d) => !isDateDpBlocked(d)).slice(0, 6);
                if (visibleDates.length === 0) {
                  return (
                    <div className="text-sm text-amber-600 font-medium">
                      No eligible dates available — all upcoming dates have special pricing.
                    </div>
                  );
                }
                return visibleDates.map((d) => {
                  const soldOut = isDateSoldOut(d);
                  const remaining = getDateRemaining(d);
                  const isSelected = date === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => !soldOut && setDate(d)}
                      disabled={soldOut}
                      className={`px-4 py-2 rounded-xl text-xs font-medium border transition-colors flex flex-col items-center gap-0.5 min-w-[90px] ${
                        soldOut
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through'
                          : isSelected
                            ? 'bg-sky-600 text-white border-sky-600'
                            : 'bg-white text-gray-800 border-gray-200 hover:border-sky-300'
                      }`}
                    >
                      <span>{dayjs(d).format('ddd, DD MMM')}</span>
                      {soldOut && <span className="text-[10px] text-red-500 font-bold no-underline" style={{ textDecoration: 'none' }}>Sold Out</span>}
                      {!soldOut && remaining != null && (
                        <span className={`text-[10px] font-medium ${isSelected ? 'text-sky-100' : 'text-emerald-600'}`}>
                          🎫 {remaining} left
                        </span>
                      )}
                    </button>
                  );
                });
              })()}
            </div>
          </div>

          {/* Item Selection */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Select {eligibleItems.every(i => i.item_type === 'Attraction') ? 'Attraction' : eligibleItems.every(i => i.item_type === 'Combo') ? 'Combo' : 'Item'}
            </p>
            {eligibleItems.length === 1 ? (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800">
                {eligibleItems[0]?.title || eligibleItems[0]?.name}
              </div>
            ) : (
              <select
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 text-sm font-medium"
                value={itemId ? `${itemId}_${itemType}` : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const [id, type] = val.split('_');
                  setItemId(id);
                  setItemType(type);
                  setSlotKey('');
                  setQuantity(1);
                }}
                disabled={!date || isSoldOut}
              >
                <option value="">Select an {eligibleItems.every(i => i.item_type === 'Attraction') ? 'attraction' : eligibleItems.every(i => i.item_type === 'Combo') ? 'combo' : 'item'}</option>
                {eligibleItems.map((item) => (
                  <option key={`${item.id}_${item.item_type}`} value={`${item.id}_${item.item_type}`}>
                    {item.title || item.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Time Slot Selection */}
          {itemId && hasTimeSlots && (
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
          {itemId && !isSoldOut && (!hasTimeSlots || slotKey) && (
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
  
  // Prior-date booking only — block today and past
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
