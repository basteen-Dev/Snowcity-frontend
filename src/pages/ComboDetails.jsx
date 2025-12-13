import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
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
  const { id: rawParam } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

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
    if (!rawParam) return null;
    const num = Number(rawParam);
    return Number.isFinite(num) ? num : null;
  }, [rawParam]);

  const matchedCombo = React.useMemo(() => {
    if (!rawParam || !comboItems.length) return null;
    return (
      comboItems.find((c) => String(c?.combo_id ?? c?.id ?? '') === rawParam) ||
      comboItems.find(
        (c) => rawParam && c?.slug && String(c.slug) === rawParam,
      ) ||
      null
    );
  }, [comboItems, rawParam]);

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
    if (!rawParam) {
      setState({ status: 'failed', data: null, error: 'Combo not found' });
      return;
    }

    if (fetchId == null) {
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
      return;
    }

    let mounted = true;
    const controller = new AbortController();
    setState({ status: 'loading', data: null, error: null });

    (async () => {
      try {
        const res = await api.get(endpoints.combos.byId(fetchId), {
          signal: controller.signal,
        });
        if (!mounted) return;
        setState({ status: 'succeeded', data: res, error: null });
      } catch (err) {
        if (err?.canceled || !mounted) return;
        if (matchedCombo) {
          setState({
            status: 'succeeded',
            data: matchedCombo,
            error: null,
          });
        } else {
          setState({
            status: 'failed',
            data: null,
            error: err?.message || 'Failed to load combo',
          });
        }
      }
    })();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [rawParam, fetchId, combosStatus, numericParam, matchedCombo]);

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
    if (!fetchId || !date) return;
    try {
      setSlotState((s) => ({ ...s, status: 'loading' }));
      setSlotErr('');
      const out = await api.get(endpoints.combos.slots(fetchId), {
        params: { date },
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
  }, [fetchId, date]);

  React.useEffect(() => {
    if (fetchId && date) loadSlots();
  }, [fetchId, date, loadSlots]);

  React.useEffect(() => {
    if (!fetchId) {
      setOffers({ status: 'idle', items: [], error: null });
      return () => {};
    }
    let cancelled = false;
    setOffers((s) => ({ ...s, status: 'loading', error: null }));
    (async () => {
      try {
        const res = await api.get(endpoints.offers.list(), {
          params: { active: true, target_type: 'combo', target_id: fetchId },
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
  }, [fetchId]);

  React.useEffect(() => {
    if (!fetchId) return undefined;
    let canceled = false;
    setLinkedGallery((s) => ({ ...s, status: 'loading', error: null }));
    (async () => {
      try {
        const res = await api.get(endpoints.gallery.list(), {
          params: {
            active: true,
            target_type: 'combo',
            target_ref_id: fetchId,
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
    return () => {
      canceled = true;
    };
  }, [fetchId]);

  const combo = state.data || matchedCombo;

  const fallbackAttractions = React.useMemo(() => {
    if (!combo) return [];
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
    if (!combo) return [];
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
  const isInitialLoading = state.status === 'loading' && !combo;

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

  const selectedSlot =
    slots.find((s) => buildSlotKey(s) === slotState.selectedKey) || null;
  const selectedSlotPricing = selectedSlot
    ? getSlotPricing(selectedSlot)
    : null;

  /* ========= Render ========= */

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e0f2fe] via-[#bae6fd] to-white font-sans">
      {/* HERO */}
      <section className="relative h-[42vh] md:h-[56vh] bg-gray-200">
        {heroImage ? (
          <img
            src={heroImage}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
            draggable="false"
          />
        ) : (
          <div
            className="absolute inset-0 grid gap-1"
            style={{
              gridTemplateColumns: `repeat(${heroTiles.length}, minmax(0, 1fr))`,
            }}
          >
            {heroTiles.map((attr, idx) => (
              <div key={`hero-attr-${idx}`} className="relative overflow-hidden">
                <img
                  src={attr.image_url || HERO_PLACEHOLDER}
                  alt={attr.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  draggable="false"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
            ))}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-6 left-0 right-0 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs uppercase tracking-wide text-gray-100 mb-2">
              <span>Combo Deal</span>
              {discountPercent > 0 ? <span>Save {discountPercent}%</span> : null}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-gray-200 text-sm md:text-base max-w-2xl mt-2">
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

      {/* INLINE BOOKING BAR (Option A) */}
      <section className="bg-white/90 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 md:py-5">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
            <div className="flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-1">
                Book this combo
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
                      date === dayjs().format('YYYY-MM-DD')
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
                    ref={setCalendarAnchor}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      date &&
                      date !== '' &&
                      date !== dayjs().format('YYYY-MM-DD') &&
                      date !== dayjs().add(1, 'day').format('YYYY-MM-DD')
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-white text-gray-800 border-gray-200 hover:border-sky-300'
                    }`}
                  >
                    {date && date !== dayjs().format('YYYY-MM-DD') && date !== dayjs().add(1, 'day').format('YYYY-MM-DD')
                      ? formatDateDisplay(date)
                      : 'All Days'}
                  </button>
                </div>
              </div>

              {/* Slot */}
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 min-w-[180px]">
                <span className="text-xs text-gray-500">Slot</span>
                <select
                  className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-gray-900 truncate"
                  value={slotState.selectedKey}
                  onChange={(e) =>
                    setSlotState((s) => ({
                      ...s,
                      selectedKey: e.target.value,
                    }))
                  }
                  disabled={slotState.status === 'loading' || !slots.length}
                >
                  {slotState.status === 'loading' && (
                    <option>Loading slots…</option>
                  )}
                  {slotState.status !== 'loading' && !slots.length && (
                    <option>No slots</option>
                  )}
                  {slotState.status !== 'loading' &&
                    slots
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
                </select>
              </div>

              {/* Qty */}
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5">
                <span className="text-xs text-gray-500">Qty</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="w-7 h-7 text-sm rounded-full border border-gray-300 flex items-center justify-center"
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
                    className="w-12 bg-transparent border-none text-center text-sm font-semibold outline-none"
                  />
                  <button
                    type="button"
                    className="w-7 h-7 text-sm rounded-full border border-gray-300 flex items-center justify-center"
                    onClick={() =>
                      setQty((prev) => Math.max(1, Number(prev || 1) + 1))
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
                disabled={!selectedSlot || slotState.status === 'loading'}
                onClick={() => {
                  if (!selectedSlot) return;
                  onBook(selectedSlot, selectedSlotPricing);
                }}
              >
                {selectedSlotPricing?.finalPrice
                  ? `Book Now • ${formatCurrency(
                      selectedSlotPricing.finalPrice * qty,
                    )}`
                  : 'Book Now'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="max-w-6xl mx-auto px-4 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-3 gap-10 md:gap-12">
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
                    <h2 className="text-lg font-semibold line-clamp-2">
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
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                About this combo
              </h2>
              <div
                className="prose prose-sm md:prose max-w-none text-gray-700 leading-relaxed"
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
      </section>
    </div>
  );
}
