import React from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
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
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/formatters';
import { prioritizeSnowcityFirst, getNextAvailableDate } from '../utils/attractions';
import {
  getPrice,
  getBasePrice,
  getDiscountPercent,
  getSlotUnitPrice,
  getSlotBasePrice,
} from '../utils/pricing';
import { imgSrc } from '../utils/media';
import dayjs from 'dayjs';
import { X, ChevronDown, Check, Calendar, Minus, Plus } from 'lucide-react';

import usePageSeo from '../hooks/usePageSeo';

/* ========= Small helpers / utilities ========= */

const HERO_PLACEHOLDER_DESKTOP =
  '';
const HERO_PLACEHOLDER_MOBILE =
  '';
const HERO_PLACEHOLDER = HERO_PLACEHOLDER_DESKTOP;

const IMAGE_PLACEHOLDER = (seed, desktop = false) =>
  desktop
    ? ``
    : ``;

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

const normalizeHtml = (value) => {
  if (!value || typeof value !== 'string') return '';
  // Use a more robust decoding method
  const doc = new DOMParser().parseFromString(value, 'text/html');
  const decoded = doc.documentElement.textContent || value;
  // If the result still contains HTML tags, it was double encoded or intended as raw HTML
  // We want to return the version that contains the tags for dangerouslySetInnerHTML
  return value.includes('<') && value.includes('>') ? value : decoded;
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

  // Hardcoded temporary fix: Disable same-day booking for combo 26
  const isCombo26 = idsMatch(targetId, 26) && normalizeTargetType(targetType) === 'combo';
  const todayStr = dayjs().format('YYYY-MM-DD');
  if (isCombo26 && bookingDate <= todayStr) {
    return false;
  }

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
  if (!raw) {
    return {
      title: fallbackTitle,
      image_url: IMAGE_PLACEHOLDER(seed),
      slug: null,
      price: 0,
      attraction_id: null,
    };
  }

  // If raw is an ID (number or string-id), use imgSrc(id) to get the /raw URL
  // If raw is an object, use imgSrc(obj) to pick the best image field
  const title = (typeof raw === 'object') ? (raw.title || raw.name || fallbackTitle) : fallbackTitle;
  const image_url = imgSrc(raw, IMAGE_PLACEHOLDER(seed));

  const slug = raw?.slug || raw?.id || raw?.attraction_id || null;
  const price = Number(raw?.base_price || raw?.price || raw?.amount || 0);
  const attraction_id = raw?.attraction_id ?? raw?.id ?? slug;
  const time_slot_enabled = raw?.time_slot_enabled !== false;

  return { title, image_url, slug, price, attraction_id, time_slot_enabled };
};

function getHeroImageFromComboOrAttraction(
  combo,
  firstAttraction,
  secondAttraction,
  desktop = false,
) {
  // 1. Try combo specific images
  const desktopImg = combo?.desktop_image_url;
  const mobileImg = combo?.image_url;

  if (desktop && desktopImg) return imgSrc(desktopImg, HERO_PLACEHOLDER_DESKTOP);
  if (!desktop && mobileImg) return imgSrc(mobileImg, HERO_PLACEHOLDER_MOBILE);
  if (!desktop && desktopImg) return imgSrc(desktopImg, HERO_PLACEHOLDER_MOBILE);
  if (desktop && mobileImg) return imgSrc(mobileImg, HERO_PLACEHOLDER_DESKTOP);

  // 2. Try legacy fields
  const fieldCandidate =
    combo?.banner_image ??
    combo?.hero_image ??
    combo?.image_web ??
    combo?.image ??
    null;

  if (fieldCandidate) {
    return imgSrc(
      fieldCandidate,
      desktop ? HERO_PLACEHOLDER_DESKTOP : HERO_PLACEHOLDER_MOBILE,
    );
  }

  // 3. Fallback to included attractions
  if (firstAttraction?.image_url) return firstAttraction.image_url;
  if (secondAttraction?.image_url) return secondAttraction.image_url;

  return desktop ? HERO_PLACEHOLDER_DESKTOP : HERO_PLACEHOLDER_MOBILE;
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
  const [searchParams] = useSearchParams();

  const slug = React.useMemo(() => {
    if (!slugParam || slugParam === 'undefined' || slugParam === 'null') return null;
    let s = slugParam;
    if (String(s).startsWith('combo-')) s = String(s).substring(6);
    return s;
  }, [slugParam]);
  
  const bookingSectionRef = React.useRef(null);

  const { items: comboItems = [], status: combosStatus } = useSelector(
    (s) => s.combos || { items: [], status: 'idle' },
  );
  const { items: attractionItems = [], status: attractionsStatus } = useSelector(
    (s) => s.attractions || { items: [], status: 'idle' },
  );

  React.useEffect(() => {
    const pDate = searchParams.get('date');
    const openDrawer = searchParams.get('openDrawer');

    if (pDate) {
      setDate(pDate);
    }

    if (openDrawer === 'true') {
      setTimeout(() => {
        bookingSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [searchParams]);

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

  const [date, setDate] = React.useState(searchParams.get('date') || '');
  const [qty, setQty] = React.useState(1);
  const [slots, setSlots] = React.useState([]);
  const [allSlots, setAllSlots] = React.useState([]);
  const [showCalendar, setShowCalendar] = React.useState(false);

  const isDayBlockedByComboRule = React.useCallback((dateStr) => {
    if (!state.data && !matchedCombo) return false;
    const item = state.data || matchedCombo;
    
    // Hardcoded temporary fix: Disable same-day booking for combo 26
    if (String(item?.combo_id) === '26') {
      const today = dayjs().format('YYYY-MM-DD');
      if (dayjs(dateStr).format('YYYY-MM-DD') === today) {
        return true;
      }
    }

    const dayRuleType = item?.day_rule_type || 'all_days';
    if (dayRuleType === 'all_days') return false;
    const customDays = item?.custom_days || [];
    const dayOfWeek = dayjs(dateStr).day();
    if (dayRuleType === 'weekends') return dayOfWeek !== 0 && dayOfWeek !== 6;
    if (dayRuleType === 'weekdays') return dayOfWeek === 0 || dayOfWeek === 6;
    if (dayRuleType === 'custom_days' && customDays.length > 0) return !customDays.includes(dayOfWeek);
    return false;
  }, [state.data, matchedCombo]);

  const todayBlocked = React.useMemo(() => isDayBlockedByComboRule(dayjs().format('YYYY-MM-DD')), [isDayBlockedByComboRule]);
  const tomorrowBlocked = React.useMemo(() => isDayBlockedByComboRule(dayjs().add(1, 'day').format('YYYY-MM-DD')), [isDayBlockedByComboRule]);

  React.useEffect(() => {
    const pDate = searchParams.get('date');
    if (pDate) {
      if (isDayBlockedByComboRule(pDate)) {
        // If the URL date is blocked, find the true next available date
        (async () => {
          try {
            const res = await api.get(endpoints.combos.slots(state.data?.combo_id || matchedCombo?.combo_id));
            const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
            setAllSlots(list);
            if (list.length > 0) {
              const todayStr = dayjs().format('YYYY-MM-DD');
              const validSlots = list.filter(s => {
                const sDate = s.start_date || s.date || '';
                return !isDayBlockedByComboRule(sDate) && s.available !== false && (s.capacity > 0 || String(s.capacity) === 'unlimited');
              });
              if (validSlots.length > 0) {
                setDate(validSlots[0].start_date || validSlots[0].date);
                return;
              }
            }
          } catch (e) { /* fallback */ }
          setDate(getNextAvailableDate(state.data || matchedCombo));
        })();
      } else {
        setDate(pDate);
      }
    } else if (state.data?.combo_id) {
      // Find true next available date from slots
      (async () => {
        try {
          const res = await api.get(endpoints.combos.slots(state.data.combo_id));
          const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
          setAllSlots(list);
          
          if (list.length > 0) {
            const todayStr = dayjs().format('YYYY-MM-DD');
            const futureSlots = list.filter(s => {
              const sDate = s.start_date || s.date || '';
              return sDate >= todayStr && !isDayBlockedByComboRule(sDate) && s.available !== false && (s.capacity > 0 || String(s.capacity) === 'unlimited');
            });
            
            if (futureSlots.length > 0) {
              const firstDate = futureSlots[0].start_date || futureSlots[0].date;
              setDate(firstDate);
              return;
            }
          }
          
          const nextDate = getNextAvailableDate(state.data);
          if (isDayBlockedByComboRule(nextDate)) {
             setDate(getNextAvailableDate(state.data, dayjs(nextDate).add(1, 'day').format('YYYY-MM-DD')));
          } else {
             setDate(nextDate);
          }
        } catch (err) {
          const nextDate = getNextAvailableDate(state.data);
          setDate(nextDate);
        }
      })();
    }
  }, [searchParams, state.data, matchedCombo, isDayBlockedByComboRule]);

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
      if (!value) return 'More Dates';
      if (value === today) return 'More Dates';
      if (value === tomorrow) return 'More Dates';
      return dayjs(value).format('DD-MMM-YYYY');
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

      // Remove auto-selection and set selectedKey to empty string
      setSlotState({
        status: 'loaded',
        selectedKey: '',
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
      return () => { };
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
            `Experience ${idx + 1}`,
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

  // Build info message about which attractions need time slot vs open entry
  const comboSlotInfoMessage = React.useMemo(() => {
    if (!normalizedAttractions.length) return null;
    const slotEnabled = normalizedAttractions.filter(a => a.time_slot_enabled !== false);
    const openEntry = normalizedAttractions.filter(a => a.time_slot_enabled === false);
    if (!openEntry.length) return null;
    const parts = [];
    if (slotEnabled.length) {
      parts.push(`Select time slot for ${slotEnabled.map(a => a.title).join(', ')}`);
    }
    if (openEntry.length) {
      if (slotEnabled.length === 0) {
        return 'Open Entry Experience — no time slot selection required.';
      }
      parts.push(`Open Entry for ${openEntry.map(a => a.title).join(', ')} (no slot required)`);
    }
    return parts.join(' • ');
  }, [normalizedAttractions]);
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

  // SEO Injection
  usePageSeo({
    slug: slug,
    title: combo?.meta_title || title || 'Combo Details',
    description: combo?.meta_description || combo?.short_description || '',
    keywords: combo?.meta_keywords || '',
    image: heroImage,
    imageAlt: combo?.image_alt || title,
    type: 'website',
    faq_items: combo?.faq_items,
    head_schema: combo?.head_schema,
    body_schema: combo?.body_schema,
    footer_schema: combo?.footer_schema,
  });

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
  const dbComboPrice =
    rawPrice > 0
      ? rawPrice
      : Number(combo?.combo_price || combo?.total_price || 0);

  // Reflect dynamic pricing: if slots are loaded for the selected date, use the first slot's price
  const comboPrice = slots.length > 0 && Number(slots[0].price) > 0
    ? Number(slots[0].price)
    : dbComboPrice;

  console.log('ComboDetails Debug -> slots:', slots.length, 'comboPrice:', comboPrice, 'slots0 price:', slots[0]?.price, 'slots0 pricing:', slots[0]?.pricing);

  const dbComboBasePrice = getBasePrice(combo);
  const comboBasePrice = slots.length > 0 && Number(slots[0].original_price) > 0
    ? Number(slots[0].original_price)
    : dbComboBasePrice;
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
      // When dynamic pricing is active for this date, skip all offers
      const isDPActive = slot?.dynamic_pricing_active || slot?.pricing?.dynamic_pricing_active;
      const bestOffer = (comboId && !isDPActive)
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

  const isBookingStopped = combo?.stop_booking === true;

  const onBook = (slot, pricingInfo) => {
    if (isBookingStopped) return;
    if (isDayBlockedByComboRule(date)) {
      toast.error('Booking is not available for the selected date');
      return;
    }

    const q = Math.max(1, Number(qty) || 1);
    const pricing = pricingInfo || getSlotPricing(slot);
    const unitPrice =
      pricing?.finalPrice ?? getSlotUnitPrice(slot, comboPrice);
    const comboSlotId = slot?.combo_slot_id ?? slot?.id ?? slot?._id ?? null;
    if (!comboSlotId) return;

    window.dataLayer = window.dataLayer || [];
    const items = [
      {
        item_name: combo?.title || combo?.name || combo?.combo_name || `Combo #${comboId}`,
        product_type: 'combo',
        quantity: q,
        price: unitPrice,
        time_slot: labelTime(slot),
        selected_date: toYMD(date)
      }
    ];
    window.dataLayer.push({
      event: 'add_to_cart',
      attraction_name: items[0]?.item_name || '',
      product_type: items[0]?.product_type || '',
      total_tickets: items.reduce((sum, item) => sum + item.quantity, 0),
      ticket_price: unitPrice,
      ticket_quantity: q,
      total_price: unitPrice * q,
      total_pax: q,
      time_slot: labelTime(slot),
      selected_date: toYMD(date),
      currency: 'INR',
      button_type: 'buy_now',
      items: items
    });

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
    toast.success('Added to your booking!');
    dispatch(setStep(1));
    const params = new URLSearchParams({
      type: 'combo',
      combo_id: String(comboId),
      date,
      slot: buildSlotKey(slot),
      qty: String(q),
    });
    sessionStorage.removeItem('snowcity_booking_state');
    navigate(`/tickets-offers?${params.toString()}`);
  };

  /* ========= Render ========= */

  const stoppedBanner = isBookingStopped ? (
    <div className="bg-red-50 border-y border-red-100 py-3">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2 text-red-700 font-medium">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Booking temporarily unavailable online</span>
      </div>
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f8ff] to-white font-sans">
      {stoppedBanner}

      {/* HERO SECTION - Full width, overlaying navbar */}
      <section className="relative w-full -mt-[76px] lg:-mt-[104px] z-0 overflow-hidden">
        {/* Banner Carousel */}
        <div className="relative h-[500px] md:h-[650px] w-full bg-gray-900 group">
          {carouselImages.length > 0 ? (
            <>
              {/* Carousel Images */}
              <button
                type="button"
                className="w-full h-full relative outline-none"
                onClick={() => {
                  const current = carouselImages[carouselIndex];
                  if (current.isBanner) {
                    if (linkedGallery.items.length > 0) setViewerIndex(0);
                  } else {
                    setViewerIndex(current.index);
                  }
                }}
              >
                <img
                  src={carouselImages[carouselIndex].src}
                  alt={carouselImages[carouselIndex].alt}
                  className="w-full h-full object-cover transition-opacity duration-700 brightness-75 group-hover:brightness-90"
                  loading="eager"
                />
                {/* Overlaying Gradient (Bottom only) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              </button>

              {/* Carousel Controls */}
              {carouselImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); prevCarousel(); }}
                    className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-xl bg-black/30 text-white hover:bg-black/50 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); nextCarousel(); }}
                    className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-xl bg-black/30 text-white hover:bg-black/50 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <div className="absolute bottom-28 left-1/2 -translate-x-1/2 flex gap-2">
                    {carouselImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={(e) => { e.stopPropagation(); setCarouselIndex(i); }}
                        className={`w-2.5 h-2.5 rounded-xl transition-all ${i === carouselIndex ? 'bg-white scale-110' : 'bg-white/40 hover:bg-white/60'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
              No images available
            </div>
          )}

          {/* HERO BANNER + GALLERY (Full Width) */}
          <div className="mt-6 flex justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#0099FF]/90 text-[10px] md:text-xs font-bold text-white uppercase tracking-widest backdrop-blur-sm">
              <span>Combo Deal</span>
              {discountPercent > 0 && (
                <span className="pl-2 border-l border-white/30">Save {discountPercent}%</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT AREA - Overlapping the Hero Bottom */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 -mt-16 md:-mt-24 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN: Main Info */}
          <div className="lg:col-span-2 space-y-8">

            {/* Gallery Card (If Gallery Banner Section was removed or combined) */}
            {linkedGallery.items.length > 0 && (
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                <div className="p-6 md:p-8">
                  <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <span className="w-2 h-6 bg-[#0099FF] rounded-xl" />
                    Photo Gallery
                  </h2>
                  <GalleryGrid items={linkedGallery.items} />
                </div>
              </div>
            )}

            {/* Included Attractions - Single Row, No Container */}
            {normalizedAttractions.length > 0 && (
              <div className="pb-4">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="w-2 h-6 bg-[#0099FF] rounded-xl" />
                  What's Included
                </h2>
                <div className="flex flex-nowrap gap-4 overflow-x-auto pb-6 -mx-1 px-1 scrollbar-hide">
                  {normalizedAttractions.map((attr, idx) => {
                    const count = normalizedAttractions.length;
                    const isThree = count === 3;
                    return (
                      <div
                        key={idx}
                        className={`group relative rounded-2xl overflow-hidden shadow-lg bg-gray-100 flex-shrink-0 transition-all 
                          ${isThree ? 'w-[280px] md:w-[calc(33.333%-11px)] aspect-[16/10]' : 'w-[300px] md:w-[380px] aspect-[4/3]'}`}
                      >
                        <img
                          src={attr.image_url}
                          alt={attr.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-5 flex flex-col justify-end">
                          <span className="text-[10px] text-[#0099FF] font-bold uppercase tracking-wider mb-1">Experience {idx + 1}</span>
                          <h3 className={`${isThree ? 'text-sm' : 'text-base'} font-bold text-white leading-tight line-clamp-1`}>{attr.title}</h3>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* MOBILE ONLY: Booking Container - Repositioned after "What's Included" images */}
            <div className="lg:hidden">
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 space-y-6">
                <div className="pb-6 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Starting From</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-gray-900 rupee">{formatCurrency(comboPrice)}</span>
                    <span className="text-gray-500 font-medium">/ person</span>
                  </div>
                  {hasBasePricing && discountPercent > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-gray-400 line-through">{formatCurrency(baseSum)}</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-lg uppercase">-{discountPercent}% OFF</span>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {!isBookingStopped && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-3 text-left">Select Date</label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={onCalendarButtonClick}
                          className="flex-1 flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl hover:border-blue-400 transition-all font-semibold text-gray-900 shadow-inner"
                        >
                          <span className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0099FF] flex items-center justify-center">
                              <Calendar size={20} />
                            </div>
                            {dayjs(date).format('DD MMM YYYY')}
                          </span>
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        </button>
                        <button
                          type="button"
                          onClick={onCalendarButtonClick}
                          className="p-3.5 rounded-xl border border-gray-100 text-gray-600 hover:border-blue-400 hover:text-[#0099FF] transition-colors bg-gray-50 shadow-inner"
                          title="Open Calendar"
                        >
                          <Calendar size={20} />
                        </button>
                      </div>
                    </div>
                  )}

                  {!isBookingStopped && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-3">Time Slot</label>
                      {comboSlotInfoMessage && (
                        <div className="mb-3 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-[#0099FF] font-medium flex items-start gap-2">
                          <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#0099FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <span>{comboSlotInfoMessage}</span>
                        </div>
                      )}
                      <div className="relative">
                        <select
                          className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none text-base font-medium appearance-none cursor-pointer pr-12"
                          value={slotState.selectedKey}
                          onChange={(e) => setSlotState(s => ({ ...s, selectedKey: e.target.value }))}
                        >
                          <option value="">Select the ticket</option>
                          {slots.filter(s => isSlotBookableForDate(s, date)).map(s => <option key={buildSlotKey(s)} value={buildSlotKey(s)}>{labelTime(s)}</option>)}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                          <ChevronDown size={20} />
                        </div>
                      </div>
                    </div>
                  )}

                  {!isBookingStopped && (
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-3 text-left">No. of tickets</label>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <button
                          type="button"
                          onClick={() => setQty((prev) => Math.max(1, Number(prev || 1) - 1))}
                          className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:border-sky-300 active:scale-95 transition"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="text-xl font-black text-gray-900">{qty}</span>
                        <button
                          type="button"
                          onClick={() => setQty((prev) => Math.max(1, Number(prev || 1) + 1))}
                          className="w-10 h-10 rounded-xl border border-sky-200 flex items-center justify-center active:scale-95 bg-sky-600 text-white shadow-sm"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  )}

                  {!isBookingStopped && (
                    <div className={`p-5 rounded-3xl text-white shadow-xl transition-all ${selectedSlot ? 'bg-[#0099FF] shadow-[#0099FF]/20' : 'bg-gray-400 opacity-60'}`}>
                      <div className="flex justify-between items-end mb-4">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-1">Total Payable</p>
                          <p className="text-2xl font-black rupee">{formatCurrency(selectedSlot ? totalPrice : 0)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-blue-100">{qty} {qty === 1 ? 'Ticket' : 'Tickets'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => selectedSlot && onBook(selectedSlot, selectedSlotPricing)}
                        disabled={isBookingStopped || !selectedSlot}
                        className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${selectedSlot ? 'bg-white text-[#0099FF] hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98]' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                      >
                        {selectedSlot ? 'Secure My Spot' : 'Select a Slot'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description Card */}
            {description && (
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="w-2 h-6 bg-[#0099FF] rounded-xl" />
                  Experience Highlights
                </h2>
                <div className="prose prose-blue max-w-none text-gray-700">
                  <div dangerouslySetInnerHTML={{ __html: normalizeHtml(description) }} />
                </div>
              </div>
            )}

            {/* FAQ Card */}
            {combo?.faq_items?.length > 0 && (
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <span className="w-2 h-6 bg-[#0099FF] rounded-xl" />
                  Frequently Asked Questions
                </h2>
                <div className="space-y-3">
                  {combo.faq_items.map((faq, i) => (
                    <details key={i} className="group border border-gray-100 rounded-2xl overflow-hidden transition-all hover:border-blue-200">
                      <summary className="flex items-center justify-between p-4 cursor-pointer font-semibold text-gray-900 hover:bg-gray-50 list-none">
                        {faq.question}
                        <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" />
                      </summary>
                      <div className="p-4 pt-0 text-gray-600 bg-gray-50/50 leading-relaxed text-xs md:text-sm">
                        {faq.answer}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}

            {/* Slot List Card */}
            <div id="availability" className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-2 h-6 bg-[#0099FF] rounded-xl" />
                  Available Time Slots
                </h2>
                <div className="px-4 py-2 bg-blue-50 text-[#0099FF] rounded-2xl text-sm font-semibold border border-blue-100">
                  {dayjs(date).format('DD MMMM YYYY')}
                </div>
              </div>
              {comboSlotInfoMessage && (
                <div className="mb-6 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700 font-medium flex items-start gap-2">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>{comboSlotInfoMessage}</span>
                </div>
              )}

              {slotState.status === 'loading' ? (
                <div className="flex justify-center py-12"><Loader /></div>
              ) : slotState.status === 'failed' ? (
                <ErrorState message={slotErr || 'Failed to load slots'} />
              ) : isDayBlockedByComboRule(date) ? (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center gap-4 w-full">
                  <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-2">
                    <Calendar size={32} />
                  </div>
                  <p className="font-bold text-lg text-gray-900 text-center">Booking Unavailable for this Date</p>
                  <p className="text-sm max-w-md text-center">
                    {String(state.data?.combo_id) === '26' 
                      ? "Same-day booking is not allowed for this combo. Please select a future date."
                      : "This combo is not available on the selected day. Please choose another date."}
                  </p>
                  {(() => {
                    const nextAvailableSlot = allSlots.find(s => {
                      const sDate = s.start_date || s.date || '';
                      return sDate > date && s.available !== false && (s.capacity > 0 || String(s.capacity) === 'unlimited') && !isDayBlockedByComboRule(sDate);
                    });
                    if (nextAvailableSlot) {
                      const nextDate = nextAvailableSlot.start_date || nextAvailableSlot.date;
                      return (
                        <button
                          onClick={() => setDate(nextDate)}
                          className="mt-2 px-6 py-3 bg-[#0099FF] text-white rounded-xl font-bold hover:bg-[#007ACC] transition-all flex items-center gap-2"
                        >
                          <Calendar size={18} />
                          Check Next Available: {dayjs(nextDate).format('DD MMM')}
                        </button>
                      );
                    }
                    return null;
                  })()}
                </div>
              ) : slots.length === 0 ? (

                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center gap-4">
                  <p>No slots available for this date.</p>
                  {(() => {
                    const nextAvailableSlot = allSlots.find(s => {
                      const sDate = s.start_date || s.date || '';
                      return sDate > date && s.available !== false && (s.capacity > 0 || String(s.capacity) === 'unlimited');
                    });
                    if (nextAvailableSlot) {
                      const nextDate = nextAvailableSlot.start_date || nextAvailableSlot.date;
                      return (
                        <button
                          onClick={() => setDate(nextDate)}
                          className="px-6 py-2 bg-[#0099FF] text-white rounded-xl font-bold hover:bg-[#007ACC] transition-all flex items-center gap-2"
                        >
                          <Calendar size={18} />
                          Check Next Available: {dayjs(nextDate).format('DD MMM')}
                        </button>
                      );
                    }
                    return null;
                  })()}
                </div>


              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {slots
                    .filter(s => isSlotBookableForDate(s, date))
                    .map((s, i) => {
                      const pricing = getSlotPricing(s);
                      const key = buildSlotKey(s);
                      const isUnavailable = s.available === 0 || s.capacity === 0 || isBookingStopped;

                      return (
                        <div key={key} className={`p-4 rounded-2xl border transition-all ${isUnavailable ? 'opacity-60 bg-gray-50' : 'bg-white border-gray-100 hover:border-blue-500 hover:shadow-lg'}`}>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="font-bold text-gray-900 text-base">{labelTime(s)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-[#0099FF] rupee">{formatCurrency(pricing.finalPrice)}</p>
                              {pricing.originalPrice > pricing.finalPrice && (
                                <p className="text-xs text-gray-400 line-through">{formatCurrency(pricing.originalPrice)}</p>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onBook(s, pricing)}
                            disabled={isUnavailable}
                            className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${isUnavailable
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-[#0099FF] text-white hover:bg-[#007ACC] shadow-sm'
                              }`}
                          >
                            {isUnavailable ? 'Unavailable' : 'Book This Slot'}
                          </button>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Explore More card - Relocated to left column */}
            <div className="mt-8 bg-gradient-to-br from-[#0099FF] to-[#007ACC] rounded-3xl p-8 text-white shadow-lg overflow-hidden relative group">
              <div className="relative z-10">
                <h3 className="text-lg font-bold mb-2">Explore More</h3>
                <p className="text-sm text-blue-100 mb-6 font-medium">Check out our other amazing combo deals and save more on your visit!</p>
                <Link to="/combos" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#0099FF] rounded-xl font-bold text-sm transition-all hover:px-8">
                  Browse All Combos
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 8l4 4m0 0l-4 4m4-4H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
                </Link>
              </div>
              <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/10 rounded-xl blur-3xl group-hover:scale-110 transition-transform duration-700" />
            </div>
          </div>

          {/* RIGHT COLUMN: Sidebar Booking - Hidden on mobile */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 sticky top-28 space-y-6">

              {/* Sidebar Header/Price */}
              <div className="pb-6 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Starting From</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-gray-900 rupee">{formatCurrency(comboPrice)}</span>
                  <span className="text-gray-500 font-medium">/ person</span>
                </div>
                {hasBasePricing && discountPercent > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-400 line-through">{formatCurrency(baseSum)}</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-lg uppercase">-{discountPercent}% OFF</span>
                  </div>
                )}
              </div>

              {/* Booking Controls */}
              <div className="space-y-6" ref={bookingSectionRef}>

                {/* Date Picker */}
                {!isBookingStopped && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-3 text-left">Select Date</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={onCalendarButtonClick}
                        className="flex-1 flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl hover:border-blue-400 transition-all font-semibold text-gray-900 shadow-inner"
                      >
                        <span className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0099FF] flex items-center justify-center">
                            <Calendar size={20} />
                          </div>
                          {dayjs(date).format('DD MMM YYYY')}
                        </span>
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      </button>
                      <button
                        type="button"
                        onClick={onCalendarButtonClick}
                        className="p-3.5 rounded-xl border border-gray-100 text-gray-600 hover:border-blue-400 hover:text-[#0099FF] transition-colors bg-gray-50 shadow-inner"
                        title="Open Calendar"
                      >
                        <Calendar size={20} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Slot Selector */}
                {!isBookingStopped && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-3">Time Slot</label>
                    {comboSlotInfoMessage && (
                      <div className="mb-3 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 font-medium flex items-start gap-2">
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>{comboSlotInfoMessage}</span>
                      </div>
                    )}
                    <div className="relative">
                      <select
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-sky-500 outline-none text-base font-medium appearance-none cursor-pointer pr-12"
                        value={slotState.selectedKey}
                        onChange={(e) => setSlotState(s => ({ ...s, selectedKey: e.target.value }))}
                        disabled={isDayBlockedByComboRule(date)}
                      >
                        <option value="">{isDayBlockedByComboRule(date) ? 'Booking Unavailable' : 'Select the ticket'}</option>
                        {!isDayBlockedByComboRule(date) && slots.filter(s => isSlotBookableForDate(s, date)).map(s => <option key={buildSlotKey(s)} value={buildSlotKey(s)}>{labelTime(s)}</option>)}
                      </select>

                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <ChevronDown size={20} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Quantity */}
                {!isBookingStopped && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-3 text-left">No. of tickets</label>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <button
                        type="button"
                        onClick={() => setQty((prev) => Math.max(1, Number(prev || 1) - 1))}
                        className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:border-sky-300 active:scale-95 transition"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="text-xl font-black text-gray-900">{qty}</span>
                      <button
                        type="button"
                        onClick={() => setQty((prev) => Math.max(1, Number(prev || 1) + 1))}
                        className="w-10 h-10 rounded-xl border border-sky-200 flex items-center justify-center active:scale-95 bg-sky-600 text-white shadow-sm"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Summary Box */}
                {!isBookingStopped && (
                  <div className={`p-5 rounded-3xl text-white shadow-xl transition-all ${selectedSlot ? 'bg-[#0099FF] shadow-[#0099FF]/20' : 'bg-gray-400 opacity-60'}`}>
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-1">Total Payable</p>
                        <p className="text-2xl font-black rupee">{formatCurrency(selectedSlot ? totalPrice : 0)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-blue-100">{qty} {qty === 1 ? 'Ticket' : 'Tickets'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => selectedSlot && onBook(selectedSlot, selectedSlotPricing)}
                      disabled={isBookingStopped || !selectedSlot}
                      className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${selectedSlot ? 'bg-white text-[#0099FF] hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98]' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                    >
                      {selectedSlot ? 'Secure My Spot' : 'Select a Slot'}
                    </button>
                  </div>
                )}

                {/* Help/Inquiry */}
                <div className="text-center pt-2">
                  <p className="text-xs text-gray-400 font-medium">Need help? <Link to="/contact" className="text-[#0099FF] font-bold hover:underline">Chat with us</Link></p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section >

      {/* FOOTER PADDING */}
      < div className="h-16" />

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
                        const isDisabledByDayRule = isDayBlockedByComboRule(dateStr);
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
      )
      }

      {/* GALLERY VIEWER */}
      {
        viewerIndex !== null && linkedGallery.items.length > 0 && (
          <GalleryViewer
            items={linkedGallery.items}
            initialIndex={viewerIndex}
            onClose={() => setViewerIndex(null)}
          />
        )
      }
    </div >
  );
}
