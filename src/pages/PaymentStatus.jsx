import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
    CheckCircle, XCircle, Loader2, FileDown, PhoneCall,
    RefreshCcw, AlertCircle, Home
} from 'lucide-react';
import api from '../services/apiClient';
import { absoluteUrl } from '../utils/media';

/**
 * PaymentStatus Page — /payment-status
 *
 * Option B redirect flow:
 *  - PhonePe redirects users to this page after payment: ?txnId=...&gateway=phonepe
 *  - PayPhi can also redirect here: ?txnId=...&gateway=payphi
 *
 * On mount, this page calls the backend to verify payment status and updates UI accordingly.
 */
export default function PaymentStatus() {
    const [sp] = useSearchParams();
    const navigate = useNavigate();

    const txnId = sp.get('txnId') || sp.get('orderId') || sp.get('merchantOrderId') || '';
    const gateway = (sp.get('gateway') || 'phonepe').toLowerCase();
    const code = sp.get('code') || '';   // PhonePe may send code=PAYMENT_SUCCESS etc.

    const [phase, setPhase] = useState('verifying'); // verifying | success | failed | error
    const [orderId, setOrderId] = useState(null);
    const [orderRef, setOrderRef] = useState('');
    const [bookingId, setBookingId] = useState(null);
    const [ticketUrl, setTicketUrl] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [retryCount, setRetryCount] = useState(0);
    const [failedOrderData, setFailedOrderData] = useState(null);

    const verify = useCallback(async () => {
        if (!txnId) {
            setPhase('error');
            setErrorMsg('No transaction ID found in URL. Please check your email for booking confirmation.');
            return;
        }

        setPhase('verifying');

        try {
            let endpoint = '';
            if (gateway === 'payphi') {
                endpoint = `/api/payments/payphi/status/txn/${encodeURIComponent(txnId)}`;
            } else {
                // phonepe (default)
                endpoint = `/api/payments/phonepe/status/txn/${encodeURIComponent(txnId)}`;
            }

            const res = await api.get(endpoint);
            const data = res?.data || res || {};

            if (data.success) {
                // Clean up booking session data
                localStorage.removeItem('pendingOrderData');
                sessionStorage.removeItem('snowcity_booking_state');

                setOrderId(data.orderId || null);
                setOrderRef(data.orderRef || '');
                setBookingId(data.bookingId || null);
                const resolvedTicket = absoluteUrl(data.ticketUrl || '');
                setTicketUrl(resolvedTicket);
                setPhase('success');

                // 🔹 GTM PURCHASE EVENT — with duplicate prevention
                const purchaseOrderId = data.orderId || data.orderRef || txnId;
                const purchaseFiredKey = `purchase_fired_${purchaseOrderId}`;
                if (!localStorage.getItem(purchaseFiredKey)) {
                    const rawItems = Array.isArray(data.items) ? data.items : [];
                    const items = rawItems.map(item => {
                        const unitPrice = Number(item.pricePerTicket || item.unit_price || item.price || 0);
                        const qty = Number(item.quantity || 1);
                        return {
                            item_id: item.id || item.attraction_id || item.combo_id || '',
                            item_name: item.title || item.name || '',
                            item_category: item.type || (item.item_type === 'Combo' ? 'combo' : 'single'),
                            product_type: item.type || (item.item_type === 'Combo' ? 'combo' : 'single'),
                            quantity: qty,
                            price: unitPrice,
                            item_total: unitPrice * qty,
                            item_variant: item.timeSlot || item.slot_label || '',
                            selected_date: item.date || item.booking_date || ''
                        };
                    });

                    window.dataLayer = window.dataLayer || [];
                    window.dataLayer.push({
                        event: 'purchase',
                        attraction_name: items[0]?.item_name || '',
                        product_type: items[0]?.product_type || '',
                        total_tickets: items.reduce((sum, item) => sum + item.quantity, 0),
                        order_id: purchaseOrderId,
                        total_value: Number(data.totalPaid || data.totalValue || data.amount || 0),
                        total_pax: items.reduce((sum, item) => sum + item.quantity, 0),
                        currency: 'INR',
                        payment_type: gateway || '',
                        payment_gateway: gateway,
                        selected_date: items[0]?.selected_date || '',
                        time_slot: items[0]?.item_variant || '',
                        has_addons: Number(data.addonsValue || 0) > 0,
                        addons_value: Number(data.addonsValue || 0),
                        promo_code: data.promoCode || '',
                        discount_value: Number(data.discountValue || 0),
                        items: items
                    });
                    localStorage.setItem(purchaseFiredKey, 'true');
                }
            } else {
                // Payment pending or failed
                const status = (data.status || '').toUpperCase();
                if (status === 'PENDING' || status === '' || data.message === 'Payment not yet completed') {
                    // Auto-retry after 3 seconds (max 3 retries)
                    if (retryCount < 3) {
                        setTimeout(() => {
                            setRetryCount((c) => c + 1);
                        }, 3000);
                    } else {
                        setFailedOrderData(data);
                        setPhase('failed');
                        setErrorMsg('Payment is taking longer than expected. Your booking will be confirmed once we receive payment. Check your email in a few minutes.');
                    }
                } else {
                    setFailedOrderData(data);
                    setPhase('failed');
                    setErrorMsg(data.message || data.error || 'Payment could not be verified.');
                }
            }
        } catch (err) {
            console.error('[PaymentStatus] verify error:', err);
            // If 404, likely txnId is wrong
            if (err?.response?.status === 404) {
                setPhase('error');
                setErrorMsg('Transaction not found. Please check your email for booking details, or contact support.');
            } else {
                // Network error — try again
                if (retryCount < 3) {
                    setTimeout(() => setRetryCount((c) => c + 1), 3000);
                } else {
                    setPhase('error');
                    setErrorMsg('Unable to reach payment server. Please check your internet connection or contact support.');
                }
            }
        }
    }, [txnId, gateway, retryCount]);

    useEffect(() => {
        // Gateway-aware quick-path using 'code' query param
        // PayPhi success codes: '0000'
        // PhonePe success code: 'PAYMENT_SUCCESS'
        const isKnownSuccess =
            code === 'PAYMENT_SUCCESS' ||                 // PhonePe
            (gateway === 'payphi' && code === '0000');    // PayPhi

        if (isKnownSuccess) {
            // Still need to verify with backend to trigger booking confirmation
        } else if (gateway === 'phonepe' && code && code !== 'PAYMENT_SUCCESS') {
            // PhonePe explicit failure — only short-circuit for PhonePe
            setPhase('failed');
            setErrorMsg('Payment was not completed. You can try again or choose a different payment method.');
            return;
        }
        // For PayPhi, ALWAYS call backend to verify regardless of code param
        verify();
    }, [retryCount]); // Re-run when retryCount increments (auto-retry)

    // 🔹 GTM PAYMENT_FAILED EVENT — fires when payment fails
    useEffect(() => {
        if (phase === 'failed' || phase === 'error') {
            const d = failedOrderData || {};
            const totalTickets = Number(d.totalTickets || d.quantity || d.total_tickets || 0);
            const totalVal = Number(d.totalPaid || d.totalValue || d.amount || d.total_amount || 0);
            const addonsVal = Number(d.addonsValue || d.addon_total || 0);

            const rawItems = Array.isArray(d.items) ? d.items : [];
            const items = rawItems.map(item => {
                const unitPrice = Number(item.pricePerTicket || item.unit_price || item.price || 0);
                const qty = Number(item.quantity || 1);
                return {
                    item_id: item.id || item.attraction_id || item.combo_id || '',
                    item_name: item.title || item.name || '',
                    item_category: item.type || (item.item_type === 'Combo' ? 'combo' : 'single'),
                    product_type: item.type || (item.item_type === 'Combo' ? 'combo' : 'single'),
                    quantity: qty,
                    price: unitPrice,
                    item_total: unitPrice * qty,
                    item_variant: item.timeSlot || item.slot_label || '',
                    selected_date: item.date || item.booking_date || ''
                };
            });

            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
                event: 'payment_failed',
                attraction_name: items[0]?.item_name || '',
                product_type: items[0]?.product_type || '',
                total_tickets: items.reduce((sum, item) => sum + item.quantity, 0),
                order_id: d.orderId || d.orderRef || txnId || '',
                total_value: totalVal,
                total_pax: items.reduce((sum, item) => sum + item.quantity, 0),
                currency: 'INR',
                payment_gateway: gateway,
                selected_date: items[0]?.selected_date || '',
                time_slot: items[0]?.item_variant || '',
                has_addons: addonsVal > 0,
                addons_value: addonsVal,
                promo_code: d.promoCode || d.coupon_code || '',
                discount_value: Number(d.discountValue || d.discount_amount || 0),
                items: items
            });
        }
    }, [phase, gateway, failedOrderData, txnId]);

    const handleDownloadTicket = (e) => {
        e.stopPropagation();
        if (!ticketUrl) return;
        const link = document.createElement('a');
        link.href = ticketUrl;
        link.download = `SnowCity_Ticket_${orderRef || bookingId || 'Booking'}.pdf`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const isVerifying = phase === 'verifying';
    const isSuccess = phase === 'success';
    const isFailed = phase === 'failed' || phase === 'error';

    return (
        <div className="min-h-[70vh] flex items-center justify-center bg-gradient-to-b from-[#f5f8ff] to-white px-4 pt-24 pb-12">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-100 px-6 sm:px-10 py-10 text-center">

                {/* Icon */}
                <div className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center shadow-inner mb-6">
                    {isVerifying && (
                        <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center">
                            <Loader2 size={40} className="animate-spin text-blue-500" />
                        </div>
                    )}
                    {isSuccess && (
                        <div className="w-20 h-20 rounded-2xl bg-emerald-50 flex items-center justify-center">
                            <CheckCircle size={42} strokeWidth={2.2} className="text-emerald-500" />
                        </div>
                    )}
                    {isFailed && (
                        <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center">
                            <XCircle size={42} strokeWidth={2.2} className="text-red-500" />
                        </div>
                    )}
                </div>

                {/* Title */}
                {isVerifying && (
                    <>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Verifying Payment…</h1>
                        <p className="text-slate-500 text-sm">
                            Please stay on this page while we confirm your booking.
                            {retryCount > 0 && <span className="block mt-1 text-xs text-blue-400">Checking payment status… (attempt {retryCount + 1})</span>}
                        </p>
                    </>
                )}

                {isSuccess && (
                    <>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Booking Confirmed! 🎉</h1>
                        <p className="text-slate-500 text-sm mb-1">
                            Your payment was successful. Tickets sent to your registered email and WhatsApp.
                        </p>
                        {orderRef && (
                            <p className="text-xs text-slate-400 mb-6">
                                Booking Ref: <strong className="text-slate-600">{orderRef}</strong>
                            </p>
                        )}
                    </>
                )}

                {isFailed && (
                    <>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">
                            {phase === 'error' ? 'Verification Error' : 'Payment Not Completed'}
                        </h1>
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-left">
                            <div className="flex items-start gap-2">
                                <AlertCircle size={18} className="text-amber-600 mt-0.5 shrink-0" />
                                <p className="text-sm text-amber-800">
                                    {errorMsg || 'We could not confirm your payment. If money was deducted, it will be refunded within 5–7 business days.'}
                                </p>
                            </div>
                        </div>
                    </>
                )}

                {/* Actions */}
                <div className="mt-4 grid gap-3">
                    {isSuccess && (
                        <>
                            {ticketUrl ? (
                                <button
                                    onClick={handleDownloadTicket}
                                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 text-white px-6 py-3.5 text-base font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors"
                                >
                                    <FileDown size={20} />
                                    Download Ticket (PDF)
                                </button>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-4 text-sm text-slate-500 bg-slate-50">
                                    Tickets are being generated. We'll send them to your email and WhatsApp shortly.
                                </div>
                            )}

                            <Link
                                to="/my-bookings"
                                className="w-full inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                            >
                                View My Bookings
                            </Link>
                        </>
                    )}

                    {isFailed && (
                        <>
                            <button
                                onClick={() => navigate('/tickets-offers')}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-600 text-white px-6 py-3.5 text-base font-semibold shadow-lg shadow-sky-200 hover:bg-sky-700 transition-colors"
                            >
                                <RefreshCcw size={18} />
                                Try Again
                            </button>

                            <Link
                                to="/my-bookings"
                                className="w-full inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                            >
                                View My Bookings
                            </Link>
                        </>
                    )}

                    <Link
                        to="/"
                        className="w-full inline-flex items-center justify-center gap-1.5 text-slate-400 font-medium py-2 text-sm hover:text-slate-600 transition-colors"
                    >
                        <Home size={14} />
                        Back to Home
                    </Link>
                </div>

                {/* Support */}
                <div className="mt-8 p-4 rounded-2xl bg-slate-50 text-left flex items-center gap-3 text-sm text-slate-600">
                    <PhoneCall size={18} className="text-blue-500 shrink-0" />
                    <div>
                        Need help?{' '}
                        <a href="tel:+917829550000" className="text-blue-600 font-medium">+91 78295 50000</a>
                        {' '}or{' '}
                        <a href="mailto:info@snowcityblr.com" className="text-blue-600 font-medium">info@snowcityblr.com</a>
                    </div>
                </div>

                {/* Debug info (hidden in production) */}
                {txnId && (
                    <p className="mt-4 text-[10px] text-slate-300 font-mono">
                        txnId: {txnId} · gateway: {gateway}
                    </p>
                )}
            </div>
        </div>
    );
}
