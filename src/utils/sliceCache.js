/**
 * Simple localStorage cache utility for Redux slices
 */
const CACHE_PREFIX = 'sc_cache_';

export const loadSliceCache = (name) => {
    try {
        const raw = localStorage.getItem(CACHE_PREFIX + name);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

export const saveSliceCache = (name, data) => {
    try {
        localStorage.setItem(CACHE_PREFIX + name, JSON.stringify({
            items: data,
            lastFetched: Date.now()
        }));
    } catch { }
};

export const isFresh = (lastFetched, ttlMs = 300000) => { // Default 5 mins
    if (!lastFetched) return false;
    return (Date.now() - lastFetched) < ttlMs;
};
