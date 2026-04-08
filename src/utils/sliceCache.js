/**
 * Simple localStorage cache utility for Redux slices.
 * Gracefully handles environments where localStorage is unavailable
 * (e.g., incognito mode in some browsers, embedded contexts).
 */
const CACHE_PREFIX = 'sc_cache_';

const isStorageAvailable = () => {
    try {
        const key = '__sc_test__';
        window.localStorage.setItem(key, '1');
        window.localStorage.removeItem(key);
        return true;
    } catch {
        return false;
    }
};

export const loadSliceCache = (name) => {
    if (!isStorageAvailable()) return null;
    try {
        const raw = localStorage.getItem(CACHE_PREFIX + name);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        // Validate structure
        if (!parsed || !Array.isArray(parsed.items)) return null;
        return parsed;
    } catch {
        return null;
    }
};

export const saveSliceCache = (name, data) => {
    if (!isStorageAvailable()) return;
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
