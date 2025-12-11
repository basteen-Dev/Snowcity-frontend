import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../services/apiClient';
import endpoints from '../services/endpoints';
import { imgSrc } from '../utils/media';
import { getPrice, getBasePrice, getSlotUnitPrice, getSlotBasePrice } from '../utils/pricing';
import { formatCurrency } from '../utils/formatters';
import {
  X, Calendar, Clock, ShoppingBag, Check, ChevronRight, Ticket,
  User, Mail, Phone, ArrowRight, Plus, Minus, Trash2, Edit2, UserPlus, Globe, AlertCircle, ArrowLeft,
} from 'lucide-react';

import {
  setStep, setContact, setCouponCode,
  sendAuthOtp, verifyAuthOtp, applyCoupon,
  createBooking, initiatePayPhi,
  addCartItem, removeCartItem, resetCart,
  setActiveCartItem,
} from '../features/bookings/bookingsSlice';

import { fetchAttractions } from '../features/attractions/attractionsSlice';
import { fetchCombos } from '../features/combos/combosSlice';
import { fetchAddons } from '../features/addons/addonsSlice';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import TokenExpiredModal from '../components/modals/TokenExpiredModal';

/* ================= Helpers ================= */
const toYMD = (d) => dayjs(d).format('YYYY-MM-DD');
const todayYMD = () => dayjs().format('YYYY-MM-DD');

const getAttrId = (a) => a?.id ?? a?._id ?? a?.attraction_id ?? null;
const getComboId = (c) => c?.id ?? c?._id ?? c?.combo_id ?? null;

const getSlotKey = (s, idx) =>
  String(s?.id ?? s?._id ?? s?.slot_id ?? s?.combo_slot_id ?? `${s?.start_time || ''}-${s?.end_time || ''}-${idx}`);

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
  return `Slot #${s?.id || '?'}`;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COUNTRY_CODES = [
  { code: '+91', label: 'IN (+91)' },
  { code: '+1', label: 'US (+1)' },
  { code: '+971', label: 'AE (+971)' },
  { code: '+44', label: 'UK (+44)' },
  { code: '+65', label: 'SG (+65)' },
];

const getAddonPrice = (a) => Number(a?.price ?? a?.amount ?? 0);
const getAddonId = (addon) => addon?.id ?? addon?.addon_id ?? addon?._id ?? null;
const getAddonName = (addon) => addon?.name ?? addon?.title ?? addon?.label ?? 'Addon';
const getAddonImage = (addon) => {
  if (!addon) return null;
  const candidates = [addon, addon?.image_url, addon?.image, addon?.thumbnail, addon?.cover_image];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const resolved = typeof candidate === 'string' ? imgSrc(candidate) : imgSrc(candidate);
    if (resolved) return resolved;
  }
  return null;
};

function useMediaQuery(query) {
  const getMatch = () => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = useState(getMatch);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(query);
    const handler = (event) => setMatches(event.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

const createDefaultSelection = () => ({
  itemType: 'attraction',
  attractionId: '',
  comboId: '',
  date: todayYMD(),
  slotKey: '',
  qty: 1,
});

const makeLocalCartKey = () =>
  `sel_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

const getComboLabel = (combo, fallbackId = null) => {
  if (!combo) return fallbackId ? `Combo ${fallbackId}` : 'Combo';
  const direct = combo.name ?? combo.title ?? combo.combo_name ?? combo.label ?? null;
  if (direct) return direct;
  return fallbackId ? `Combo ${fallbackId}` : 'Combo';
};

const resolveImageSource = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return imgSrc(value);
  if (typeof value === 'object') {
    const nested = value.url || value.src || value.image_url || value.path;
    if (nested) return imgSrc(nested);
  }
  return null;
};

const getAttractionImage = (item) => {
  if (!item) return null;
  const candidates = [
    item.desktop_image_url,
    item.hero_image,
    item.banner_image,
    item.image_url,
    item.cover_image,
    item.thumbnail,
    item.media?.[0],
  ];
  for (const candidate of candidates) {
    const src = resolveImageSource(candidate);
    if (src) return src;
  }
  return null;
};

const getComboPrimaryImage = (combo) => {
  if (!combo) return null;
  const candidates = [
    combo.desktop_image_url,
    combo.hero_image,
    combo.banner_image,
    combo.image_url,
    combo.cover_image,
    combo.media?.[0],
    combo.attraction_1_image,
    combo.attraction_2_image,
  ];
  for (const candidate of candidates) {
    const src = resolveImageSource(candidate);
    if (src) return src;
  }
  return null;
};

const getComboPreviewImages = (combo) => {
  if (!combo) return [];
  const images = [];
  if (combo.attraction_1_image) images.push(resolveImageSource(combo.attraction_1_image));
  if (combo.attraction_2_image) images.push(resolveImageSource(combo.attraction_2_image));
  if (images.length < 2 && Array.isArray(combo.media)) {
    combo.media.forEach((m) => {
      const src = resolveImageSource(m);
      if (src && !images.includes(src)) images.push(src);
    });
  }
  return images.slice(0, 2).filter(Boolean);
};

const toAmount = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
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

const sumAttractionPrices = (attractionPrices) => {
  if (!attractionPrices) return 0;
  if (Array.isArray(attractionPrices)) {
    return attractionPrices.reduce((acc, val) => acc + toAmount(val), 0);
  }
  if (typeof attractionPrices === 'object') {
    return Object.values(attractionPrices).reduce((acc, val) => acc + toAmount(val), 0);
  }
  return 0;
};

const getComboDisplayPrice = (combo) => {
  if (!combo) return 0;
  const raw = getPrice(combo);
  if (raw > 0) return raw;

  const directFallback =
    combo?.combo_price ??
    combo?.price ??
    combo?.amount ??
    combo?.total_price ??
    combo?.starting_price ??
    combo?.min_price ??
    combo?.base_price ??
    0;
  if (toAmount(directFallback) > 0) return toAmount(directFallback);

  const comboAttractions = combo?.combo_attractions;
  if (Array.isArray(comboAttractions) && comboAttractions.length) {
    const sum = comboAttractions.reduce(
      (acc, attr) => acc + toAmount(attr?.attraction_price ?? attr?.price),
      0,
    );
    if (sum > 0) return sum;
  }

  const attrPricesSum = sumAttractionPrices(combo?.attraction_prices);
  if (attrPricesSum > 0) return attrPricesSum;

  const legacySum =
    toAmount(combo?.attraction_1_price) + toAmount(combo?.attraction_2_price);
  if (legacySum > 0) return legacySum;

  return 0;
};

const normalizePayphiMobile = (s) => {
  const digits = String(s || '').replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
};

const isSlotAvailable = (slot, selectedDate) => {
  if (!slot) return true;
  const now = dayjs();
  const selectedDay = dayjs(selectedDate);
  
  // Today: slot must be at least 1 hour from now
  if (selectedDay.format('YYYY-MM-DD') === now.format('YYYY-MM-DD')) {
    const slotTime = slot.start_time || slot.time || slot.startTime;
    if (!slotTime) return true;
    const [hours, minutes] = slotTime.split(':');
    const slotMinutes = parseInt(hours) * 60 + parseInt(minutes);
    const nowMinutes = now.hour() * 60 + now.minute();
    const minRequiredMinutes = nowMinutes + 60;
    return slotMinutes >= minRequiredMinutes;
  }
  // Future dates: all slots are available
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

const getOfferId = (offer) =>
  offer?.id ?? offer?.offer_id ?? offer?.offerId ?? offer?.slug ?? null;
const getOfferTitle = (offer) =>
  offer?.title || offer?.name || `Offer ${getOfferId(offer) ?? ''}`.trim();
const getOfferSummary = (offer) =>
  offer?.short_description || offer?.subtitle || offer?.description || '';

const computeOfferDiscount = (offer, totalAmount) => {
  if (!offer || !totalAmount) return 0;
  const discountType = String(offer.discount_type || offer.rule_discount_type || '').toLowerCase();
  const percentFromOffer =
    Number(
      offer.discount_percent ??
        offer.discountPercent ??
        (discountType === 'percent' ? offer.discount_value ?? offer.discountValue : 0),
    ) || 0;
  const flatValue =
    Number(offer.discount_value ?? offer.discountValue ?? offer.flat_discount ?? 0) || 0;

  let discount = 0;
  if ((discountType === 'percent' && percentFromOffer > 0) || percentFromOffer > 0) {
    discount = (totalAmount * percentFromOffer) / 100;
  } else {
    discount = flatValue;
  }

  const maxDiscount = Number(offer.max_discount ?? offer.maxDiscount ?? 0);
  if (maxDiscount > 0) discount = Math.min(discount, maxDiscount);

  return Math.max(0, Math.min(discount, totalAmount));
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
    const slotCandidates = [slot.slot_id, slot.id, slot._id, slot.combo_slot_id].filter(
      (v) => v != null,
    );
    const hasMatch = ruleSlotIds.some((rid) => slotCandidates.some((cid) => idsMatch(rid, cid)));
    if (!hasMatch) return false;
  }

  const hasTimeConstraints = rule.specific_time || (rule.time_from && rule.time_to);
  if (!hasTimeConstraints) return true;

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

const doesRuleMatchContext = ({ rule, selectedDate, selectedSlot, itemType, itemId }) => {
  if (!rule || !selectedDate) return false;
  const bookingDate = dayjs(selectedDate).format('YYYY-MM-DD');

  const ruleType = normalizeTargetType(rule.target_type);
  const currentType = normalizeTargetType(itemType);
  if (ruleType && currentType && ruleType !== currentType) return false;
  const appliesToAll = toBoolean(rule.applies_to_all);
  if (!appliesToAll) {
    const ruleTargetIds = [];
    if (rule.target_id != null) ruleTargetIds.push(rule.target_id);
    if (Array.isArray(rule.target_ids)) ruleTargetIds.push(...rule.target_ids);
    if (!ruleTargetIds.length) return false;
    const hasTargetMatch = ruleTargetIds.some((id) => idsMatch(id, itemId));
    if (!hasTargetMatch) return false;
  }

  if (rule.specific_date && bookingDate !== rule.specific_date) return false;
  if (Array.isArray(rule.specific_dates) && rule.specific_dates.length) {
    if (!rule.specific_dates.some((d) => dayjs(d).format('YYYY-MM-DD') === bookingDate))
      return false;
  }
  if (rule.date_from && bookingDate < rule.date_from) return false;
  if (rule.date_to && bookingDate > rule.date_to) return false;
  if (!matchesDayType(rule, bookingDate)) return false;
  if (!ruleMatchesSlotConstraints(rule, selectedSlot)) return false;

  return true;
};

const isHappyHourApplicable = (offer, selectedDate, selectedSlot, itemType, itemId) => {
  if (!offer || !selectedDate || !selectedSlot) return false;
  const rules = Array.isArray(offer.rules) ? offer.rules : [];
  const applicableRules = rules.filter((rule) =>
    doesRuleMatchContext({ rule, selectedDate, selectedSlot, itemType, itemId }),
  );
  return applicableRules.length > 0;
};

/* New: Offer preview helper used by OfferSelector */
const previewOfferForSelection = (offer, unitPrice, qty) => {
  const total = Number(unitPrice || 0) * Number(qty || 1);
  if (!offer || total <= 0) return null;
  const totalDiscount = computeOfferDiscount(offer, total) || 0;
  return {
    total,
    totalDiscount,
    final: Math.max(0, total - totalDiscount),
  };
};

/* ================= Component ================= */
export default function Booking() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const auth = useSelector((s) => s.auth);
  const hasToken = !!auth?.token;

  const attractionsState = useSelector((s) => s.attractions);
  const combosState = useSelector((s) => s.combos);
  const addonsState = useSelector((s) => s.addons);
  const { step, contact, otp, coupon, creating, cart } = useSelector((s) => s.bookings);
  const cartItems = cart?.items || [];
  const hasCartItems = cartItems.length > 0;
  const activeKey = cart?.activeKey;

  const checkoutItem = useMemo(() => {
    if (!cartItems.length) return null;
    if (activeKey) {
      const found = cartItems.find((item) => item.key === activeKey);
      if (found) return found;
    }
    return cartItems[0];
  }, [cartItems, activeKey]);

  const activeItemKey = checkoutItem?.key || null;

  const [sel, setSel] = useState(() => createDefaultSelection());
  const [editingKey, setEditingKey] = useState(null);
  const [showTokenExpiredModal, setShowTokenExpiredModal] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('booking');
  const [detailsMainImage, setDetailsMainImage] = useState(null);

  const [state, setState] = useState({
    status: 'idle',
    error: null,
    offers: [],
    offerRules: [],
    activeOffer: null,
    activeRule: null,
    selectedOffer: null,
    selectedRule: null,
    offerPreview: null,
    loadingOffers: false,
  });

  const [countryCode, setCountryCode] = useState('+91');
  const [phoneLocal, setPhoneLocal] = useState('');
  const [contactErrors, setContactErrors] = useState({});
  const [slots, setSlots] = useState({ status: 'idle', items: [], error: null });
  const [otpCode, setOtpCode] = useState('');
  const [promoInput, setPromoInput] = useState('');
  const [selectedOfferId, setSelectedOfferId] = useState('');
  const [cartAddons, setCartAddons] = useState(new Map());
  const [availablePromos, setAvailablePromos] = useState([]);
  const [promosLoading, setPromosLoading] = useState(false);

  const attractions = attractionsState.items || [];
  const combos = combosState.items || [];

  const computeBestOffer = useCallback(() => {
    if (!Array.isArray(state.offers) || !checkoutItem) return null;
    const targetType = normalizeTargetType(
      checkoutItem.item_type || (checkoutItem.combo_id ? 'Combo' : 'Attraction'),
    );
    const targetId = checkoutItem.attraction_id || checkoutItem.combo_id || null;
    const selectedDate = checkoutItem.date || '';
    const selectedSlot = checkoutItem.slot || {};

    let best = null;
    for (const offer of state.offers) {
      const rules = Array.isArray(offer.rules) ? offer.rules : [];
      for (const rule of rules) {
        if (
          !doesRuleMatchContext({
            rule,
            selectedDate,
            selectedSlot,
            itemType: targetType,
            itemId: targetId,
          })
        )
          continue;
        if (
          !best ||
          rule.priority > best.rule.priority ||
          (rule.priority === best.rule.priority && rule.rule_id < best.rule.rule_id)
        ) {
          best = { offer, rule };
        }
      }
    }
    return best;
  }, [state.offers, checkoutItem]);

  useEffect(() => {
    const best = computeBestOffer();
    setState((s) => ({ ...s, activeOffer: best?.offer || null, activeRule: best?.rule || null }));
  }, [computeBestOffer]);

  useEffect(() => {
    if (!state.activeOffer || !state.activeRule || !checkoutItem) {
      setState((s) => ({ ...s, offerPreview: null }));
      return;
    }
    const basePrice = Number(checkoutItem.price || checkoutItem.unitPrice || 0);
    const discountType =
      state.activeRule.rule_discount_type || state.activeOffer.discount_type || 'percent';
    const discountValue = Number(
      state.activeRule.rule_discount_value ?? state.activeOffer.discount_value ?? 0,
    );
    let newPrice = basePrice;
    if (discountType === 'percent') {
      newPrice = basePrice * (1 - discountValue / 100);
    } else if (discountType === 'amount') {
      newPrice = Math.max(0, basePrice - discountValue);
    }
    const savings = basePrice - newPrice;
    setState((s) => ({
      ...s,
      offerPreview: {
        basePrice,
        newPrice,
        savings,
        discountType,
        discountValue,
        offerTitle: state.activeOffer.title,
        ruleId: state.activeRule.rule_id,
      },
    }));
  }, [state.activeOffer, state.activeRule, checkoutItem]);

  useEffect(() => {
    if (contact?.phone && !phoneLocal) {
      const digits = String(contact.phone).replace(/\D/g, '');
      if (digits.length > 10) {
        const known = COUNTRY_CODES.find((c) => digits.startsWith(c.code.replace('+', '')));
        if (known) {
          setCountryCode(known.code);
          setPhoneLocal(digits.slice(known.code.length - 1));
        } else {
          setPhoneLocal(digits.slice(-10));
        }
      } else {
        setPhoneLocal(digits);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (state.status !== 'idle') return;
    let cancelled = false;
    const loadOffers = async () => {
      setState((s) => ({ ...s, status: 'loading', loadingOffers: true }));
      try {
        const res = await api.get(endpoints.offers.list(), { params: { active: true, limit: 20 } });
        if (cancelled) return;
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setState((s) => ({
          ...s,
          status: 'succeeded',
          offers: list,
          loadingOffers: false,
        }));
      } catch {
        if (!cancelled) setState((s) => ({ ...s, status: 'failed', loadingOffers: false }));
      }
    };
    loadOffers();
    return () => {
      cancelled = true;
    };
  }, [state.status]);

  useEffect(() => {
    if (promosLoading || availablePromos.length > 0) return;
    let cancelled = false;
    const loadPromos = async () => {
      setPromosLoading(true);
      try {
        const res = await api.get(endpoints.coupons.list(), { params: { active: true, limit: 50 } });
        if (cancelled) return;
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setAvailablePromos(list);
      } catch (error) {
        console.error('Failed to fetch promos:', error);
        setAvailablePromos([]);
      } finally {
        setPromosLoading(false);
      }
    };
    loadPromos();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCloseBooking = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const [search] = useSearchParams();
  const preselectType = search.get('type');
  const preselectAttrId = search.get('attraction_id');
  const preselectComboId = search.get('combo_id');
  const preselectDate = search.get('date');
  const preselectSlot = search.get('slot');
  const preselectQty = search.get('qty');

  useEffect(() => {
    if (attractionsState.status === 'idle')
      dispatch(fetchAttractions({ active: true, limit: 100 }));
    if (combosState.status === 'idle') dispatch(fetchCombos({ active: true, limit: 100 }));
    if (addonsState.status === 'idle') dispatch(fetchAddons({ active: true, limit: 100 }));
  }, [dispatch, attractionsState.status, combosState.status, addonsState.status]);

  useEffect(() => {
    if (step === 3 && hasToken) dispatch(setStep(4));
  }, [step, hasToken, dispatch]);

  // Hide global footer while on booking page (restore on unmount)
  useEffect(() => {
    const footer = typeof document !== 'undefined' && document.querySelector('footer');
    const prevDisplay = footer ? footer.style.display : null;
    if (footer) footer.style.display = 'none';
    return () => {
      if (footer) footer.style.display = prevDisplay || '';
    };
  }, []);

  useEffect(() => {
    if (!preselectAttrId && !preselectComboId) dispatch(resetCart());
  }, [dispatch, preselectAttrId || '', preselectComboId || '']);

  // Apply pre-selection from query params
  useEffect(() => {
    const newSelection = {};

    if (preselectType) newSelection.itemType = preselectType;

    if (preselectAttrId) {
      const exists = (attractionsState.items || []).some(
        (a) => String(getAttrId(a)) === String(preselectAttrId),
      );
      if (exists) {
        newSelection.attractionId = String(preselectAttrId);
        if (!preselectType) newSelection.itemType = 'attraction';
      }
    }

    if (preselectComboId) {
      const existsC = (combosState.items || []).some(
        (c) => String(getComboId(c)) === String(preselectComboId),
      );
      if (existsC) {
        newSelection.comboId = String(preselectComboId);
        if (!preselectType) newSelection.itemType = 'combo';
      }
    }

    if (preselectDate) newSelection.date = preselectDate;
    if (preselectSlot) newSelection.slotKey = preselectSlot;
    if (preselectQty) newSelection.qty = Math.max(1, Number(preselectQty) || 1);

    if (Object.keys(newSelection).length > 0) {
      setSel((s) => ({ ...s, ...newSelection }));
      setDrawerOpen(true); // open details by default if deep-linked
    }
  }, [
    preselectType || '',
    preselectAttrId || '',
    preselectComboId || '',
    preselectDate || '',
    preselectSlot || '',
    preselectQty || '',
    attractionsState.items || [],
    combosState.items || [],
  ]);

  const fetchSlots = useCallback(async ({ itemType, attractionId, comboId, date }) => {
    if (!date) return;
    const key = itemType === 'combo' ? comboId : attractionId;
    if (!key) return;

    setSlots({ status: 'loading', items: [], error: null });
    try {
      if (itemType === 'combo') {
        const res = await api.get(endpoints.combos.slots(key), { params: { date: toYMD(date) } });
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setSlots({ status: 'succeeded', items: list, error: null });
      } else {
        const res = await api.get(endpoints.slots.list(), {
          params: { attraction_id: key, date: toYMD(date) },
        });
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setSlots({ status: 'succeeded', items: list, error: null });
      }
    } catch (err) {
      setSlots({
        status: 'failed',
        items: [],
        error: err?.message || 'Failed to load slots',
      });
    }
  }, []);

  useEffect(() => {
    const itemType = sel.itemType;
    const date = sel.date;
    const attractionId = sel.attractionId;
    const comboId = sel.comboId;
    const key = itemType === 'combo' ? comboId : attractionId;
    if (key && date) {
      setSel((s) => ({ ...s, slotKey: sel.slotKey || '' }));
      fetchSlots({ itemType, attractionId, comboId, date });
    } else {
      setSlots({ status: 'idle', items: [], error: null });
    }
  }, [sel.itemType || '', sel.attractionId || '', sel.comboId || '', sel.date || '', fetchSlots]); // eslint-disable-line

  const selectedAttraction = useMemo(
    () =>
      sel.itemType === 'attraction'
        ? attractions.find((a) => String(getAttrId(a)) === String(sel.attractionId))
        : null,
    [attractions || [], sel.itemType || '', sel.attractionId || ''],
  );
  const selectedCombo = useMemo(
    () =>
      sel.itemType === 'combo'
        ? combos.find((c) => String(getComboId(c)) === String(sel.comboId))
        : null,
    [combos || [], sel.itemType || '', sel.comboId || ''],
  );

  const selectedSlot = useMemo(() => {
    for (let i = 0; i < slots.items.length; i += 1) {
      const s = slots.items[i];
      if (getSlotKey(s, i) === sel.slotKey) return s;
      // Also allow matching by raw slot id if deep-linked
      const candidates = [s?.slot_id, s?.id, s?._id, s?.combo_slot_id].filter(Boolean);
      if (sel.slotKey && candidates.map(String).includes(String(sel.slotKey))) return s;
    }
    return null;
  }, [slots.items, sel.slotKey]);

  const selectedMeta = useMemo(() => {
    if (sel.itemType === 'combo' && selectedCombo) {
      const fallbackPrice = toAmount(getComboDisplayPrice(selectedCombo));
      const fallbackBasePrice = toAmount(getBasePrice(selectedCombo) || fallbackPrice);
      const slotPricing = selectedSlot?.pricing || {};
      const slotOffer = selectedSlot?.offer || null;

      const preOfferBase = selectedSlot
        ? getSlotBasePrice(selectedSlot, fallbackBasePrice)
        : fallbackBasePrice;
      const preOfferUnit = selectedSlot
        ? getSlotUnitPrice(selectedSlot, fallbackPrice)
        : fallbackPrice;

      let originalPrice = toAmount(slotPricing.base_price ?? preOfferBase);
      let finalPrice = toAmount(slotPricing.final_price ?? preOfferUnit);
      if (!originalPrice) originalPrice = preOfferBase;
      if (!finalPrice) finalPrice = preOfferUnit;

      const selectedDate = toYMD(sel.date);
      const itemId = getComboId(selectedCombo);

      let appliedOffer = slotOffer || null;
      if (!appliedOffer) {
        appliedOffer = state.offers.find(
          (offer) =>
            (offer.rule_type === 'happy_hour' ||
              offer.rule_type === 'holiday' ||
              offer.rule_type === 'special') &&
            isHappyHourApplicable(offer, selectedDate, selectedSlot, 'combo', itemId),
        );
        if (appliedOffer) {
          const discount = computeOfferDiscount(appliedOffer, originalPrice || finalPrice);
          finalPrice = Math.max(0, (originalPrice || finalPrice) - discount);
        }
      }

      return {
        title: getComboLabel(selectedCombo, getComboId(selectedCombo)),
        price: finalPrice,
        originalPrice: originalPrice || finalPrice,
        happyHourOffer: appliedOffer,
        offerDescription: appliedOffer?.description || '',
        image: getComboPrimaryImage(selectedCombo),
        previewImages: getComboPreviewImages(selectedCombo),
      };
    }

    if (sel.itemType === 'attraction' && selectedAttraction) {
      const fallbackPrice = toAmount(
        getPrice(selectedAttraction) ||
          selectedAttraction?.price ||
          selectedAttraction?.base_price ||
          selectedAttraction?.amount ||
          0,
      );
      const fallbackBasePrice = toAmount(getBasePrice(selectedAttraction) || fallbackPrice);
      const slotPricing = selectedSlot?.pricing || {};
      const slotOffer = selectedSlot?.offer || null;

      const preOfferBase = selectedSlot
        ? getSlotBasePrice(selectedSlot, fallbackBasePrice)
        : fallbackBasePrice;
      const preOfferUnit = selectedSlot
        ? getSlotUnitPrice(selectedSlot, fallbackPrice)
        : fallbackPrice;

      let originalPrice = toAmount(slotPricing.base_price ?? preOfferBase);
      let finalPrice = toAmount(slotPricing.final_price ?? preOfferUnit);
      if (!originalPrice) originalPrice = preOfferBase;
      if (!finalPrice) finalPrice = preOfferUnit;

      const selectedDate = toYMD(sel.date);
      const itemId = getAttrId(selectedAttraction);

      let appliedOffer = slotOffer || null;
      if (!appliedOffer) {
        appliedOffer = state.offers.find(
          (offer) =>
            (offer.rule_type === 'happy_hour' ||
              offer.rule_type === 'holiday' ||
              offer.rule_type === 'special') &&
            isHappyHourApplicable(offer, selectedDate, selectedSlot, 'attraction', itemId),
        );
        if (appliedOffer) {
          const discount = computeOfferDiscount(appliedOffer, originalPrice || finalPrice);
          finalPrice = Math.max(0, (originalPrice || finalPrice) - discount);
        }
      }

      return {
        title:
          selectedAttraction?.name ||
          selectedAttraction?.title ||
          `Attraction #${getAttrId(selectedAttraction)}`,
        price: finalPrice,
        originalPrice: originalPrice || finalPrice,
        happyHourOffer: appliedOffer,
        offerDescription: appliedOffer?.description || '',
        image: getAttractionImage(selectedAttraction),
      };
    }

    return { title: '', price: 0, originalPrice: 0, offerDescription: '' };
  }, [
    sel.itemType || '',
    selectedCombo || null,
    selectedAttraction || null,
    selectedSlot || null,
    sel.date || '',
    state.offers || [],
  ]);

  const qty = Math.max(1, Number(sel.qty) || 1);
  const ticketsSubtotal = Number(selectedMeta.price || 0) * qty;
  const selectionReady = Boolean(selectedMeta.title && sel.date && sel.slotKey && qty);

  const cartTicketsTotal = useMemo(
    () =>
      cartItems.reduce(
        (acc, item) => acc + Number(item.unitPrice || 0) * Number(item.quantity || 0),
        0,
      ),
    [cartItems || []],
  );

  const totalAddonsCost = useMemo(() => {
    let total = 0;
    cartAddons.forEach((itemAddonsMap, itemKey) => {
      const itemExists = cartItems.find((i) => i.key === itemKey);
      if (itemExists) {
        itemAddonsMap.forEach((addon) => {
          total += Number(addon.price || 0) * Number(addon.quantity || 0);
        });
      }
    });
    return total;
  }, [cartAddons || new Map(), cartItems || []]);

  const grossTotal = cartTicketsTotal + totalAddonsCost;
  const couponDiscount = Number(coupon.discount || 0);
  const couponApplied = couponDiscount > 0 && (coupon.code || coupon.data?.code);
  const finalTotal = Math.max(0, grossTotal - couponDiscount);

  const heroImage =
    selectedMeta.image ||
    getAttractionImage(attractions[0]) ||
    getComboPrimaryImage(combos[0]) ||
    'https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&cs=tinysrgb&w=1200';

  const currentItemAddons = useMemo(() => {
    if (!activeItemKey) return new Map();
    return cartAddons.get(activeItemKey) || new Map();
  }, [cartAddons, activeItemKey]);

  const addSelectionToCart = useCallback(() => {
    if (!selectionReady) return false;

    const item_type = sel.itemType === 'combo' ? 'Combo' : 'Attraction';
    const slotId =
      sel.itemType === 'combo'
        ? selectedSlot?.combo_slot_id ?? selectedSlot?.id ?? selectedSlot?._id ?? null
        : selectedSlot?.slot_id ?? selectedSlot?.id ?? selectedSlot?._id ?? null;

    const appliedSlotOffer = selectedSlot?.offer || selectedMeta.happyHourOffer || null;
    const payload = {
      key: editingKey || makeLocalCartKey(),
      merge: false,
      item_type,
      title: selectedMeta.title,
      slotLabel: selectedSlot ? getSlotLabel(selectedSlot) : '',
      quantity: qty,
      booking_date: toYMD(sel.date),
      booking_time:
        selectedSlot?.start_time || selectedSlot?.startTime || selectedSlot?.slot_start_time || null,
      unitPrice: selectedMeta.price || 0,
      dateLabel: toYMD(sel.date),
      slot_id: item_type === 'Attraction' ? slotId : null,
      combo_slot_id: item_type === 'Combo' ? slotId : null,
      attraction_id: item_type === 'Attraction' ? getAttrId(selectedAttraction) : null,
      combo_id: item_type === 'Combo' ? getComboId(selectedCombo) : null,
      slot: selectedSlot || null,
      attraction: selectedAttraction || null,
      combo: selectedCombo || null,
      pricing: selectedSlot?.pricing || null,
      originalPrice: selectedMeta.originalPrice || null,
      offer: appliedSlotOffer,
      offerDescription: selectedMeta.offerDescription || appliedSlotOffer?.description || '',
    };

    if (editingKey) dispatch(removeCartItem(editingKey));
    dispatch(addCartItem(payload));
    dispatch(setActiveCartItem(payload.key));

    setEditingKey(null);
    setSel(createDefaultSelection());

    setCartAddons((prev) => {
      const next = new Map(prev);
      if (!next.has(payload.key)) next.set(payload.key, new Map());
      return next;
    });
    return true;
  }, [
    selectionReady,
    sel || {},
    selectedMeta || {},
    selectedSlot || null,
    selectedAttraction || null,
    selectedCombo || null,
    qty || 1,
    editingKey || null,
    dispatch,
  ]);

  const handleDirectBuy = useCallback(() => {
    if (!selectionReady) {
      alert('Please select a date, a time slot, and quantity first.');
      return;
    }
    const added = addSelectionToCart();
    if (added) {
      // Take user to extras step so they can choose add-ons before checkout
      dispatch(setStep(2));
    }
  }, [selectionReady, addSelectionToCart, dispatch, hasToken]);

  const handleNext = () => {
    if (step === 1) {
      if (hasCartItems) {
        dispatch(setStep(2));
      } else {
        if (!selectionReady) {
          alert('Please select date, time slot and quantity.');
          return;
        }
        const added = addSelectionToCart();
        if (added) dispatch(setStep(2));
      }
    } else if (step === 2) {
      dispatch(setStep(hasToken ? 4 : 3));
    } else if (step === 3) {
      if (otp.verified) dispatch(setStep(4));
      else alert('Please verify OTP to continue.');
    }
  };

  const handleBack = () => {
    if (step === 1) return;
    if (step === 2) dispatch(setStep(1));
    else if (step === 3) dispatch(setStep(2));
    else if (step === 4) dispatch(setStep(hasToken ? 2 : 3));
  };

  const handleAddonQuantityChange = (addonId, quantity, addon) => {
    setCartAddons((prev) => {
      const next = new Map(prev);
      const itemAddons = next.get(activeItemKey) || new Map();

      if (quantity <= 0) {
        itemAddons.delete(addonId);
      } else {
        itemAddons.set(addonId, {
          addon_id: addonId,
          name: getAddonName(addon),
          price: getAddonPrice(addon),
          quantity,
        });
      }

      next.set(activeItemKey, itemAddons);
      return next;
    });
  };

  const onPlaceOrderAndPay = async () => {
    if (creating?.status === 'loading') return; // prevent duplicate submits while processing
    if (!hasToken) {
      setShowTokenExpiredModal(true);
      return;
    }
    if (!hasCartItems) return;

    try {
      const couponCode = (coupon?.code || '').trim() || undefined;
      const offerId = selectedOfferId ? Number(selectedOfferId) : undefined;

      const bookingPayloads = cartItems.map((item) => {
        const isCombo = item.item_type === 'Combo';
        const itemAddonsMap = cartAddons.get(item.key);
        const addonsPayload = itemAddonsMap
          ? Array.from(itemAddonsMap.values())
              .filter((a) => Number(a.quantity) > 0)
              .map((a) => ({ addon_id: a.addon_id, quantity: Number(a.quantity) }))
          : [];

        return {
          item_type: isCombo ? 'Combo' : 'Attraction',
          combo_id: isCombo ? item.combo_id : undefined,
          combo_slot_id: isCombo ? item.combo_slot_id : undefined,
          attraction_id: !isCombo ? item.attraction_id : undefined,
          slot_id: !isCombo ? item.slot_id : undefined,
          booking_date: item.booking_date,
          quantity: item.quantity,
          addons: addonsPayload,
          coupon_code: couponCode,
          offer_id: offerId,
        };
      });

      const created = await dispatch(createBooking(bookingPayloads)).unwrap();
      const orderId = created?.data?.order_id || created?.order_id;
      if (!orderId) throw new Error('Order ID missing');

      const email = (contact.email || auth?.user?.email || '').trim();
      const mobile = normalizePayphiMobile(contact.phone || auth?.user?.phone || '');

      const init = await dispatch(
        initiatePayPhi({ bookingId: orderId, email, mobile, amount: finalTotal }),
      ).unwrap();
      if (init?.redirectUrl) {
        window.location.assign(init.redirectUrl);
      } else {
        alert('Payment initiation failed.');
      }
    } catch (err) {
      if (err?.status === 401 || err?.response?.status === 401) {
        setShowTokenExpiredModal(true);
      } else {
        alert(`Payment failed: ${err.message}`);
      }
    }
  };

  const onRemoveCartItem = (key) => {
    dispatch(removeCartItem(key));
    setCartAddons((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
    if (editingKey === key) {
      setEditingKey(null);
      setSel(createDefaultSelection());
    }
  };

  const onEditCartItem = (item) => {
    const itemType = item.item_type === 'Combo' ? 'combo' : 'attraction';
    setSel({
      itemType,
      attractionId: item.attraction_id ? String(item.attraction_id) : '',
      comboId: item.combo_id ? String(item.combo_id) : '',
      date: item.booking_date || todayYMD(),
      slotKey: '',
      qty: Number(item.quantity || 1),
    });
    setEditingKey(item.key);
    dispatch(setActiveCartItem(item.key));
    dispatch(setStep(1));
    setDrawerOpen(true);
  };

  /* AUTH handlers */
  const handlePhoneChange = (e) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, '').slice(0, 10);
    setPhoneLocal(digits);
    if (digits.length === 10) {
      setContactErrors((prev) => ({ ...prev, phone: undefined }));
      dispatch(setContact({ phone: `${countryCode}${digits}` }));
    }
  };

  const sendOTP = async () => {
    const errors = {};
    const email = (contact.email || '').trim();
    if (!EMAIL_REGEX.test(email)) errors.email = 'Please enter a valid email address';
    if (phoneLocal.length !== 10) errors.phone = 'Phone number must be exactly 10 digits';

    if (Object.keys(errors).length > 0) {
      setContactErrors(errors);
      return;
    }

    setContactErrors({});
    const fullPhone = `${countryCode}${phoneLocal}`;
    dispatch(setContact({ email, phone: fullPhone }));

    try {
      await dispatch(sendAuthOtp({ email, phone: fullPhone })).unwrap();
    } catch (e) {
      alert(e?.message || 'Failed to send OTP');
    }
  };

  const verifyOTP = async () => {
    if (!otpCode || otpCode.length < 4) return alert('Enter the full OTP code');
    await dispatch(verifyAuthOtp({ otp: otpCode }))
      .unwrap()
      .then(() => dispatch(setStep(3)))
      .catch((e) => alert(e?.message || 'OTP verification failed'));
  };

  const applyPromo = async () => {
    if (!promoInput) return;
    await dispatch(
      applyCoupon({
        code: promoInput,
        total_amount: Math.max(0, grossTotal),
        onDate: sel.date || toYMD(new Date()),
      }),
    )
      .unwrap()
      .then(() => dispatch(setCouponCode(promoInput)))
      .catch(() => {});
  };

  const ProgressBar = () => (
    <div className="flex items-center justify-between mb-4 md:mb-6 px-4">
      {[
        { n: 1, l: 'Select', icon: ShoppingBag },
        { n: 2, l: 'Extras', icon: Ticket },
        { n: 3, l: 'Verify', icon: Clock },
        { n: 4, l: 'Pay', icon: Check },
      ].map((s) => {
        if (hasToken && s.n === 3) return null;
        const isCompleted = step > s.n || (hasToken && s.n === 3);
        const isCurrent = step === s.n;
        const showCheck = isCompleted || (hasToken && s.n === 3);
        const IconComponent = s.icon;

        return (
          <div key={s.n} className="flex flex-col items-center relative z-10 group">
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2 shadow-sm ${
                isCurrent
                  ? 'bg-gradient-to-br from-sky-600 to-sky-700 border-sky-600 text-white scale-110 ring-4 ring-sky-100'
                  : showCheck
                  ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 border-emerald-600 text-white shadow-md'
                  : 'bg-white border-gray-200 text-gray-300 shadow-sm'
              }`}
            >
              {showCheck && !isCurrent ? (
                <Check size={18} strokeWidth={3} />
              ) : (
                <IconComponent size={18} />
              )}
            </div>
            <span
              className={`text-[10px] mt-2 font-bold uppercase tracking-widest ${
                isCurrent
                  ? 'text-sky-600'
                  : showCheck
                  ? 'text-emerald-600'
                  : 'text-gray-400'
              }`}
            >
              {s.l}
            </span>
          </div>
        );
      })}
      <div className="absolute left-8 right-8 top-[22px] h-[3px] bg-gradient-to-r from-sky-100 to-sky-200 -z-0 overflow-hidden rounded-full">
        <div
          className="h-full bg-gradient-to-r from-sky-600 to-sky-500 transition-all duration-500 ease-out shadow-sm"
          style={{ width: `${((step - 1) / (hasToken ? 2 : 3)) * 100}%` }}
        />
      </div>
    </div>
  );

  /* Product list with images */
  const ProductList = () => {
    const activeTab = sel.itemType;
    const data = activeTab === 'attraction' ? attractions : combos;

    return (
      <div className="space-y-4">
        {/* Toggle */}
        <div className="mb-2">
          <div className="bg-sky-50 p-1 rounded-xl inline-flex border border-sky-100">
            {['attraction', 'combo'].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setSel((prev) => ({
                    ...prev,
                    itemType: t,
                    attractionId: '',
                    comboId: '',
                    slotKey: '',
                  }));
                }}
                className={`px-6 py-2 text-sm font-semibold rounded-lg capitalize transition-all duration-200 ${
                  sel.itemType === t
                    ? 'bg-white text-sky-700 shadow-sm ring-1 ring-black/5'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t === 'attraction' ? 'Attractions' : 'Combos'}
              </button>
            ))}
          </div>
        </div>

        {data.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
            {sel.itemType === 'combo' ? 'No combos available' : 'No attractions available'}
          </div>
        ) : (
          data.map((item) => {
            const id =
              sel.itemType === 'attraction' ? getAttrId(item) : getComboId(item);
            const isSelected =
              String(sel.itemType === 'attraction' ? sel.attractionId : sel.comboId) ===
              String(id);

            const basePrice =
              sel.itemType === 'combo'
                ? Number(getComboDisplayPrice(item) || 0)
                : Number(
                    getPrice(item) ||
                      item.price ||
                      item.base_price ||
                      item.amount ||
                      0,
                  );

            const title =
              sel.itemType === 'attraction'
                ? item.title || item.name
                : getComboLabel(item);

            const image =
              sel.itemType === 'combo' ? getComboPrimaryImage(item) : getAttractionImage(item);

            const onSelect = () => {
              const isCombo = sel.itemType === 'combo';
              const existing = cartItems.find((ci) =>
                isCombo
                  ? ci.item_type === 'Combo' && idsMatch(ci.combo_id, id)
                  : (ci.item_type === 'Attraction' || ci.item_type === undefined) && idsMatch(ci.attraction_id, id),
              );
              if (existing) {
                onEditCartItem(existing);
                return;
              }

              setSel((prev) => ({
                ...prev,
                itemType: sel.itemType,
                attractionId: sel.itemType === 'attraction' ? String(id) : '',
                comboId: sel.itemType === 'combo' ? String(id) : '',
                slotKey: '',
              }));
              setDrawerMode('booking');
              setDrawerOpen(true);
            };

            return (
              <div
                key={id}
                className={`bg-white rounded-3xl shadow-sm border px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4 transition-all ${
                  isSelected
                    ? 'border-sky-400 shadow-md'
                    : 'border-gray-100 hover:border-sky-200'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border border-gray-100 bg-sky-50 shrink-0">
                    {image ? (
                      <img src={image} alt={title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sky-400">
                        <ShoppingBag />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 truncate">
                      {title}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Great for families • Flexible slots • Instant confirmation
                    </p>
                            <button
                              type="button"
                              onClick={() => {
                                setSel((prev) => ({
                                  ...prev,
                                  itemType: sel.itemType,
                                  attractionId: sel.itemType === 'attraction' ? String(id) : '',
                                  comboId: sel.itemType === 'combo' ? String(id) : '',
                                  slotKey: '',
                                }));
                                setDetailsMainImage(image || null);
                                setDrawerMode('details');
                                setDrawerOpen(true);
                              }}
                      className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-sky-700 hover:text-sky-900 mt-2"
                    >
                      View details
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 sm:gap-3">
                  <div className="text-right text-xs text-gray-500 uppercase tracking-wide">
                    From
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg sm:text-xl font-bold text-sky-700 tabular-nums">
                      ₹{basePrice || 0}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onSelect}
                    className={`px-6 py-2.5 sm:py-3 rounded-full text-white text-sm font-semibold shadow-md active:scale-[0.98] transition-all ${
                      isSelected
                        ? 'bg-sky-700'
                        : 'bg-sky-600 hover:bg-sky-700'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  const OfferSelector = () => {
    if (state.loadingOffers) {
      return (
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm text-sm text-gray-500">
          Loading offers...
        </div>
      );
    }
    if (!state.offers.length) return null;

    return (
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-800">Available Offers</h4>
          {selectedOfferId && (
            <button
              type="button"
              onClick={() => setSelectedOfferId('')}
              className="text-xs font-medium text-sky-700 hover:underline"
            >
              Remove
            </button>
          )}
        </div>
        <div className="space-y-3">
          {state.offers.map((offer) => {
            const id = String(getOfferId(offer));
            if (!id) return null;
            const preview = previewOfferForSelection(offer, selectedMeta.price || 0, qty);
            return (
              <label
                key={`offer-${id}`}
                className={`flex items-start gap-3 rounded-2xl border px-3 py-3 cursor-pointer transition-all duration-200 ${
                  String(selectedOfferId) === id
                    ? 'border-sky-500 bg-sky-50 shadow-sm'
                    : 'hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="selected-offer"
                  className="mt-1"
                  checked={String(selectedOfferId) === id}
                  onChange={() => setSelectedOfferId(id)}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {getOfferTitle(offer)}
                      </p>
                      {getOfferSummary(offer) ? (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {getOfferSummary(offer)}
                        </p>
                      ) : null}
                    </div>
                    <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-1 rounded-full">
                      {preview ? `Save ₹${preview.totalDiscount.toFixed(0)}` : 'No discount'}
                    </span>
                  </div>
                  {preview && preview.totalDiscount > 0 && (
                    <p className="text-xs text-emerald-600 mt-1">
                      Save up to ₹{preview.totalDiscount.toFixed(0)} with this offer
                    </p>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  const handleToday = () => {
    setSel((s) => ({ ...s, date: todayYMD(), slotKey: '' }));
  };
  const handleTomorrow = () => {
    setSel((s) => ({
      ...s,
      date: dayjs().add(1, 'day').format('YYYY-MM-DD'),
      slotKey: '',
    }));
  };

  const onOpenDrawerForSelected = () => {
    if (!selectedMeta.title) return;
    setDrawerOpen(true);
  };

  return (
    <>
      {/* Page wrapper: make sure everything sits under navbar; ensure Inter font */}
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white font-inter">
        {/* hero */}
        <div className="max-w-6xl mx-auto pt-20 md:pt-24 px-3 lg:px-0">
          <div className="rounded-3xl overflow-hidden shadow-xl bg-sky-100">
            <img src={heroImage} alt={selectedMeta.title || 'Experience'} className="w-full h-56 sm:h-72 lg:h-80 object-cover" />
          </div>
        </div>

        {/* steps / body */}
        <div className="max-w-6xl mx-auto px-3 lg:px-0 pb-24 lg:pb-20">
          {/* header + steps */}
          <div className="mt-4 md:mt-6 bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-sky-100">
            <div className="px-4 md:px-6 pt-3 md:pt-4 pb-2 md:pb-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg md:text-xl font-bold text-gray-900">
                {step === 1
                  ? 'Select tickets'
                  : step === 2
                  ? 'Customize Add-ons'
                  : step === 3
                  ? 'Verify OTP'
                  : 'Checkout'}
              </h2>
              <button
                onClick={handleCloseBooking}
                className="p-2 hover:bg-sky-50 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={22} />
              </button>
            </div>
            <div className="relative pb-3">
              <ProgressBar />
            </div>
          </div>

          {/* main content */}
          <div className="mt-4 md:mt-6">
            {/* STEP 1: product list + order summary */}
            {step === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2.1fr)_minmax(320px,1fr)] gap-6 items-start">
                {/* left: product list */}
                <div className="space-y-4">
                  {/* quick date row */}
                  <div className="flex flex-wrap gap-2 items-center mb-1">
                    <button
                      type="button"
                      onClick={handleToday}
                      className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium border transition-colors ${
                        sel.date === todayYMD()
                          ? 'bg-sky-600 text-white border-sky-600'
                          : 'bg-white text-gray-800 border-gray-200 hover:border-sky-300'
                      }`}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={handleTomorrow}
                      className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium border transition-colors ${
                        sel.date === dayjs().add(1, 'day').format('YYYY-MM-DD')
                          ? 'bg-sky-600 text-white border-sky-600'
                          : 'bg-white text-gray-800 border-gray-200 hover:border-sky-300'
                      }`}
                    >
                      Tomorrow
                    </button>
                    <button
                      type="button"
                      onClick={onOpenDrawerForSelected}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium bg-white text-gray-800 border border-gray-200 hover:border-sky-300"
                    >
                      <Calendar size={14} className="text-gray-500" />
                      <span>
                        {sel.date ? dayjs(sel.date).format('DD/MM/YYYY') : 'Choose Date'}
                      </span>
                    </button>
                    <span className="text-xs sm:text-sm text-gray-500 ml-1">
                      Change date/time in details panel
                    </span>
                  </div>

                  <ProductList />
                </div>

                {/* right: order details */}
                <div className="lg:sticky lg:top-28">
                  <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-5 sm:p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Order details
                    </h3>

                    {!hasCartItems ? (
                      <div className="flex flex-col items-center justify-center text-center py-8">
                        <div className="w-14 h-14 rounded-full bg-sky-50 flex items-center justify-center mb-3">
                          <ShoppingBag className="text-sky-600" />
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          The product you choose will be displayed here
                        </p>
                        <p className="text-xs text-gray-400">
                          Select a ticket and add to your order
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 mb-4 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                        {cartItems.map((item) => (
                          <div
                            key={item.key}
                            className="flex justify-between gap-3 text-sm border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 line-clamp-2">
                                {item.title ||
                                  item.meta?.title ||
                                  (item.item_type === 'combo'
                                    ? item.combo?.title ||
                                      item.combo?.name ||
                                      item.combo?.combo_name ||
                                      `Combo #${item.combo_id}`
                                    : item.attraction?.title ||
                                      item.attraction?.name ||
                                      `Attraction #${item.attraction_id}`)}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {item.quantity} ticket(s) •{' '}
                                {item.dateLabel ||
                                  dayjs(item.booking_date).format('DD MMM YYYY') ||
                                  item.booking_date}
                                {item.slotLabel ? ` • ${item.slotLabel}` : ''}
                              </div>
                              <div className="flex gap-3 mt-1">
                                <button
                                  type="button"
                                  onClick={() => onEditCartItem(item)}
                                  className="text-[11px] text-sky-700 hover:underline"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onRemoveCartItem(item.key)}
                                  className="text-[11px] text-red-500 hover:underline"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-gray-900 tabular-nums">
                                ₹{(item.unitPrice * item.quantity).toFixed(0)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-3 border-t border-gray-100 mt-2">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-500">Total amount</span>
                        <span className="text-lg font-semibold text-sky-700 tabular-nums">
                          ₹{finalTotal.toFixed(0)}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={!hasCartItems}
                        onClick={handleNext}
                        className={`w-full flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all ${
                          !hasCartItems
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-sky-600 text-white shadow-md hover:bg-sky-700 active:scale-[0.98]'
                        }`}
                      >
                        <span>Continue</span>
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Add-ons */}
            {step === 2 && (
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2.1fr)_minmax(320px,1fr)] gap-6 items-start mt-4">
                <div className="space-y-6">
                  {cartItems.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                      {cartItems.map((item) => (
                        <button
                          key={item.key}
                          onClick={() => dispatch(setActiveCartItem(item.key))}
                          className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                            item.key === activeItemKey
                              ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-sky-200'
                          }`}
                        >
                          {item.title ||
                            item.meta?.title ||
                            (item.item_type === 'combo'
                              ? item.combo?.title ||
                                item.combo?.name ||
                                item.combo?.combo_name ||
                                `Combo #${item.combo_id}`
                              : item.attraction?.title ||
                                item.attraction?.name ||
                                `Attraction #${item.attraction_id}`) ||
                            'Item'}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Add-ons
                        </p>
                        <p className="text-sm text-gray-500">
                          Enhance your experience with optional extras
                        </p>
                      </div>
                      <button
                        onClick={() => dispatch(fetchAddons({ active: true, limit: 100 }))}
                        className="text-xs font-semibold text-sky-700 hover:underline"
                      >
                        Refresh
                      </button>
                    </div>

                    {addonsState.status === 'loading' ? (
                      <div className="text-center py-10 text-gray-500 text-sm">
                        Loading add-ons...
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {(addonsState.items || []).map((addon) => {
                          const addonId = getAddonId(addon);
                          const price = getAddonPrice(addon);
                          const name = getAddonName(addon);
                          const image = getAddonImage(addon);
                          const quantity = Number(currentItemAddons.get(addonId)?.quantity || 0);

                          return (
                            <div
                              key={addonId}
                              className="flex gap-4 items-center border border-gray-200 rounded-2xl p-4 hover:border-sky-200 transition-all"
                            >
                              {image ? (
                                <img
                                  src={image}
                                  alt={name}
                                  className="w-16 h-16 rounded-xl object-cover border border-gray-100"
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                                  <ShoppingBag />
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 truncate">
                                  {name}
                                </div>
                                <div className="text-sm text-gray-500 tabular-nums">
                                  {formatCurrency(price)}
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() =>
                                    handleAddonQuantityChange(
                                      addonId,
                                      Math.max(0, quantity - 1),
                                      addon,
                                    )
                                  }
                                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:border-sky-200 active:scale-95 transition"
                                >
                                  <Minus size={16} />
                                </button>
                                <span className="w-6 text-center font-semibold text-gray-800 tabular-nums">
                                  {quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    handleAddonQuantityChange(addonId, quantity + 1, addon)
                                  }
                                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:border-sky-200 active:scale-95 bg-sky-600 text-white shadow"
                                >
                                  <Plus size={16} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: order details (same as STEP 1) */}
                <div className="lg:sticky lg:top-28">
                  <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-5 sm:p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Order details</h3>

                    {!hasCartItems ? (
                      <div className="flex flex-col items-center justify-center text-center py-8">
                        <div className="w-14 h-14 rounded-full bg-sky-50 flex items-center justify-center mb-3">
                          <ShoppingBag className="text-sky-600" />
                        </div>
                        <p className="text-sm text-gray-600 mb-1">The product you choose will be displayed here</p>
                        <p className="text-xs text-gray-400">Select a ticket and add to your order</p>
                      </div>
                    ) : (
                      <div className="space-y-3 mb-4 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                        {cartItems.map((item) => {
                          const itemAddonsMap = cartAddons.get(item.key) || new Map();
                          const itemAddons = Array.from(itemAddonsMap.values()).filter((a) => Number(a.quantity) > 0);
                          return (
                            <div
                              key={item.key}
                              className="flex justify-between gap-3 text-sm border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                            >
                              <div className="min-w-0">
                                <div className="font-semibold text-gray-900 line-clamp-2">
                                  {item.title || item.meta?.title || (item.item_type === 'combo'
                                    ? item.combo?.title || item.combo?.name || item.combo?.combo_name || `Combo #${item.combo_id}`
                                    : item.attraction?.title || item.attraction?.name || `Attraction #${item.attraction_id}`)}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {item.quantity} ticket(s) • {item.dateLabel || dayjs(item.booking_date).format('DD MMM YYYY') || item.booking_date}{item.slotLabel ? ` • ${item.slotLabel}` : ''}
                                </div>

                                <div className="flex gap-3 mt-1">
                                  <button type="button" onClick={() => onEditCartItem(item)} className="text-[11px] text-sky-700 hover:underline">Edit</button>
                                  <button type="button" onClick={() => onRemoveCartItem(item.key)} className="text-[11px] text-red-500 hover:underline">Remove</button>
                                </div>

                                {itemAddons.length > 0 && (
                                  <div className="mt-2 text-xs text-gray-600">
                                    <div className="font-medium text-gray-700 mb-1">Extras</div>
                                    <div className="space-y-1">
                                      {itemAddons.map((a) => (
                                        <div key={a.addon_id} className="flex items-center justify-between text-sm text-gray-600">
                                          <div className="truncate">
                                            {a.name} <span className="text-xs text-gray-400">x{a.quantity}</span>
                                          </div>
                                          <div className="tabular-nums">₹{(Number(a.price || 0) * Number(a.quantity || 0)).toFixed(0)}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-gray-900 tabular-nums">₹{(item.unitPrice * item.quantity).toFixed(0)}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="pt-3 border-t border-gray-100 mt-2">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-500">Total amount</span>
                        <span className="text-lg font-semibold text-sky-700 tabular-nums">₹{finalTotal.toFixed(0)}</span>
                      </div>
                      <button
                        type="button"
                        disabled={!hasCartItems}
                        onClick={handleNext}
                        className={`w-full flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all ${
                          !hasCartItems
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-sky-600 text-white shadow-md hover:bg-sky-700 active:scale-[0.98]'
                        }`}
                      >
                        <span>Continue</span>
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: OTP */}
            {step === 3 && !hasToken && (
              <div className="space-y-6 max-w-md mx-auto animate-in fade-in slide-in-from-right-8 duration-300 mt-4">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-sky-50 text-sky-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserPlus size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Guest Details</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    Enter your details to receive tickets via Email & SMS.
                  </p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                      Full Name
                    </label>
                    <div className="relative group">
                      <User
                        className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-sky-600 transition-colors"
                        size={18}
                      />
                      <input
                        placeholder="John Doe"
                        className="w-full pl-11 p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:bg-white outline-none transition-all font-medium"
                        value={contact.name}
                        onChange={(e) => dispatch(setContact({ name: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                      Email Address
                    </label>
                    <div className="relative group">
                      <Mail
                        className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-sky-600 transition-colors"
                        size={18}
                      />
                      <input
                        placeholder="name@example.com"
                        type="email"
                        className={`w-full pl-11 p-3.5 bg-gray-50 border rounded-xl focus:ring-2 focus:bg-white outline-none transition-all font-medium ${
                          contactErrors.email
                            ? 'border-red-300 focus:ring-red-200'
                            : 'border-gray-200 focus:ring-sky-500'
                        }`}
                        value={contact.email}
                        onChange={(e) => {
                          dispatch(setContact({ email: e.target.value }));
                          if (contactErrors.email)
                            setContactErrors((p) => ({ ...p, email: undefined }));
                        }}
                      />
                    </div>
                    {contactErrors.email && (
                      <p className="text-xs text-red-500 ml-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {contactErrors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                      Mobile Number
                    </label>
                    <div className="flex gap-3">
                      <div className="relative w-32">
                        <div className="absolute left-3 top-3.5 z-10 pointer-events-none">
                          <Globe size={18} className="text-gray-400" />
                        </div>
                        <select
                          className="w-full pl-10 pr-8 p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none appearance-none font-medium text-sm"
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                        >
                          {COUNTRY_CODES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.code}
                            </option>
                          ))}
                        </select>
                        <ChevronRight
                          size={14}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none"
                        />
                      </div>

                      <div className="relative flex-1 group">
                        <Phone
                          className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-sky-600 transition-colors"
                          size={18}
                        />
                        <input
                          placeholder="98765 43210"
                          type="tel"
                          maxLength={10}
                          className={`w-full pl-11 p-3.5 bg-gray-50 border rounded-xl focus:ring-2 focus:bg-white outline-none transition-all font-medium tracking-wide ${
                            contactErrors.phone
                              ? 'border-red-300 focus:ring-red-200'
                              : 'border-gray-200 focus:ring-sky-500'
                          }`}
                          value={phoneLocal}
                          onChange={handlePhoneChange}
                        />
                      </div>
                    </div>
                    {contactErrors.phone && (
                      <p className="text-xs text-red-500 ml-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {contactErrors.phone}
                      </p>
                    )}
                  </div>

                  {!otp.sent ? (
                    <button
                      onClick={sendOTP}
                      disabled={otp.status === 'loading'}
                      className="w-full bg-sky-700 text-white py-3 rounded-xl font-bold text-base shadow-lg hover:bg-sky-800 transition-all disabled:opacity-70 flex items-center justify-center gap-2 mt-4"
                    >
                      {otp.status === 'loading' ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        'Send OTP Verification'
                      )}
                    </button>
                  ) : (
                    <div className="mt-6 bg-sky-50 border border-sky-100 p-5 rounded-2xl animate-in fade-in slide-in-from-bottom-2">
                      <p className="text-sm text-sky-800 mb-3 font-medium">
                        Enter OTP sent to {countryCode} {phoneLocal}
                      </p>
                      <div className="flex gap-3 flex-col sm:flex-row">
                        <input
                          placeholder="XXXXXX"
                          className="flex-1 p-3.5 text-center tracking-[0.5em] font-bold text-xl border-2 border-sky-200 rounded-xl focus:border-sky-600 focus:ring-4 focus:ring-sky-100 outline-none bg-white transition-all"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                        />
                        <button
                          onClick={verifyOTP}
                          disabled={otp.status === 'loading'}
                          className="bg-sky-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 w-full sm:w-auto text-sm sm:text-base"
                        >
                          {otp.status === 'loading' ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Verifying...</span>
                            </>
                          ) : otp.verified ? (
                            <>
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Verified
                            </>
                          ) : (
                            'Verify'
                          )}
                        </button>
                      </div>
                      <button
                        onClick={sendOTP}
                        className="text-xs text-sky-700 font-medium mt-3 hover:underline"
                      >
                        Resend Code
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 4: Summary */}
            {step === 4 && (
              <div className="space-y-6 max-w-lg mx-auto animate-in fade-in slide-in-from-right-8 duration-300 mt-4 pb-20">
                <OfferSelector />
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
                    <ShoppingBag className="text-sky-600" size={20} />
                    Order Summary
                  </h3>
                  {couponApplied && (
                    <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-sm text-emerald-700">
                      <div className="font-semibold text-emerald-800">
                        Coupon {String(coupon.code || coupon.data?.code).toUpperCase()} applied
                      </div>
                      <div className="flex items-center justify-between mt-1 text-emerald-700">
                        <span>
                          {coupon.data?.description || 'Discount applied successfully'}
                        </span>
                        <span className="font-bold tabular-nums">
                          -₹{couponDiscount.toFixed(0)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="mb-4 space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                    {cartItems.map((item) => (
                      <div
                        key={item.key}
                        className="flex justify-between text-sm py-2 border-b border-dashed border-gray-100 last:border-0"
                      >
                        <div className="text-gray-700">
                          <span className="font-bold text-gray-900">{item.quantity}x</span>{' '}
                          {item.title ||
                            item.meta?.title ||
                            (item.item_type === 'combo'
                              ? item.combo?.title ||
                                item.combo?.name ||
                                item.combo?.combo_name ||
                                `Combo #${item.combo_id}`
                              : item.attraction?.title ||
                                item.attraction?.name ||
                                `Attraction #${item.attraction_id}`)}
                          <div className="text-xs text-gray-400">
                            {(item.dateLabel ||
                              dayjs(item.booking_date).format('DD MMM YYYY') ||
                              item.booking_date)}
                            {item.slotLabel ? ` • ${item.slotLabel}` : ''}
                          </div>
                        </div>
                        <div className="font-medium text-gray-900 tabular-nums">
                          ₹{item.unitPrice * item.quantity}
                        </div>
                      </div>
                    ))}
                    {totalAddonsCost > 0 && (
                      <div className="flex justify-between text-sm py-2 border-t border-gray-100 pt-3">
                        <div className="text-gray-600 font-medium">Extras / Add-ons</div>
                        <div className="font-medium text-gray-900 tabular-nums">₹{totalAddonsCost}</div>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-sm mt-2">
                    <div className="flex justify-between text-gray-500">
                      <span>Subtotal (with offers)</span> <span className="tabular-nums">₹{grossTotal}</span>
                    </div>
                    {couponDiscount > 0 && (
                      <div className="flex justify-between text-green-600 font-medium">
                        <span>
                          Coupon (
                          {String(coupon.code || coupon.data?.code).toUpperCase()})
                        </span>
                        <span className="tabular-nums">-₹{couponDiscount.toFixed(0)}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-3 flex justify-between items-center mt-2">
                      <span className="font-bold text-gray-800 text-lg">Total Payable</span>
                      <span className="font-bold text-2xl text-sky-700 tabular-nums">₹{finalTotal}</span>
                    </div>
                  </div>
                </div>

                {/* Swiggy-like coupon apply row */}
                <div className="space-y-3 border-t border-gray-200 pt-4">
                  {!couponApplied && (
                    <>
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Apply Promo Code</p>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Ticket size={18} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
                          <select
                            className="w-full pl-10 pr-20 p-3 border border-gray-200 rounded-xl text-sm uppercase focus:ring-2 focus:ring-sky-500 outline-none font-bold tracking-wider appearance-none bg-white cursor-pointer disabled:bg-gray-50 disabled:text-gray-400"
                            value={promoInput}
                            onChange={(e) => setPromoInput(e.target.value)}
                            disabled={promosLoading}
                          >
                            <option value="">
                              {promosLoading ? 'Loading promos...' : 'Select a promo code'}
                            </option>
                            {availablePromos.map((promo) => (
                              <option key={promo.id || promo.code} value={promo.code}>
                                {promo.code} {promo.discount ? `(${promo.discount}% off)` : ''}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={applyPromo}
                            disabled={!promoInput || promosLoading}
                            className="absolute right-1 top-1 bottom-1 px-4 rounded-lg bg-sky-600 text-white text-xs font-bold tracking-wide hover:bg-sky-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            APPLY
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* floating bottom action bar (not a footer; mobile-friendly cart CTA) */}
          {(step !== 1 || !isDesktop) && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 md:px-0 py-3 md:py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-30">
              <div className="max-w-6xl mx-auto flex gap-3 items-center">
                {!isDesktop && step > 1 && (
                  <button
                    onClick={handleBack}
                    className="md:hidden p-3 rounded-xl border border-gray-200 text-gray-700 hover:border-gray-300 active:scale-[0.95] transition-all flex items-center justify-center"
                    title="Go back"
                  >
                    <ArrowLeft size={20} />
                  </button>
                )}
                <div className={`flex-1 ${isDesktop ? 'hidden' : ''}`}>
                  <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                    Total
                  </div>
                  <div className="text-xl font-bold text-gray-900 tabular-nums">₹{finalTotal}</div>
                </div>
                {step > 1 && (
                  <button
                    onClick={handleBack}
                    className={`px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:border-gray-300 active:scale-[0.98] transition-all ${
                      isDesktop ? '' : 'hidden md:block'
                    }`}
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={step === 4 ? onPlaceOrderAndPay : handleNext}
                  disabled={
                    (step === 3 && !hasToken && !otp.verified) || (creating?.status === 'loading')
                  }
                  className={`flex-1 bg-gradient-to-r from-sky-600 to-sky-700 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed text-base md:text-lg ${
                    isDesktop ? '' : 'md:w-full'
                  }`}
                >
                  {step === 4 ? (
                    creating.status === 'loading' ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="relative">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <div className="absolute inset-0 w-5 h-5 border-2 border-transparent border-b-white/50 rounded-full animate-spin animation-delay-150"></div>
                        </div>
                        <span className="animate-pulse">Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 group">
                        <div className="p-1.5 bg-white/20 rounded-lg transition-all duration-300 group-hover:bg-white/30">
                          <Ticket size={18} className="text-white" />
                        </div>
                        <span className="font-semibold">Pay ₹{finalTotal}</span>
                        <div className="w-0 group-hover:w-5 overflow-hidden transition-all duration-300">
                          <ArrowRight size={16} className="text-white" />
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center justify-center gap-2 group">
                      <span className="font-semibold">Continue</span>
                      <ArrowRight size={20} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Details drawer: right on desktop, bottom-sheet on mobile */}
      {drawerOpen && selectedMeta.title && (
        <div className="fixed inset-0 z-50 flex justify-center sm:justify-end items-end sm:items-start bg-black/40 backdrop-blur-[2px]">
          <div className="flex-1 sm:hidden" onClick={() => setDrawerOpen(false)} />
          <div className="w-full sm:w-1/2 lg:w-[480px] max-w-full bg-white rounded-t-3xl sm:rounded-none sm:rounded-l-3xl shadow-2xl flex flex-col transform translate-y-0 sm:translate-x-0 transition-all h-full sm:h-screen sm:mt-0">
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 sm:px-6 pt-4 pb-2 border-b border-gray-100 bg-white rounded-t-3xl sm:rounded-none sm:rounded-tl-3xl">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 pr-3 truncate">
                {selectedMeta.title}
              </h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 flex-shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 py-4 space-y-4">
              {drawerMode === 'details' ? (
                <div className="space-y-4">
                  {(detailsMainImage || selectedMeta.image) && (
                    <div className="rounded-2xl overflow-hidden border border-gray-100">
                      <img
                        src={detailsMainImage || selectedMeta.image}
                        alt={selectedMeta.title}
                        className="w-full h-52 object-cover"
                      />
                    </div>
                  )}

                  {/* gallery thumbnails (combo previewImages or attraction media) */}
                  {(() => {
                    const gallery = sel.itemType === 'combo'
                      ? (selectedMeta.previewImages || [])
                      : (selectedAttraction?.media || []).map(resolveImageSource).filter(Boolean);
                    if (!gallery || !gallery.length) return null;
                    return (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {gallery.map((g, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setDetailsMainImage(g)}
                            className="w-24 h-16 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0"
                          >
                            <img src={g} alt={`thumb-${i}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    );
                  })()}

                  {/* description */}
                  <div className="text-sm text-gray-700">
                    {(() => {
                      const desc = sel.itemType === 'combo'
                        ? (selectedCombo?.description || selectedCombo?.short_description || selectedCombo?.summary || '')
                        : (selectedAttraction?.description || selectedAttraction?.short_description || selectedAttraction?.summary || selectedAttraction?.about || '');
                      return (desc || '').split('\n').map((line, i) => (
                        <p key={i} className="mb-2">{line}</p>
                      ));
                    })()}
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setDrawerMode('booking')}
                      className="w-full px-4 py-3 rounded-xl bg-sky-600 text-white font-semibold"
                    >
                      Book this
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* image */}
                  {selectedMeta.image && (
                    <div className="rounded-2xl overflow-hidden border border-gray-100">
                      <img
                        src={selectedMeta.image}
                        alt={selectedMeta.title}
                        className="w-full h-40 sm:h-52 object-cover"
                      />
                    </div>
                  )}

                  {/* date chips & custom date */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Date
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleToday}
                        className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium border transition-colors ${
                          sel.date === todayYMD()
                            ? 'bg-sky-600 text-white border-sky-600'
                            : 'bg-white text-gray-800 border-gray-200 hover:border-sky-300'
                        }`}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={handleTomorrow}
                        className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium border transition-colors ${
                          sel.date === dayjs().add(1, 'day').format('YYYY-MM-DD')
                            ? 'bg-sky-600 text-white border-sky-600'
                            : 'bg-white text-gray-800 border-gray-200 hover:border-sky-300'
                        }`}
                      >
                        Tomorrow
                      </button>
                      <div className="relative">
                        <div className="absolute left-3 top-2.5 pointer-events-none">
                          <Calendar size={14} className="text-gray-500" />
                        </div>
                        <input
                          type="date"
                          min={todayYMD()}
                          value={sel.date}
                          onChange={(e) =>
                            setSel((s) => ({ ...s, date: e.target.value, slotKey: '' }))
                          }
                          className="pl-8 pr-3 py-2 rounded-full text-xs sm:text-sm font-medium border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* slot select */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Time slot
                    </p>
                    <div className="relative">
                      <select
                        className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none text-sm font-medium appearance-none cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 transition-all hover:border-gray-300"
                        value={sel.slotKey}
                        onChange={(e) =>
                          setSel((st) => ({
                            ...st,
                            slotKey: e.target.value,
                          }))
                        }
                        disabled={!sel.attractionId && !sel.comboId}
                      >
                        <option value="">
                          {!sel.attractionId && !sel.comboId
                            ? 'Select a ticket above first'
                            : 'Select a time slot'}
                        </option>
                        {slots.items.map((s, i) => {
                          const sid = getSlotKey(s, i);
                          const hasCapacity = slotHasCapacity(s);
                          const isAvailable = isSlotAvailable(s, sel.date);
                          const isDisabled = !hasCapacity || !isAvailable;
                          return (
                            <option key={sid} value={sid} disabled={isDisabled}>
                              {getSlotLabel(s)} {!hasCapacity ? '(Full)' : !isAvailable ? '(Not Available)' : ''}
                            </option>
                          );
                        })}
                      </select>
                      <ChevronRight
                        size={16}
                        className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 rotate-90"
                      />
                    </div>
                  </div>

                  {/* quantity */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Quantity
                    </p>
                    <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-1.5 border border-gray-200 w-fit">
                      <button
                        onClick={() =>
                          setSel((s) => ({ ...s, qty: Math.max(1, s.qty - 1) }))
                        }
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-white text-gray-600 shadow-sm hover:text-sky-700 active:scale-95 transition"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="font-bold text-lg w-8 text-center text-gray-800 tabular-nums">
                        {sel.qty}
                      </span>
                      <button
                        onClick={() =>
                          setSel((s) => ({ ...s, qty: Math.max(1, s.qty + 1) }))
                        }
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-sky-600 text-white shadow-md hover:bg-sky-700 active:scale-95 transition"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* bottom: subtotal + buttons */}
            <div className="relative">
              <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-t from-white via-white/70 to-transparent pointer-events-none" />
              <div className="px-4 sm:px-6 py-3 border-t border-gray-100 bg-white flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">
                    Subtotal
                  </div>
                  <div className="text-lg font-bold text-sky-700 tabular-nums">
                    ₹{ticketsSubtotal.toFixed(0)}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={addSelectionToCart}
                    disabled={!selectionReady}
                    className="inline-flex items-center px-4 py-2 rounded-full border border-gray-200 text-xs font-semibold text-gray-700 hover:border-sky-300 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Add to order
                  </button>
                  <button
                    type="button"
                    onClick={handleDirectBuy}
                    disabled={!selectionReady}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-sky-600 text-white text-sm font-semibold shadow-md hover:bg-sky-700 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ShoppingBag size={18} />
                    <span>Buy now</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Token Expired Modal */}

      {showTokenExpiredModal && (
        <TokenExpiredModal
          onClose={() => setShowTokenExpiredModal(false)}
          onSignIn={() => {
            setShowTokenExpiredModal(false);
            dispatch(setStep(3));
          }}
          onContinueAsGuest={() => {
            setShowTokenExpiredModal(false);
            dispatch(setStep(3));
          }}
        />
      )}
    </>
  );
}