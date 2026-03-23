import React from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import dayjs from 'dayjs';
import { X, ChevronDown, Check, Calendar, Plus, Minus } from 'lucide-react';
import api from '../services/apiClient';
import endpoints from '../services/endpoints';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import GalleryViewer from '../components/gallery/GalleryViewer';
import { addCartItem, setStep } from '../features/bookings/bookingsSlice';
import toast from 'react-hot-toast';
import { getAttrId } from '../utils/ids';
import { prioritizeSnowcityFirst, getNextAvailableDate } from '../utils/attractions';
import { imgSrc } from '../utils/media';
import usePageSeo from '../hooks/usePageSeo';
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

const normalizeHtml = (value) => {
  if (!value || typeof value !== 'string') return '';
  const doc = new DOMParser().parseFromString(value, 'text/html');
  const decoded = doc.documentElement.textContent || value;
  return value.includes('<') && value.includes('>') ? value : decoded;
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
    // If no slot is selected (open entry), allow rule regardless of time constraints
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
  const isToday = bookingDate === todayYMD();

  const ruleType = normalizeTargetType(rule.target_type);
  const currentType = normalizeTargetType(targetType);
  if (ruleType && currentType && ruleType !== currentType) {
    return false;
  }

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
  if (rule.date_from && bookingDate < rule.date_from.slice(0, 10)) {
    return false;
  }
  if (rule.date_to && bookingDate > rule.date_to.slice(0, 10)) {
    return false;
  }
  if (!matchesDayType(rule, bookingDate)) {
    return false;
  }
  const slotRes = ruleMatchesSlotConstraints(rule, slot);
  return slotRes;
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
  const maxD = Number(offer.max_discount);
  if (offer.max_discount != null && Number.isFinite(maxD) && maxD > 0) {
    discount = Math.min(discount, maxD);
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

// Get URL for gallery item (image only)
const getGalleryMediaUrl = (item, fallback = '') => {
  if (!item) return fallback;
  if (typeof item === 'string') return imgSrc(item, fallback);
  // For gallery items, use the url field which should contain the media URL
  return imgSrc(item.url || item.image_url, fallback);
};

/* ================= Component ================= */

export default function AttractionDetails() {
  const { slug: slugParam } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  const slug = React.useMemo(() => {
    if (!slugParam || slugParam === 'undefined' || slugParam === 'null') return null;
    return slugParam;
  }, [slugParam]);

  const [details, setDetails] = React.useState({
    status: 'idle',
    data: null,
    error: null,
  });

  const [date, setDate] = React.useState(
    searchParams.get('date') || getNextAvailableDate(details.data)
  );
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

  // Day rule blocking for Today/Tomorrow buttons
  const isDayBlockedByAttrRule = (dateStr) => {
    const dayRuleType = details.data?.day_rule_type || 'all_days';
    if (dayRuleType === 'all_days') return false;
    const customDays = details.data?.custom_days || [];
    const dayOfWeek = dayjs(dateStr).day();
    if (dayRuleType === 'weekends') return dayOfWeek !== 0 && dayOfWeek !== 6;
    if (dayRuleType === 'weekdays') return dayOfWeek === 0 || dayOfWeek === 6;
    if (dayRuleType === 'custom_days' && customDays.length > 0) return !customDays.includes(dayOfWeek);
    return false;
  };
  const todayBlocked = isDayBlockedByAttrRule(todayYMD());
  const tomorrowBlocked = isDayBlockedByAttrRule(dayjs().add(1, 'day').format('YYYY-MM-DD'));

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

  const [viewerIndex, setViewerIndex] = React.useState(null);

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

  const bookingSectionRef = React.useRef(null);

  React.useEffect(() => {
    if (!slug) {
      setDetails({
        status: 'failed',
        data: null,
        error: 'Invalid attraction slug',
      });
    }
  }, [slug]);

  // Handle auto-open and date from search parameters
  React.useEffect(() => {
    const pDate = searchParams.get('date');
    const openDrawer = searchParams.get('openDrawer');

    if (pDate) {
      setDate(pDate);
    } else if (details.data) {
      // If no URL date, use next available day based on rules
      setDate(getNextAvailableDate(details.data));
    }

    if (openDrawer === 'true') {
      // Small delay to ensure render is complete
      setTimeout(() => {
        bookingSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [searchParams, details.data]);

  const numericAttrId = React.useMemo(() => {
    return details.data?.attraction_id || null;
  }, [details.data]);

  const a = details.data;
  const title = a?.name || a?.title || 'Attraction';

  const isTimeSlotDisabled = a?.time_slot_enabled === false;
  const isBookingStopped = a?.stop_booking === true;

  const loadLinkedGallery = React.useCallback((targetId) => {
    if (!targetId) return () => { };
    let canceled = false;
    setLinkedGallery({ status: 'loading', items: [], error: null });
    console.log('Debug - Loading gallery for attraction ID:', targetId);
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

        // Handle both { data, meta } format and direct array format
        const items = res?.data?.data || (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);

        console.log('Debug - Raw gallery response:', res);
        console.log('Debug - Processed gallery items:', items);
        console.log('Debug - Expected target ID:', targetId);

        // Additional client-side validation to ensure items belong to this attraction
        const validItems = items.filter(item => {
          const itemTargetType = String(item?.target_type || '').toLowerCase();
          const itemTargetId = item?.target_ref_id;

          const typeMatches = itemTargetType === 'attraction';
          const idMatches = itemTargetId && (
            itemTargetId === targetId ||
            String(itemTargetId) === String(targetId) ||
            Number(itemTargetId) === Number(targetId)
          );

          if (!typeMatches || !idMatches) {
            console.warn('Debug - Filtering out invalid gallery item:', {
              item,
              itemTargetType,
              itemTargetId,
              targetId,
              typeMatches,
              idMatches
            });
          }

          return typeMatches && idMatches;
        });

        console.log('Debug - Validated gallery items for attraction', targetId, ':', validItems);

        // Since we're filtering at API level, no need for additional client-side filtering
        // Sort items so first added appears first
        const sortedItems = validItems.sort((a, b) => {
          if (a.created_at && b.created_at) {
            return new Date(a.created_at) - new Date(b.created_at);
          }
          if (a.id && b.id) return a.id - b.id;
          if (a.gallery_item_id && b.gallery_item_id) {
            return a.gallery_item_id - b.gallery_item_id;
          }
          return 0;
        });

        console.log('Debug - Final sorted gallery items:', sortedItems);

        setLinkedGallery({
          status: 'succeeded',
          items: sortedItems,
          error: null,
        });
      } catch (err) {
        if (canceled) return;
        console.log('Debug - Gallery loading error:', err);
        setLinkedGallery({
          status: 'failed',
          items: [],
          error: err?.message || 'Failed to load gallery',
        });
      }
    })();
    return () => {
      canceled = true;
    };
  }, []);

  React.useEffect(() => {
    console.log('Debug - Gallery loading effect triggered. numericAttrId:', numericAttrId);

    // Reset gallery state when attraction changes
    setLinkedGallery({ status: 'loading', items: [], error: null });

    if (!numericAttrId) {
      console.log('Debug - No numericAttrId, setting gallery to idle');
      setLinkedGallery({ status: 'idle', items: [], error: null });
      return () => { };
    }

    // Add a small delay to ensure state reset
    const timeoutId = setTimeout(() => {
      const cancel = loadLinkedGallery(numericAttrId);
      return cancel;
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [numericAttrId, loadLinkedGallery]);

  React.useEffect(() => {
    if (!slug) return;
    setDetails({ status: 'loading', data: null, error: null });
    const ac = new AbortController();
    (async () => {
      try {
        const res = await api.get(endpoints.attractions.bySlug(slug), {
          signal: ac.signal,
        });
        const data = res?.attraction || res || null;
        setDetails({ status: 'succeeded', data, error: null });
      } catch (err) {
        if (err?.canceled) return;

        // If attraction not found (404), redirect to 404 page
        if (err?.status === 404 || err?.response?.status === 404) {
          navigate('/404', { replace: true });
          return;
        }

        setDetails({
          status: 'failed',
          data: null,
          error: err?.message || 'Failed to load attraction',
        });
      }
    })();
    return () => ac.abort();
  }, [slug]);

  const fetchSlots = React.useCallback(async () => {
    if (!numericAttrId || !date) return;

    // Skip slot fetching if time slots are disabled for this attraction
    if (a?.time_slot_enabled === false) {
      setSlots({ status: 'succeeded', items: [], error: null });
      setSlotKey('no-slot'); // Special key for non-slotted booking
      return;
    }

    setSlots((s) => ({ ...s, status: 'loading', error: null, items: [] }));
    const ac = new AbortController();
    try {
      const res = await api.get(endpoints.slots.list(), {
        params: { attraction_id: numericAttrId, date: toYMD(date) },
        signal: ac.signal,
      });
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : [];
      setSlots({ status: 'succeeded', items: list, error: null });

      // auto select first available slot
      // const firstAvailable = 
      //   list.find((s) => isSlotAvailable(s, date)) || list[0] || null;
      // setSlotKey(firstAvailable ? getSlotKey(firstAvailable, 0) : '');
      setSlotKey('');
    } catch (err) {
      if (err?.canceled) return;
      setSlots({
        status: 'failed',
        items: [],
        error: err?.message || 'Failed to load slots',
      });
    }
    return () => ac.abort();
  }, [numericAttrId, date, a?.time_slot_enabled]);

  React.useEffect(() => {
    if (numericAttrId && date) {
      setSlotKey('');
      fetchSlots();
    } else {
      setSlots({ status: 'idle', items: [], error: null });
    }
  }, [numericAttrId, date, fetchSlots]);

  React.useEffect(() => {
    if (!numericAttrId || offers.status !== 'idle') return;
    let cancelled = false;
    setOffers((s) => ({ ...s, status: 'loading', error: null }));
    (async () => {
      try {
        const res = await api.get(endpoints.offers.list(), {
          params: {
            active: true,
            target_type: 'attraction',
            target_id: numericAttrId,
            limit: 100,
          },
        });
        if (cancelled) return;
        const list = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data)
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
  }, [numericAttrId]);



  // hero image placeholders
  const placeholderDesktop = ``;
  const placeholderMobile = ``;

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
    a?.mobile_image ||
    a?.image_mobile ||
    a?.image_url ||
    a,
    placeholderMobile,
  );
  const cover = isDesktop ? coverDesktop : coverMobile;

  // SEO Injection
  usePageSeo({
    title: a?.meta_title || title || 'Attraction Details',
    description: a?.meta_description || a?.short_description || '',
    keywords: a?.meta_keywords || '',
    image: cover,
    imageAlt: a?.image_alt || title,
    type: 'website',
    faq_items: a?.faq_items,
    head_schema: a?.head_schema,
    body_schema: a?.body_schema,
    footer_schema: a?.footer_schema,
  });

  // HERO GALLERY DATA (for banner + viewer)
  const heroGalleryItems = React.useMemo(() => {
    const items = linkedGallery.items || [];
    const galleryImages = items.map(item => ({
      ...item,
      image_url: getGalleryMediaUrl(item) || imgSrc(item.image_url || item.url || item, '')
    }));

    // For hero display: use cover as primary, then gallery images
    if (cover) {
      return [{ image_url: cover, isCover: true }, ...galleryImages];
    }

    // If no cover, use gallery images only
    return galleryImages;
  }, [linkedGallery.items, cover]);

  // Gallery viewer items (only actual gallery images, not cover)
  const galleryViewerItems = React.useMemo(() => {
    const items = linkedGallery.items || [];
    return items.map(item => ({
      ...item,
      image_url: getGalleryMediaUrl(item) || imgSrc(item.image_url || item.url || item, '')
    }));
  }, [linkedGallery.items]);

  // Debug: Log image URLs
  React.useEffect(() => {
    console.log('Debug - Attraction ID:', numericAttrId);
    console.log('Debug - Attraction Data:', a);
    console.log('Debug - Cover URL:', cover);
    console.log('Debug - Gallery Items:', linkedGallery.items);
    console.log('Debug - Hero Gallery Items:', heroGalleryItems);
    console.log('Debug - Gallery Viewer Items:', galleryViewerItems);
  }, [numericAttrId, a, cover, linkedGallery.items, heroGalleryItems, galleryViewerItems]);

  const heroMain = cover || galleryViewerItems[0]?.image_url || null;
  const heroRightTop = galleryViewerItems[0]?.image_url || heroMain;
  const heroRightBottom = galleryViewerItems[1]?.image_url || galleryViewerItems[0]?.image_url || heroMain;
  const totalGalleryItems = galleryViewerItems.length || 1;

  const selectedSlot = React.useMemo(() => {
    for (let i = 0; i < slots.items.length; i += 1) {
      const s = slots.items[i];
      if (getSlotKey(s, i) === slotKey) return s;
    }
    return null;
  }, [slots.items, slotKey]);

  const selectedSlotForBar = React.useMemo(() => {
    if (isTimeSlotDisabled) {
      return { id: 'open', label: 'Open entry', pricing: {} };
    }
    return selectedSlot;
  }, [isTimeSlotDisabled, selectedSlot]);

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
    const isSlotRequired = a?.time_slot_enabled !== false;
    const isSameOrPast = date && date <= todayYMD();
    if ((isSlotRequired && !selectedSlot) || !a || !offers.items.length || hasBackendOffer || isSameOrPast)
      return null;
    // When dynamic pricing is active for this date, skip all offers
    if (selectedSlot && (selectedSlot.dynamic_pricing_active || selectedSlot.pricing?.dynamic_pricing_active))
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
      ? Math.round(((baseUnitPrice - effectiveUnitPrice) / baseUnitPrice) * 100)
      : getDiscountPercent(a) || 0;

  const hasDiscount =
    baseUnitPrice > 0 &&
    effectiveUnitPrice > 0 &&
    effectiveUnitPrice < baseUnitPrice;

  const totalPrice = Number(effectiveUnitPrice || 0) * qtyNumber;

  const onBookNow = () => {
    if (!a || !date || !qty || isBookingStopped) return;

    // Check slot only if slots are enabled
    if (!isTimeSlotDisabled && !selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }

    const slotId = isTimeSlotDisabled
      ? null
      : (selectedSlot?.id ?? selectedSlot?._id ?? selectedSlot?.slot_id);

    if (!isTimeSlotDisabled && !slotId) return;

    const aId = getAttrId(a);
    const sanitizedQty = qtyNumber;

    window.dataLayer = window.dataLayer || [];
    const items = [
      {
        item_name: a?.title || a?.name || `Attraction #${aId}`,
        product_type: 'single',
        quantity: sanitizedQty,
        price: Number(effectiveUnitPrice ?? selectedSlot?.price ?? baseUnitPrice),
        time_slot: isTimeSlotDisabled ? '' : getSlotLabel(selectedSlot),
        selected_date: toYMD(date)
      }
    ];
    window.dataLayer.push({
      event: 'add_to_cart',
      attraction_name: items[0]?.item_name || '',
      product_type: items[0]?.product_type || '',
      total_tickets: items.reduce((sum, item) => sum + item.quantity, 0),
      ticket_price: Number(effectiveUnitPrice ?? selectedSlot?.price ?? baseUnitPrice),
      ticket_quantity: sanitizedQty,
      total_price: Number(effectiveUnitPrice ?? selectedSlot?.price ?? baseUnitPrice) * sanitizedQty,
      total_pax: sanitizedQty,
      time_slot: isTimeSlotDisabled ? '' : getSlotLabel(selectedSlot),
      selected_date: toYMD(date),
      currency: 'INR',
      button_type: 'buy_now',
      items: items
    });

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
        slot: selectedSlot || null,
        qty: sanitizedQty,
        unitPrice: Number(
          effectiveUnitPrice ?? selectedSlot?.price ?? baseUnitPrice,
        ),
        title: a?.title || a?.name || `Attraction #${aId}`,
        slotLabel: isTimeSlotDisabled ? null : getSlotLabel(selectedSlot),
        dateLabel: dayjs(date).format('DD MMM YYYY'),
        meta: {
          title: a?.title || a?.name || `Attraction #${aId}`,
          start_time: selectedSlot?.start_time || null,
          end_time: selectedSlot?.end_time || null,
          capacity: selectedSlot?.capacity || null,
          available: selectedSlot?.available || null,
        },
        offer_id: appliedOffer?.offer_id,
        offer_rule_id: appliedOffer?.rule_id || bestOffer?.rule?.rule_id,
        offerDescription: offerDescription || appliedOffer?.description || '',
      }),
    );

    toast.success('Added to your booking!');
    dispatch(setStep(1));

    const params = new URLSearchParams({
      type: 'attraction',
      attraction_id: String(aId),
      date: toYMD(date),
      slot: slotKey,
      qty: String(sanitizedQty),
    });
    sessionStorage.removeItem('snowcity_booking_state');
    navigate(`/tickets-offers?${params.toString()}`);
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

  // Handle stopped booking state with a full-page overlay or banner if needed, 
  // but usually we just disable the sidebar. For UX, let's show a banner if stopped.
  const stoppedBanner = isBookingStopped ? (
    <div className="bg-red-50 border-y border-red-100 py-3 mb-6">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2 text-red-700 font-medium">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Booking temporarily unavailable online</span>
      </div>
    </div>
  ) : null;

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
  const barPrice =
    selectedSlotForBar && effectiveUnitPrice
      ? effectiveUnitPrice * qtyNumber
      : null;

  return (
    <>
      {/* Add pb-24 so fixed mobile bar doesn't overlap content */}
      <div className="min-h-screen bg-gradient-to-b from-[#f5f8ff] to-white font-sans pt-14 lg:pt-0">
        {stoppedBanner}
        {/* HERO BANNER + GALLERY (Full Width) */}
        <section className="mt-0 bg-transparent">

          {/* Banner card - Full Width Block */}
          <div className="w-full bg-gray-100 border-y border-gray-200">
            {galleryViewerItems.length > 0 ? (
              // Multi-image layout when gallery has actual images
              <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-[2px] bg-white">
                {/* Left side - Attraction banner image */}
                <button
                  type="button"
                  className="relative w-full group"
                  onClick={() =>
                    galleryViewerItems.length && setViewerIndex(0)
                  }
                >
                  <div className="md:h-[420px] w-full overflow-hidden">
                    <img
                      src={cover}
                      alt={title}
                      className="w-full h-half object-cover"
                      loading="lazy"
                      draggable="false"
                    />

                    {/* Attraction Title Overlay removed */}
                  </div>
                </button>

                {/* Right column - Gallery images */}
                <div className="hidden md:grid grid-rows-2 gap-[2px] h-[420px]">
                  {/* First gallery image */}
                  <button
                    type="button"
                    className="relative w-full group"
                    onClick={() =>
                      galleryViewerItems.length > 0 && setViewerIndex(0)
                    }
                  >
                    <div className="w-full h-full overflow-hidden">
                      <img
                        src={galleryViewerItems[0]?.image_url || ''}
                        alt={title}
                        className="w-full h-full object-cover brightness-[0.95]"
                        loading="lazy"
                        draggable="false"
                      />
                      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/50 via-black/10 to-transparent pointer-events-none" />
                    </div>
                  </button>

                  {/* Second gallery image with pagination */}
                  <button
                    type="button"
                    className="relative w-full group"
                    onClick={() =>
                      galleryViewerItems.length > 1 && setViewerIndex(1)
                    }
                  >
                    <div className="w-full h-full overflow-hidden">
                      <img
                        src={galleryViewerItems[1]?.image_url || galleryViewerItems[0]?.image_url || ''}
                        alt={title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        draggable="false"
                      />

                      <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-xl">
                        {galleryViewerItems.length > 1 ? (
                          <>1 / {galleryViewerItems.length}</>
                        ) : null}
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              // Full-width banner when no gallery images
              <button
                type="button"
                className="relative w-full group"
                onClick={() =>
                  galleryViewerItems.length && setViewerIndex(0)
                }
              >
                <div className="h-[420px] w-full overflow-hidden">
                  <img
                    src={cover}
                    alt={title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    draggable="false"
                  />

                  {/* Attraction Title Overlay removed */}
                </div>
              </button>
            )}
          </div>
        </section>

        {/* Mobile Title - Rendered here for mobile only */}
        <div className="lg:hidden px-4 pt-6 pb-2">
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            {title}
          </h1>
        </div>

        {/* MOBILE BOOKING CONTROLS (gallery is handled by hero) */}
        <div className="lg:hidden max-w-6xl mx-auto px-4 py-6">
          <div className="rounded-3xl border shadow-lg bg-white p-6 space-y-6">
            {/* Price summary */}
            <div className="flex items-baseline justify-between">
              <div className="flex flex-col gap-1 flex-1">
                <div>
                  <div
                    className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold"

                  >
                    price
                  </div>
                  <div
                    className="text-base font-semibold text-gray-900 rupee"

                  >
                    {formatCurrency(baseUnitPrice || effectiveUnitPrice || 0)}
                  </div>
                </div>
                {hasDiscount ? (
                  <div>
                    <div
                      className="text-[11px] uppercase tracking-wide text-gray-500"

                    >
                      Offer price
                    </div>
                    <div
                      className="text-xl font-bold text-emerald-600 rupee"

                    >
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
                
                {hasDiscount && (
                  <div className="text-xs font-semibold text-emerald-600">
                    Save {discountPercent}%
                  </div>
                )}
              </div>
            </div>

            {/* Date Selection */}
            {!isBookingStopped && (
              <div className="space-y-3">
                <label className="text-xs font-medium text-gray-700">
                  Select Date
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleToday}
                    disabled={todayBlocked}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${todayBlocked
                      ? 'text-gray-300 border-gray-100 cursor-not-allowed bg-gray-50'
                      : date === todayYMD()
                      ? 'bg-[#0099FF] text-white border-[#0099FF]'
                      : 'bg-white text-[#111827] border-gray-200 hover:border-[#007ACC]'
                      }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={handleTomorrow}
                    disabled={tomorrowBlocked}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${tomorrowBlocked
                      ? 'text-gray-300 border-gray-100 cursor-not-allowed bg-gray-50'
                      : date === dayjs().add(1, 'day').format('YYYY-MM-DD')
                      ? 'bg-[#0099FF] text-white border-[#0099FF]'
                      : 'bg-white text-[#111827] border-gray-200 hover:border-[#007ACC]'
                      }`}
                  >
                    Tomorrow
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onCalendarButtonClick}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${date &&
                        date !== todayYMD() &&
                        date !== dayjs().add(1, 'day').format('YYYY-MM-DD')
                        ? 'bg-[#0099FF] text-white border-[#0099FF]'
                        : 'bg-white text-[#111827] border-gray-200 hover:border-[#007ACC]'
                        }`}
                    >
                      {date &&
                        date !== todayYMD() &&
                        date !== dayjs().add(1, 'day').format('YYYY-MM-DD')
                        ? dayjs(date).format('D MMM')
                        : 'More Dates'}
                    </button>
                    <button
                      type="button"
                      onClick={onCalendarButtonClick}
                      className="p-1.5 rounded-xl border border-gray-200 text-gray-600 hover:border-[#007ACC] hover:text-[#007ACC] transition-colors bg-white shadow-sm"
                      title="Open Calendar"
                    >
                      <Calendar size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Time Slot Selection */}
            {!isBookingStopped && !isTimeSlotDisabled && (
              <div className="space-y-3">
                {slots.status === 'loading' ? (
                  <div className="py-3">
                    <Loader size="sm" />
                  </div>
                ) : slots.status === 'failed' ? (
                  <div className="py-3">
                    <ErrorState message={slots.error || 'Failed to load slots'} />
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-900 outline-none appearance-none pr-10"
                      value={slotKey}
                      onChange={(e) => setSlotKey(e.target.value)}
                      disabled={!slots.items.length}
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
                                <option key={sid} value={sid} disabled={disabled}>
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
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <ChevronDown size={18} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {isTimeSlotDisabled && (
              <div className="bg-sky-50 border border-sky-100 rounded-xl p-3">
                <p className="text-xs text-sky-700 font-medium text-center">
                  Open Entry Experience — no time slot selection required.
                </p>
              </div>
            )}

            {/* Quantity Selection */}
            {!isBookingStopped && (
              <div className="space-y-3">
                <label className="text-xs font-medium text-gray-700">
                  No. of tickets
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:border-sky-300 active:scale-95 transition"
                    onClick={() =>
                      setQty((prev) => Math.max(1, Number(prev || 1) - 1))
                    }
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center font-semibold text-gray-800 tabular-nums">
                    {qty}
                  </span>
                  <button
                    type="button"
                    className="w-9 h-9 rounded-xl border border-sky-200 flex items-center justify-center active:scale-95 bg-sky-600 text-white shadow-sm"
                    onClick={() =>
                      setQty((prev) => Math.max(1, Number(prev || 1) + 1))
                    }
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            )}

            {/* Subtotal / total */}
            {date && selectedSlotForBar && (
              <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm flex flex-col gap-2">
                <div className="flex items-center justify-between text-gray-700">
                  <span className="font-semibold">
                    Selection:
                  </span>
                  <span className="font-medium text-right">
                    {dayjs(date).format('DD MMM YYYY')} <br /> {getSlotLabel(selectedSlotForBar)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-700 pt-2 border-t border-sky-200 border-dashed">
                  <span>Subtotal</span>
                  <span className="rupee">
                    {qtyNumber} × {formatCurrency(effectiveUnitPrice || 0)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-gray-900 font-bold text-lg">
                  <span>Total</span>
                  <span className="rupee">
                    {formatCurrency(totalPrice || 0)}
                  </span>
                </div>
              </div>
            )}

            {!date || (!isTimeSlotDisabled && !selectedSlotForBar) ? (
              <div className="mt-4 rounded-2xl border bg-gray-50 px-3 py-2 text-sm text-center text-gray-500">
                Please select {!date ? 'a date' : 'a time slot'}.
              </div>
            ) : null}

            {isBookingStopped && (
              <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-center text-red-600 font-medium">
                Booking temporarily unavailable online
              </div>
            )}

            {/* Book button */}
            <button
              type="button"
              className="w-full inline-flex items-center justify-center rounded-xl bg-[#0099FF] text-white px-6 py-2.5 text-sm font-semibold shadow-md hover:bg-[#007ACC] disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isBookingStopped || !date || (!isTimeSlotDisabled && !selectedSlotForBar) || !effectiveUnitPrice}
              onClick={onBookNow}

            >
              {barPrice ? (
                <>
                  Book Now •{' '}
                  <span className="ml-1 rupee">{formatCurrency(barPrice)}</span>
                </>
              ) : (
                'Book Now'
              )}
            </button>
          </div>
        </div >

        {/* MAIN CONTENT */}
        <section className="max-w-7xl mx-auto px-4 py-8 md:py-12 mt-0">
          <div className="mb-8 hidden lg:block">
            <h1
              className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight"

            >
              {title}
            </h1>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 md:gap-12">
            {/* LEFT CONTENT */}
            <div className="lg:col-span-2 space-y-8">
              {details.status === 'failed' ? (
                <ErrorState message={details.error} />
              ) : (
                <>
                  {/* Short description */}
                  {shortDescription ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
                      <div className="prose prose-blue max-w-none text-gray-700">
                        <div dangerouslySetInnerHTML={{ __html: normalizeHtml(shortDescription) }} />
                      </div>
                    </div>
                  ) : null}

                  {/* Full description */}
                  {a?.description ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
                      <div className="prose prose-blue max-w-none text-gray-700">
                        <div dangerouslySetInnerHTML={{ __html: normalizeHtml(a.description) }} />
                      </div>
                    </div>
                  ) : null}

                  {/* FAQ Section */}
                  {a?.faq_items && a.faq_items.length > 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 mt-8">
                      <h2
                        className="text-lg font-semibold text-gray-900 mb-4"

                      >
                        Frequently Asked Questions
                      </h2>
                      <div className="space-y-4">
                        {a.faq_items.map((faq, idx) => (
                          <details key={idx} className="group border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                            <summary className="flex cursor-pointer items-center justify-between text-base font-medium text-gray-900 marker:content-none [&::-webkit-details-marker]:hidden">
                              {faq.question}
                              <ChevronDown className="h-5 w-5 text-gray-500 transition-transform group-open:rotate-180 flex-shrink-0 ml-4" />
                            </summary>
                            <p className="mt-3 text-gray-700 whitespace-pre-line text-xs md:text-sm leading-relaxed">
                              {faq.answer}
                            </p>
                          </details>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {/* Gallery Link */}
                  {linkedGallery.items && linkedGallery.items.length > 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
                      <Link
                        to={`/gallery?attraction=${numericAttrId}`}
                        className="inline-flex items-center gap-2 text-[#0099FF] hover:text-[#007ACC] font-medium transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        View {linkedGallery.items.length} Gallery {linkedGallery.items.length === 1 ? 'Image' : 'Images'}
                      </Link>
                    </div>
                  ) : null}
                </>
              )}
            </div>

            {/* RIGHT SIDEBAR (DESKTOP) */}
            <aside className="hidden lg:block lg:col-span-1">
              <div className="rounded-3xl border shadow-lg bg-white p-6 sticky top-24 space-y-6">
                {/* Price summary */}
                <div className="flex items-baseline justify-between">
                  <div className="flex flex-col gap-1 flex-1">
                    <div>
                      <div
                        className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold"

                      >
                        price
                      </div>
                      <div
                        className="text-base font-semibold text-gray-900 rupee"

                      >
                        {formatCurrency(
                          baseUnitPrice || effectiveUnitPrice || 0,
                        )}
                      </div>
                    </div>

                    {hasDiscount ? (
                      <div>
                        <div
                          className="text-[11px] uppercase tracking-wide text-gray-500"

                        >
                          Offer price
                        </div>
                        <div
                          className="text-xl font-bold text-emerald-600 rupee"

                        >
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
                    {hasDiscount && (
                      <div className="text-xs font-semibold text-emerald-600">
                        Save {discountPercent}%
                      </div>
                    )}
                  </div>
                </div>

                {/* Booking controls (desktop) */}
                <div className="space-y-5">
                  {/* Date */}
                  {!isBookingStopped && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-700">
                        Select Date
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleToday}
                          disabled={todayBlocked}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${todayBlocked
                            ? 'text-gray-300 border-gray-100 cursor-not-allowed bg-gray-50'
                            : date === todayYMD()
                            ? 'bg-[#0099FF] text-white border-[#0099FF]'
                            : 'bg-white text-[#111827] border-gray-200 hover:border-[#007ACC]'
                            }`}
                        >
                          Today
                        </button>
                        <button
                          type="button"
                          onClick={handleTomorrow}
                          disabled={tomorrowBlocked}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${tomorrowBlocked
                            ? 'text-gray-300 border-gray-100 cursor-not-allowed bg-gray-50'
                            : date === dayjs().add(1, 'day').format('YYYY-MM-DD')
                            ? 'bg-[#0099FF] text-white border-[#0099FF]'
                            : 'bg-white text-[#111827] border-gray-200 hover:border-[#007ACC]'
                            }`}
                        >
                          Tomorrow
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={onCalendarButtonClick}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${date &&
                              date !== todayYMD() &&
                              date !== dayjs().add(1, 'day').format('YYYY-MM-DD')
                              ? 'bg-[#0099FF] text-white border-[#0099FF]'
                              : 'bg-white text-[#111827] border-gray-200 hover:border-[#007ACC]'
                              }`}
                          >
                            {date &&
                              date !== todayYMD() &&
                              date !== dayjs().add(1, 'day').format('YYYY-MM-DD')
                              ? dayjs(date).format('D MMM')
                              : 'More Dates'}
                          </button>
                          <button
                            type="button"
                            onClick={onCalendarButtonClick}
                            className="p-1.5 rounded-xl border border-gray-200 text-gray-600 hover:border-[#007ACC] hover:text-[#007ACC] transition-colors bg-white shadow-sm"
                            title="Open Calendar"
                          >
                            <Calendar size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Slot */}
                  {!isBookingStopped && !isTimeSlotDisabled && (
                    <div className="space-y-2">
                     

                      {slots.status === 'loading' ? (
                        <div className="py-2">
                          <Loader size="sm" />
                        </div>
                      ) : slots.status === 'failed' ? (
                        <ErrorState
                          message={slots.error || 'Failed to load slots'}
                        />
                      ) : (
                        <div className="relative">
                          <select
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none text-base font-medium appearance-none cursor-pointer pr-12"
                            value={slotKey}
                            onChange={(e) => setSlotKey(e.target.value)}
                            disabled={!slots.items.length}
                          >
                            <option value="">Select the time slot</option>
                            {!slots.items.length ? (
                              <option disabled>No slots available</option>
                            ) : (
                              <>
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
                                      <option key={sid} value={sid} disabled={disabled}>
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
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <ChevronDown size={20} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {isTimeSlotDisabled && (
                    <div className="bg-sky-50 border border-sky-100 rounded-2xl p-4 text-center">
                      <p className="text-sm text-sky-700 font-medium">
                        Open Entry Experience — no time slot selection required.
                      </p>
                    </div>
                  )}

                  {/* Qty */}
                  {!isBookingStopped && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-700">
                        No. of tickets
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:border-sky-300 active:scale-95 transition"
                          onClick={() =>
                            setQty((prev) => Math.max(1, Number(prev || 1) - 1))
                          }
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-6 text-center font-semibold text-gray-800 tabular-nums">
                          {qty}
                        </span>
                        <button
                          type="button"
                          className="w-9 h-9 rounded-xl border border-sky-200 flex items-center justify-center active:scale-95 bg-sky-600 text-white shadow-sm"
                          onClick={() =>
                            setQty((prev) => Math.max(1, Number(prev || 1) + 1))
                          }
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Subtotal / total */}
                  {date && selectedSlotForBar && (
                    <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm flex flex-col gap-2">
                      <div className="flex items-center justify-between text-gray-700">
                        <span className="font-semibold">
                          Selection:
                        </span>
                        <span className="font-medium">
                          {dayjs(date).format('DD MMM YYYY')} • {getSlotLabel(selectedSlotForBar)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-gray-700 pt-2 border-t border-sky-200 border-dashed">
                        <span>Subtotal</span>
                        <span className="rupee">
                          {qtyNumber} × {formatCurrency(effectiveUnitPrice || 0)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-gray-900 font-bold text-lg">
                        <span>Total</span>
                        <span className="rupee">
                          {formatCurrency(totalPrice || 0)}
                        </span>
                      </div>
                    </div>
                  )}

                  {!date || (!isTimeSlotDisabled && !selectedSlotForBar) ? (
                    <div className="mt-4 rounded-2xl border bg-gray-50 px-3 py-2 text-sm text-center text-gray-500">
                      Please select {!date ? 'a date' : 'a time slot'}
                    </div>
                  ) : null}

                  {isBookingStopped && (
                    <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-center text-red-600 font-medium">
                      Booking temporarily unavailable online
                    </div>
                  )}

                  {/* Book button */}
                  <button
                    type="button"
                    className="w-full inline-flex items-center justify-center rounded-xl bg-[#0099FF] text-white px-6 py-2.5 text-sm font-semibold shadow-md hover:bg-[#007ACC] disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={isBookingStopped || !date || (!isTimeSlotDisabled && !slotKey) || !effectiveUnitPrice}
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

                {/* Helper links */}
                <div className="space-y-3 text-sm">
                  <p
                    className="text-xs text-gray-600"

                  >
                    Slots and pricing may vary by date and time. Use the options
                    above to choose your preferred session.
                  </p>
                  <Link
                    to="/attractions"
                    className="inline-flex items-center justify-center rounded-xl border border-blue-100 text-blue-600 px-5 py-2.5 text-sm font-medium hover:bg-blue-50"

                  >
                    Explore other attractions
                  </Link>
                </div>

                <p className="text-[11px] text-gray-400 text-center">
                  We'll add this to your cart so you can add more attractions
                  before checkout.
                </p>
              </div>
            </aside>
          </div>
        </section>



        {/* Calendar Modal */}
        {showCalendar && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 sm:p-6"
            onClick={() => setShowCalendar(false)}
          >
            <div
              className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 md:p-8 w-full max-w-6xl max-h-[90vh] overflow-y-auto md:overflow-y-visible"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Select Date</h3>
                  <p className="text-sm text-gray-500 mt-1">Pick your preferred visit date</p>
                </div>
                <button
                  onClick={() => setShowCalendar(false)}
                  className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all border border-transparent hover:border-gray-200"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-8 overflow-x-auto pb-4 md:pb-0 custom-scrollbar">
                {/* Generate calendar for next 2 months */}
                {[0, 1].map((monthOffset) => {
                  const currentDate = dayjs().add(monthOffset, 'month');
                  const monthStart = currentDate.startOf('month');
                  const monthEnd = currentDate.endOf('month');
                  const startDay = monthStart.day();
                  const daysInMonth = monthEnd.date();
                  const today = dayjs();

                  return (
                    <div key={monthOffset} className="flex-1 min-w-[280px]">
                      <h4 className="text-base font-bold text-sky-700 mb-4 px-1">
                        {currentDate.format('MMMM YYYY')}
                      </h4>
                      <div className="grid grid-cols-7 gap-1 text-xs">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                          <div key={day} className="text-center text-gray-400 font-bold py-2 uppercase tracking-wider">
                            {day}
                          </div>
                        ))}
                        {/* Empty cells for days before month starts */}
                        {Array.from({ length: startDay }).map((_, i) => (
                          <div key={`empty-${i}`} className="p-2" />
                        ))}
                        {/* Days of the month */}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                          const current = monthStart.date(i + 1);
                          const dateStr = current.format('YYYY-MM-DD');
                          const isPast = current.isBefore(today, 'day');
                          const isSelected = date === dateStr;
                          const isToday = current.isSame(today, 'day');

                          // Day rule filtering
                          const dayOfWeek = current.day();
                          const dayRuleType = details.data?.day_rule_type || 'all_days';
                          const customDays = details.data?.custom_days || [];
                          let isDisabledByDayRule = false;
                          if (dayRuleType === 'weekends') {
                            isDisabledByDayRule = dayOfWeek !== 0 && dayOfWeek !== 6;
                          } else if (dayRuleType === 'weekdays') {
                            isDisabledByDayRule = dayOfWeek === 0 || dayOfWeek === 6;
                          } else if (dayRuleType === 'custom_days' && customDays.length > 0) {
                            isDisabledByDayRule = !customDays.includes(dayOfWeek);
                          }
                          const isDisabled = isPast || isDisabledByDayRule;

                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleDateSelect(dateStr)}
                              disabled={isDisabled}
                              className={`
                                p-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                                ${isDisabled ? 'text-gray-300 cursor-not-allowed' : ''}
                                ${isSelected ? 'bg-sky-600 text-white shadow-lg scale-110 z-10' : ''}
                                ${!isDisabled && !isSelected ? 'hover:bg-sky-50 text-gray-700 hover:text-sky-700 hover:scale-105' : ''}
                                ${isToday && !isSelected ? 'ring-2 ring-sky-100 text-sky-600' : ''}
                              `}
                            >
                              {current.date()}
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

        {/* Gallery Viewer - uses only actual gallery images */}
        {
          viewerIndex !== null && galleryViewerItems.length > 0 && (
            <GalleryViewer
              items={galleryViewerItems}
              initialIndex={viewerIndex}
              onClose={() => setViewerIndex(null)}
            />
          )
        }
      </div>
    </>
  );
}
