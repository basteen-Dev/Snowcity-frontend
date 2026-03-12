import React, { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAdminBooking, updateAdminBooking, cancelAdminBooking,
  payphiStatusAdmin, payphiInitiateAdmin, payphiRefundAdmin
} from '../../features/bookings/adminBookingsSlice';
import {
  ArrowLeft, User, Phone, Mail, MapPin, CreditCard, IndianRupee,
  Ticket, Clock, CheckCircle2, XCircle, Send, Download, CalendarClock,
  MessageSquare, ChevronDown, ChevronUp, RotateCcw, AlertTriangle
} from 'lucide-react';

/* ── Tiny helpers ── */
const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (d) => d ? dayjs(d).format('DD MMM, YYYY') : '—';
const fmtDateTime = (d) => d ? dayjs(d).format('DD MMM YYYY · h:mm A') : '—';

const formatTime12 = (t) => {
  if (!t) return '';
  const [h, m] = String(t).split(':');
  if (!h || !m) return '';
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m.padStart(2, '0')} ${ampm}`;
};

const fmtPayTime = (ts) => {
  if (!ts || ts.length < 14) return ts || '—';
  // YYYYMMDDHHmmss
  const y = ts.slice(0, 4);
  const m = ts.slice(4, 6);
  const d = ts.slice(6, 8);
  const h = ts.slice(8, 10);
  const min = ts.slice(10, 12);
  const s = ts.slice(12, 14);
  return `${d}/${m}/${y} ${h}:${min}:${s}`;
};

const statusBadge = (status, type = 'booking') => {
  const colors = {
    // Booking statuses
    PENDING_PAYMENT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    CONFIRMED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    ABANDONED: 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400',
    REFUNDED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    Booked: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    Redeemed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    Expired: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    Cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    // Payment statuses
    Completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    SUCCESS: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    INITIATED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    Failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    TIMED_OUT: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  };
  const labels = {
    PENDING_PAYMENT: 'Pending Payment', CONFIRMED: 'Confirmed', ABANDONED: 'Abandoned',
    REFUNDED: 'Refunded', SUCCESS: 'Success', INITIATED: 'Initiated', TIMED_OUT: 'Timed Out',
  };
  return (
    <span className={`inline-flex items-center rounded-xl px-3 py-1 text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {labels[status] || status || '—'}
    </span>
  );
};

/* ── Card wrapper ── */
const Card = ({ children, className = '' }) => (
  <div className={`rounded-2xl border border-gray-200 bg-white shadow-sm dark:bg-neutral-900 dark:border-neutral-800 ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ icon: Icon, title, action }) => (
  <div className="flex items-center justify-between px-5 pt-5 pb-3">
    <div className="flex items-center gap-2">
      {Icon && <Icon size={18} className="text-gray-400" />}
      <h3 className="text-sm font-semibold text-gray-900 dark:text-neutral-100">{title}</h3>
    </div>
    {action}
  </div>
);

const InfoRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-start gap-3 py-2">
    {Icon && <Icon size={16} className="text-gray-400 mt-0.5 shrink-0" />}
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">{label}</div>
      <div className="text-sm font-medium text-gray-900 dark:text-neutral-100 break-words">{value ?? '—'}</div>
    </div>
  </div>
);

/* ── Timeline event icon helper ── */
const timelineIcon = (eventType) => {
  if (eventType.startsWith('booking_created')) return { icon: Ticket, color: 'bg-blue-500' };
  if (eventType.startsWith('payment_completed') || eventType.startsWith('payment_success')) return { icon: CheckCircle2, color: 'bg-emerald-500' };
  if (eventType.startsWith('payment_')) return { icon: CreditCard, color: 'bg-amber-500' };
  if (eventType === 'ticket_redeemed') return { icon: CheckCircle2, color: 'bg-emerald-500' };
  if (eventType === 'ticket_not_redeemed') return { icon: RotateCcw, color: 'bg-amber-500' };
  if (eventType.startsWith('status_confirmed')) return { icon: CheckCircle2, color: 'bg-emerald-500' };
  if (eventType.startsWith('status_redeemed')) return { icon: CheckCircle2, color: 'bg-emerald-500' };
  if (eventType.startsWith('status_cancelled')) return { icon: XCircle, color: 'bg-red-500' };
  if (eventType.startsWith('status_')) return { icon: RotateCcw, color: 'bg-purple-500' };
  if (eventType === 'whatsapp_sent') return { icon: MessageSquare, color: 'bg-green-500' };
  if (eventType === 'email_sent') return { icon: Mail, color: 'bg-indigo-500' };
  if (eventType === 'ticket_generated') return { icon: Download, color: 'bg-cyan-500' };
  return { icon: Clock, color: 'bg-gray-500' };
};

const timelineLabel = (eventType) => {
  const labels = {
    booking_created: 'Booking Created',
    payment_completed: 'Payment Completed',
    payment_success: 'Payment Successful',
    payment_pending: 'Payment Initiated',
    payment_initiated: 'Payment Initiated',
    payment_failed: 'Payment Failed',
    payment_cancelled: 'Payment Cancelled',
    payment_timed_out: 'Payment Timed Out',
    status_booked: 'Status → Booked',
    status_confirmed: 'Booking Confirmed',
    status_pending_payment: 'Awaiting Payment',
    status_redeemed: 'Ticket Redeemed',
    status_cancelled: 'Booking Cancelled',
    status_abandoned: 'Booking Abandoned',
    status_refunded: 'Booking Refunded',
    ticket_redeemed: 'Ticket Redeemed',
    ticket_not_redeemed: 'Ticket Marked Not Redeemed',
    whatsapp_sent: 'WhatsApp Sent',
    email_sent: 'Email Sent',
    ticket_generated: 'Ticket Generated',
  };
  return labels[eventType] || eventType.replace(/_/g, ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase());
};

/* ═══════════════════════════════════════════════════════ */

export default function BookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { current, action } = useSelector((s) => s.adminBookings);
  const [expandedItems, setExpandedItems] = useState({});
  const [showPayPhi, setShowPayPhi] = useState(false);
  const [refund, setRefund] = useState({ amount: '', newMerchantTxnNo: '' });
  const [init, setInit] = useState({ email: '', mobile: '' });
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Custom modal states
  const [redeemModalOpen, setRedeemModalOpen] = useState(false);
  const [redeemModalState, setRedeemModalState] = useState('confirm'); // 'confirm' | 'success'
  const [redeemNewStatus, setRedeemNewStatus] = useState('REDEEMED');

  React.useEffect(() => {
    dispatch(getAdminBooking({ id }));
  }, [id, dispatch]);

  const b = current.data;

  // Deduplicate activity: remove events with same event_type within 2s window
  // Must be above early returns to satisfy React hooks rules
  const dedupedActivity = React.useMemo(() => {
    const activity = b?.activity || [];
    if (!activity.length) return [];
    const result = [];
    for (const log of activity) {
      const lastSame = result.findLast(r => r.event_type === log.event_type);
      if (lastSame) {
        const diff = Math.abs(new Date(log.created_at) - new Date(lastSame.created_at));
        if (diff < 2000) continue;
      }
      result.push(log);
    }
    return result;
  }, [b?.activity]);

  /* Loading / Error states */
  if (current.status === 'loading' && !b) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-xl h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (current.status === 'failed') {
    const isForbidden = current.error?.status === 403 || /forbidden/i.test(current.error?.message || '');
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 max-w-2xl mx-auto mt-8">
        <AlertTriangle size={20} className="inline mr-2" />
        {isForbidden
          ? 'You don\'t have permission to view this booking.'
          : (current.error?.message || 'Failed to load booking')}
      </div>
    );
  }

  if (!b) return null;

  const orderRef = b.order_ref || b.booking_ref || `#${id}`;
  const user = b.user || {};
  const payment = b.payment || {};
  const items = (b.items || []).filter(it => !it.parent_booking_id);
  const activity = b.activity || [];
  const bookingDate = b.booking_date;
  const bookingStatus = b.booking_status || items[0]?.booking_status || '—';

  const toggleItem = (bookingId) => {
    setExpandedItems(prev => ({ ...prev, [bookingId]: !prev[bookingId] }));
  };

  const closeRedeemModal = () => {
    setRedeemModalOpen(false);
    setTimeout(() => { setRedeemModalState('confirm'); }, 300);
  };

  const handleConfirmRedeem = async () => {
    const firstBookingId = items[0]?.booking_id;
    if (!firstBookingId) return;
    setStatusUpdating(true);
    try {
      await dispatch(updateAdminBooking({ id: firstBookingId, patch: { ticket_status: redeemNewStatus, propagate: true } })).unwrap();
      setRedeemModalState('success');
      setTimeout(() => {
        closeRedeemModal();
        dispatch(getAdminBooking({ id }));
      }, 1800);
    } catch (err) {
      window.alert(err?.message || 'Failed to update ticket status');
      closeRedeemModal();
    } finally {
      setStatusUpdating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/parkpanel/bookings')}
            className="p-2 rounded-xl hover:bg-gray-100 transition dark:hover:bg-neutral-800"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-neutral-100 flex items-center gap-2">
              {orderRef}
              {statusBadge(bookingStatus)}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {fmtDate(bookingDate)} · Created {fmtDateTime(b.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Ticket Status toggle */}
          {(() => {
            const isConfirmed = bookingStatus === 'CONFIRMED' || bookingStatus === 'Booked';
            const ticketStatus = b.ticket_status || 'NOT_REDEEMED';
            const isRedeemed = ticketStatus === 'REDEEMED';
            return (
              <button
                onClick={() => {
                  if (!isConfirmed) {
                    window.alert('Ticket status can only be changed when booking is CONFIRMED.');
                    return;
                  }
                  const newStatus = isRedeemed ? 'NOT_REDEEMED' : 'REDEEMED';
                  setRedeemNewStatus(newStatus);
                  setRedeemModalState('confirm');
                  setRedeemModalOpen(true);
                }}
                disabled={statusUpdating || !isConfirmed}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${isRedeemed
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700'
                  : 'border-amber-300 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700'
                  } ${(statusUpdating || !isConfirmed) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}`}
                title={!isConfirmed ? 'Booking must be CONFIRMED to change ticket status' : (isRedeemed ? 'Click to mark as Not Redeemed' : 'Click to mark as Redeemed')}
              >
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${isRedeemed ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                {isRedeemed ? 'Redeemed' : 'Not Redeemed'}
              </button>
            );
          })()}
          <button
            onClick={() => dispatch(getAdminBooking({ id }))}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50 transition dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            <RotateCcw size={14} className="inline mr-1" /> Refresh
          </button>
        </div>
      </div>

      {/* ── Top cards grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Customer Details */}
        <Card>
          <CardHeader icon={User} title="Customer Details" />
          <div className="px-5 pb-5 grid grid-cols-2 gap-x-4 gap-y-1">
            <InfoRow icon={User} label="Name" value={user.name || '—'} />
            <InfoRow icon={Phone} label="Phone" value={user.phone || '—'} />
            <InfoRow icon={Mail} label="Email" value={user.email || '—'} />
            <InfoRow icon={MapPin} label="Source" value={payment.mode || 'Online'} />
          </div>
        </Card>

        {/* Payment Details */}
        <Card>
          <CardHeader
            icon={CreditCard}
            title="Payment Details"
            action={statusBadge(payment.status)}
          />
          <div className="px-5 pb-5 grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
            <InfoRow icon={IndianRupee} label="Total" value={money(payment.total)} />
            <InfoRow icon={IndianRupee} label="Transaction Amount" value={money(payment.paid)} />
            <InfoRow icon={Clock} label="Transaction Date & Time" value={fmtPayTime(payment.datetime)} />

            <InfoRow icon={CreditCard} label="Gateway" value={payment.mode || '—'} />
            <InfoRow icon={CreditCard} label="Payment Mode" value={payment.method || '—'} />
            <InfoRow icon={Ticket} label="Booking Ref" value={b.order_ref || '—'} />

            <InfoRow icon={Ticket} label="Transaction Id" value={payment.ref || '—'} />
            <InfoRow icon={Ticket} label="Merchent Ref No" value={payment.txn_no || '—'} />
          </div>
        </Card>
      </div>

      {/* ── Tickets / Items ── */}
      <Card>
        <CardHeader
          icon={Ticket}
          title={`Tickets (${items.length} item${items.length !== 1 ? 's' : ''})`}
        />
        <div className="divide-y divide-gray-100 dark:divide-neutral-800">
          {items.length === 0 && (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">No items found</div>
          )}
          {items.map((item) => {
            const isExpanded = expandedItems[item.booking_id];
            const slotStr = item.slot_start_time && item.slot_end_time
              ? `${formatTime12(item.slot_start_time)} - ${formatTime12(item.slot_end_time)}`
              : item.slot_label || '—';

            return (
              <div key={item.booking_id}>
                <button
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/60 transition text-left dark:hover:bg-neutral-800/50"
                  onClick={() => toggleItem(item.booking_id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-xl shrink-0 ${item.booking_status === 'CONFIRMED' || item.booking_status === 'Redeemed' ? 'bg-emerald-500' : item.booking_status === 'Cancelled' ? 'bg-red-400' : item.booking_status === 'PENDING_PAYMENT' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 dark:text-neutral-100 truncate">
                        {item.item_title}
                        <span className="text-xs font-normal text-gray-400 ml-2">× {item.quantity}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {fmtDate(item.booking_date)} · {slotStr}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900 dark:text-neutral-100">{money(item.final_amount || item.total_amount)}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {statusBadge(item.booking_status)}
                        {item.ticket_status && (
                          <span className={`inline-flex items-center gap-1 rounded-xl px-2 py-0.5 text-[10px] font-semibold ${item.ticket_status === 'REDEEMED'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                            : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${item.ticket_status === 'REDEEMED' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            {item.ticket_status === 'REDEEMED' ? 'Redeemed' : 'Not Redeemed'}
                          </span>
                        )}
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-4 bg-gray-50/50 dark:bg-neutral-800/30">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-3 text-xs">
                      <div>
                        <span className="text-gray-400 uppercase tracking-wider font-semibold">Type</span>
                        <p className="text-sm font-medium text-gray-800 dark:text-neutral-200 mt-0.5">{item.item_type || '—'}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 uppercase tracking-wider font-semibold">Booking Ref</span>
                        <p className="text-sm font-medium text-gray-800 dark:text-neutral-200 mt-0.5">{item.booking_ref || '—'}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 uppercase tracking-wider font-semibold">Payment</span>
                        <p className="mt-0.5">{statusBadge(item.payment_status)}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 uppercase tracking-wider font-semibold">Discount</span>
                        <p className="text-sm font-medium text-gray-800 dark:text-neutral-200 mt-0.5">{money(item.discount_amount)}</p>
                      </div>
                    </div>

                    {item.addons && item.addons.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-neutral-700">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Add-ons</p>
                        {item.addons.map((addon) => (
                          <div key={addon.booking_addon_id || addon.addon_id} className="flex justify-between text-sm py-0.5">
                            <span className="text-gray-700 dark:text-neutral-300">{addon.title} × {addon.quantity}</span>
                            <span className="text-gray-600">{money(addon.price * addon.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {item.offer_title && (
                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-neutral-700">
                        <p className="text-xs text-emerald-600 font-medium">
                          🎁 Offer: {item.offer_title}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── Quick Actions ── */}
      <Card>
        <CardHeader icon={Send} title="Quick Actions" />
        <div className="px-5 pb-5 flex flex-wrap gap-3">
          {(() => {
            const isConfirmed = bookingStatus === 'CONFIRMED' || bookingStatus === 'Booked';
            const disabledStyle = 'opacity-50 cursor-not-allowed';
            return (
              <>
                <button
                  onClick={() => {
                    const firstBid = items[0]?.booking_id;
                    if (firstBid) {
                      import('../../features/bookings/adminBookingsSlice').then(m => {
                        dispatch(m.resendWhatsAppAdmin({ id: firstBid }));
                      });
                    }
                  }}
                  disabled={!isConfirmed}
                  className={`flex items-center gap-2 rounded-xl border border-green-200 px-4 py-2.5 text-sm font-medium text-green-700 hover:bg-green-50 transition dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20 ${!isConfirmed ? disabledStyle : ''}`}
                  title={!isConfirmed ? 'Booking must be CONFIRMED' : ''}
                >
                  <MessageSquare size={16} /> Send WhatsApp
                </button>
                <button
                  onClick={() => {
                    const firstBid = items[0]?.booking_id;
                    if (firstBid) {
                      import('../../features/bookings/adminBookingsSlice').then(m => {
                        dispatch(m.resendEmailAdmin({ id: firstBid }));
                      });
                    }
                  }}
                  disabled={!isConfirmed}
                  className={`flex items-center gap-2 rounded-xl border border-indigo-200 px-4 py-2.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50 transition dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/20 ${!isConfirmed ? disabledStyle : ''}`}
                  title={!isConfirmed ? 'Booking must be CONFIRMED' : ''}
                >
                  <Mail size={16} /> Send Email
                </button>
                <button
                  onClick={() => {
                    const firstBid = items[0]?.booking_id;
                    if (firstBid) {
                      window.open(`/api/parkpanel/bookings/${firstBid}/ticket`, '_blank');
                    }
                  }}
                  disabled={!isConfirmed}
                  className={`flex items-center gap-2 rounded-xl border border-blue-200 px-4 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-50 transition dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20 ${!isConfirmed ? disabledStyle : ''}`}
                  title={!isConfirmed ? 'Booking must be CONFIRMED' : ''}
                >
                  <Download size={16} /> Download Ticket
                </button>
              </>
            );
          })()}
          <button
            onClick={() => setShowPayPhi(!showPayPhi)}
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <CreditCard size={16} /> Payment Gateway
          </button>
        </div>

        {/* PayPhi controls (expandable) */}
        {showPayPhi && (
          <div className="px-5 pb-5 pt-2 border-t border-gray-100 dark:border-neutral-800">
            <div className="flex flex-wrap gap-2 items-center mb-3">
              <button className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50 transition" onClick={() => dispatch(payphiStatusAdmin({ id }))}>Check Status</button>
              <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Customer email" value={init.email} onChange={(e) => setInit({ ...init, email: e.target.value })} />
              <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Customer mobile" value={init.mobile} onChange={(e) => setInit({ ...init, mobile: e.target.value })} />
              <button className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50 transition" onClick={() => dispatch(payphiInitiateAdmin({ id, email: init.email, mobile: init.mobile }))}>Initiate</button>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <input className="rounded-xl border px-3 py-2 text-sm" placeholder="Refund amount" value={refund.amount} onChange={(e) => setRefund({ ...refund, amount: e.target.value })} />
              <input className="rounded-xl border px-3 py-2 text-sm" placeholder="New merchant Txn (optional)" value={refund.newMerchantTxnNo} onChange={(e) => setRefund({ ...refund, newMerchantTxnNo: e.target.value })} />
              <button className="rounded-xl border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition" onClick={() => dispatch(payphiRefundAdmin({ id, ...refund }))}>Refund</button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Activity Timeline ── */}
      <Card>
        <CardHeader icon={CalendarClock} title="Activity Timeline" />
        <div className="px-5 pb-5">
          {dedupedActivity.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">No activity recorded yet</p>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-gray-200 dark:bg-neutral-700" />

              <div className="space-y-0">
                {dedupedActivity.map((log, idx) => {
                  const { icon: EventIcon, color } = timelineIcon(log.event_type);
                  return (
                    <div key={log.log_id || idx} className="flex gap-4 relative py-3">
                      {/* Icon */}
                      <div className={`w-6 h-6 rounded-xl ${color} flex items-center justify-center shrink-0 z-10 shadow-sm`}>
                        <EventIcon size={12} className="text-white" />
                      </div>
                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-gray-900 dark:text-neutral-100">
                            {timelineLabel(log.event_type)}
                          </p>
                          <time className="text-xs text-gray-400 whitespace-nowrap">{fmtDateTime(log.created_at)}</time>
                        </div>
                        {log.event_detail && (
                          <p className="text-xs text-gray-500 mt-0.5">{log.event_detail}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* ── Custom Redeem Modal Overlay ── */}
      {redeemModalOpen && (
        <div className="custom-overlay" onClick={closeRedeemModal}>
          <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
            {redeemModalState === 'confirm' ? (
              <>
                <div className="custom-modal-header">
                  <div className="custom-modal-icon">
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                      <path d="M20 12V22H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" stroke={redeemNewStatus === 'REDEEMED' ? '#e07b00' : '#4b5563'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <div className="custom-modal-title">{redeemNewStatus === 'REDEEMED' ? 'Redeem Ticket' : 'Mark as Not Redeemed'}</div>
                    <div className="custom-modal-sub">Verify details before marking as {redeemNewStatus === 'REDEEMED' ? 'redeemed' : 'not redeemed'}</div>
                  </div>
                </div>

                <div className="custom-modal-body">
                  <div className="ticket-card">
                    <div className="ticket-row">
                      <div className="ticket-field">
                        <label>Booking ID</label>
                        <div className="val highlight">{orderRef || '—'}</div>
                      </div>
                      <div className="ticket-field" style={{ textAlign: 'right' }}>
                        <label>Amount Paid</label>
                        <div className="val">{money(payment.total)}</div>
                      </div>
                    </div>
                    <hr className="ticket-divider" />
                    <div className="ticket-meta">
                      <div className="ticket-meta-item">
                        <label>Customer</label>
                        <div className="val">{user.name || user.email || '—'}</div>
                        <div className="sub">{user.phone || '—'}</div>
                      </div>
                      <div className="ticket-meta-item">
                        <label>Items</label>
                        <div className="flex flex-col gap-1 mt-1">
                          {(Array.isArray(b.items) ? b.items.filter(it => !it.parent_booking_id) : []).map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1.5">
                              <div className="val">{item.item_title}</div>
                              {item.quantity > 1 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold dark:bg-blue-900/30 dark:text-blue-400">
                                  x{item.quantity}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="sub mt-1">{fmtDate(bookingDate)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="warn-box" style={redeemNewStatus !== 'REDEEMED' ? { backgroundColor: '#f3f4f6', borderColor: '#d1d5db', color: '#374151' } : {}}>
                    {redeemNewStatus === 'REDEEMED' ? (
                      <>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                          <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#e07b00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p>This action is <strong>irreversible</strong>. Once confirmed, this ticket cannot be redeemed again.</p>
                      </>
                    ) : (
                      <p>This will roll back the redeemed status. The ticket will become active again.</p>
                    )}
                  </div>
                </div>

                <div className="custom-modal-footer">
                  <button className="btn-cancel" onClick={closeRedeemModal}>Cancel</button>
                  <button className="btn-confirm" onClick={handleConfirmRedeem} disabled={statusUpdating}>
                    {statusUpdating ? 'Updating...' : (
                      <>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        {redeemNewStatus === 'REDEEMED' ? 'Yes, Redeem Ticket' : 'Yes, Un-redeem Ticket'}
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="success-body">
                <div className="check-circle">
                  <svg width="34" height="34" fill="none" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke="#22a06b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <div className="success-title">Ticket {redeemNewStatus === 'REDEEMED' ? 'Redeemed' : 'Un-redeemed'}!</div>
                <div className="success-sub">Booking status updated successfully.</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div >
  );
}
