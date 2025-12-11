import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import {
  listMyBookings,
  checkPayPhiStatus,
  initiatePayPhi
} from '../features/bookings/bookingsSlice';
import { formatCurrency } from '../utils/formatters';
import { absoluteUrl } from '../utils/media';
import { ChevronDown, ChevronUp, FileText, RefreshCcw, CreditCard, CheckCircle, AlertCircle, Clock } from 'lucide-react';

/* ========== Helpers ========== */
const Pill = ({ text, tone }) => {
  const map = {
    green: 'bg-green-100 text-green-700 border-green-200',
    red: 'bg-red-100 text-red-700 border-red-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200'
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${map[tone] || map.gray}`}>{text}</span>;
};

const statusConfig = (status) => {
  const u = String(status || '').trim().toUpperCase();
  if (['COMPLETED', 'SUCCESS', 'PAID', 'CONFIRMED'].includes(u)) return { tone: 'green', icon: CheckCircle, label: 'Paid' };
  if (['FAILED', 'DECLINED', 'CANCELLED', 'CANCELED'].includes(u)) return { tone: 'red', icon: AlertCircle, label: 'Failed' };
  return { tone: 'yellow', icon: Clock, label: 'Pending' };
};

const normalizePayphiMobile = (s) => {
  const digits = String(s || '').replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
};

// Format '14:30:00' to '2:30 PM'
const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = String(timeStr).split(':');
  if (!h || !m) return '';
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
};

const buildOrderItems = (items = []) => {
  if (!Array.isArray(items) || !items.length) return [];
  const map = new Map();
  items.forEach((item) => {
    map.set(item.booking_id, { ...item, child_items: [] });
  });
  map.forEach((item) => {
    if (item.parent_booking_id && map.has(item.parent_booking_id)) {
      map.get(item.parent_booking_id).child_items.push(item);
    }
  });
  const roots = Array.from(map.values()).filter((item) => !item.parent_booking_id);
  return roots.length ? roots : Array.from(map.values());
};

const getDisplayTitle = (item) => {
  if (!item) return 'Ticket';
  if (String(item.item_type).toLowerCase() === 'combo') {
    return item.combo_title || item.combo_name || item.item_title || (item.combo_id ? `Combo #${item.combo_id}` : 'Combo');
  }
  return item.item_title || item.attraction_title || 'Ticket';
};

// Get nice slot label
const getSlotDisplay = (item) => {
  // Debug logging to see what data we actually have
  console.log('🔍 DEBUG MyBookings item data:', {
    booking_id: item.booking_id,
    slot_start_time: item.slot_start_time,
    slot_end_time: item.slot_end_time,
    start_time: item.start_time,
    end_time: item.end_time,
    slot_label: item.slot_label,
    booking_time: item.booking_time,
    full_item: item
  });
  
  // Try to get explicit times first
  const start = formatTime(item.slot_start_time || item.start_time);
  const end = formatTime(item.slot_end_time || item.end_time);
  
  if (start && end) {
    const result = `${start} - ${end}`;
    console.log('🔍 DEBUG MyBookings using start/end times:', result);
    return result;
  }
  if (start) {
    console.log('🔍 DEBUG MyBookings using start time only:', start);
    return start;
  }
  if (item.slot_label) {
    console.log('🔍 DEBUG MyBookings using slot_label:', item.slot_label);
    return item.slot_label;
  }
  
  // Fallback to booking_time if slot is missing
  const fallback = formatTime(item.booking_time) || 'Slot Time';
  console.log('🔍 DEBUG MyBookings using booking_time fallback:', fallback);
  return fallback;
};

/* ========== Component ========== */
export default function MyBookings() {
  const dispatch = useDispatch();
  const { status, items, error } = useSelector((s) => s.bookings.list);
  const payphi = useSelector((s) => s.bookings.payphi);
  const user = useSelector((s) => s.auth?.user);

  // Group items by Order ID and Calculate Totals Correctly
  const orders = useMemo(() => {
    if (!Array.isArray(items)) return [];
    
    const grouped = new Map();
    
    items.forEach(item => {
      const key = item.order_id || item.booking_id || item.id;
      
      if (!grouped.has(key)) {
        grouped.set(key, {
          id: key,
          ref: item.order_ref || item.booking_ref, // Prefer Order Ref
          date: item.created_at,
          status: item.payment_status,
          items: [],
          calculatedTotal: 0 // Initialize total
        });
      }
      
      const order = grouped.get(key);
      order.items.push(item);
    });
    grouped.forEach((order) => {
      order.primaryItems = buildOrderItems(order.items);
      order.primaryItems.forEach((item) => {
        if (Array.isArray(item.child_items) && item.child_items.length) {
          item.child_items = [...item.child_items].sort((a, b) => {
            const aTime = a.slot_start_time || a.booking_time || '';
            const bTime = b.slot_start_time || b.booking_time || '';
            return String(aTime).localeCompare(String(bTime));
          });
        }
      });
      const primary = order.primaryItems.length ? order.primaryItems : order.items;
      order.itemCount = primary.length;
      order.calculatedTotal = primary.reduce(
        (acc, item) => acc + Number(item.final_amount || item.total_amount || 0),
        0
      );
    });

    // Convert Map to Array and Sort by Date Descending
    return Array.from(grouped.values()).sort((a,b) => new Date(b.date) - new Date(a.date));
  }, [items]);

  const [expandedOrder, setExpandedOrder] = useState(null);
  const [retryOrder, setRetryOrder] = useState(null);
  const [payEmail, setPayEmail] = useState('');
  const [payMobile, setPayMobile] = useState('');

  useEffect(() => { dispatch(listMyBookings({ page: 1, limit: 50 })); }, [dispatch]);

  useEffect(() => {
    setPayEmail(user?.email || '');
    setPayMobile(user?.phone || '');
  }, [user]);

  const refresh = () => dispatch(listMyBookings({ page: 1, limit: 50 }));

  const onRetry = async (order) => {
    const email = (payEmail || user?.email || '').trim();
    const mobile = normalizePayphiMobile(payMobile || user?.phone || '');

    if (!email || !mobile || mobile.length < 10) {
      alert('Please enter a valid email and 10-digit mobile to continue.');
      return;
    }

    try {
        // Pass Order ID to initiate payment
        const res = await dispatch(initiatePayPhi({ bookingId: order.id, email, mobile })).unwrap();
        if (res?.redirectUrl) {
            window.location.href = res.redirectUrl;
        } else {
            alert('Payment initiation failed. Please try again.');
        }
    } catch (err) {
        alert(`Payment failed: ${err.message || 'Unknown error'}`);
    }
  };

  const onCheckStatus = async (orderId) => {
    await dispatch(checkPayPhiStatus({ bookingId: orderId })).unwrap();
    refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#e0f2fe] via-[#bae6fd] to-white px-4 py-8">
      <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-500 text-sm">Track your tickets and payment status</p>
        </div>
        <button
          onClick={refresh}
          disabled={status === 'loading'}
          className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
          title="Refresh List"
        >
          <RefreshCcw size={20} className={status === 'loading' ? 'animate-spin' : ''} />
        </button>
      </div>

      {status === 'failed' && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 text-sm text-center">
          {error?.message || 'Failed to load orders.'}
        </div>
      )}

      {status === 'succeeded' && orders.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
          <p className="text-gray-500">No orders found.</p>
        </div>
      )}

      <div className="space-y-6">
        {orders.map((order) => {
          const meta = statusConfig(order.status);
          const Icon = meta.icon;
          const isExpanded = expandedOrder === order.id;
          const isRetry = retryOrder === order.id;
          const canPay = meta.label === 'Pending';

          return (
            <div key={order.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md">
              
              {/* Order Header (Click to Expand) */}
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none" onClick={() => setExpandedOrder(isExpanded ? null : order.id)}>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-full ${meta.tone === 'green' ? 'bg-green-50 text-green-600' : meta.tone === 'red' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'}`}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900">Order #{order.ref}</span>
                      <Pill text={meta.label} tone={meta.tone} />
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {dayjs(order.date).format('DD MMM YYYY • h:mm A')}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {order.itemCount || order.items.length} Item{(order.itemCount || order.items.length) !== 1 && 's'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                  <div className="text-right">
                    <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Total</div>
                    <div className="text-2xl font-bold text-gray-900">{formatCurrency(order.calculatedTotal)}</div>
                  </div>
                  <div className="text-gray-400">
                    {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                  </div>
                </div>
              </div>

              {/* Expanded Details (Order Items) */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50/50 p-5 animate-slide-down">
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Order Items</h4>
                  <div className="space-y-3">
                    {(order.primaryItems && order.primaryItems.length ? order.primaryItems : order.items).map((item, idx) => {
                        const slotStr = getSlotDisplay(item);
                        const itemTotal = Number(item.final_amount || item.total_amount || 0);

                        return (
                          <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div>
                              <div className="font-medium text-gray-800 text-base">
                                {getDisplayTitle(item)}
                              </div>
                              <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                <span>{dayjs(item.booking_date).format('DD MMM')}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                <span>{slotStr}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                <span>Qty: {item.quantity}</span>
                              </div>
                            </div>
                            <div className="font-bold text-gray-900">
                              {formatCurrency(itemTotal)}
                            </div>
                          </div>
                        );
                    })}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex flex-wrap gap-3 border-t border-gray-200 pt-4">
                    {meta.label === 'Paid' && (
                      <a 
                        href={absoluteUrl(order.items[0]?.ticket_pdf)} 
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <FileText size={18} /> Download Ticket(s)
                      </a>
                    )}
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); onCheckStatus(order.id); }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <RefreshCcw size={18} /> Check Status
                    </button>

                    {canPay && !isRetry && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setRetryOrder(order.id); }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm ml-auto"
                      >
                        <CreditCard size={18} /> Pay Now
                      </button>
                    )}
                  </div>

                  {/* Retry Payment Form */}
                  {isRetry && (
                    <div className="mt-4 bg-white border border-blue-100 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                      <h5 className="text-sm font-bold text-gray-800 mb-3">Complete Payment for Order #{order.ref}</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Email</label>
                            <input 
                              type="email" 
                              className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              value={payEmail}
                              onChange={e => setPayEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Mobile</label>
                            <input 
                              type="tel" 
                              className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              value={payMobile}
                              onChange={e => setPayMobile(e.target.value)}
                            />
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => onRetry(order)}
                          disabled={payphi.status === 'loading'}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 shadow-md transition-all"
                        >
                          {payphi.status === 'loading' ? 'Processing...' : 'Proceed to Payment Gateway'}
                        </button>
                        <button 
                          onClick={() => setRetryOrder(null)}
                          className="px-4 py-2 text-gray-500 text-sm hover:text-gray-700 font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  </div>
  );
}