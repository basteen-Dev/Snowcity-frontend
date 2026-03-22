import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { X, ShoppingCart, ShoppingBag, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { addCartItem, setActiveCartItem, setStep } from '../../features/bookings/bookingsSlice';
import api from '../../services/apiClient';
import endpoints from '../../services/endpoints';
import { getPrice, getSlotUnitPrice } from '../../utils/pricing';
import { formatCurrency } from '../../utils/formatters';

const toYMD = (d) => dayjs(d).format('YYYY-MM-DD');

const getComboId = (combo) => combo?.combo_id ?? combo?.id ?? combo?._id ?? null;

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

const getSlotKeyLocal = (s, idx) =>
  String(s?.combo_slot_id ?? s?.id ?? s?._id ?? `${s?.start_time || ''}-${s?.end_time || ''}-${idx}`);

export default function OfferDrawer({
  isOpen,
  onClose,
  offer,
  combos,
  initialDate,
}) {
  const dispatch = useDispatch();
  const [date, setDate] = useState('');
  const [items, setItems] = useState([]);
  const [slotsByIndex, setSlotsByIndex] = useState([]);

  const rule = useMemo(() => {
    if (!offer) return null;
    if (Array.isArray(offer.rules) && offer.rules.length) return offer.rules[0];
    if (Array.isArray(offer.offer_rules) && offer.offer_rules.length) return offer.offer_rules[0];
    return null;
  }, [offer]);
  const buyQty = Math.max(1, Number(rule?.buy_qty ?? offer?.buy_qty ?? 1));
  const getQty = Math.max(1, Number(rule?.get_qty ?? offer?.get_qty ?? 1));

  useEffect(() => {
    if (!offer) return;
    const nextItems = Array.from({ length: buyQty }, () => ({ comboId: '', slotKey: '' }));
    setItems(nextItems);
    setSlotsByIndex(Array.from({ length: buyQty }, () => ({ status: 'idle', items: [], comboId: '', date: '' })));
  }, [offer, buyQty]);

  useEffect(() => {
    if (!offer || !isOpen) return;
    const preferred = initialDate && isDateAllowed(initialDate, offer, rule) ? initialDate : null;
    if (preferred) {
      setDate(preferred);
      return;
    }
    const nextValid = getNextValidDate(offer, rule);
    if (nextValid) setDate(nextValid);
  }, [initialDate, offer, rule, isOpen]);

  useEffect(() => {
    if (!date) {
      const alreadyReset = slotsByIndex.every((entry) => entry.status === 'idle' && entry.items.length === 0);
      if (!alreadyReset) {
        setSlotsByIndex((prev) => prev.map((entry) => ({ ...entry, status: 'idle', items: [] })));
      }
      return;
    }
    items.forEach((item, idx) => {
      if (!item.comboId) {
        setSlotsByIndex((prev) => {
          const next = [...prev];
          next[idx] = { status: 'idle', items: [], comboId: '', date: '' };
          return next;
        });
        return;
      }
      const current = slotsByIndex[idx];
      if (current && current.comboId === item.comboId && current.date === date && current.status !== 'failed') {
        return;
      }
      setSlotsByIndex((prev) => {
        const next = [...prev];
        next[idx] = { status: 'loading', items: [], comboId: item.comboId, date };
        return next;
      });
      api
        .get(endpoints.combos.slots(item.comboId), { params: { date: toYMD(date) } })
        .then((res) => {
          const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
          setSlotsByIndex((prev) => {
            const next = [...prev];
            next[idx] = { status: 'succeeded', items: list, comboId: item.comboId, date };
            return next;
          });
        })
        .catch(() => {
          setSlotsByIndex((prev) => {
            const next = [...prev];
            next[idx] = { status: 'failed', items: [], comboId: item.comboId, date };
            return next;
          });
        });
    });
  }, [items, date, slotsByIndex]);

  const isReady = date && items.length === buyQty && items.every((item) => item.comboId && item.slotKey);

  const totalPrice = useMemo(() => {
    return items.reduce((sum, item, idx) => {
      const combo = combos.find((c) => String(getComboId(c)) === String(item.comboId));
      if (!combo) return sum;
      const slotsForIndex = slotsByIndex[idx]?.items || [];
      const slot = slotsForIndex.find((s, sIdx) => getSlotKeyLocal(s, sIdx) === item.slotKey) || null;
      const basePrice = getComboDisplayPrice(combo);
      const unitPrice = getSlotUnitPrice(slot, basePrice) || basePrice;
      return sum + Number(unitPrice || 0);
    }, 0);
  }, [items, combos, slotsByIndex]);

  const handleCheckout = (isDirectBuy) => {
    if (!isReady || !offer) return;
    const offerId = offer.offer_id ?? offer.id ?? null;
    const offerRuleId = rule?.rule_id ?? null;
    const offerDescription = offer.description || `Buy ${buyQty} Combo Get ${getQty} Combo (claim at counter)`;
    const baseKey = `offer_${offerId || 'x'}_${Date.now()}`;

    items.forEach((item, idx) => {
      const combo = combos.find((c) => String(getComboId(c)) === String(item.comboId));
      if (!combo) return;
      const slotsForIndex = slotsByIndex[idx]?.items || [];
      const slot = slotsForIndex.find((s, sIdx) => getSlotKeyLocal(s, sIdx) === item.slotKey) || null;
      const basePrice = getComboDisplayPrice(combo);
      const unitPrice = getSlotUnitPrice(slot, basePrice) || basePrice;
      const payload = {
        key: `${baseKey}_${idx + 1}`,
        merge: false,
        item_type: 'Combo',
        title: combo?.name ?? combo?.title ?? 'Combo',
        slotLabel: slot ? getSlotLabel(slot) : '',
        quantity: 1,
        booking_date: toYMD(date),
        booking_time: slot?.start_time || null,
        unitPrice: unitPrice || 0,
        dateLabel: dayjs(date).format('DD-MMM-YYYY'),
        slot_id: null,
        combo_slot_id: slot?.combo_slot_id || slot?.id || null,
        attraction_id: null,
        combo_id: getComboId(combo),
        slot: slot || null,
        combo: combo || null,
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
              Buy {buyQty} combo{buyQty > 1 ? 's' : ''} online and claim {getQty} free combo{getQty > 1 ? 's' : ''} at the counter.
              The free combo must be equal to or lower in value than the cheapest paid combo in your qualifying set.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date of Visit</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setDateFromPreset('today', offer, rule, setDate)}
                className={`px-4 py-2 rounded-xl text-xs font-medium border transition-colors ${date === dayjs().format('YYYY-MM-DD') ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-gray-800 border-gray-200'}`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setDateFromPreset('tomorrow', offer, rule, setDate)}
                className={`px-4 py-2 rounded-xl text-xs font-medium border transition-colors ${date === dayjs().add(1, 'day').format('YYYY-MM-DD') ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-gray-800 border-gray-200'}`}
              >
                Tomorrow
              </button>
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  if (isDateAllowed(e.target.value, offer, rule)) setDate(e.target.value);
                  else {
                    toast.error('This offer is restricted to specific days. Please select a valid date.');
                    setDate('');
                  }
                }}
                min={offer?.valid_from ? String(offer.valid_from).slice(0, 10) : undefined}
                max={offer?.valid_to ? String(offer.valid_to).slice(0, 10) : undefined}
                className="px-4 py-1.5 rounded-xl text-xs font-medium border border-gray-200 text-gray-800 bg-white outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="space-y-5 pt-1">
            {items.map((item, idx) => {
              const slotsForIndex = slotsByIndex[idx]?.items || [];
              return (
                <div key={`offer-combo-${idx}`} className="space-y-2">
                  <h3 className="text-sm font-bold text-gray-800 border-b pb-1">Combo {idx + 1}</h3>
                  <select
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 text-sm font-medium"
                    value={item.comboId}
                    onChange={(e) => {
                      const comboId = e.target.value;
                      setItems((prev) => {
                        const next = [...prev];
                        next[idx] = { comboId, slotKey: '' };
                        return next;
                      });
                    }}
                    disabled={!date}
                  >
                    <option value="">Select Combo {idx + 1}</option>
                    {combos.map((c) => (
                      <option key={getComboId(c)} value={getComboId(c)}>
                        {c.name || c.title}
                      </option>
                    ))}
                  </select>

                  {item.comboId ? (
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

function getComboDisplayPrice(combo) {
  if (!combo) return 0;
  const raw = getPrice(combo);
  if (raw > 0) return raw;
  const directFallback = combo?.combo_price ?? combo?.price ?? combo?.base_price ?? 0;
  if (Number(directFallback) > 0) return Number(directFallback);
  return 0;
}

function isDateAllowed(dateValue, offer, rule) {
  if (!dateValue) return false;
  const date = dayjs(dateValue).format('YYYY-MM-DD');
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
