import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import dayjs from 'dayjs';
import api from '../services/apiClient';
import endpoints from '../services/endpoints';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import { addCartItem, setStep } from '../features/bookings/bookingsSlice';
import { getAttrId } from '../utils/ids';
import { imgSrc } from '../utils/media';
import { getPrice, getBasePrice, getDiscountPercent, getSlotUnitPrice, getSlotBasePrice } from '../utils/pricing';
import { formatCurrency } from '../utils/formatters';

const toYMD = (d) => dayjs(d).format('YYYY-MM-DD');
const todayYMD = () => dayjs().format('YYYY-MM-DD');

const getSlotKey = (s, idx) =>
  String(s?.id ?? s?._id ?? s?.slot_id ?? `${s?.start_time || ''}-${s?.end_time || ''}-${idx}`);

// Helper function to convert 24-hour time to 12-hour format
const formatTime12Hour = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
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
  
  return `Slot #${s?.id ?? s?._id ?? s?.slot_id ?? '?'}`;
};

const parseMinutes = (time) => {
  if (!time || typeof time !== 'string') return null;
  const [h = '0', m = '0'] = time.split(':');
  const hours = Number(h);
  const minutes = Number(m);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
};

const matchesDayType = (rule = {}, dateYMD) => {
  if (!rule.day_type) return true;
  const dayIndex = dayjs(dateYMD).day(); // 0 (Sun) - 6 (Sat)
  const dayType = String(rule.day_type).toLowerCase();
  if (dayType === 'weekday') return dayIndex >= 1 && dayIndex <= 5;
  if (dayType === 'weekend') return dayIndex === 0 || dayIndex === 6;
  if (dayType === 'custom' && Array.isArray(rule.specific_days)) {
    return rule.specific_days.map(Number).includes(dayIndex);
  }
  if (dayType === 'holiday') {
    // Without a holiday calendar on the client, treat as true so server-side validation still applies later
    return true;
  }
  return true;
};

const normalizeTargetType = (value) => String(value || '').toLowerCase();
const idsMatch = (a, b) => {
  if (a == null || b == null) return false;
  return String(a) === String(b);
};
const toBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (value == null) return false;
  if (typeof value === 'number') return value !== 0;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return false;
  if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n'].includes(normalized)) return false;
  return Boolean(value);
};

const ruleMatchesSlotConstraints = (rule = {}, slot = null) => {
  if (!slot) {
    if (rule.slot_id != null || (Array.isArray(rule.slot_ids) && rule.slot_ids.length)) return false;
    if (rule.specific_time || (rule.time_from && rule.time_to)) return false;
    return true;
  }

  const ruleSlotIds = [];
  if (rule.slot_id != null) ruleSlotIds.push(rule.slot_id);
  if (Array.isArray(rule.slot_ids)) ruleSlotIds.push(...rule.slot_ids);
  if (rule.target_slot_id != null) ruleSlotIds.push(rule.target_slot_id);

  if (ruleSlotIds.length) {
    const slotCandidates = [slot.slot_id, slot.id, slot._id, slot.combo_slot_id].filter((v) => v != null);
    const hasMatch = ruleSlotIds.some((rid) => slotCandidates.some((cid) => idsMatch(rid, cid)));
    if (!hasMatch) return false;
  }

  const slotTime = slot.start_time || slot.time || slot.startTime || null;
  if (rule.specific_time && slotTime) {
    if (slotTime.slice(0, 5) !== String(rule.specific_time).slice(0, 5)) return false;
  }

  if (rule.time_from && rule.time_to && slotTime) {
    const slotMinutes = parseMinutes(slotTime);
    const fromMinutes = parseMinutes(rule.time_from);
    const toMinutes = parseMinutes(rule.time_to);
    if (
      slotMinutes == null ||
      fromMinutes == null ||
      toMinutes == null ||
      slotMinutes < fromMinutes ||
      slotMinutes > toMinutes
    ) {
      return false;
    }
  }

  return true;
};

const ruleMatchesContext = (rule, { targetType, targetId, date, slot }) => {
  if (!rule || !targetType || !targetId) return false;
  const bookingDate = dayjs(date).format('YYYY-MM-DD');

  const ruleType = normalizeTargetType(rule.target_type);
  const currentType = normalizeTargetType(targetType);
  if (ruleType && currentType && ruleType !== currentType) return false;

  const appliesToAll = toBoolean(rule.applies_to_all);
  if (!appliesToAll) {
    const ruleTargetIds = [];
    if (rule.target_id != null) ruleTargetIds.push(rule.target_id);
    if (Array.isArray(rule.target_ids)) ruleTargetIds.push(...rule.target_ids);
    if (!ruleTargetIds.length) return false;
    if (!ruleTargetIds.some((id) => idsMatch(id, targetId))) return false;
  }

  if (rule.specific_date && bookingDate !== rule.specific_date) return false;
  if (Array.isArray(rule.specific_dates) && rule.specific_dates.length) {
    if (!rule.specific_dates.some((d) => dayjs(d).format('YYYY-MM-DD') === bookingDate)) return false;
  }
  if (rule.date_from && bookingDate < rule.date_from) return false;
  if (rule.date_to && bookingDate > rule.date_to) return false;
  if (!matchesDayType(rule, bookingDate)) return false;
  if (!ruleMatchesSlotConstraints(rule, slot)) return false;

  return true;
};

const computeDiscountFromRule = (offer = {}, rule = null, basePrice = 0) => {
  const unit = Number(basePrice);
  if (!unit || unit <= 0) return 0;
  let discountType = rule?.rule_discount_type || offer.discount_type || (offer.discount_percent ? 'percent' : null);
  let discountValue = rule?.rule_discount_value ?? offer.discount_value ?? offer.discount_percent ?? 0;
  if (!discountType || !discountValue) return 0;
  discountType = String(discountType).toLowerCase();
  let discount = discountType === 'amount'
    ? Number(discountValue)
    : (Number(discountValue) / 100) * unit;
  if (Number.isFinite(Number(offer.max_discount))) {
    discount = Math.min(discount, Number(offer.max_discount));
  }
  discount = Math.min(discount, unit);
  return Math.max(0, discount);
};

const findBestOfferForSelection = (offers = [], { targetType, targetId, date, slot, basePrice }) => {
  if (!Array.isArray(offers) || !offers.length || !basePrice || !targetId) return null;
  let best = null;

  offers.forEach((offer) => {
    const rules = Array.isArray(offer.rules) && offer.rules.length ? offer.rules : [null];
    rules.forEach((rule) => {
      if (rule && !ruleMatchesContext(rule, { targetType, targetId, date, slot })) return;
      const discount = computeDiscountFromRule(offer, rule, basePrice);
      if (!discount) return;
      const finalPrice = Math.max(0, basePrice - discount);
      if (!best || finalPrice < best.price) {
        best = {
          offer,
          rule,
          price: finalPrice,
          discount,
        };
      }
    });
  });

  return best;
};

export default function AttractionDetails() {
  const { id: idParam } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const attrId = React.useMemo(() => {
    if (!idParam || idParam === 'undefined' || idParam === 'null') return null;
    return idParam;
  }, [idParam]);

  const [details, setDetails] = React.useState({ status: 'idle', data: null, error: null });
  const [date, setDate] = React.useState(todayYMD());
  const [slots, setSlots] = React.useState({ status: 'idle', items: [], error: null });
  const [slotKey, setSlotKey] = React.useState('');
  const [qty, setQty] = React.useState(1);
  const [linkedGallery, setLinkedGallery] = React.useState({ status: 'idle', items: [], error: null });
  const [offers, setOffers] = React.useState({ status: 'idle', items: [], error: null });

  React.useEffect(() => {
    if (!attrId) {
      setDetails({ status: 'failed', data: null, error: 'Invalid attraction id' });
    }
  }, [attrId]);

  const numericAttrId = React.useMemo(() => {
    const fromDetails = getAttrId(details.data || {});
    const parsedDetailsId = Number(fromDetails);
    if (Number.isFinite(parsedDetailsId)) return parsedDetailsId;
    const fallback = Number(attrId);
    return Number.isFinite(fallback) ? fallback : null;
  }, [details.data, attrId]);

  const loadLinkedGallery = React.useCallback((targetId) => {
    if (!targetId) return () => {};
    let canceled = false;
    setLinkedGallery({ status: 'loading', items: [], error: null });
    (async () => {
      try {
        const res = await api.get(endpoints.gallery.list(), {
          params: { active: true, target_type: 'attraction', target_ref_id: targetId, limit: 12 }
        });
        if (canceled) return;
        const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setLinkedGallery({ status: 'succeeded', items, error: null });
      } catch (err) {
        if (canceled) return;
        setLinkedGallery({ status: 'failed', items: [], error: err?.message || 'Failed to load gallery' });
      }
    })();
    const cancel = () => {
      canceled = true;
    };
    return cancel;
  }, [attrId]);

  React.useEffect(() => {
    if (!numericAttrId) {
      setLinkedGallery({ status: 'idle', items: [], error: null });
      return () => {};
    }
    const cancel = loadLinkedGallery(numericAttrId);
    return cancel;
  }, [numericAttrId, loadLinkedGallery]);

  React.useEffect(() => {
    if (!attrId) return;
    setDetails({ status: 'loading', data: null, error: null });
    const ac = new AbortController();
    (async () => {
      try {
        const res = await api.get(endpoints.attractions.byId(attrId), { signal: ac.signal });
        const data = res?.attraction || res || null;
        setDetails({ status: 'succeeded', data, error: null });
      } catch (err) {
        if (err?.canceled) return;
        setDetails({ status: 'failed', data: null, error: err?.message || 'Failed to load attraction' });
      }
    })();
    return () => ac.abort();
  }, [attrId]);

  const fetchSlots = React.useCallback(async () => {
    if (!attrId || !date) return;
    setSlots((s) => ({ ...s, status: 'loading', error: null, items: [] }));
    const ac = new AbortController();
    try {
      const res = await api.get(endpoints.slots.list(), {
        params: { attraction_id: attrId, date: toYMD(date) },
        signal: ac.signal
      });
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setSlots({ status: 'succeeded', items: list, error: null });
    } catch (err) {
      if (err?.canceled) return;
      setSlots({ status: 'failed', items: [], error: err?.message || 'Failed to load slots' });
    }
    return () => ac.abort();
  }, [attrId, date]);

  React.useEffect(() => {
    if (!attrId || offers.status === 'loading') return;
    let cancelled = false;
    setOffers((s) => ({ ...s, status: 'loading', error: null }));
    (async () => {
      try {
        const res = await api.get(endpoints.offers.list(), { params: { active: true, target_type: 'attraction', target_id: attrId } });
        if (cancelled) return;
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setOffers({ status: 'succeeded', items: list, error: null });
      } catch (err) {
        if (cancelled) return;
        setOffers({ status: 'failed', items: [], error: err?.message || 'Failed to load offers' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attrId, offers.status]);

  React.useEffect(() => {
    if (attrId && date) {
      setSlotKey('');
      fetchSlots();
    } else {
      setSlots({ status: 'idle', items: [], error: null });
    }
  }, [attrId, date, fetchSlots]);

  const a = details.data;
  const title = a?.name || a?.title || 'Attraction';
  const hasLinkedGallery = linkedGallery.items.length > 0;
  const cover = imgSrc(a, `https://picsum.photos/seed/attr${attrId}/1200/600`);

  const selectedSlot = React.useMemo(() => {
    for (let i = 0; i < slots.items.length; i++) {
      const s = slots.items[i];
      if (getSlotKey(s, i) === slotKey) return s;
    }
    return null;
  }, [slots.items, slotKey]);

  const fallbackUnitPrice = Number(getPrice(a) || 0);
  const fallbackBasePrice = Number(getBasePrice(a) || fallbackUnitPrice);
  const slotPricing = selectedSlot?.pricing || {};
  const slotOffer = selectedSlot?.offer || null;

  const computedBaseUnit = selectedSlot
    ? getSlotBasePrice(selectedSlot, fallbackBasePrice)
    : fallbackBasePrice;
  const computedUnit = selectedSlot
    ? getSlotUnitPrice(selectedSlot, fallbackUnitPrice)
    : fallbackUnitPrice;

  const baseUnitPrice = Number(slotPricing.base_price ?? computedBaseUnit ?? 0);
  const unitBeforeOffer = Number(slotPricing.final_price ?? computedUnit ?? 0);

  const hasBackendOffer = Boolean(slotOffer) || (baseUnitPrice > 0 && unitBeforeOffer > 0 && unitBeforeOffer < baseUnitPrice && slotPricing.final_price != null);
  const backendDiscountPercent = hasBackendOffer && baseUnitPrice > 0
    ? Math.round(((baseUnitPrice - unitBeforeOffer) / baseUnitPrice) * 100)
    : 0;

  const qtyNumber = Math.max(1, Number(qty) || 1);
  const bestOffer = React.useMemo(() => {
    if (!selectedSlot || !a || !offers.items.length || hasBackendOffer) return null;
    const basePrice = unitBeforeOffer || baseUnitPrice || 0;
    if (!basePrice) return null;
    const attractionId = getAttrId(a);
    return findBestOfferForSelection(offers.items, {
      targetType: 'attraction',
      targetId: attractionId,
      date,
      slot: selectedSlot,
      basePrice,
    });
  }, [a, selectedSlot, offers.items, unitBeforeOffer, baseUnitPrice, date, hasBackendOffer]);

  const effectiveUnitPrice = hasBackendOffer
    ? unitBeforeOffer || baseUnitPrice
    : bestOffer
    ? bestOffer.price
    : unitBeforeOffer;

  const appliedOffer = hasBackendOffer ? slotOffer : bestOffer?.offer || null;
  const offerDescription = appliedOffer?.description || '';
  const discountPercent = hasBackendOffer
    ? backendDiscountPercent
    : bestOffer && baseUnitPrice > 0
    ? Math.round(((baseUnitPrice - effectiveUnitPrice) / baseUnitPrice) * 100)
    : 0;
  const hasDiscount = baseUnitPrice > 0 && effectiveUnitPrice > 0 && effectiveUnitPrice < baseUnitPrice;

  const totalPrice = Number(effectiveUnitPrice || 0) * qtyNumber;

  const onBookNow = () => {
    if (!a || !date || !selectedSlot || !qty) return;
    const slotId = selectedSlot?.id ?? selectedSlot?._id ?? selectedSlot?.slot_id;
    if (!slotId) return;

    const aId = getAttrId(a);
    const sanitizedQty = qtyNumber;
    dispatch(
      addCartItem({
        attractionId: aId,
        attraction: a,
        date: toYMD(date),
        slotId,
        slot: selectedSlot,
        qty: sanitizedQty,
        unitPrice: Number(effectiveUnitPrice ?? selectedSlot?.price ?? baseUnitPrice),
        offer_id: appliedOffer?.offer_id,
        offer_rule_id: appliedOffer?.rule_id || bestOffer?.rule?.rule_id,
      })
    );
    dispatch(setStep(1));
    const params = new URLSearchParams({
      type: 'attraction',
      attraction_id: String(aId),
      date: toYMD(date),
      slot: slotKey,
      qty: String(sanitizedQty)
    });
    navigate(`/booking?${params.toString()}`);
  };

  return (
    <div className="min-h-screen">
      <section className="relative h-[42vh] md:h-[56vh] bg-gray-200">
        {details.status === 'loading' ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader />
          </div>
        ) : cover ? (
          <>
            <img src={cover} alt="snowcity" loading="lazy" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-0 right-0 px-4">
              <div className="max-w-6xl mx-auto">
                <h1 className="text-2xl md:text-4xl font-bold text-white drop-shadow">{title}</h1>
              </div>
            </div>
          </>
        ) : null}
      </section>

      <section className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {details.status === 'failed' ? (
            <ErrorState message={details.error} />
          ) : (
            <>
              {a?.short_description ? (
                <p className="text-gray-700 text-lg">{a.short_description}</p>
              ) : null}

              {a?.description ? (
                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-3">About</h2>
                  <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: a.description }} />
                </div>
              ) : null}

              {linkedGallery.status === 'loading' && !linkedGallery.items.length ? (
                <div className="mt-8"><Loader /></div>
              ) : null}
              {linkedGallery.status === 'failed' ? (
                <div className="mt-8">
                  <ErrorState message={linkedGallery.error} onRetry={() => numericAttrId && loadLinkedGallery(numericAttrId)} />
                </div>
              ) : null}
              {linkedGallery.items.length ? (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-semibold">Gallery</h2>
                    <span className="text-sm text-gray-500">#{linkedGallery.items[0]?.target_name || title}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {linkedGallery.items.map((item) => {
                      const isVideo = String(item.media_type || '').toLowerCase() === 'video';
                      const mediaUrl = isVideo ? item.url : imgSrc(item);
                      if (!mediaUrl) return null;
                      return (
                        <figure key={`linked-media-${item.gallery_item_id}`} className="relative rounded-xl overflow-hidden border shadow-sm bg-white">
                          {isVideo ? (
                            <video className="w-full h-48 object-cover" src={mediaUrl} controls preload="metadata" poster={imgSrc(item.thumbnail)} />
                          ) : (
                            <img src={mediaUrl} alt={item.title || title} className="w-full h-48 object-cover" loading="lazy" />
                          )}
                          {(item.title || item.description) ? (
                            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-xs text-white">
                              {item.title ? <div className="font-medium text-sm">{item.title}</div> : null}
                              {item.description ? <div className="opacity-80 mt-1">{item.description}</div> : null}
                            </figcaption>
                          ) : null}
                        </figure>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>

        <aside className="md:col-span-1">
          <div className="rounded-2xl border shadow-sm bg-white p-4 sticky top-24">
            <div className="flex items-baseline justify-between">
              <div className="flex flex-col gap-1 flex-1">
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Base price</div>
                  <div className="text-lg font-semibold text-gray-900">{formatCurrency(baseUnitPrice || effectiveUnitPrice)}</div>
                </div>
                {hasDiscount ? (
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-gray-500">Offer price</div>
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(effectiveUnitPrice)}</div>
                    {offerDescription ? (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{offerDescription}</p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">Per person • taxes included</p>
                )}
                {appliedOffer ? (
                  <span className="mt-1 text-xs font-semibold text-green-600 flex items-center gap-1">
                    <span>{appliedOffer.rule_type === 'happy_hour' ? 'Happy Hour' : 'Offer'} applied:</span>
                    <span>{appliedOffer.title || 'Special offer'}</span>
                  </span>
                ) : null}
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">per ticket</div>
                {hasDiscount ? (
                  <div className="text-xs font-semibold text-green-600">Save {discountPercent}%</div>
                ) : null}
              </div>
            </div>

            <div className="mt-3 rounded-2xl border bg-gray-50 px-3 py-2 text-sm">
              <div className="flex items-center justify-between text-gray-600">
                <span>Subtotal</span>
                <span>
                  {qtyNumber} × {formatCurrency(effectiveUnitPrice)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-gray-900 font-semibold">
                <span>Total</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Date</label>
                <input
                  type="date"
                  className="w-full rounded-md border px-3 py-2"
                  min={todayYMD()}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Slot</label>
                {slots.status === 'loading' ? (
                  <Loader className="py-4" />
                ) : slots.status === 'failed' ? (
                  <ErrorState message={slots.error} />
                ) : slots.items.length ? (
                  <div className="flex flex-wrap gap-2">
                    {slots.items.map((s, i) => {
                      const sid = getSlotKey(s, i);
                      const selected = slotKey === sid;
                      const disabled = s?.available === 0 || s?.capacity === 0;
                      return (
                        <button
                          key={`slot-${sid}`}
                          type="button"
                          disabled={disabled}
                          onClick={() => setSlotKey(sid)}
                          className={`px-3 py-2 rounded-full border text-sm ${
                            disabled
                              ? 'opacity-50 cursor-not-allowed'
                              : selected
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'hover:bg-gray-50'
                          }`}
                          title={getSlotLabel(s)}
                        >
                          {getSlotLabel(s)}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No slots available for this date.</div>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Quantity</label>
                <div className="inline-flex items-center rounded-full border overflow-hidden">
                  <button type="button" className="px-3 py-2 hover:bg-gray-50" onClick={() => setQty((q) => Math.max(1, Number(q) - 1))}>-</button>
                  <input type="number" min={1} className="w-16 text-center py-2" value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} />
                  <button type="button" className="px-3 py-2 hover:bg-gray-50" onClick={() => setQty((q) => Math.max(1, Number(q) + 1))}>+</button>
                </div>
              </div>

              <button
                className="w-full rounded-full bg-blue-600 text-white px-5 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
                onClick={onBookNow}
                disabled={!a || !date || !slotKey || !qty}
              >
                Book Now
              </button>

              <div className="text-xs text-gray-500 text-center">
                We’ll add this to your cart so you can add more attractions before checkout.
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}