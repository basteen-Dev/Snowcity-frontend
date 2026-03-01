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

function formatTime12(t) {
  if (!t) return '';
  const [h, m] = String(t).split(':');
  if (!h || !m) return '';
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${m.padStart(2, '0')} ${ampm}`;
}

const statusBadge = (status, type = 'booking') => {
  const colors = {
    Booked: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    Redeemed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    Expired: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    Cancelled: 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400',
    Completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    Failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return (
    <span className={`inline-flex items-center rounded-xl px-3 py-1 text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {status || '—'}
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
  if (eventType.startsWith('payment_completed')) return { icon: CheckCircle2, color: 'bg-emerald-500' };
  if (eventType.startsWith('payment_')) return { icon: CreditCard, color: 'bg-amber-500' };
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
    payment_pending: 'Payment Initiated',
    payment_failed: 'Payment Failed',
    payment_cancelled: 'Payment Cancelled',
    status_booked: 'Status → Booked',
    status_redeemed: 'Ticket Redeemed',
    status_expired: 'Ticket Expired',
    status_cancelled: 'Booking Cancelled',
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
  const items = b.items || [];
  const activity = b.activity || [];
  const bookingDate = b.booking_date;
  const bookingStatus = b.booking_status || items[0]?.booking_status || '—';

  const toggleItem = (bookingId) => {
    setExpandedItems(prev => ({ ...prev, [bookingId]: !prev[bookingId] }));
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/bookings')}
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
          {/* Status update dropdown */}
          <select
            className={`rounded-xl border px-3 py-2 text-sm font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${bookingStatus === 'Redeemed' ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700'
              : bookingStatus === 'Cancelled' ? 'border-gray-300 bg-gray-50 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-600'
                : bookingStatus === 'Expired' ? 'border-orange-300 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700'
                  : 'border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700'
              } ${statusUpdating ? 'opacity-50 pointer-events-none' : ''}`}
            value={bookingStatus}
            onChange={async (e) => {
              const newStatus = e.target.value;
              if (newStatus === bookingStatus) return;
              const firstBookingId = items[0]?.booking_id;
              if (!firstBookingId) return;
              const ok = window.confirm(`Change status from "${bookingStatus}" to "${newStatus}"?\n\nThis will update all items in this order.`);
              if (!ok) { e.target.value = bookingStatus; return; }
              setStatusUpdating(true);
              try {
                await dispatch(updateAdminBooking({ id: firstBookingId, patch: { booking_status: newStatus, propagate: true } })).unwrap();
                dispatch(getAdminBooking({ id }));
              } catch (err) {
                window.alert(err?.message || 'Failed to update status');
              } finally {
                setStatusUpdating(false);
              }
            }}
            disabled={statusUpdating}
          >
            <option value="Booked">Booked</option>
            <option value="Redeemed">Redeemed</option>
            <option value="Expired">Expired</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          <button
            onClick={() => dispatch(cancelAdminBooking({ id }))}
            className="rounded-xl border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition dark:border-red-800 dark:hover:bg-red-900/20"
          >
            <XCircle size={14} className="inline mr-1" /> Cancel
          </button>
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
          <div className="px-5 pb-5 grid grid-cols-2 gap-x-4 gap-y-1">
            <InfoRow icon={IndianRupee} label="Total" value={money(payment.total)} />
            <InfoRow icon={IndianRupee} label="Paid" value={money(payment.paid)} />
            <InfoRow icon={CreditCard} label="Method" value={payment.mode || '—'} />
            <InfoRow icon={Ticket} label="Txn ID" value={payment.ref || payment.txn_no || '—'} />
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
                    <div className={`w-2 h-2 rounded-xl shrink-0 ${item.booking_status === 'Redeemed' ? 'bg-emerald-500' : item.booking_status === 'Cancelled' ? 'bg-red-400' : 'bg-blue-500'}`} />
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
                      {statusBadge(item.booking_status)}
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
          <button
            onClick={() => {
              const firstBid = items[0]?.booking_id;
              if (firstBid) {
                import('../../features/bookings/adminBookingsSlice').then(m => {
                  dispatch(m.resendWhatsAppAdmin({ id: firstBid }));
                });
              }
            }}
            className="flex items-center gap-2 rounded-xl border border-green-200 px-4 py-2.5 text-sm font-medium text-green-700 hover:bg-green-50 transition dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20"
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
            className="flex items-center gap-2 rounded-xl border border-indigo-200 px-4 py-2.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50 transition dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
          >
            <Mail size={16} /> Send Email
          </button>
          <button
            onClick={() => {
              const firstBid = items[0]?.booking_id;
              if (firstBid) {
                window.open(`/api/admin/bookings/${firstBid}/ticket`, '_blank');
              }
            }}
            className="flex items-center gap-2 rounded-xl border border-blue-200 px-4 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-50 transition dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20"
          >
            <Download size={16} /> Download Ticket
          </button>
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
    </div>
  );
}
