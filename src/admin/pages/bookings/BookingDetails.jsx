import React from 'react';
import dayjs from 'dayjs';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAdminBooking, updateAdminBooking, cancelAdminBooking,
  payphiStatusAdmin, payphiInitiateAdmin, payphiRefundAdmin
} from '../../features/bookings/adminBookingsSlice';

const SectionCard = ({ title, subtitle, children, className = '' }) => (
  <div className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:bg-neutral-900 dark:border-neutral-800 ${className}`}>
    <div className="flex items-start justify-between mb-4">
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-neutral-100">{title}</p>
        {subtitle ? <p className="text-xs text-gray-500">{subtitle}</p> : null}
      </div>
    </div>
    {children}
  </div>
);

const Field = ({ label, value, muted }) => (
  <div>
    <div className={`text-xs font-semibold uppercase tracking-wide ${muted ? 'text-gray-400' : 'text-gray-500'}`}>{label}</div>
    <div className="text-sm font-medium text-gray-900 break-words">{value ?? '—'}</div>
  </div>
);

export default function BookingDetails() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { current, action } = useSelector((s) => s.adminBookings);
  const [patch, setPatch] = React.useState({ payment_status: '', booking_status: '', payment_ref: '' });
  const [refund, setRefund] = React.useState({ amount: '', newMerchantTxnNo: '' });
  const [init, setInit] = React.useState({ email: '', mobile: '' });

  React.useEffect(() => {
    dispatch(getAdminBooking({ id }));
  }, [id, dispatch]);

  const b = current.data;

  if (current.status === 'loading' && !b) return <div>Loading…</div>;
  if (current.status === 'failed') {
    const isForbidden = current.error?.status === 403 || /forbidden/i.test(current.error?.message || '');
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        {isForbidden
          ? (
            <>
              <p className="font-semibold mb-1">You don't have permission to view this booking.</p>
              <p className="text-amber-700">The attraction is outside your assigned scope. Please contact a super admin if you need access.</p>
            </>
          )
          : (current.error?.message || 'Failed to load booking')}
      </div>
    );
  }

  const onSave = async () => {
    await dispatch(updateAdminBooking({ id, patch })).unwrap().catch(() => {});
    dispatch(getAdminBooking({ id }));
  };

  return (
    <div className="space-y-6">
      <SectionCard
        title={`Booking #${b?.booking_ref || b?.booking_id || id}`}
        subtitle={b?.created_at ? `Created ${dayjs(b.created_at).format('DD MMM YYYY · h:mm A')}` : null}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="User" value={b?.user?.email || b?.user_email || '—'} />
          <Field label="Contact" value={b?.user?.phone || b?.user_phone || '—'} />
          <Field label="Item" value={b?.item_title || b?.attraction_title || b?.combo_title || '—'} />
          <Field label="Amount" value={`₹${Number(b?.final_amount ?? b?.total_amount ?? 0).toLocaleString()}`} />
          <Field label="Payment Status" value={b?.payment_status} />
          <Field label="Booking Status" value={b?.booking_status} />
          <Field label="Slot" value={b?.slot_label || `${b?.slot_start_time || ''} ${b?.slot_end_time ? `- ${b.slot_end_time}` : ''}` || '—'} />
          <Field label="Offer" value={b?.offer_title || '—'} muted />
        </div>
      </SectionCard>

      <SectionCard title="Update Statuses" subtitle="Manually reconcile payment and fulfilment">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select className="rounded-lg border px-3 py-2" value={patch.payment_status} onChange={(e) => setPatch({ ...patch, payment_status: e.target.value })}>
            <option value="">Payment status</option>
            <option>Pending</option><option>Completed</option><option>Failed</option><option>Cancelled</option>
          </select>
          <select className="rounded-lg border px-3 py-2" value={patch.booking_status} onChange={(e) => setPatch({ ...patch, booking_status: e.target.value })}>
            <option value="">Booking status</option>
            <option>Booked</option><option>Redeemed</option><option>Expired</option><option>Cancelled</option>
          </select>
          <input className="rounded-lg border px-3 py-2" placeholder="Payment reference" value={patch.payment_ref} onChange={(e) => setPatch({ ...patch, payment_ref: e.target.value })} />
        </div>
        <div className="flex gap-3 mt-4">
          <button className="rounded-lg bg-gray-900 text-white px-4 py-2 text-sm" onClick={onSave} disabled={action.status === 'loading'}>
            {action.status === 'loading' ? 'Saving…' : 'Save changes'}
          </button>
          <button className="rounded-lg border px-4 py-2 text-sm" onClick={() => dispatch(getAdminBooking({ id }))}>
            Refresh data
          </button>
        </div>
      </SectionCard>

      <SectionCard title="PayPhi" subtitle="Payment gateway controls">
        <div className="flex flex-wrap gap-2 items-center">
          <button className="rounded-full border px-4 py-2 text-sm" onClick={() => dispatch(payphiStatusAdmin({ id }))}>Check Status</button>
          <input className="rounded-full border px-3 py-2 text-sm" placeholder="Customer email" value={init.email} onChange={(e) => setInit({ ...init, email: e.target.value })} />
          <input className="rounded-full border px-3 py-2 text-sm" placeholder="Customer mobile" value={init.mobile} onChange={(e) => setInit({ ...init, mobile: e.target.value })} />
          <button className="rounded-full border px-4 py-2 text-sm" onClick={() => dispatch(payphiInitiateAdmin({ id, email: init.email, mobile: init.mobile }))}>Initiate Collection</button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <input className="rounded-lg border px-3 py-2 text-sm" placeholder="Refund amount" value={refund.amount} onChange={(e) => setRefund({ ...refund, amount: e.target.value })} />
          <input className="rounded-lg border px-3 py-2 text-sm" placeholder="New merchant Txn (optional)" value={refund.newMerchantTxnNo} onChange={(e) => setRefund({ ...refund, newMerchantTxnNo: e.target.value })} />
          <button className="rounded-lg border px-4 py-2 text-sm text-red-600" onClick={() => dispatch(payphiRefundAdmin({ id, ...refund }))}>Trigger Refund</button>
        </div>
      </SectionCard>

      <SectionCard title="Danger Zone" subtitle="Irreversible operations" className="border-red-200">
        <button className="rounded-lg border px-4 py-2 text-sm text-red-600" onClick={() => dispatch(cancelAdminBooking({ id }))}>Cancel Booking</button>
      </SectionCard>
    </div>
  );
}

