import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import dayjs from 'dayjs';
import { X } from 'lucide-react';
import api from '../services/apiClient';
import endpoints from '../services/endpoints';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import { addCartItem, setStep } from '../features/bookings/bookingsSlice';
import { getAttrId } from '../utils/ids';
import { imgSrc } from '../utils/media';
import {
  getPrice,
  getBasePrice,
  getDiscountPercent,
  getSlotUnitPrice,
  getSlotBasePrice,
} from '../utils/pricing';
import { formatCurrency } from '../utils/formatters';

/* ================= Helpers ================= */

const toYMD = (d) => dayjs(d).format('YYYY-MM-DD');
const todayYMD = () => dayjs().format('YYYY-MM-DD');

const getSlotKey = (s, idx) =>
  String(
    s?.id ??
      s?._id ??
      s?.slot_id ??
      `${s?.start_time || ''}-${s?.end_time || ''}-${idx}`,
  );

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
    // Without a holiday calendar on the client, treat as true so server-side validation can still apply later
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
    if (
      rule.slot_id != null ||
      (Array.isArray(rule.slot_ids) && rule.slot_ids.length)
    )
      return false;
    if (rule.specific_time || (rule.time_from && rule.time_to)) return false;
    return true;
  }

  const ruleSlotIds = [];
  if (rule.slot_id != null) ruleSlotIds.push(rule.slot_id);
  if (Array.isArray(rule.slot_ids)) ruleSlotIds.push(...rule.slot_ids);
  if (rule.target_slot_id != null) ruleSlotIds.push(rule.target_slot_id);

  if (ruleSlotIds.length) {
    const slotCandidates = [
      slot.slot_id,
      slot.id,
      slot._id,
      slot.combo_slot_id,
    ].filter((v) => v != null);
    const hasMatch = ruleSlotIds.some((rid) =>
      slotCandidates.some((cid) => idsMatch(rid, cid)),
    );
    if (!hasMatch) return false;
  }

  const slotTime = slot.start_time || slot.time || slot.startTime || null;
  if (rule.specific_time && slotTime) {
    if (slotTime.slice(0, 5) !== String(rule.specific_time).slice(0, 5))
      return false;
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
    if (
      !rule.specific_dates.some(
        (d) => dayjs(d).format('YYYY-MM-DD') === bookingDate,
      )
    )
      return false;
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
  let discountType =
    rule?.rule_discount_type ||
    offer.discount_type ||
    (offer.discount_percent ? 'percent' : null);
  let discountValue =
    rule?.rule_discount_value ??
    offer.discount_value ??
    offer.discount_percent ??
    0;
  if (!discountType || !discountValue) return 0;
  discountType = String(discountType).toLowerCase();
  let discount =
    discountType === 'amount'
      ? Number(discountValue)
      : (Number(discountValue) / 100) * unit;
  if (Number.isFinite(Number(offer.max_discount))) {
    discount = Math.min(discount, Number(offer.max_discount));
  }
  discount = Math.min(discount, unit);
  return Math.max(0, discount);
};

const findBestOfferForSelection = (
  offers = [],
  { targetType, targetId, date, slot, basePrice },
) => {
  if (!Array.isArray(offers) || !offers.length || !basePrice || !targetId)
    return null;
  let best = null;

  offers.forEach((offer) => {
    const rules =
      Array.isArray(offer.rules) && offer.rules.length ? offer.rules : [null];
    rules.forEach((rule) => {
      if (
        rule &&
        !ruleMatchesContext(rule, { targetType, targetId, date, slot })
      )
        return;
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

// Slot availability (1 hour buffer for today)
const isSlotAvailable = (slot, selectedDate) => {
  if (!slot || !selectedDate) return true;

  const today = dayjs().format('YYYY-MM-DD');
  const slotDate = dayjs(selectedDate).format('YYYY-MM-DD');

  if (slotDate > today) return true;

  if (slotDate === today) {
    const now = dayjs();
    const slotTime = slot.start_time || slot.time || null;
    if (!slotTime) return true;

    const [hours, minutes] = slotTime.split(':').map(Number);
    const slotMinutes = (hours || 0) * 60 + (minutes || 0);
    const currentMinutes = now.hour() * 60 + now.minute();
    const minimumMinutes = currentMinutes + 60;
    return slotMinutes >= minimumMinutes;
  }

  return false;
};

/* ================= Component ================= */

export default function AttractionDetails() {
  const { id: idParam } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const attrId = React.useMemo(() => {
    if (!idParam || idParam === 'undefined' || idParam === 'null') return null;
    return idParam;
  }, [idParam]);

  const [details, setDetails] = React.useState({
    status: 'idle',
    data: null,
    error: null,
  });
  const [date, setDate] = React.useState(todayYMD());
  const [slots, setSlots] = React.useState({
    status: 'idle',
    items: [],
    error: null,
  });
  const [slotKey, setSlotKey] = React.useState('');
  const [qty, setQty] = React.useState(1);
  const [showCalendar, setShowCalendar] = React.useState(false);
  const [calendarAnchor, setCalendarAnchor] = React.useState(null);
  const calendarAnchorRect = React.useMemo(() => {
    // Always center the calendar
    return null;
  }, [calendarAnchor, showCalendar]);
  const updateDate = React.useCallback((nextDate) => {
    setDate(nextDate);
    setSlotKey('');
  }, []);
  const handleToday = React.useCallback(() => {
    updateDate(todayYMD());
  }, [updateDate]);
  const handleTomorrow = React.useCallback(() => {
    updateDate(dayjs().add(1, 'day').format('YYYY-MM-DD'));
  }, [updateDate]);
  const onCalendarButtonClick = React.useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setCalendarAnchor(event.currentTarget);
    setShowCalendar(true);
  }, []);
  const handleDateSelect = React.useCallback(
    (selectedDate) => {
      updateDate(selectedDate);
      setShowCalendar(false);
    },
    [updateDate],
  );
  const formatDateDisplay = React.useCallback(
    (value) => {
      if (!value) return 'All Days';
      if (value === todayYMD()) return 'All Days';
      if (value === dayjs().add(1, 'day').format('YYYY-MM-DD')) return 'All Days';
      return dayjs(value).format('D MMM');
    },
    [],
  );
  const [linkedGallery, setLinkedGallery] = React.useState({
    status: 'idle',
    items: [],
    error: null,
  });
  const [offers, setOffers] = React.useState({
    status: 'idle',
    items: [],
    error: null,
  });

  React.useEffect(() => {
    if (!attrId) {
      setDetails({
        status: 'failed',
        data: null,
        error: 'Invalid attraction id',
      });
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
          params: {
            active: true,
            target_type: 'attraction',
            target_ref_id: targetId,
            limit: 12,
          },
        });
        if (canceled) return;
        const items = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];
        setLinkedGallery({ status: 'succeeded', items, error: null });
      } catch (err) {
        if (canceled) return;
        setLinkedGallery({
          status: 'failed',
          items: [],
          error: err?.message || 'Failed to load gallery',
        });
      }
    })();
    const cancel = () => {
      canceled = true;
    };
    return cancel;
  }, []);

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
        const res = await api.get(endpoints.attractions.byId(attrId), {
          signal: ac.signal,
        });
        const data = res?.attraction || res || null;
        setDetails({ status: 'succeeded', data, error: null });
      } catch (err) {
        if (err?.canceled) return;
        setDetails({
          status: 'failed',
          data: null,
          error: err?.message || 'Failed to load attraction',
        });
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
        signal: ac.signal,
      });
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
        ? res
        : [];
      setSlots({ status: 'succeeded', items: list, error: null });

      // auto select first available slot
      const firstAvailable =
        list.find((s) => isSlotAvailable(s, date)) || list[0] || null;
      setSlotKey(firstAvailable ? getSlotKey(firstAvailable, 0) : '');
    } catch (err) {
      if (err?.canceled) return;
      setSlots({
        status: 'failed',
        items: [],
        error: err?.message || 'Failed to load slots',
      });
    }
    return () => ac.abort();
  }, [attrId, date]);

  React.useEffect(() => {
    if (attrId && date) {
      setSlotKey('');
      fetchSlots();
    } else {
      setSlots({ status: 'idle', items: [], error: null });
    }
  }, [attrId, date, fetchSlots]);

  React.useEffect(() => {
    if (!attrId || offers.status === 'loading') return;
    let cancelled = false;
    setOffers((s) => ({ ...s, status: 'loading', error: null }));
    (async () => {
      try {
        const res = await api.get(endpoints.offers.list(), {
          params: {
            active: true,
            target_type: 'attraction',
            target_id: attrId,
          },
        });
        if (cancelled) return;
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];
        setOffers({ status: 'succeeded', items: list, error: null });
      } catch (err) {
        if (cancelled) return;
        setOffers({
          status: 'failed',
          items: [],
          error: err?.message || 'Failed to load offers',
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attrId, offers.status]);

  const a = details.data;
  const title = a?.name || a?.title || 'Attraction';

  // hero image: prefer desktop-style fields from DB
  const placeholderDesktop = `https://picsum.photos/seed/attr${attrId}/1920/800`;
  const placeholderMobile = `https://picsum.photos/seed/attr${attrId}/800/600`;

  const [isDesktop, setIsDesktop] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false,
  );
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const coverDesktop = imgSrc(
    a?.desktop_image_url ||
      a?.hero_image ||
      a?.banner_image ||
      a?.image_web ||
      a?.image_url ||
      a,
    placeholderDesktop,
  );
  const coverMobile = imgSrc(
    a?.mobile_image || a?.image_mobile || a?.image_url || a,
    placeholderMobile,
  );
  const cover = isDesktop ? coverDesktop : coverMobile;

  const hasLinkedGallery = linkedGallery.items.length > 0;

  const selectedSlot = React.useMemo(() => {
    for (let i = 0; i < slots.items.length; i += 1) {
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

  const baseUnitPrice = Number(
    slotPricing.base_price ?? computedBaseUnit ?? 0,
  );
  const unitBeforeOffer = Number(
    slotPricing.final_price ?? computedUnit ?? 0,
  );

  const hasBackendOffer =
    Boolean(slotOffer) ||
    (baseUnitPrice > 0 &&
      unitBeforeOffer > 0 &&
      unitBeforeOffer < baseUnitPrice &&
      slotPricing.final_price != null);
  const backendDiscountPercent =
    hasBackendOffer && baseUnitPrice > 0
      ? Math.round(((baseUnitPrice - unitBeforeOffer) / baseUnitPrice) * 100)
      : 0;

  const qtyNumber = Math.max(1, Number(qty) || 1);

  const bestOffer = React.useMemo(() => {
    if (!selectedSlot || !a || !offers.items.length || hasBackendOffer)
      return null;
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
  }, [
    a,
    selectedSlot,
    offers.items,
    unitBeforeOffer,
    baseUnitPrice,
    date,
    hasBackendOffer,
  ]);

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
    ? Math.round(
        ((baseUnitPrice - effectiveUnitPrice) / baseUnitPrice) * 100,
      )
    : getDiscountPercent(a) || 0;

  const hasDiscount =
    baseUnitPrice > 0 &&
    effectiveUnitPrice > 0 &&
    effectiveUnitPrice < baseUnitPrice;

  const totalPrice = Number(effectiveUnitPrice || 0) * qtyNumber;

  const onBookNow = () => {
    if (!a || !date || !selectedSlot || !qty) return;
    const slotId =
      selectedSlot?.id ?? selectedSlot?._id ?? selectedSlot?.slot_id;
    if (!slotId) return;

    const aId = getAttrId(a);
    const sanitizedQty = qtyNumber;
    dispatch(
      addCartItem({
        itemType: 'attraction',
        attractionId: aId,
        attraction: a,
        date: toYMD(date),
        booking_date: toYMD(date),
        booking_time:
          selectedSlot?.start_time ||
          selectedSlot?.startTime ||
          selectedSlot?.slot_start_time ||
          null,
        slotId,
        slot: selectedSlot,
        qty: sanitizedQty,
        unitPrice: Number(
          effectiveUnitPrice ??
            selectedSlot?.price ??
            baseUnitPrice,
        ),
        title: a?.title || a?.name || `Attraction #${aId}`,
        slotLabel: getSlotLabel(selectedSlot),
        dateLabel: dayjs(date).format('DD MMM YYYY'),
        meta: {
          title: a?.title || a?.name || `Attraction #${aId}`,
          start_time: selectedSlot?.start_time,
          end_time: selectedSlot?.end_time,
          capacity: selectedSlot?.capacity,
          available: selectedSlot?.available,
        },
        offer_id: appliedOffer?.offer_id,
        offer_rule_id: appliedOffer?.rule_id || bestOffer?.rule?.rule_id,
      }),
    );
    dispatch(setStep(1));
    const params = new URLSearchParams({
      type: 'attraction',
      attraction_id: String(aId),
      date: toYMD(date),
      slot: slotKey,
      qty: String(sanitizedQty),
    });
    navigate(`/booking?${params.toString()}`);
  };

  const isInitialLoading = details.status === 'loading' && !a;

  /* ============ Render ============ */

  if (isInitialLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-white">
        <Loader />
      </div>
    );
  }

  if (details.status === 'failed') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-white px-4">
        <div className="max-w-lg w-full">
          <ErrorState message={details.error || 'Attraction not found'} />
        </div>
      </div>
    );
  }

  if (!a) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-white px-4">
        <div className="max-w-lg w-full">
          <ErrorState message="Attraction not found" />
        </div>
      </div>
    );
  }

  const shortDescription = a?.short_description || a?.subtitle || '';

  const selectedSlotForBar = selectedSlot;
  const barPrice =
    selectedSlotForBar && effectiveUnitPrice
      ? effectiveUnitPrice * qtyNumber
      : null;

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-[#e0f2fe] via-[#bae6fd] to-white font-sans">
      {/* HERO – desktop image from DB */}
      <section className="relative h-[42vh] md:h-[56vh] bg-gray-200">
        {details.status === 'loading' ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader />
          </div>
        ) : cover ? (
          <>
            <img
              src={cover}
              alt={title}
              loading="lazy"
              className="w-full h-full object-cover"
              draggable="false"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="absolute bottom-6 left-0 right-0 px-4">
              <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow">
                  {title}
                </h1>
                {shortDescription ? (
                  <p className="text-gray-200 text-sm md:text-base max-w-2xl mt-2">
                    {shortDescription}
                  </p>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </section>

      {/* INLINE BOOKING BAR (A1) */}
      <section className="bg-white/90 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 md:py-5">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <div className="flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
                Book this experience
              </p>
              <p className="text-sm text-gray-600">
                Choose your date, time slot & tickets to continue to checkout.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 md:flex-none">
              {/* Date */}
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 flex-wrap">
                <span className="text-xs text-gray-500 whitespace-nowrap">Date</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleToday}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      date === todayYMD()
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white text-gray-800 border-gray-200 hover:border-sky-300'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={handleTomorrow}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      date === dayjs().add(1, 'day').format('YYYY-MM-DD')
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white text-gray-800 border-gray-200 hover:border-sky-300'
                    }`}
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={onCalendarButtonClick}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      date &&
                      date !== '' &&
                      date !== todayYMD() &&
                      date !== dayjs().add(1, 'day').format('YYYY-MM-DD')
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white text-gray-800 border-gray-200 hover:border-sky-300'
                    }`}
                  >
                    {date && date !== todayYMD() && date !== dayjs().add(1, 'day').format('YYYY-MM-DD')
                      ? formatDateDisplay(date)
                      : 'All Days'}
                  </button>
                </div>
              </div>

              {/* Slot */}
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 min-w-[190px]">
                <span className="text-xs text-gray-500">Slot</span>
                {slots.status === 'loading' ? (
                  <span className="text-xs text-gray-500">Loading…</span>
                ) : (
                  <select
                    className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-gray-900 truncate"
                    value={slotKey}
                    onChange={(e) => setSlotKey(e.target.value)}
                    disabled={
                      slots.status === 'loading' || !slots.items.length
                    }
                  >
                    {!slots.items.length ? (
                      <option>No slots</option>
                    ) : (
                      <>
                        {!slotKey && <option value="">Select slot</option>}
                        {slots.items
                          .filter((s) => isSlotAvailable(s, date))
                          .map((s, i) => {
                            const sid = getSlotKey(s, i);
                            const disabled =
                              s?.available === 0 || s?.capacity === 0;
                            const pricingBase =
                              getSlotUnitPrice(s, fallbackUnitPrice) ||
                              fallbackUnitPrice ||
                              0;
                            return (
                              <option
                                key={sid}
                                value={sid}
                                disabled={disabled}
                              >
                                {getSlotLabel(s)}
                                {pricingBase
                                  ? ` • ${formatCurrency(pricingBase)}`
                                  : ''}
                                {disabled ? ' — Unavailable' : ''}
                              </option>
                            );
                          })}
                      </>
                    )}
                  </select>
                )}
              </div>

              {/* Qty */}
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5">
                <span className="text-xs text-gray-500">Qty</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="w-7 h-7 text-sm rounded-full border border-gray-300 flex items-center justify-center"
                    onClick={() =>
                      setQty((prev) =>
                        Math.max(1, Number(prev || 1) - 1),
                      )
                    }
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={qty}
                    onChange={(e) =>
                      setQty(Math.max(1, Number(e.target.value) || 1))
                    }
                    className="w-12 bg-transparent border-none text-center text-sm font-semibold outline-none"
                  />
                  <button
                    type="button"
                    className="w-7 h-7 text-sm rounded-full border border-gray-300 flex items-center justify-center"
                    onClick={() =>
                      setQty((prev) =>
                        Math.max(1, Number(prev || 1) + 1),
                      )
                    }
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Book button */}
              <button
                type="button"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-blue-600 text-white px-6 py-2.5 text-sm font-semibold shadow-md hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={!selectedSlotForBar || !effectiveUnitPrice}
                onClick={onBookNow}
              >
                {barPrice ? (
                  <>
                    Book Now •{' '}
                    <span className="ml-1 rupee">
                      {formatCurrency(barPrice)}
                    </span>
                  </>
                ) : (
                  'Book Now'
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="max-w-6xl mx-auto px-4 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-3 gap-10 md:gap-12">
        {/* LEFT CONTENT */}
        <div className="lg:col-span-2 space-y-8">
          {details.status === 'failed' ? (
            <ErrorState message={details.error} />
          ) : (
            <>
              {/* Short description */}
              {shortDescription ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
                  <p className="text-gray-700 text-base md:text-lg">
                    {shortDescription}
                  </p>
                </div>
              ) : null}

              {/* Full description */}
              {a?.description ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    About this attraction
                  </h2>
                  <div
                    className="prose prose-sm md:prose max-w-none text-gray-700 leading-relaxed"
                    style={{ textAlign: 'left' }}
                    dangerouslySetInnerHTML={{ __html: a.description }}
                  />
                </div>
              ) : null}


            </>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="lg:col-span-1">
          <div className="rounded-3xl border shadow-lg bg-white p-6 sticky top-24 space-y-6">
            {/* Price summary */}
            <div className="flex items-baseline justify-between">
              <div className="flex flex-col gap-1 flex-1">
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">
                    Base price
                  </div>
                  <div className="text-lg font-semibold text-gray-900 rupee">
                    {formatCurrency(baseUnitPrice || effectiveUnitPrice || 0)}
                  </div>
                </div>
                {hasDiscount ? (
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-gray-500">
                      Offer price
                    </div>
                    <div className="text-2xl font-bold text-emerald-600 rupee">
                      {formatCurrency(effectiveUnitPrice || 0)}
                    </div>
                    {offerDescription ? (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {offerDescription}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">
                    Per person • taxes included
                  </p>
                )}
                {appliedOffer ? (
                  <span className="mt-1 text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <span>
                      {appliedOffer.rule_type === 'happy_hour'
                        ? 'Happy Hour'
                        : 'Offer'}{' '}
                      applied:
                    </span>
                    <span>{appliedOffer.title || 'Special offer'}</span>
                  </span>
                ) : null}
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">per ticket</div>
                {hasDiscount && (
                  <div className="text-xs font-semibold text-emerald-600">
                    Save {discountPercent}%
                  </div>
                )}
              </div>
            </div>

            {/* Subtotal / total */}
            <div className="mt-3 rounded-2xl border bg-gray-50 px-3 py-2 text-sm">
              <div className="flex items-center justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="rupee">
                  {qtyNumber} × {formatCurrency(effectiveUnitPrice || 0)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-gray-900 font-semibold">
                <span>Total</span>
                <span className="rupee">
                  {formatCurrency(totalPrice || 0)}
                </span>
              </div>
            </div>

            {/* Helper links */}
            <div className="space-y-3 text-sm">
              <p className="text-gray-600">
                Slots and pricing may vary by date and time. Use the booking
                bar above to choose your preferred session.
              </p>
              <Link
                to="/attractions"
                className="inline-flex items-center justify-center rounded-full border border-blue-100 text-blue-600 px-5 py-2.5 text-sm font-medium hover:bg-blue-50"
              >
                Explore other attractions
              </Link>
            </div>

            <p className="text-[11px] text-gray-400 text-center">
              We’ll add this to your cart so you can add more attractions before
              checkout.
            </p>
          </div>
        </aside>
      </section>
      </div>

      {showCalendar && (
        <div
          className="fixed inset-0 z-[80] flex"
          onClick={() => setShowCalendar(false)}
        >
          <div className="flex-1" />
          <div
            className="absolute bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 w-80 max-h-[70vh] overflow-y-auto"
            style={{
              top: calendarAnchorRect ? `${calendarAnchorRect.top}px` : '50%',
              left: calendarAnchorRect ? `${calendarAnchorRect.left - 160}px` : '50%',
              transform: calendarAnchorRect ? 'none' : 'translate(-50%, -50%)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Select Date</h3>
              <button
                onClick={() => setShowCalendar(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              {[0, 1, 2].map((monthOffset) => {
                const currentDate = dayjs().add(monthOffset, 'month');
                const monthStart = currentDate.startOf('month');
                const monthEnd = currentDate.endOf('month');
                const startDay = monthStart.day();
                const daysInMonth = monthEnd.date();
                const today = dayjs();
                return (
                  <div key={monthOffset} className="border border-gray-100 rounded-xl p-3 bg-white">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      {currentDate.format('MMMM YYYY')}
                    </h4>
                    <div className="grid grid-cols-7 gap-1 text-xs">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                        <div key={day} className="text-center text-gray-400 font-medium py-2">
                          {day}
                        </div>
                      ))}
                      {Array.from({ length: startDay }).map((_, idx) => (
                        <div key={`empty-${idx}`} className="p-2" />
                      ))}
                      {Array.from({ length: daysInMonth }).map((_, idx) => {
                        const current = monthStart.date(idx + 1);
                        const dateStr = current.format('YYYY-MM-DD');
                        const isPast = current.isBefore(today, 'day');
                        const isSelected = date === dateStr;
                        const isToday = current.isSame(today, 'day');
                        return (
                          <button
                            key={dateStr}
                            type="button"
                            onClick={() => handleDateSelect(dateStr)}
                            disabled={isPast}
                            className={`
                              p-2 rounded-lg text-sm font-medium transition-all duration-200
                              ${isPast ? 'text-gray-300 cursor-not-allowed bg-gray-50' : ''}
                              ${isSelected ? 'bg-sky-600 text-white shadow-sm scale-105' : ''}
                              ${
                                !isPast && !isSelected
                                  ? 'hover:bg-sky-50 text-gray-700 hover:text-sky-700'
                                  : ''
                              }
                              ${
                                isToday && !isSelected
                                  ? 'bg-sky-100 text-sky-700 font-semibold border border-sky-200'
                                  : ''
                              }
                            `}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
