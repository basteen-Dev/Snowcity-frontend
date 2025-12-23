import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import GalleryGrid from '../components/gallery/GalleryGrid';
import GalleryViewer from '../components/gallery/GalleryViewer';
import api from '../services/apiClient';
import endpoints from '../services/endpoints';
import { fetchCombos } from '../features/combos/combosSlice';
import { fetchAttractions } from '../features/attractions/attractionsSlice';
import { addCartItem, setStep } from '../features/bookings/bookingsSlice';
import { formatCurrency } from '../utils/formatters';
import {
  getPrice,
  getBasePrice,
  getDiscountPercent,
  getSlotUnitPrice,
  getSlotBasePrice,
} from '../utils/pricing';
import { imgSrc } from '../utils/media';
import dayjs from 'dayjs';
import { X } from 'lucide-react';

/* ========= Small helpers / utilities ========= */

const HERO_PLACEHOLDER_DESKTOP =
  'https://picsum.photos/seed/combo-hero/1920/800';
const HERO_PLACEHOLDER_MOBILE =
  'https://picsum.photos/seed/combo-hero/800/600';
const HERO_PLACEHOLDER = HERO_PLACEHOLDER_DESKTOP;

const IMAGE_PLACEHOLDER = (seed, desktop = false) =>
  desktop
    ? `https://picsum.photos/seed/${seed}/1920/800`
    : `https://picsum.photos/seed/${seed}/640/400`;

const pickImage = (src, seed, desktop = false) =>
  imgSrc(src, IMAGE_PLACEHOLDER(seed || 'combo', desktop));

const toYMD = (d) => dayjs(d).format('YYYY-MM-DD');

const getAttrId = (a) => a?.id ?? a?._id ?? a?.attraction_id ?? null;

const formatTime12Hour = (time) => {
  if (!time) return '';
  const [hStr = '0', mStr = '0'] = String(time).split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return '';
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  const mm = m.toString().padStart(2, '0');
  return `${hour12}:${mm} ${ampm}`;
};

const hhmm = (time) => {
  if (!time) return '';
  return String(time).slice(0, 5);
};

const labelTime = (slot) => {
  const start = formatTime12Hour(slot?.start_time);
  const end = formatTime12Hour(slot?.end_time);

  if (start && end) return `${start} → ${end}`;

  const st = hhmm(slot?.start_time);
  const et = hhmm(slot?.end_time);
  return st && et ? `${st} → ${et}` : '';
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
  const dayIndex = dayjs(dateYMD).day();
  const dayType = String(rule.day_type).toLowerCase();
  if (dayType === 'weekday') return dayIndex >= 1 && dayIndex <= 5;
  if (dayType === 'weekend') return dayIndex === 0 || dayIndex === 6;
  if (dayType === 'custom' && Array.isArray(rule.specific_days)) {
    return rule.specific_days.map(Number).includes(dayIndex);
  }
  if (dayType === 'holiday') return true;
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

const normalizeAttraction = (raw, fallbackTitle, seed) => {
  if (!raw || typeof raw !== 'object') {
    return {
      title: fallbackTitle,
      image_url: IMAGE_PLACEHOLDER(seed),
      slug: null,
      price: 0,
      attraction_id: null,
    };
  }

  const title = raw.title || raw.name || fallbackTitle;

  // Prefer desktop / hero images first
  const srcCandidate =
    raw.desktop_image_url ??
    raw.hero_desktop_image ??
    raw.hero_image ??
    raw.image_media_id ??
    raw.media_id ??
    raw.cover_media_id ??
    raw.banner_media_id ??
    raw.url_path ??
    raw.image_url ??
    raw.cover_image ??
    raw.web_image ??
    raw.mobile_image ??
    raw.image ??
    null;

  const image_url = imgSrc(srcCandidate, IMAGE_PLACEHOLDER(seed));
  const slug = raw.slug || raw.id || raw.attraction_id || null;
  const price = Number(raw.base_price || raw.price || raw.amount || 0);
  const attraction_id = raw.attraction_id ?? raw.id ?? slug;

  return { title, image_url, slug, price, attraction_id };
};

function getHeroImageFromComboOrAttraction(
  combo,
  firstAttraction,
  secondAttraction,
  desktop = false,
) {
  // Prefer the first attraction's *desktop* style image if available
  if (firstAttraction?.image_url) {
    return firstAttraction.image_url;
  }

  // Then try dedicated combo media
  const mediaCandidate =
    combo?.banner_media_id ?? combo?.image_media_id ?? combo?.cover_media_id;
  const fieldCandidate =
    mediaCandidate ??
    combo?.banner_image ??
    combo?.hero_image ??
    combo?.image_web ??
    combo?.image_url ??
    combo?.image ??
    null;

  const primary = imgSrc(
    fieldCandidate,
    desktop ? HERO_PLACEHOLDER_DESKTOP : HERO_PLACEHOLDER_MOBILE,
  );
  if (primary) return primary;

  // Fallback to any included attraction
  return (
    firstAttraction?.image_url ||
    secondAttraction?.image_url ||
    (desktop ? HERO_PLACEHOLDER_DESKTOP : HERO_PLACEHOLDER_MOBILE)
  );
}

const isSlotBookableForDate = (slot, date) => {
  if (!slot) return false;
  // For today, hide past slots (1 hour buffer)
  const todayYMD = dayjs().format('YYYY-MM-DD');
  if (date === todayYMD) {
    const now = dayjs();
    const slotTime = slot.start_time || slot.time || null;
    if (!slotTime) return true;
    const [hours, minutes] = slotTime.split(':').map(Number);
    const slotMinutes = (hours || 0) * 60 + (minutes || 0);
    const currentMinutes = now.hour() * 60 + now.minute();
    return slotMinutes >= currentMinutes + 60;
  }
  return true;
};

const buildSlotKey = (slot) => {
  if (!slot) return '';
  return String(
    slot.combo_slot_id ??
      slot.id ??
      slot._id ??
      slot.slot_id ??
      `${slot.start_time || ''}-${slot.end_time || ''}`,
  );
};

/* ========= Component ========= */

export default function ComboDetails() {
  const params = useParams();
  const slugParam = params?.slug ?? params?.id ?? params?.comboId ?? params?.combo_id ?? null;
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const slug = React.useMemo(() => {
    if (!slugParam || slugParam === 'undefined' || slugParam === 'null') return null;
    let s = slugParam;
    if (String(s).startsWith('combo-')) s = String(s).substring(6);
    return s;
  }, [slugParam]);

  const { items: comboItems = [], status: combosStatus } = useSelector(
    (s) => s.combos || { items: [], status: 'idle' },
  );
  const { items: attractionItems = [], status: attractionsStatus } = useSelector(
    (s) => s.attractions || { items: [], status: 'idle' },
  );

  React.useEffect(() => {
    if (combosStatus === 'idle') {
      dispatch(fetchCombos({ active: true, limit: 100 }));
    }
    if (attractionsStatus === 'idle') {
      dispatch(fetchAttractions({ active: true, limit: 200 }));
    }
  }, [attractionsStatus, combosStatus, dispatch]);

  const numericParam = React.useMemo(() => {
    if (!slug) return null;
    const num = Number(slug);
    return Number.isFinite(num) ? num : null;
  }, [slug]);

  const matchedCombo = React.useMemo(() => {
    if (!slug || !comboItems.length) return null;
    return (
      comboItems.find((c) => String(c?.combo_id ?? c?.id ?? '') === slug) ||
      comboItems.find(
        (c) => slug && c?.slug && String(c.slug) === slug,
      ) ||
      null
    );
  }, [comboItems, slug]);

  const fetchId = React.useMemo(() => {
    if (numericParam != null) return numericParam;
    if (matchedCombo?.combo_id) return Number(matchedCombo.combo_id);
    if (matchedCombo?.id) return Number(matchedCombo.id);
    return null;
  }, [matchedCombo, numericParam]);

  const [state, setState] = React.useState({
    status: 'idle',
    data: null,
    error: null,
  });
  const [linkedGallery, setLinkedGallery] = React.useState({
    status: 'idle',
    items: [],
    error: null,
  });
  const [viewerIndex, setViewerIndex] = React.useState(null);
  const [offers, setOffers] = React.useState({
    status: 'idle',
    items: [],
    error: null,
  });

  // Responsive flag
  const [isDesktop, setIsDesktop] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false,
  );
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    if (!slug) {
      setState({ status: 'failed', data: null, error: 'Combo not found' });
    } else if (fetchId == null) {
      if (
        numericParam == null &&
        (combosStatus === 'loading' || combosStatus === 'idle')
      ) {
        setState((prev) =>
          prev.status === 'loading'
            ? prev
            : { status: 'loading', data: null, error: null },
        );
      } else if (numericParam == null && combosStatus === 'failed') {
        setState({ status: 'failed', data: null, error: 'Combo not found' });
      }
    }
  }, [slug, fetchId, numericParam, combosStatus]);

  React.useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    if (!slug) {
      setState({ status: 'failed', data: null, error: 'Combo not found' });
    } else {
      setState({ status: 'loading', data: null, error: null });

      (async () => {
        try {
          const url = numericParam != null ? endpoints.combos.byId(fetchId) : endpoints.combos.bySlug(slug);
          const res = await api.get(url, { signal: controller.signal });
          if (!mounted) return;
          setState({ status: 'succeeded', data: res, error: null });
          // Set page title
          document.title = res?.title || res?.name || 'Combo Details';
        } catch (err) {
          if (err?.canceled || !mounted) return;

          // If combo not found (404), redirect to 404 page
          if (err?.status === 404 || err?.response?.status === 404) {
            navigate('/404', { replace: true });
            return;
          }

          setState({ status: 'failed', data: null, error: err?.message || 'Failed to load combo' });
        }
      })();
    }

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [slug]);

  /* ===== Availability / slots state ===== */

  const [date, setDate] = React.useState(dayjs().format('YYYY-MM-DD'));
  const [qty, setQty] = React.useState(1);
  const [slots, setSlots] = React.useState([]);
  const [showCalendar, setShowCalendar] = React.useState(false);
  const [calendarAnchor, setCalendarAnchor] = React.useState(null);
  const calendarAnchorRect = React.useMemo(() => {
    // Always center the calendar
    return null;
  }, [calendarAnchor, showCalendar]);

  // Hero carousel state
  const [carouselIndex, setCarouselIndex] = React.useState(0);

  const updateDate = React.useCallback((nextDate) => {
    setDate(nextDate);
    setSlotState((s) => ({ ...s, selectedKey: '' }));
  }, []);
  const handleToday = React.useCallback(() => {
    updateDate(dayjs().format('YYYY-MM-DD'));
  }, [updateDate]);
  const handleTomorrow = React.useCallback(() => {
    updateDate(dayjs().add(1, 'day').format('YYYY-MM-DD'));
  }, [updateDate]);
  const handleAllDays = React.useCallback(() => {
    updateDate('');
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
  const formatDateDisplay = React.useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
    return (value) => {
      if (!value) return 'All Days';
      if (value === today) return 'All Days';
      if (value === tomorrow) return 'All Days';
      return dayjs(value).format('D MMM');
    };
  }, []);

  const [slotState, setSlotState] = React.useState({
    status: 'idle',
    selectedKey: '',
  });
  const [slotErr, setSlotErr] = React.useState('');

  const loadSlots = React.useCallback(async () => {
    if (!state.data?.combo_id) return;
    try {
      setSlotState((s) => ({ ...s, status: 'loading' }));
      setSlotErr('');
      const out = await api.get(endpoints.combos.slots(state.data.combo_id), {
        params: date ? { date } : {},
      });
      const list = Array.isArray(out)
        ? out
        : Array.isArray(out?.data)
        ? out.data
        : [];
      setSlots(list);

      // auto-select first bookable slot for the date
      const firstBookable =
        list.find((slot) => isSlotBookableForDate(slot, date)) || list[0] || null;
      setSlotState({
        status: 'loaded',
        selectedKey: firstBookable ? buildSlotKey(firstBookable) : '',
      });
    } catch (e) {
      setSlotErr(e?.message || 'Failed to load slots');
      setSlotState((s) => ({ ...s, status: 'failed', selectedKey: '' }));
    }
  }, [state.data?.combo_id, date]);

  React.useEffect(() => {
    if (state.data?.combo_id && date) loadSlots();
  }, [state.data?.combo_id, date, loadSlots]);

  React.useEffect(() => {
    if (!state.data?.combo_id) {
      setOffers({ status: 'idle', items: [], error: null });
      return () => {};
    }
    let cancelled = false;
    setOffers((s) => ({ ...s, status: 'loading', error: null }));
    (async () => {
      try {
        const res = await api.get(endpoints.offers.list(), {
          params: { active: true, target_type: 'combo', target_id: state.data?.combo_id },
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
  }, [state.data?.combo_id]);

  React.useEffect(() => {
    if (!state.data?.combo_id) return undefined;
    let canceled = false;
    setLinkedGallery((s) => ({ ...s, status: 'loading', error: null }));
    (async () => {
      try {
        const res = await api.get(endpoints.gallery.list(), {
          params: {
            active: true,
            target_type: 'combo',
            target_ref_id: state.data.combo_id,
            limit: 12,
          },
        });
        if (canceled) return;
        // Handle both { data, meta } format and direct array format
        const items = res?.data?.data || (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
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
    return () => {
      canceled = true;
    };
  }, [state.data?.combo_id]);

  const combo = state.data || matchedCombo;

  const fallbackAttractions = React.useMemo(() => {
    if (!combo) {
      return [];
    }
    const legacy = [
      combo.attraction_1 || {
        title: combo?.attraction_1_title,
        image_url: combo?.attraction_1_image,
        slug: combo?.attraction_1_slug,
        base_price: combo?.attraction_1_price,
        attraction_id: combo?.attraction_1_id,
      },
      combo.attraction_2 || {
        title: combo?.attraction_2_title,
        image_url: combo?.attraction_2_image,
        slug: combo?.attraction_2_slug,
        base_price: combo?.attraction_2_price,
        attraction_id: combo?.attraction_2_id,
      },
    ];
    const flat = Array.isArray(legacy) ? legacy.filter(Boolean) : [];
    return flat;
  }, [combo]);

  const normalizedAttractions = React.useMemo(() => {
    if (!combo) {
      return [];
    }
    if (Array.isArray(combo?.attractions) && combo.attractions.length) {
      return combo.attractions.map((attr, idx) =>
        normalizeAttraction(attr, `Experience ${idx + 1}`, `combo-${idx}`),
      );
    }

    const ids = Array.isArray(combo?.attraction_ids)
      ? combo.attraction_ids.filter(Boolean)
      : [];
    if (ids.length && attractionItems.length) {
      return ids
        .map((id, idx) => {
          const match = attractionItems.find(
            (a) => String(getAttrId(a)) === String(id),
          );
          return normalizeAttraction(
            match || { title: `Experience ${idx + 1}` },
            `combo-${idx}`,
          );
        })
        .filter(Boolean);
    }

    return fallbackAttractions
      .map((attr, idx) =>
        normalizeAttraction(
          attr,
          `Experience ${idx + 1}`,
          `combo-${idx}`,
        ),
      )
      .filter(Boolean);
  }, [combo, attractionItems, fallbackAttractions]);

  const [firstAttraction, secondAttraction] = [
    normalizedAttractions[0],
    normalizedAttractions[1],
  ];
  const isInitialLoading = state.status === 'loading' && !combo;

  // Move hooks before conditional returns
  const comboId = combo?.combo_id || combo?.id || fetchId || null;
  const title = combo?.name || combo?.title || 'Combo Deal';
  const subtitle = combo?.short_description || combo?.subtitle || '';
  const description = combo?.description || combo?.long_description || '';

  const heroImage = getHeroImageFromComboOrAttraction(
    combo,
    firstAttraction,
    secondAttraction,
    isDesktop,
  );

  const carouselImages = React.useMemo(() => {
    const images = [];
    if (heroImage) images.push({ src: heroImage, alt: 'Snow City Banner', isBanner: true });
    linkedGallery.items.forEach((item, idx) => {
      const src = item.image_url || item.url || '';
      if (src) images.push({ src, alt: item.title || `Gallery ${idx + 1}`, isBanner: false, item, index: idx });
    });
    return images;
  }, [heroImage, linkedGallery.items]);

  const nextCarousel = React.useCallback(() => {
    setCarouselIndex((prev) => (prev + 1) % carouselImages.length);
  }, [carouselImages.length]);

  const prevCarousel = React.useCallback(() => {
    setCarouselIndex((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  }, [carouselImages.length]);

  // Auto-play carousel
  React.useEffect(() => {
    if (carouselImages.length <= 1) return;
    const interval = setInterval(nextCarousel, 5000); // 5 seconds
    return () => clearInterval(interval);
  }, [nextCarousel, carouselImages.length]);

  const heroTiles = (normalizedAttractions.length
    ? normalizedAttractions
    : [
        {
          title,
          image_url: HERO_PLACEHOLDER,
        },
      ]
  ).slice(0, Math.max(2, Math.min(3, normalizedAttractions.length || 2)));

  const heroCaption = heroTiles.map((a) => a.title).join(' + ');

  const rawPrice = getPrice(combo);
  const comboPrice =
    rawPrice > 0
      ? rawPrice
      : Number(combo?.combo_price || combo?.total_price || 0);
  const comboBasePrice = getBasePrice(combo);
  const baseSum =
    comboBasePrice ||
    normalizedAttractions.reduce(
      (sum, attr) => sum + Number(attr?.price || 0),
      0,
    );
  const hasBasePricing = baseSum > 0;
  const savings =
    hasBasePricing && comboPrice > 0 ? baseSum - comboPrice : 0;
  const discountPercent =
    hasBasePricing && comboPrice > 0 && comboPrice < baseSum
      ? Math.max(
          0,
          Math.round(
            getDiscountPercent(combo) ||
              ((baseSum - comboPrice) / baseSum) * 100,
          ),
        )
      : Number(combo?.discount_percent || 0);

  const getSlotPricing = React.useCallback(
    (slot) => {
      const fallbackUnit = Number(comboPrice || 0);
      const fallbackBase = Number(comboBasePrice || baseSum || fallbackUnit);
      const unitBeforeOffer = getSlotUnitPrice(slot, fallbackUnit);
      const originalPrice = getSlotBasePrice(slot, fallbackBase);
      const basePrice = unitBeforeOffer || originalPrice || 0;
      const bestOffer = comboId
        ? findBestOfferForSelection(offers.items, {
            targetType: 'combo',
            targetId: comboId,
            date,
            slot,
            basePrice,
          })
        : null;
      const finalPrice = bestOffer ? bestOffer.price : unitBeforeOffer;
      const localSavings =
        originalPrice > finalPrice ? originalPrice - finalPrice : 0;
      return {
        finalPrice,
        originalPrice,
        savings: localSavings,
        bestOffer,
      };
    },
    [comboPrice, comboBasePrice, baseSum, offers.items, comboId, date],
  );

  const selectedSlot =
    slots.find((s) => buildSlotKey(s) === slotState.selectedKey) || null;
  const selectedSlotPricing = selectedSlot
    ? getSlotPricing(selectedSlot)
    : null;

  // Quantity handling
  const qtyNumber = Math.max(1, Number(qty) || 1);

  // Pricing calculations for mobile bar and booking
  const effectiveUnitPrice = selectedSlotPricing?.finalPrice || 0;
  const baseUnitPrice = selectedSlotPricing?.originalPrice || comboPrice || 0;
  const hasDiscount = baseUnitPrice > 0 && effectiveUnitPrice > 0 && effectiveUnitPrice < baseUnitPrice;
  const selectedDiscountPercent = hasDiscount
    ? Math.round(((baseUnitPrice - effectiveUnitPrice) / baseUnitPrice) * 100)
    : 0;
  const totalPrice = Number(effectiveUnitPrice || 0) * qtyNumber;
  const barPrice = selectedSlot && effectiveUnitPrice ? effectiveUnitPrice * qtyNumber : null;

  if (isInitialLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-white">
        <Loader />
      </div>
    );
  }

  if (state.status === 'failed') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-white px-4">
        <div className="max-w-lg w-full">
          <ErrorState message={state.error || 'Combo not found'} />
        </div>
      </div>
    );
  }

  if (!combo) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-white px-4">
        <div className="max-w-lg w-full">
          <ErrorState message="Combo not found" />
        </div>
      </div>
    );
  }

  const onBook = (slot, pricingInfo) => {
    const q = Math.max(1, Number(qty) || 1);
    const pricing = pricingInfo || getSlotPricing(slot);
    const unitPrice =
      pricing?.finalPrice ?? getSlotUnitPrice(slot, comboPrice);
    const comboSlotId = slot?.combo_slot_id ?? slot?.id ?? slot?._id ?? null;
    if (!comboSlotId) return;

    dispatch(
      addCartItem({
        itemType: 'combo',
        comboId: Number(comboId) || comboId,
        combo,
        date,
        booking_date: toYMD(date),
        booking_time:
          slot?.start_time ||
          slot?.startTime ||
          slot?.slot_start_time ||
          null,
        comboSlotId,
        slot,
        qty: q,
        unitPrice,
        title:
          combo?.title ||
          combo?.name ||
          combo?.combo_name ||
          `Combo #${comboId}`,
        slotLabel: labelTime(slot),
        dateLabel: dayjs(date).format('DD MMM YYYY'),
        meta: {
          title:
            combo?.title ||
            combo?.name ||
            combo?.combo_name ||
            `Combo #${comboId}`,
          start_time: slot?.start_time,
          end_time: slot?.end_time,
          capacity: slot?.capacity,
          available: slot?.available,
        },
        offer_id: pricing?.bestOffer?.offer?.offer_id,
        offer_rule_id: pricing?.bestOffer?.rule?.rule_id,
      }),
    );
    dispatch(setStep(1));
    const params = new URLSearchParams({
      type: 'combo',
      combo_id: String(comboId),
      date,
      slot: buildSlotKey(slot),
      qty: String(q),
    });
    navigate(`/booking?${params.toString()}`);
  };

  /* ========= Render ========= */

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e0f2fe] via-[#bae6fd] to-white font-sans">
      {/* HERO BANNER + GALLERY (VinWonders-style) */}
      <section className="mt-0 bg-transparent">
        <div className="max-w-6xl mx-auto px-4 pt-6 space-y-4">
          {/* Title above banner */}
          <h1
            className="text-3xl md:text-4xl font-bold text-gray-900"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {title}
          </h1>

          {/* Banner card */}
          <div className="overflow-hidden shadow-lg bg-gray-100 relative">
            {carouselImages.length > 0 ? (
              <div className="relative h-[420px] w-full overflow-hidden">
                {/* Carousel Image */}
                <button
                  type="button"
                  className="relative w-full h-full group"
                  onClick={() => {
                    const current = carouselImages[carouselIndex];
                    if (current.isBanner) {
                      // Open gallery viewer if there are gallery items
                      if (linkedGallery.items.length > 0) setViewerIndex(0);
                    } else {
                      setViewerIndex(current.index);
                    }
                  }}
                >
                  <img
                    src={carouselImages[carouselIndex].src}
                    alt={carouselImages[carouselIndex].alt}
                    className="w-full h-full object-cover transition-opacity duration-500"
                    loading="lazy"
                    draggable="false"
                  />
                  
                  {/* Combo Title Overlay */}
                  <div className="absolute inset-0 flex items-start justify-start p-6">
                    <h2 
                      className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg"
                      style={{ 
                        fontFamily: 'Inter, sans-serif',
                        color: '#87CEEB',
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                      }}
                    >
                      {title}
                    </h2>
                  </div>
                </button>

                {/* Navigation Buttons */}
                {carouselImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={prevCarousel}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                      aria-label="Previous image"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={nextCarousel}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                      aria-label="Next image"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                {/* Dots Indicator */}
                {carouselImages.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                    {carouselImages.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCarouselIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          idx === carouselIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                        aria-label={`Go to image ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Fallback if no images
              <div className="h-[420px] w-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500">No images available</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-6 left-0 right-0 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs uppercase tracking-wide text-gray-100 mb-2">
              <span>Combo Deal</span>
              {discountPercent > 0 ? <span>Save {discountPercent}%</span> : null}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow" style={{ fontFamily: 'Inter, sans-serif', color: '#87CEEB' }}>
              {title}
            </h1>
            {subtitle ? (
              <p className="text-gray-200 text-sm md:text-base max-w-2xl mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                {subtitle}
              </p>
            ) : null}
            {!heroImage && heroCaption ? (
              <p className="text-xs uppercase tracking-[0.25em] text-gray-200 mt-3 line-clamp-2">
                {heroCaption}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/* GALLERY BANNER SECTION */}
      {linkedGallery.items.length > 0 ? (
        <section className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Banner - 2/3 */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3" style={{ fontFamily: 'Inter, sans-serif', color: '#87CEEB' }}>
                  Photo Gallery
                </h2>
                {linkedGallery.status === 'loading' ? (
                  <div className="py-8 text-center">
                    <Loader />
                  </div>
                ) : linkedGallery.status === 'failed' ? (
                  <div className="py-8 text-center">
                    <ErrorState message={linkedGallery.error} />
                  </div>
                ) : (
                  <GalleryGrid items={linkedGallery.items} />
                )}
              </div>
            </div>
            {/* Gallery Preview - 1/3 */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Gallery Preview
                </h3>
                <div className="space-y-3">
                  {linkedGallery.items.slice(0, 3).map((item, index) => {
                    const isVideo = String(item.media_type || '').toLowerCase() === 'video';
                    const mediaUrl = isVideo
                      ? imgSrc(item.media_url || item.url || item)
                      : imgSrc(item.image_url || item.url || item);
                    
                    return (
                      <div key={item.gallery_item_id || item.id || index} className="relative group">
                        {isVideo ? (
                          <video
                            className="w-full h-32 object-cover rounded-lg"
                            src={mediaUrl}
                            muted
                            preload="metadata"
                          />
                        ) : (
                          <img
                            src={mediaUrl}
                            alt={item.title || 'Gallery item'}
                            className="w-full h-32 object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-medium">+{linkedGallery.items.length - 3} more</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 md:gap-12">
          {/* LEFT CONTENT */}
          <div className="lg:col-span-2 space-y-8">
            {/* Included attractions */}
            {normalizedAttractions.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {normalizedAttractions.map((attr, idx) => (
                  <figure
                    key={`included-${idx}`}
                    className="relative rounded-2xl overflow-hidden shadow-sm bg-white"
                  >
                    <img
                      src={attr.image_url}
                      alt={attr.title}
                      className="w-full h-60 md:h-64 object-cover"
                      loading="lazy"
                    />
                    <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent p-4 text-white">
                      <p className="text-[11px] uppercase tracking-wide text-gray-300">
                        Experience {idx + 1}
                      </p>
                      <h2 className="text-lg font-semibold line-clamp-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                        {attr.title}
                      </h2>
                      {attr.price ? (
                        <p className="text-xs text-gray-200 mt-1">
                          Base price: {formatCurrency(attr.price)}
                        </p>
                      ) : null}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}

            {/* Description – tidied up */}
            {description ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3" style={{ fontFamily: 'Inter, sans-serif', color: '#87CEEB' }}>
                  About this combo
                </h2>
                <div
                  className="prose prose-sm md:prose max-w-none text-gray-700 leading-relaxed"
                  style={{ textAlign: 'left', fontFamily: 'Inter, sans-serif' }}
                  dangerouslySetInnerHTML={{ __html: description }}
                />
              </div>
            ) : null}



          {/* Detailed availability list (all slots) */}
          <div
            id="availability"
            className="rounded-2xl border shadow-sm p-4 md:p-5 bg-white"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                All time slots
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>
                  {dayjs(date).format('DD MMM YYYY')} • {qty} ticket
                  {qty > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {slotState.status === 'loading' ? (
              <div className="py-3">
                <Loader size="sm" />
              </div>
            ) : null}
            {slotState.status === 'failed' ? (
              <div className="py-3">
                <ErrorState message={slotErr || 'Failed to load slots'} />
              </div>
            ) : null}
            {slotState.status === 'loaded' && (
              <>
                {!slots.length ? (
                  <div className="text-sm text-gray-500">
                    No slots available for{' '}
                    {dayjs(date).format('DD MMM YYYY')}.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {slots
                      .filter((slot) => isSlotBookableForDate(slot, date))
                      .map((slot) => {
                        const timeText = labelTime(slot);
                        const pricingInfo = getSlotPricing(slot);
                        const price = pricingInfo.finalPrice;
                        const slotBase = pricingInfo.originalPrice;
                        const slotHasDiscount =
                          slotBase > 0 && price >= 0 && price < slotBase;
                        const slotDiscountPercent =
                          slotHasDiscount && slotBase
                            ? Math.max(
                                0,
                                Math.round(((slotBase - price) / slotBase) * 100),
                              )
                            : null;
                        const disabled =
                          slot?.available === 0 || slot?.capacity === 0;
                        return (
                          <div
                            key={
                              slot.combo_slot_id ||
                              `${slot.combo_id}-${slot.start_time}-${slot.end_time}`
                            }
                            className={`flex items-center justify-between rounded-xl border px-4 py-3 shadow-sm ${
                              disabled
                                ? 'opacity-50 bg-gray-100 border-gray-200'
                                : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md transition-all'
                            }`}
                          >
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-base text-gray-900">
                                {timeText || 'Time slot'}
                              </span>
                              <span className="text-xs text-gray-500">
                                Capacity: {slot.capacity} •{' '}
                                {slot.available ? 'Available' : 'Unavailable'}
                              </span>
                              {slotHasDiscount ? (
                                <span className="text-sm text-emerald-600 font-medium mt-1">
                                  {formatCurrency(price)}{' '}
                                  <span className="line-through text-gray-400 ml-1">
                                    {formatCurrency(slotBase)}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-sm text-gray-700 mt-1">
                                  {formatCurrency(price)}
                                </span>
                              )}
                              {slotHasDiscount && (
                                <span className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                                  Save {slotDiscountPercent}%
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              disabled={disabled}
                              onClick={() => onBook(slot, pricingInfo)}
                              className={`px-4 py-2 rounded-full border text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                disabled
                                  ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400'
                                  : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                              }`}
                            >
                              Book this slot
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="lg:col-span-1">
          <div className="rounded-3xl border shadow-lg bg-white p-6 sticky top-24 space-y-6">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-gray-500">
                Combo price
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-semibold text-gray-900">
                  {formatCurrency(comboPrice)}
                </span>
                <span className="text-sm text-gray-500">per combo</span>
              </div>
              {hasBasePricing && (
                <div className="mt-2 text-sm text-gray-600">
                  <span className="line-through mr-2">
                    {formatCurrency(baseSum)}
                  </span>
                  {discountPercent > 0 ? (
                    <span className="text-emerald-600 font-medium">
                      Save {discountPercent}% ({formatCurrency(savings)})
                    </span>
                  ) : (
                    <span>
                      Special pricing across{' '}
                      {normalizedAttractions.length || 2} experiences
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Booking controls (desktop) */}
            <div className="space-y-5">
              {/* Date */}
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-gray-700"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Select Date
                </label>
                <div className="flex flex-wrap gap-2">
                  
                  <button
                    type="button"
                    onClick={handleToday}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      date === dayjs().format('YYYY-MM-DD')
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white text-gray-800 border-gray-200 hover:border-sky-300'
                    }`}
                    style={{ fontFamily: 'Inter, sans-serif' }}
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
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={onCalendarButtonClick}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      date && date !== '' && date !== dayjs().format('YYYY-MM-DD') && date !== dayjs().add(1, 'day').format('YYYY-MM-DD')
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white text-gray-800 border-gray-200 hover:border-sky-300'
                    }`}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {date && date !== '' && date !== dayjs().format('YYYY-MM-DD') && date !== dayjs().add(1, 'day').format('YYYY-MM-DD')
                      ? dayjs(date).format('D MMM')
                      : 'All Days'}
                  </button>
                </div>
              </div>

              {/* Slot */}
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-gray-700"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Select Time Slot
                </label>

                {slotState.status === 'loading' ? (
                  <div className="py-2">
                    <Loader size="sm" />
                  </div>
                ) : slotState.status === 'failed' ? (
                  <ErrorState
                    message={slotErr || 'Failed to load slots'}
                  />
                ) : (
                  <select
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-900 outline-none"
                    value={slotState.selectedKey}
                    onChange={(e) =>
                      setSlotState((s) => ({
                        ...s,
                        selectedKey: e.target.value,
                      }))
                    }
                    disabled={!slots.length}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {!slots.length ? (
                      <option>No slots</option>
                    ) : (
                      <>
                        {!slotState.selectedKey && <option value="">Select slot</option>}
                        {slots
                          .filter((slot) => isSlotBookableForDate(slot, date))
                          .map((slot) => {
                            const key = buildSlotKey(slot);
                            const pricing = getSlotPricing(slot);
                            const label = labelTime(slot) || 'Slot';
                            const priceText =
                              pricing?.finalPrice != null
                                ? ` • ${formatCurrency(pricing.finalPrice)}`
                                : '';
                            return (
                              <option key={key} value={key}>
                                {label}
                                {priceText}
                              </option>
                            );
                          })}
                      </>
                    )}
                  </select>
                )}
              </div>

              {/* Qty */}
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-gray-700"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Number of Tickets
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="w-8 h-8 text-sm rounded-full border border-gray-300 flex items-center justify-center"
                    onClick={() =>
                      setQty((prev) => Math.max(1, Number(prev || 1) - 1))
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
                    className="w-16 text-center border border-gray-300 rounded-lg px-2 py-1 text-sm"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  />

                  <button
                    type="button"
                    className="w-8 h-8 text-sm rounded-full border border-gray-300 flex items-center justify-center"
                    onClick={() =>
                      setQty((prev) => Math.max(1, Number(prev || 1) + 1))
                    }
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Subtotal / total */}
              <div className="mt-3 rounded-2xl border bg-gray-50 px-3 py-2 text-sm">
                <div className="flex items-center justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="rupee">
                    {qty} × {formatCurrency(selectedSlotPricing?.finalPrice || comboPrice || 0)}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-gray-900 font-semibold">
                  <span>Total</span>
                  <span className="rupee">
                    {formatCurrency((selectedSlotPricing?.finalPrice || comboPrice || 0) * qty)}
                  </span>
                </div>
              </div>

              {/* Book button */}
              <button
                type="button"
                className="w-full inline-flex items-center justify-center rounded-xl bg-blue-600 text-white px-6 py-2.5 text-sm font-semibold shadow-md hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={!selectedSlot || slotState.status === 'loading'}
                onClick={() => {
                  if (!selectedSlot) return;
                  onBook(selectedSlot, selectedSlotPricing);
                }}
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {selectedSlotPricing?.finalPrice
                  ? `Book Now • ${formatCurrency(
                      selectedSlotPricing.finalPrice * qty,
                    )}`
                  : 'Book Now'}
              </button>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <p>
                Includes admission for{' '}
                {normalizedAttractions.length || 2} attraction(s). Book together
                to lock in bundled savings.
              </p>
              <ul className="list-disc list-inside space-y-1">
                {normalizedAttractions.map((attr, idx) => (
                  <li key={`sidebar-attr-${idx}`}>{attr.title}</li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <a
                href="#availability"
                className="inline-flex items-center justify-center rounded-full bg-blue-600 text-white px-6 py-3 text-sm font-medium hover:bg-blue-700"
              >
                View all time slots
              </a>
              <Link
                to="/combos"
                className="inline-flex items-center justify-center rounded-full border border-blue-100 text-blue-600 px-6 py-3 text-sm font-medium hover:bg-blue-50"
              >
                Explore other combos
              </Link>
            </div>
          </div>
        </aside>
        </div>
      </section>

      {/* MOBILE FIXED PRICE BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[70] border-t border-gray-200 bg-white/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">
                {hasDiscount ? 'Offer price' : 'Base price'}
              </div>

              <div className="flex items-baseline gap-2">
                <div className="text-lg font-bold text-gray-900 rupee">
                  {formatCurrency(
                    hasDiscount
                      ? selectedSlotPricing?.finalPrice || 0
                      : baseUnitPrice || selectedSlotPricing?.finalPrice || 0,
                  )}
                </div>

                {hasDiscount ? (
                  <div className="text-sm text-gray-400 line-through rupee">
                    {formatCurrency(baseUnitPrice || 0)}
                  </div>
                ) : null}

                {hasDiscount ? (
                  <div className="text-xs font-semibold text-emerald-600">
                    Save {selectedDiscountPercent}%
                  </div>
                ) : null}
              </div>

              <div className="text-xs text-gray-500 truncate">
                {qty} ticket{qty > 1 ? 's' : ''} • Total{' '}
                <span className="rupee font-semibold text-gray-800">
                  {formatCurrency(totalPrice || 0)}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 text-white px-6 py-2.5 text-sm font-semibold shadow-md hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={!selectedSlot || slotState.status === 'loading'}
              onClick={() => {
                if (!selectedSlot) return;
                onBook(selectedSlot, selectedSlotPricing);
              }}
            >
              {barPrice ? (
                <>
                  Book •{' '}
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

      {/* Calendar Modal */}
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
              left: calendarAnchorRect
                ? `${calendarAnchorRect.left - 160}px`
                : '50%',
              transform: calendarAnchorRect ? 'none' : 'translate(-50%, -50%)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Select Date</h3>
              <button
                type="button"
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
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold text-gray-900">{currentDate.format('MMMM YYYY')}</div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                        <div key={d} className="py-1 font-medium">{d}</div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-sm">
                      {Array.from({ length: startDay }).map((_, i) => (
                        <div key={`pad-${i}`} />
                      ))}

                      {Array.from({ length: daysInMonth }).map((_, dIndex) => {
                        const dayNum = dIndex + 1;
                        const dayVal = monthStart.date(dayNum).format('YYYY-MM-DD');
                        const disabled = false;
                        const isToday = today.format('YYYY-MM-DD') === dayVal;

                        return (
                          <button
                            key={dayVal}
                            type="button"
                            onClick={() => {
                              handleDateSelect(dayVal);
                            }}
                            disabled={disabled}
                            className={`w-full h-8 rounded-lg flex items-center justify-center transition-colors ${
                              disabled
                                ? 'text-gray-300'
                                : isToday
                                ? 'bg-sky-100 text-sky-700 font-semibold'
                                : 'hover:bg-gray-100'
                            }`}
                          >
                            {dayNum}
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

      {/* GALLERY VIEWER MODAL */}
      {viewerIndex !== null && linkedGallery.items.length > 0 ? (
        <GalleryViewer
          items={linkedGallery.items}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      ) : null}
    </div>
  );
}
