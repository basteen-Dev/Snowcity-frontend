import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { X, ShoppingCart, ShoppingBag, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { addCartItem, setActiveCartItem, setStep } from '../../features/bookings/bookingsSlice';
import api from '../../services/apiClient';
import endpoints from '../../services/endpoints';
import { getPrice, getBasePrice, getSlotUnitPrice } from '../../utils/pricing';
import { formatCurrency } from '../../utils/formatters';

const toYMD = (d) => dayjs(d).format('YYYY-MM-DD');

const getComboId = (combo) => combo?.combo_id ?? combo?.id ?? combo?._id ?? null;
const getAttrId = (attr) => attr?.attraction_id ?? attr?.id ?? attr?._id ?? null;

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
  return `Slot #${s?.id || s?.combo_slot_id || '?'}`;
};

const isSlotEligible = (slot, date) => {
  if (!slot || !date) return true;
  const now = dayjs().format('YYYY-MM-DD');
  const selectedDay = dayjs(date).format('YYYY-MM-DD');
  // Strict block: same-day bookings are not allowed for these offers.
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

const getSlotKeyLocal = (s, idx) =>
  String(s?.combo_slot_id ?? s?.id ?? s?._id ?? `${s?.start_time || ''}-${s?.end_time || ''}-${idx}`);

export default function OfferDrawer({
  isOpen,
  onClose,
  offer,
  combos = [],
  attractions = [],
  initialDate,
  dynamicPricingDates = {},
}) {
  const dispatch = useDispatch();
  const [date, setDate] = useState('');
  const [items, setItems] = useState([]);
  const [slotsByIndex, setSlotsByIndex] = useState([]);

  const rule = useMemo(() => {
    if (!offer) return null;
    const rules = Array.isArray(offer.rules) ? offer.rules : (Array.isArray(offer.offer_rules) ? offer.offer_rules : []);
    if (!rules.length) return null;

    // Aggregate all target_ids and get_target_ids for multi-target selection
    const allTargetIds = new Set();
    const allGetTargetIds = new Set();
    let appliesToAll = false;

    rules.forEach(r => {
      if (r.applies_to_all) appliesToAll = true;
      if (r.target_id) {
        const type = String(r.target_type || 'attraction').toLowerCase();
        allTargetIds.add(`${type}_${r.target_id}`);
      }
      if (r.get_target_id) {
        const type = String(r.get_target_type || 'attraction').toLowerCase();
        allGetTargetIds.add(`${type}_${r.get_target_id}`);
      }
    });

    return {
      ...rules[0],
      allTargetIds: Array.from(allTargetIds),
      allGetTargetIds: Array.from(allGetTargetIds),
      appliesToAll,
    };
  }, [offer]);

  const buyQty = Math.max(1, Number(rule?.buy_qty ?? offer?.buy_qty ?? 1));
  const getQty = Math.max(1, Number(rule?.get_qty ?? offer?.get_qty ?? 1));

  // Unified list of eligible attractions and combos
  const eligibleItems = useMemo(() => {
    const allAttractions = (attractions || []).map(a => ({ ...a, item_type: 'Attraction', id: getAttrId(a) }));
    const allCombos = (combos || []).map(c => ({ ...c, item_type: 'Combo', id: getComboId(c) }));
    const allCatalog = [...allAttractions, ...allCombos];

    if (!rule || rule.appliesToAll) return allCatalog;
    if (rule.allTargetIds.length === 0) return allCatalog;
    
    return allCatalog.filter(item => {
      const idStr = `${item.item_type.toLowerCase()}_${item.id}`;
      return rule.allTargetIds.includes(idStr);
    });
  }, [attractions, combos, rule]);

  useEffect(() => {
    if (!offer) return;
    const nextItems = Array.from({ length: buyQty }, () => ({ itemId: '', itemType: '', slotKey: '' }));
    setItems(nextItems);
    setSlotsByIndex(Array.from({ length: buyQty }, () => ({ status: 'idle', items: [], itemId: '', itemType: '', date: '' })));
  }, [offer, buyQty]);

  useEffect(() => {
    if (!offer || !isOpen) return;
    // Find first valid date that also doesn't have dynamic pricing
    const findValidDate = (startDate) => {
      const todayStr = dayjs().format('YYYY-MM-DD');
      if (startDate && isDateAllowed(startDate, offer, rule)) {
        const dateStr = toYMD(startDate);
        if (dateStr <= todayStr) return ''; // Block today and past
        
        // Check DP for all items on this date
        const hasDP = eligibleItems.some((item) => {
          const dpKey = `${item.item_type.toLowerCase()}:${item.id}:${dateStr}`;
          return !!dynamicPricingDates[dpKey];
        });
        if (!hasDP) return startDate;
      }
      // Fall back to next valid non-DP date
      const start = dayjs().add(1, 'day'); // Start searching from tomorrow
      for (let i = 0; i <= 60; i++) {
        const candidate = start.add(i, 'day').format('YYYY-MM-DD');
        if (!isDateAllowed(candidate, offer, rule)) continue;
        const hasDP2 = eligibleItems.some((item) => {
          const dpKey = `${item.item_type.toLowerCase()}:${item.id}:${candidate}`;
          return !!dynamicPricingDates[dpKey];
        });
        if (!hasDP2) return candidate;
      }
      return '';
    };
    const preferred = initialDate ? findValidDate(initialDate) : findValidDate(null);
    setDate(preferred || '');
  }, [initialDate, offer, rule, isOpen, dynamicPricingDates, eligibleItems]);

  useEffect(() => {
    if (!date) {
      const alreadyReset = slotsByIndex.every((entry) => entry.status === 'idle' && entry.items.length === 0);
      if (!alreadyReset) {
        setSlotsByIndex((prev) => prev.map((entry) => ({ ...entry, status: 'idle', items: [] })));
      }
      return;
    }
    items.forEach((item, idx) => {
      const current = slotsByIndex[idx];
      if (!item.itemId) {
        if (current && current.status === 'idle' && current.itemId === '') return;
        setSlotsByIndex((prev) => {
          const next = [...prev];
          next[idx] = { status: 'idle', items: [], itemId: '', itemType: '', date: '' };
          return next;
        });
        return;
      }
      if (current && current.itemId === item.itemId && current.date === date && current.status !== 'failed') {
        return;
      }
      setSlotsByIndex((prev) => {
        const next = [...prev];
        next[idx] = { status: 'loading', items: [], itemId: item.itemId, itemType: item.itemType, date };
        return next;
      });

      const slotEndpoint = item.itemType === 'Attraction' 
        ? endpoints.attractions.slotsByAttraction(item.itemId)
        : endpoints.combos.slots(item.itemId);

      api
        .get(slotEndpoint, { params: { date: toYMD(date) } })
        .then((res) => {
          const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
          setSlotsByIndex((prev) => {
            const next = [...prev];
            next[idx] = { status: 'succeeded', items: list, itemId: item.itemId, itemType: item.itemType, date };
            return next;
          });
        })
        .catch(() => {
          setSlotsByIndex((prev) => {
            const next = [...prev];
            next[idx] = { status: 'failed', items: [], itemId: item.itemId, itemType: item.itemType, date };
            return next;
          });
        });
    });
  }, [items, date, slotsByIndex]);

  // Local dynamic pricing cache for combos checked within this drawer
  const [dpCache, setDpCache] = useState({});

  // Fetch dynamic pricing status for selected combos
  useEffect(() => {
    if (!date) return;
    const dateStr = toYMD(date);
    items.forEach((item) => {
      if (!item.itemId) return;
      const dpKey = `${item.itemType.toLowerCase()}:${item.itemId}:${dateStr}`;
      // Skip if already checked in parent or local cache
      if (dynamicPricingDates[dpKey] !== undefined || dpCache[dpKey] !== undefined) return;
      api.get(endpoints.dynamicPricing.check(), {
        params: { target_type: item.itemType.toLowerCase(), target_id: item.itemId, date: dateStr },
      })
        .then((res) => {
          const hasDp = !!(res?.hasDynamicPricing || res?.data?.hasDynamicPricing);
          setDpCache((prev) => ({ ...prev, [dpKey]: hasDp }));
        })
        .catch(() => {});
    });
  }, [date, items, dynamicPricingDates, dpCache]);

  // Check if any selected combo has dynamic pricing on the chosen date
  const hasDynamicPricing = useMemo(() => {
    if (!date) return false;
    const dateStr = toYMD(date);
    return items.some((item) => {
      if (!item.itemId) return false;
      const dpKey = `${item.itemType.toLowerCase()}:${item.itemId}:${dateStr}`;
      return !!(dynamicPricingDates[dpKey] || dpCache[dpKey]);
    });
  }, [date, items, dynamicPricingDates, dpCache]);

  // If current date gets blocked by DP OR is today, auto-clear it
  useEffect(() => {
    const today = dayjs().format('YYYY-MM-DD');
    if (date && (hasDynamicPricing || date <= today)) {
      if (hasDynamicPricing) toast.error('This date has special pricing. Offer is not applicable.');
      setDate('');
    }
  }, [date, hasDynamicPricing, dynamicPricingDates]);

  const isReady = date && !hasDynamicPricing && items.length === buyQty && items.every((item) => item.itemId && item.slotKey);

  const totalPrice = useMemo(() => {
    return items.reduce((sum, item, idx) => {
      const catalogItem = eligibleItems.find((ci) => String(ci.id) === String(item.itemId) && ci.item_type === item.itemType);
      if (!catalogItem) return sum;
      const slotsForIndex = slotsByIndex[idx]?.items || [];
      const slot = slotsForIndex.find((s, sIdx) => getSlotKeyLocal(s, sIdx) === item.slotKey) || null;
      const basePrice = getItemDisplayPrice(catalogItem);
      const unitPrice = getSlotUnitPrice(slot, basePrice) || basePrice;
      return sum + Number(unitPrice || 0);
    }, 0);
  }, [items, eligibleItems, slotsByIndex]);

  const handleCheckout = (isDirectBuy) => {
    if (!isReady || !offer) return;
    const offerId = offer.offer_id ?? offer.id ?? null;
    const offerRuleId = rule?.rule_id ?? null;
    const offerDescription = offer.description || `Buy ${buyQty} Combo Get ${getQty} Combo (claim at counter)`;
    const baseKey = `offer_${offerId || 'x'}_${Date.now()}`;

    items.forEach((item, idx) => {
      const catalogItem = eligibleItems.find((ci) => String(ci.id) === String(item.itemId) && ci.item_type === item.itemType);
      if (!catalogItem) return;
      const slotsForIndex = slotsByIndex[idx]?.items || [];
      const slot = slotsForIndex.find((s, sIdx) => getSlotKeyLocal(s, sIdx) === item.slotKey) || null;
      const basePrice = getItemDisplayPrice(catalogItem);
      const unitPrice = getSlotUnitPrice(slot, basePrice) || basePrice;
      const payload = {
        key: `${baseKey}_${idx + 1}`,
        merge: false,
        item_type: item.itemType,
        title: catalogItem?.name ?? catalogItem?.title ?? item.itemType,
        slotLabel: slot ? getSlotLabel(slot) : '',
        quantity: 1,
        booking_date: toYMD(date),
        booking_time: slot?.start_time || null,
        unitPrice: unitPrice || 0,
        dateLabel: dayjs(date).format('DD-MMM-YYYY'),
        slot_id: item.itemType === 'Attraction' ? (slot?.id || slot?.slot_id || null) : null,
        combo_slot_id: item.itemType === 'Combo' ? (slot?.combo_slot_id || slot?.id || null) : null,
        attraction_id: item.itemType === 'Attraction' ? item.itemId : null,
        combo_id: item.itemType === 'Combo' ? item.itemId : null,
        slot: slot || null,
        combo: item.itemType === 'Combo' ? catalogItem : null,
        offer_id: offerId,
        offer_rule_id: offerRuleId,
        offerDescription,
      };
      dispatch(addCartItem(payload));
      if (idx === 0) dispatch(setActiveCartItem(payload.key));
    });

    onClose();
    if (isDirectBuy) dispatch(setStep(2));
  };

  if (!isOpen || !offer) return null;

  return (
    <div className="fixed inset-0 z-[160] flex justify-end items-end md:items-stretch bg-black/40 backdrop-blur-[2px] md:bg-black/20">
      <div className="flex-1 hidden md:block" onClick={onClose} />
      <div className="w-full md:w-[520px] bg-white rounded-t-3xl md:rounded-l-3xl shadow-2xl flex flex-col h-[85vh] md:h-screen md:max-h-screen">
        <div className="md:hidden flex justify-center pt-2 pb-1">
          <div className="h-1.5 w-12 rounded-xl bg-gray-300" />
        </div>
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 pt-4 pb-2 border-b border-gray-100 bg-white md:rounded-tl-3xl">
          <h2 className="text-lg font-semibold text-sky-700 pr-3 truncate">
            {offer.title || 'Special Offer'}
          </h2>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <div className="bg-sky-50 border border-sky-100 p-4 rounded-2xl flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sky-800 font-bold">
              <AlertCircle size={18} className="text-sky-600" />
              <span>How it works</span>
            </div>
            <p className="text-sm text-sky-700">
              Buy {buyQty} item{buyQty > 1 ? 's' : ''} online and claim {getQty} free item{getQty > 1 ? 's' : ''} at the counter.
              The free item must be equal to or lower in value than the cheapest paid item in your qualifying set.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date of Visit</p>
            <div className="flex flex-wrap gap-2">
              {/* Remove "Today" option as same-day is restricted */}
              <button
                type="button"
                onClick={() => {
                  const d = dayjs().add(1, 'day').format('YYYY-MM-DD');
                  if (!isDateAllowed(d, offer, rule)) {
                    toast.error('This offer is restricted to specific days.');
                    return;
                  }
                  const hasDP = eligibleItems.some((item) => {
                    const dpKey = `${item.item_type.toLowerCase()}:${item.id}:${d}`;
                    return !!(dynamicPricingDates[dpKey] || dpCache[dpKey]);
                  });
                  if (hasDP) {
                    toast.error('This date has special pricing. Offer is not applicable.');
                    return;
                  }
                  setDate(d);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-medium border transition-colors ${date === dayjs().add(1, 'day').format('YYYY-MM-DD') ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-gray-800 border-gray-200'}`}
              >
                Tomorrow
              </button>
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  const d = e.target.value;
                  if (!isDateAllowed(d, offer, rule)) {
                    toast.error('This offer is restricted to specific days. Please select a valid date.');
                    setDate('');
                    return;
                  }
                  const hasDP = eligibleItems.some((item) => {
                    const dpKey = `${item.item_type.toLowerCase()}:${item.id}:${d}`;
                    return !!(dynamicPricingDates[dpKey] || dpCache[dpKey]);
                  });
                  if (hasDP) {
                    toast.error('This date has special pricing. Offer is not applicable.');
                    setDate('');
                    return;
                  }
                  setDate(d);
                }}
                min={dayjs().add(1, 'day').format('YYYY-MM-DD')} // Restrict to tomorrow onwards
                max={offer?.valid_to ? String(offer.valid_to).slice(0, 10) : undefined}
                className="px-4 py-1.5 rounded-xl text-xs font-medium border border-gray-200 text-gray-800 bg-white outline-none focus:border-sky-500"
              />
            </div>
          </div>



          <div className="space-y-5 pt-1">
            {items.map((item, idx) => {
              const slotsForIndex = slotsByIndex[idx]?.items || [];
              const isFree = idx >= buyQty;
              const labelPrefix = isFree ? 'Free Item' : 'Buy Item';
              const displayIdx = isFree ? (idx - buyQty + 1) : (idx + 1);

              return (
                <div key={`offer-combo-${idx}`} className="space-y-2">
                  <h3 className="text-sm font-bold text-gray-800 border-b pb-1">
                    {labelPrefix} {displayIdx} {item.itemType ? `(${item.itemType})` : ''}
                  </h3>
                  <select
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 text-sm font-medium"
                    value={item.itemId ? `${item.itemId}_${item.itemType}` : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const [itemId, itemType] = val.split('_');
                      setItems((prev) => {
                        const next = [...prev];
                        next[idx] = { itemId, itemType, slotKey: '' };
                        return next;
                      });
                    }}
                    disabled={!date}
                  >
                    <option value="">Select {item.itemType || 'Item'}</option>
                    {eligibleItems.map((ci) => (
                      <option key={`${ci.id}_${ci.item_type}`} value={`${ci.id}_${ci.item_type}`}>
                        {ci.name || ci.title}
                      </option>
                    ))}
                  </select>

                  {item.itemId ? (
                    <select
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 text-sm font-medium"
                      value={item.slotKey}
                      onChange={(e) => {
                        const slotKey = e.target.value;
                        setItems((prev) => {
                          const next = [...prev];
                          next[idx] = { ...next[idx], slotKey };
                          return next;
                        });
                      }}
                    >
                      <option value="">Select Time Slot</option>
                      {slotsForIndex.map((s, sIdx) => {
                        const sid = getSlotKeyLocal(s, sIdx);
                        const disabled = !slotHasCapacity(s) || !isSlotEligible(s, date);
                        return (
                          <option key={sid} value={sid} disabled={disabled}>
                            {getSlotLabel(s)}{disabled ? ' (Unavailable)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-gray-100 px-6 py-4 bg-white flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Subtotal</div>
            <div className="text-lg font-bold text-sky-700 tabular-nums">{formatCurrency(totalPrice)}</div>
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

function getItemDisplayPrice(item) {
  if (!item) return 0;
  // Use getBasePrice to ignore dynamic/happy hour discounts when an offer is active
  const base = getBasePrice(item);
  if (base > 0) return base;
  const raw = getPrice(item);
  if (raw > 0) return raw;
  const directFallback = item?.combo_price ?? item?.price ?? item?.base_price ?? 0;
  if (Number(directFallback) > 0) return Number(directFallback);
  return 0;
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

function setDateFromPreset(preset, offer, rule, setDate) {
  const next = preset === 'today'
    ? dayjs().format('YYYY-MM-DD')
    : dayjs().add(1, 'day').format('YYYY-MM-DD');
  if (isDateAllowed(next, offer, rule)) setDate(next);
  else toast.error('This offer is restricted to specific days. Please select a valid date.');
}

function getNextValidDate(offer, rule, lookAheadDays = 60) {
  const start = dayjs();
  for (let i = 0; i <= lookAheadDays; i += 1) {
    const candidate = start.add(i, 'day').format('YYYY-MM-DD');
    if (isDateAllowed(candidate, offer, rule)) return candidate;
  }
  return '';
}
