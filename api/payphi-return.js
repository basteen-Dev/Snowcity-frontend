/**
 * Vercel Serverless Function — PayPhi Return Handler
 * ───────────────────────────────────────────────────
 * PayPhi redirects users back via POST (form submission).
 * Vercel's static SPA cannot handle POST requests (returns 405).
 *
 * This serverless function:
 *  1. Receives the POST from PayPhi (on the whitelisted frontend domain)
 *  2. Extracts txnId/merchantTxnNo from POST body or query params
 *  3. Redirects (302 GET) to /payment-status?gateway=payphi&txnId=...
 *
 * This keeps the whitelisted URL on the same frontend domain.
 */

const { URL } = require('url');

// Extract value from PayPhi response (case-insensitive key match)
function pick(obj, key) {
    if (!obj || !key) return '';
    const lower = key.toLowerCase();
    for (const [k, v] of Object.entries(obj)) {
        if ((k || '').toLowerCase() === lower) return String(v || '').trim();
    }
    return '';
}

module.exports = async (req, res) => {
    try {
        // PayPhi sends data in body (POST) or query (GET)
        const params = { ...(req.query || {}), ...(req.body || {}) };

        // Extract the transaction identifier
        const txnId =
            pick(params, 'merchantTxnNo') ||
            pick(params, 'merchantTxnno') ||
            pick(params, 'tranCtx') ||
            pick(params, 'addlParam1') ||
            '';

        // Build the frontend payment status URL
        const base = new URL('/payment-status', `https://${req.headers.host}`);
        base.searchParams.set('gateway', 'payphi');
        if (txnId) base.searchParams.set('txnId', txnId);

        // Pass along any PayPhi status info for immediate UI feedback
        const statusCode = pick(params, 'statusCode') || pick(params, 'responseCode');
        if (statusCode) base.searchParams.set('code', statusCode);

        const statusMessage = pick(params, 'statusMessage') || pick(params, 'responseMessage');
        if (statusMessage) base.searchParams.set('msg', statusMessage);

        // 302 redirect — browser will follow with a GET request
        res.writeHead(302, { Location: base.toString() });
        res.end();
    } catch (err) {
        console.error('PayPhi return handler error:', err);
        // Fallback — redirect to payment status with error
        res.writeHead(302, {
            Location: `/payment-status?gateway=payphi&status=error`
        });
        res.end();
    }
};
