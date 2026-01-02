const SORT_KEY_CANDIDATES = ['key', 'sort_key', 'order', 'order_key', 'priority', 'sequence', 'display_order'];

export const isSnowcityAttraction = (item) => {
  if (!item) return false;
  const name = String(item?.name ?? item?.title ?? '').toLowerCase();
  const slug = String(item?.slug ?? '').toLowerCase();
  const normalizedName = name.replace(/\s+/g, '');
  const normalizedSlug = slug.replace(/\s+/g, '');
  if (!normalizedName && !normalizedSlug) return false;
  return (
    normalizedName.includes('snowcity') ||
    normalizedName.includes('snowpark') ||
    slug.includes('snow city') ||
    slug.includes('snow park') ||
    normalizedSlug.includes('snow-city') ||
    normalizedSlug.includes('snow-park')
  );
};

const getNumericSortKey = (item) => {
  if (!item) return Number.MAX_SAFE_INTEGER;
  for (const key of SORT_KEY_CANDIDATES) {
    if (item[key] == null || item[key] === '') continue;
    const value = Number(item[key]);
    if (Number.isFinite(value)) return value;
  }
  return Number.MAX_SAFE_INTEGER;
};

const getTieBreaker = (item) => String(item?.name ?? item?.title ?? '').toLowerCase();

export const prioritizeSnowcityFirst = (items) => {
  if (!Array.isArray(items)) return [];
  return [...items].sort((a, b) => {
    const aIsSnow = isSnowcityAttraction(a);
    const bIsSnow = isSnowcityAttraction(b);
    if (aIsSnow && !bIsSnow) return -1;
    if (!aIsSnow && bIsSnow) return 1;

    const aKey = getNumericSortKey(a);
    const bKey = getNumericSortKey(b);
    if (aKey !== bKey) return aKey - bKey;

    return getTieBreaker(a).localeCompare(getTieBreaker(b));
  });
};
