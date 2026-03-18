import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { CheckCircle, Loader2, FileDown, PhoneCall } from 'lucide-react';
import api from '../services/apiClient';
import endpoints from '../services/endpoints';
import { absoluteUrl } from '../utils/media';
import { fireConversionEvent } from '../hooks/useConversionPixels';

const statusCopy = {
  processing: {
    title: 'Verifying Payment…',
    desc: 'Please stay on this page while we generate your ticket.',
  },
  success: {
    title: 'Booking Confirmed!',
    desc: 'Download your ticket below or visit My Bookings anytime.',
  },
};

export default function PaymentSuccess() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const token = useSelector((s) => s.auth?.token);

  const bookingId = sp.get('booking') || sp.get('booking_id') || sp.get('id') || sp.get('orderId') || '';
  const cartRef = sp.get('cart') || '';
  const tranCtx = sp.get('tx') || sp.get('tranCtx') || '';
  const ticketQueryUrl = sp.get('ticket') || '';

  const [booking, setBooking] = React.useState(null);
  const [loadingBooking, setLoadingBooking] = React.useState(false);

  // Helper to extract ticket URL from booking or order response
  const getTicketUrl = (data) => {
    if (!data) return null;
    // Check direct properties
    let url = data.ticket_pdf_url || data.ticket_url || data.pdf_url || data.ticket_pdf;
    // Check items array (if it's an Order)
    if (!url && Array.isArray(data.items) && data.items.length > 0) {
      const item = data.items.find((it) => it.ticket_pdf || it.ticket_pdf_url);
      if (item) url = item.ticket_pdf || item.ticket_pdf_url;
    }
    // Check if data is array (list of bookings)
    if (!url && Array.isArray(data) && data.length > 0) {
      const item = data.find((it) => it.ticket_pdf || it.ticket_pdf_url);
      if (item) url = item.ticket_pdf || item.ticket_pdf_url;
    }
    return absoluteUrl(url);
  };

  const initialTicketUrl = absoluteUrl(ticketQueryUrl);
  const [ticketUrl, setTicketUrl] = React.useState(initialTicketUrl);

  const pollIntervalRef = React.useRef(null);
  const conversionFiredRef = React.useRef(false);

  React.useEffect(() => {
    if (initialTicketUrl) {
      setTicketUrl(initialTicketUrl);
      return;
    }

    if (!token || !bookingId) return;

    setLoadingBooking(true);

    const fetchBooking = async () => {
      try {
        const res = await api.get(endpoints.users.myBookingById(bookingId));
        const data = res?.booking || res || null;
        setBooking(data);

        const foundUrl = getTicketUrl(data);
        if (foundUrl) {
          setTicketUrl(foundUrl);
          setLoadingBooking(false);
          // Stop polling if we found the ticket
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

          // Fire conversion tracking (once)
          if (!conversionFiredRef.current) {
            conversionFiredRef.current = true;

            const orderId = data?.order_id || (data?.items && data.items[0]?.order_id);
            const totalAmount = Number(data?.total_amount || data?.final_amount || 0);

            // 🔹 GTM PURCHASE EVENT — with enriched data
            const purchaseFiredKey = `purchase_fired_${orderId}`;
            if (!localStorage.getItem(purchaseFiredKey)) {
              const items = Array.isArray(data?.items) ? data.items : [];
              const attractionNames = items.length > 0
                ? items.map(it => it.title || it.name || it.attraction_name || '').filter(Boolean).join(' + ')
                : (data?.title || data?.attraction_name || '');

              const productTypes = items.map(it => it.item_type === 'Combo' ? 'combo' : 'single');
              const isCombo = productTypes.includes('combo') || data?.item_type === 'Combo';
              const isSingle = productTypes.includes('single') || (data?.item_type !== 'Combo' && !items.length);
              const productType = (isCombo && isSingle) ? 'mixed' : (isCombo ? 'combo' : 'single');

              const selectedDate = items[0]?.booking_date || data?.booking_date || '';
              const timeSlot = items[0]?.slot_label || items[0]?.time_slot || data?.slot_label || '';

              const totalTicketsAmount = items.length > 0
                ? items.reduce((sum, item) => sum + Number(item.quantity || 1), 0)
                : Number(data?.total_tickets || data?.quantity || 1);

              window.dataLayer = window.dataLayer || [];
              window.dataLayer.push({
                event: 'purchase',
                order_id: orderId || '',
                total_value: totalAmount,
                total_tickets: totalTicketsAmount,
                total_pax: totalTicketsAmount,
                currency: 'INR',
                payment_type: data?.payment_mode || data?.gateway || '',
                payment_gateway: data?.payment_mode || data?.gateway || '',
                attraction_name: items[0]?.title || items[0]?.name || items[0]?.attraction_name || attractionNames || '',
                product_type: items.length > 0
                  ? (items[0]?.item_type === 'Combo' ? 'combo' : 'single')
                  : (data?.item_type === 'Combo' ? 'combo' : 'single'),
                selected_date: selectedDate,
                time_slot: timeSlot,
                has_addons: Number(data?.addons_value || data?.addon_total || 0) > 0,
                addons_value: Number(data?.addons_value || data?.addon_total || 0),
                promo_code: data?.promo_code || data?.coupon_code || '',
                discount_value: Number(data?.discount_value || data?.discount_amount || 0),
                items: items.length > 0 ? items.map(item => {
                  const unitPrice = Number(item.unit_price || item.price || 0);
                  const qty = Number(item.quantity || 1);
                  return {
                    item_id: item.id || item.attraction_id || item.combo_id || '',
                    item_name: item.title || item.name || item.attraction_name || '',
                    item_category: item.item_type === 'Combo' ? 'combo' : 'single',
                    quantity: qty,
                    price: unitPrice,
                    item_total: unitPrice * qty,
                    item_variant: item.slot_label || item.time_slot || '',
                    selected_date: item.booking_date || ''
                  };
                }) : [{
                  item_id: data?.id || data?.attraction_id || data?.combo_id || '',
                  item_name: data?.title || data?.attraction_name || '',
                  item_category: data?.item_type === 'Combo' ? 'combo' : 'single',
                  quantity: Number(data?.quantity || 1),
                  price: totalAmount,
                  item_total: totalAmount,
                  item_variant: data?.slot_label || '',
                  selected_date: data?.booking_date || ''
                }]
              });
              localStorage.setItem(purchaseFiredKey, 'true');
            }


            if (totalAmount > 0) {
              fireConversionEvent({ value: totalAmount, currency: "INR" });
            }
          }
        } else {
          // If ticket not found, try to force a status check
          // This handles cases where webhook/redirect failed to trigger the check
          const orderId = data?.order_id || (data?.items && data.items[0]?.order_id);
          const paymentMode = data?.payment_mode;
          const gatewayParam = sp.get('gateway');

          // Trigger status check if we have an order ID and appropriate context
          if (orderId) {
            try {
              if (paymentMode === 'PhonePe' || gatewayParam === 'phonepe') {
                await api.get(endpoints.bookings.phonepe.status(orderId));
              } else if (paymentMode === 'PayPhi' || gatewayParam === 'payphi') {
                await api.get(endpoints.bookings.payphi.status(orderId));
              }
            } catch (e) {
              console.warn('[PaymentSuccess] Status check failed', e);
            }
          }
        }
      } catch (err) {
        console.error('Unable to fetch booking', err);
      }
    };

    // Initial fetch
    fetchBooking();

    // Poll every 3 seconds if not found
    pollIntervalRef.current = setInterval(fetchBooking, 3000);

    // Cleanup
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [token, bookingId, initialTicketUrl]);

  // If no token, we can't fetch details effectively.
  // Show a message suggesting they check email or login.
  if (!token && !ticketUrl) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-gradient-to-b from-[#f5f8ff] to-white px-4 pt-24 pb-12">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-100 px-6 sm:px-10 py-10 text-center">
          <div className="mx-auto w-20 h-20 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
            <CheckCircle size={42} strokeWidth={2.2} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mt-6 bg-yellow-100 inline-block px-4 py-1 rounded-lg">Booking Confirmed!</h1>
          <p className="text-slate-600 mt-4 text-base">
            Your booking reference is <strong>{booking?.order_ref || bookingId || cartRef}</strong>.
            <br />
            We are generating your tickets and will send them to your email shortly.
          </p>
          <div className="mt-8 flex justify-center">
            <a href="/?authRequired=1" className="text-blue-600 font-medium hover:underline">Log in to view your bookings</a>
          </div>
        </div>
      </div>
    );
  }

  const stateKey = ticketUrl ? 'success' : 'processing';
  const copy = statusCopy[stateKey];

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gradient-to-b from-[#f5f8ff] to-white px-4 pt-24 pb-12">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-100 px-6 sm:px-10 py-10 text-center">
        <div className="mx-auto w-20 h-20 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
          {ticketUrl ? <CheckCircle size={42} strokeWidth={2.2} /> : <Loader2 size={40} className="animate-spin" />}
        </div>
        <h1 className="text-3xl font-semibold text-slate-900 mt-6">{copy.title}</h1>
        <p className="text-slate-600 mt-2 text-base">{copy.desc}</p>

        <div className="mt-6 grid gap-4">
          {ticketUrl ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const url = ticketUrl || `https://app.snowcityblr.com/api/tickets/generated/ORDER_${cartRef || booking?.order_ref || bookingId}.pdf`;
                // Create a temporary link to force download with a nice filename
                const link = document.createElement('a');
                link.href = url;
                link.download = `SnowCity_Ticket_${cartRef || booking?.order_ref || 'Booking'}.pdf`;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 text-white px-6 py-3.5 text-lg font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <FileDown size={22} /> Download Ticket (PDF)
            </button>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-4 text-sm text-slate-500 bg-slate-50">
              Tickets are being generated. We will send them to your registered email and WhatsApp shortly.
              {loadingBooking && <div className="mt-2 text-xs text-slate-400">Refreshing booking status…</div>}
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-4">
            <a
              href="/my-bookings"
              className="flex-1 inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 font-medium text-slate-700 hover:border-slate-300"
            >
              View My Bookings
            </a>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 inline-flex items-center justify-center rounded-2xl bg-slate-900 text-white px-5 py-3 font-semibold hover:bg-slate-800"
            >
              Back to Home
            </button>
          </div>
        </div>

        <div className="mt-8 p-4 rounded-2xl bg-slate-50 text-left flex flex-col gap-3 text-sm text-slate-600">
          <div className="flex flex-wrap gap-3 text-xs uppercase tracking-wide text-slate-400">
            <span>Booking Ref: <strong className="text-slate-700">{booking?.order_ref || cartRef || '—'}</strong></span>
            {tranCtx && <span>Txn ID: <strong className="text-slate-700">{tranCtx}</strong></span>}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <PhoneCall size={18} className="text-blue-500" />
            <div>
              Need help? Reach us at <a href="tel:+917829550000" className="text-blue-600 font-medium">+91 78295 50000</a> or write to <a href="mailto:info@snowcityblr.com" className="text-blue-600 font-medium">info@snowcityblr.com</a>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
