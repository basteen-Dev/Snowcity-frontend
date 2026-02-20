// src/hooks/useConversionPixels.js
// Fire Meta Pixel + Google Ads conversion events

/**
 * Fire a purchase conversion event on both Meta and Google.
 * @param {{ value: number, currency?: string }} opts
 */
export function fireConversionEvent({ value, currency = 'INR' }) {
    try {
        // Meta Pixel — Purchase event
        if (typeof window.fbq === 'function') {
            window.fbq('track', 'Purchase', {
                value,
                currency,
            });
        }
    } catch {
        // Silently fail
    }

    try {
        // Google Ads — Conversion event
        if (typeof window.gtag === 'function') {
            const conversionId = import.meta.env?.VITE_GOOGLE_ADS_ID || '';
            const conversionLabel = import.meta.env?.VITE_GOOGLE_ADS_CONVERSION_LABEL || '';
            if (conversionId && conversionLabel) {
                window.gtag('event', 'conversion', {
                    send_to: `${conversionId}/${conversionLabel}`,
                    value,
                    currency,
                });
            }
        }
    } catch {
        // Silently fail
    }
}

export default fireConversionEvent;
