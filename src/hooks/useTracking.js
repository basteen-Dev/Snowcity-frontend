// src/hooks/useTracking.js
// Tracks UTM parameters and landing page on first visit
import { useEffect } from 'react';
import api from '../services/apiClient';

const TRACKING_SESSION_KEY = 'tracking_session_id';
const TRACKING_DATA_KEY = 'tracking_data';

/**
 * Generate a simple unique session ID.
 */
function generateTrackingSessionId() {
    return `trk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Call once at app root to capture UTM params and log the visit.
 */
export function useTracking() {
    useEffect(() => {
        try {
            // Get or create tracking session
            let sessionId = localStorage.getItem(TRACKING_SESSION_KEY);
            if (!sessionId) {
                sessionId = generateTrackingSessionId();
                localStorage.setItem(TRACKING_SESSION_KEY, sessionId);
            }

            // Parse UTM & click-id params from URL
            const params = new URLSearchParams(window.location.search);
            const utm_source = params.get('utm_source');
            const utm_medium = params.get('utm_medium');
            const utm_campaign = params.get('utm_campaign');
            const utm_content = params.get('utm_content');
            const utm_term = params.get('utm_term');
            const gclid = params.get('gclid');
            const fbclid = params.get('fbclid');

            // Only log if there are tracking params (avoid logging every page reload)
            const hasTrackingParams = utm_source || utm_medium || utm_campaign || gclid || fbclid;

            const trackingData = {
                session_id: sessionId,
                utm_source,
                utm_medium,
                utm_campaign,
                utm_content,
                utm_term,
                gclid,
                fbclid,
                landing_page: window.location.pathname,
            };

            // Always persist the latest tracking data
            // If we already have data and there are no new UTM params, keep the old data
            const existing = localStorage.getItem(TRACKING_DATA_KEY);
            if (hasTrackingParams || !existing) {
                localStorage.setItem(TRACKING_DATA_KEY, JSON.stringify(trackingData));
            }

            // Fire visit log to backend (only when there are tracking params)
            if (hasTrackingParams) {
                api.post('/api/track/visit', trackingData).catch(() => {
                    // Silently fail — tracking should never block user experience
                });
            }
        } catch {
            // Silently fail
        }
    }, []);
}

/**
 * Get the stored tracking session ID.
 */
export function getTrackingSessionId() {
    try {
        return localStorage.getItem(TRACKING_SESSION_KEY) || null;
    } catch {
        return null;
    }
}

/**
 * Get the stored tracking data.
 */
export function getTrackingData() {
    try {
        const raw = localStorage.getItem(TRACKING_DATA_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

/**
 * Fire booking attribution event to backend.
 * Call this after a successful payment.
 */
export async function trackBookingConversion({ order_id, amount, user_id }) {
    try {
        const tracking = getTrackingData();
        if (!tracking?.session_id) return;

        await api.post('/api/track/booking', {
            session_id: tracking.session_id,
            order_id,
            amount,
            user_id,
        });
    } catch {
        // Silently fail
    }
}

export default useTracking;
