const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const selectFirstNumber = (values) => {
  for (const value of values) {
    if (value == null) continue;
    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }
  return 0;
};

const buildPriceCandidates = (obj, includeOffers = true) => {
  const items = [];
  if (includeOffers) {
    items.push(obj?.pricing?.offer_price, obj?.offer_price);
  }
  items.push(
    obj?.pricing?.final_price,
    obj?.sale_price,
    obj?.discount_price,
    obj?.price,
    obj?.base_price,
    obj?.combo_price,
    obj?.amount,
    obj?.starting_price,
    obj?.min_price,
    obj?.total_price
  );
  return items;
};

export const getPrice = (obj, options = {}) => {
  const includeOffers = options.includeOffers !== false;
  return selectFirstNumber(buildPriceCandidates(obj, includeOffers));
};

export const getBasePrice = (obj) =>
  toNumber(
    obj?.pricing?.base_price ??
    obj?.pricing?.mrp ??
    obj?.original_price ??
    obj?.price ??
    obj?.base_price ??
    obj?.amount ??
    obj?.starting_price ??
    obj?.min_price ??
    obj?.total_price ??
    0
  );

export const getSlotUnitPrice = (slot, fallback = 0) => {
  const resolvedFallback = toNumber(fallback, 0);
  if (!slot) return resolvedFallback;
  const offer = toNumber(
    slot?.pricing?.offer_price ??
    slot?.offer_price ??
    slot?.special_price ??
    slot?.discount_price ??
    slot?.final_price ??
    slot?.price ??
    slot?.amount ??
    resolvedFallback
  );
  if (offer > 0) return offer;
  return resolvedFallback;
};

export const getSlotBasePrice = (slot, fallback = 0) => {
  const resolvedFallback = toNumber(fallback, 0);
  if (!slot) return resolvedFallback;
  const base = toNumber(
    slot?.pricing?.base_price ??
    slot?.base_price ??
    slot?.mrp ??
    slot?.original_price ??
    slot?.list_price ??
    slot?.price ??
    slot?.amount ??
    resolvedFallback
  );
  if (base > 0) return base;
  return resolvedFallback;
};

export const getDiscountPercent = (obj) => {
  if (obj?.pricing?.discount_percent != null) {
    return toNumber(obj.pricing.discount_percent, 0);
  }
  const base = getBasePrice(obj);
  const price = getPrice(obj);
  if (!base || !price || price >= base) return 0;
  return Math.max(0, ((base - price) / base) * 100);
};

export const getUnitLabel = (obj) =>
  obj?.unit_label || obj?.price_unit || (obj?.type === 'combo' ? 'per combo' : 'per person');