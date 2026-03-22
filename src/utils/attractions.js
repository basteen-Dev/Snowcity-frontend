import dayjs from 'dayjs';

const SORT_KEY_CANDIDATES = ['key', 'sort_key', 'order', 'order_key', 'priority', 'sequence', 'display_order'];

export const getNextAvailableDate = (item) => {
  if (!item) return dayjs().format('YYYY-MM-DD');
  const dayRuleType = item.day_rule_type || 'all_days';
  const customDays = item.custom_days || [];
  
  let current = dayjs();
  // Check up to 30 days in the future to find a valid day
  for (let i = 0; i < 30; i++) {
    const dateStr = current.format('YYYY-MM-DD');
    const dayOfWeek = current.day(); // 0 (Sun) to 6 (Sat)
    let isBlocked = false;
    
    if (dayRuleType === 'weekends') {
      isBlocked = (dayOfWeek !== 0 && dayOfWeek !== 6);
    } else if (dayRuleType === 'weekdays') {
      isBlocked = (dayOfWeek === 0 || dayOfWeek === 6);
    } else if (dayRuleType === 'custom_days' && customDays.length > 0) {
      isBlocked = !customDays.includes(dayOfWeek);
    }
    
    if (!isBlocked) return dateStr;
    current = current.add(1, 'day');
  }
  return dayjs().format('YYYY-MM-DD'); // fallback
};

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
    const aName = String(a?.name ?? a?.title ?? '').toLowerCase();
    const bName = String(b?.name ?? b?.title ?? '').toLowerCase();

    const getRank = (name) => {
      if (name.includes('snow park') || name.includes('snow city') || name.includes('snowpark') || name.includes('snowcity')) return 1;
      if (name.includes('mad lab') || name.includes('madlab')) return 2;
      return 3;
    };

    const aRank = getRank(aName);
    const bRank = getRank(bName);

    if (aRank !== bRank) return aRank - bRank;

    // Secondary sort: By ID ascending
    const aId = Number(a?.attraction_id || a?.id || 0);
    const bId = Number(b?.attraction_id || b?.id || 0);

    if (aId > 0 && bId > 0 && aId !== bId) {
      return aId - bId;
    }

    // Tertiary sort: Keep it alphabetical
    return aName.localeCompare(bName);
  });
};
