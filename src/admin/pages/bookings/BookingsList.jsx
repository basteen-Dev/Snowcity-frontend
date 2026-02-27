import React from 'react';
import dayjs from 'dayjs';
import { useDispatch, useSelector } from 'react-redux';
import { listAdminBookings, updateAdminBooking, resendTicketAdmin, resendWhatsAppAdmin, resendEmailAdmin } from '../../features/bookings/adminBookingsSlice';
import AdminTable from '../../components/common/AdminTable';
import TablePagination from '../../components/common/TablePagination';
import { useNavigate } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';

import {
  Search, Filter, ChevronLeft, ChevronRight, RotateCcw,
  MoreVertical, Eye, MessageSquare, Mail, Download, ChevronDown
} from 'lucide-react';

/* ─── Shared UI ──────────────────────────────────────────── */
const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString()}`;

const inputClasses = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all placeholder:text-gray-400';
const selectClasses = `${inputClasses} appearance-none cursor-pointer`;
const btnPrimary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 text-sm font-semibold shadow-sm shadow-blue-500/20 hover:shadow-md hover:shadow-blue-500/30 transition-all';
const btnSecondary = 'inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800 transition-all';

const normalizeOptionList = (res) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.items)) return res.items;
  if (Array.isArray(res.results)) return res.results;
  if (res.data && Array.isArray(res.data.items)) return res.data.items;
  if (res.data && Array.isArray(res.data.results)) return res.data.results;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  if (res.meta && Array.isArray(res.meta.data)) return res.meta.data;
  if (typeof res.data === 'object' && res.data !== null && !Array.isArray(res.data) && Object.keys(res.data).length > 0) {
    const firstValue = Object.values(res.data)[0];
    if (Array.isArray(firstValue)) return firstValue;
  }
  return [];
};

const quickRanges = [
  { key: 'today', label: 'Today', from: () => dayjs().startOf('day'), to: () => dayjs().endOf('day') },
  { key: 'yesterday', label: 'Yesterday', from: () => dayjs().subtract(1, 'day').startOf('day'), to: () => dayjs().subtract(1, 'day').endOf('day') },
  { key: 'tomorrow', label: 'Tomorrow', from: () => dayjs().add(1, 'day').startOf('day'), to: () => dayjs().add(1, 'day').endOf('day') },
  { key: 'thisWeek', label: 'This Week', from: () => dayjs().startOf('week'), to: () => dayjs().endOf('week') },
  { key: 'thisMonth', label: 'This Month', from: () => dayjs().startOf('month'), to: () => dayjs().endOf('month') },
  { key: 'last7', label: 'Last 7 days', from: () => dayjs().subtract(6, 'day').startOf('day'), to: () => dayjs().endOf('day') },
  { key: 'last30', label: 'Last 30 days', from: () => dayjs().subtract(29, 'day').startOf('day'), to: () => dayjs().endOf('day') },
  { key: 'all', label: 'All time', from: () => null, to: () => null }
];

/* ─── 3-dot Action Menu ──────────────────────────────────── */
const ActionMenu = ({ row, onView, onWhatsApp, onEmail, onDownload }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    if (open) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
      >
        <MoreVertical size={16} className="text-gray-500" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-xl border border-gray-200 bg-white shadow-lg dark:bg-neutral-900 dark:border-neutral-700 py-1 animate-in fade-in slide-in-from-top-1">
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onView(row); }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          >
            <Eye size={15} className="text-blue-500" /> View Details
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onWhatsApp(row); }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          >
            <MessageSquare size={15} className="text-green-500" /> Send WhatsApp
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onEmail(row); }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          >
            <Mail size={15} className="text-indigo-500" /> Send Email
          </button>
          <div className="border-t border-gray-100 dark:border-neutral-700 my-1" />
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onDownload(row); }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          >
            <Download size={15} className="text-cyan-500" /> Download Ticket
          </button>
        </div>
      )}
    </div>
  );
};

/* ─── Main Component ─────────────────────────────────────── */

export default function BookingsList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list } = useSelector((s) => s.adminBookings);
  const { user } = useSelector((s) => s.adminAuth);
  const rows = React.useMemo(() => (Array.isArray(list.data) ? list.data : []), [list.data]);

  const [filters, setFilters] = React.useState({
    search: '',
    payment_status: '',   // Default: ALL (no filter)
    booking_status: '',
    attraction_id: '',
    combo_id: '',
    offer_id: '',
    user_email: '',
    user_phone: '',
    item_type: '',
    date_from: '',
    date_to: ''
  });
  const [options, setOptions] = React.useState({ status: 'idle', attractions: [], combos: [], offers: [] });
  const [activeRange, setActiveRange] = React.useState('all');
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const [showFilters, setShowFilters] = React.useState(false); // Default: collapsed
  const searchTimerRef = React.useRef(null);
  const [statusUpdating, setStatusUpdating] = React.useState(null);
  const [autoSync, setAutoSync] = React.useState(true);

  // Auto-sync: poll every 15s for new bookings
  React.useEffect(() => {
    // Initial load
    dispatch(listAdminBookings({ page: 1, limit: rowsPerPage }));

    if (!autoSync) return;

    const poll = () => {
      if (document.hidden) return; // skip if tab not visible
      dispatch(listAdminBookings({ ...buildQuery(), page: currPageRef.current, limit: rowsPerPage }));
    };

    const intervalId = setInterval(poll, 15000);

    // Pause on tab hide, resume on tab show
    const onVisibility = () => {
      if (!document.hidden) poll(); // immediate fetch on tab return
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSync, rowsPerPage]);

  const currPageRef = React.useRef(1);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (options.status !== 'idle') return;
      setOptions((s) => ({ ...s, status: 'loading' }));
      try {
        const [attractionsRes, combosRes, offersRes] = await Promise.all([
          adminApi.get(A.attractions(), { params: { limit: 1000 } }),
          adminApi.get(A.combos(), { params: { limit: 1000 } }),
          adminApi.get(A.offers(), { params: { limit: 1000 } }),
        ]);
        if (cancelled) return;

        const userRoles = Array.isArray(user?.roles) ? user.roles.map(r => String(r).toLowerCase()) : [];
        const userScopes = user?.scopes || {};
        const isSubadmin = userRoles.includes('subadmin') && !userRoles.includes('admin') && !userRoles.includes('root');

        let allAttractions = normalizeOptionList(attractionsRes);
        let allCombos = normalizeOptionList(combosRes);
        const allOffers = normalizeOptionList(offersRes);

        let filteredAttractions = allAttractions;
        let filteredCombos = allCombos;

        if (isSubadmin) {
          const allowedAttractionIds = userScopes.attraction || [];
          const allowedComboIds = userScopes.combo || [];
          if (allowedAttractionIds.length > 0) {
            filteredAttractions = allAttractions.filter(a =>
              allowedAttractionIds.includes(a.attraction_id) || allowedAttractionIds.includes(a.id)
            );
          } else {
            filteredAttractions = [];
          }
          if (allowedComboIds.length > 0) {
            filteredCombos = allCombos.filter(c =>
              allowedComboIds.includes(c.combo_id) || allowedComboIds.includes(c.id)
            );
          } else {
            filteredCombos = [];
          }
        }

        setOptions({
          status: 'succeeded',
          attractions: filteredAttractions,
          combos: filteredCombos,
          offers: allOffers,
        });
      } catch (err) {
        if (cancelled) return;
        setOptions((s) => ({ ...s, status: 'failed', error: err }));
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const buildQuery = React.useCallback((extra = {}) => {
    const merged = { ...filters, ...extra };
    const clean = {};
    Object.entries(merged).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (typeof value === 'string' && value.trim() === '') return;
      clean[key] = value;
    });
    return clean;
  }, [filters]);

  /* ─── Filter helpers ───────────────────────────────────── */

  const applyFilters = React.useCallback(() => {
    dispatch(listAdminBookings({ ...buildQuery(), page: 1, limit: rowsPerPage }));
  }, [buildQuery, dispatch, rowsPerPage]);

  const resetFilters = React.useCallback(() => {
    setFilters({ search: '', payment_status: '', booking_status: '', attraction_id: '', combo_id: '', offer_id: '', user_email: '', user_phone: '', item_type: '', date_from: '', date_to: '' });
    dispatch(listAdminBookings({ page: 1, limit: rowsPerPage }));
    setActiveRange('all');
  }, [dispatch, rowsPerPage]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearchChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      const next = { ...filters, [field]: value };
      const clean = {};
      Object.entries(next).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        if (typeof v === 'string' && v.trim() === '') return;
        clean[k] = v;
      });
      dispatch(listAdminBookings({ ...clean, page: 1, limit: rowsPerPage }));
    }, 400);
  };

  React.useEffect(() => {
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, []);

  const handleFilterKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      applyFilters();
    }
  };

  const handleSelectChange = (field, value) => {
    const next = { ...filters, [field]: value };
    setFilters(next);
    const clean = {};
    Object.entries(next).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      if (typeof v === 'string' && v.trim() === '') return;
      clean[k] = v;
    });
    dispatch(listAdminBookings({ ...clean, page: 1, limit: rowsPerPage }));
  };

  // Inline status change — propagate to all sibling bookings in same order
  const handleInlineStatusChange = async (row, newStatus) => {
    const bookingId = row.booking_id ?? row.id;
    if (!bookingId) return;
    const oldStatus = row.booking_status || 'Unknown';
    if (newStatus === oldStatus) return;
    const ok = window.confirm(`Change booking #${row.booking_ref || bookingId} status from "${oldStatus}" to "${newStatus}"?\n\nThis will update all items in this order.`);
    if (!ok) return;
    setStatusUpdating(bookingId);
    try {
      await dispatch(updateAdminBooking({ id: bookingId, patch: { booking_status: newStatus, propagate: true } })).unwrap();
      dispatch(listAdminBookings({ ...buildQuery(), page: currPage, limit: rowsPerPage }));
    } catch (err) {
      window.alert(err?.message || 'Failed to update status');
    } finally {
      setStatusUpdating(null);
    }
  };

  const stepSingleDate = (days) => {
    const base = filters.date_from ? dayjs(filters.date_from) : dayjs();
    const next = base.add(days, 'day');
    const formatted = next.format('YYYY-MM-DD');
    setFilters((prev) => ({ ...prev, date_from: formatted, date_to: formatted }));
    setActiveRange('custom');
    dispatch(listAdminBookings({ ...buildQuery({ date_from: formatted, date_to: formatted }), page: 1, limit: rowsPerPage }));
  };

  const applyQuickRange = React.useCallback((key) => {
    const range = quickRanges.find((r) => r.key === key);
    if (!range) return;
    const from = range.from();
    const to = range.to();
    setFilters((prev) => ({
      ...prev,
      date_from: from ? from.format('YYYY-MM-DD') : '',
      date_to: to ? to.format('YYYY-MM-DD') : ''
    }));
    setActiveRange(key);
    dispatch(listAdminBookings({
      ...buildQuery({
        date_from: from ? from.format('YYYY-MM-DD') : undefined,
        date_to: to ? to.format('YYYY-MM-DD') : undefined
      }),
      page: 1,
      limit: rowsPerPage
    }));
  }, [buildQuery, dispatch, rowsPerPage]);

  const meta = list.meta || {};
  const currPage = meta.page || list.query.page || 1;
  currPageRef.current = currPage;

  const ticketUrl = React.useCallback((path) => {
    if (!path) return null;
    if (/^https?:/i.test(path)) return path;
    const base = import.meta.env?.VITE_API_BASE_URL || '';
    if (base) return `${base.replace(/\/$/, '')}${path}`;
    return path;
  }, []);

  const handleDownloadTicket = (row) => {
    if (!row.ticket_pdf) { window.alert('Ticket PDF not available yet.'); return; }
    const url = ticketUrl(row.ticket_pdf);
    if (url) window.open(url, '_blank', 'noopener');
  };

  const handleResendWhatsApp = async (row) => {
    if (!row.booking_id) return;
    if (!window.confirm('Resend ticket via WhatsApp to this user?')) return;
    try {
      await dispatch(resendWhatsAppAdmin({ id: row.booking_id })).unwrap();
      window.alert('WhatsApp ticket resend initiated.');
    } catch (err) { window.alert(err?.message || 'Failed to resend WhatsApp ticket'); }
  };

  const handleResendEmail = async (row) => {
    if (!row.booking_id) return;
    if (!window.confirm('Resend ticket via email to this user?')) return;
    try {
      await dispatch(resendEmailAdmin({ id: row.booking_id })).unwrap();
      window.alert('Email ticket resend initiated.');
    } catch (err) { window.alert(err?.message || 'Failed to resend email ticket'); }
  };

  /* ─── Subadmin check ───────────────────────────────────── */
  const userRoles = React.useMemo(() => Array.isArray(user?.roles) ? user.roles.map(r => String(r).toLowerCase()) : [], [user]);
  const isSubadmin = userRoles.includes('subadmin') && !userRoles.includes('admin') && !userRoles.includes('root');

  /* ─── Active filter count ──────────────────────────────── */
  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (filters.payment_status) count++;
    if (filters.booking_status) count++;
    if (filters.attraction_id) count++;
    if (filters.combo_id) count++;
    if (filters.offer_id) count++;
    if (filters.user_email) count++;
    if (filters.user_phone) count++;
    if (filters.item_type) count++;
    if (filters.date_from) count++;
    return count;
  }, [filters]);

  /* ─── Render ───────────────────────────────────────────── */

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">Bookings</h1>
            <p className="text-sm text-gray-500 dark:text-neutral-400 mt-0.5">Manage all bookings</p>
          </div>
          <button
            onClick={() => setAutoSync(!autoSync)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border transition-all ${autoSync
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-400'
              : 'bg-gray-50 border-gray-200 text-gray-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400'}`}
            title={autoSync ? 'Auto-sync ON (every 15s) — click to disable' : 'Auto-sync OFF — click to enable'}
          >
            <span className={`inline-block w-2 h-2 rounded-full ${autoSync ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
            {autoSync ? 'Live' : 'Paused'}
          </button>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {quickRanges.map((range) => (
            <button
              key={range.key}
              onClick={() => applyQuickRange(range.key)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-all ${activeRange === range.key
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-sm shadow-blue-500/20'
                : 'border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800'}`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
        {/* Always-visible: search bar + filter toggle */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              className={`${inputClasses} pl-9`}
              placeholder="Search ref, email, phone…"
              value={filters.search}
              onChange={(e) => handleSearchChange('search', e.target.value)}
              onKeyDown={handleFilterKeyDown}
            />
          </div>
          <button
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${showFilters
              ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-400'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800'}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showFilters && (
          <div className="px-4 pb-4 border-t border-gray-100 dark:border-neutral-800 pt-3 space-y-3">
            {isSubadmin && (
              <div className="bg-blue-50 text-blue-900 border border-blue-200 rounded-xl px-3 py-2 text-xs dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                <strong>Subadmin Access:</strong> Viewing attractions and combos from your assigned bookings only.
              </div>
            )}

            {/* Row 1: Payment + Booking Status + Item Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <select className={selectClasses} value={filters.payment_status} onChange={(e) => handleSelectChange('payment_status', e.target.value)}>
                <option value="">Payment: All</option>
                <option>Pending</option><option>Completed</option><option>Failed</option><option>Cancelled</option>
              </select>
              <select className={selectClasses} value={filters.booking_status} onChange={(e) => handleSelectChange('booking_status', e.target.value)}>
                <option value="">Booking: All</option>
                <option>Booked</option><option>Redeemed</option><option>Expired</option><option>Cancelled</option>
              </select>
              <select className={selectClasses} value={filters.item_type} onChange={(e) => handleSelectChange('item_type', e.target.value)}>
                <option value="">Item Type: All</option>
                <option value="Attraction">Attraction</option>
                <option value="Combo">Combo</option>
              </select>
            </div>

            {/* Row 2: Attraction + Combo + Offer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <select className={selectClasses} value={filters.attraction_id} onChange={(e) => handleSelectChange('attraction_id', e.target.value)} disabled={options.status === 'loading'}>
                <option value="">{options.status === 'loading' ? 'Loading…' : 'All Attractions'}</option>
                {options.status === 'succeeded' && (options.attractions || []).map((a) => (
                  <option key={a.attraction_id || a.id} value={a.attraction_id || a.id}>{a.title || a.name || `#${a.attraction_id || a.id}`}</option>
                ))}
              </select>
              <select className={selectClasses} value={filters.combo_id} onChange={(e) => handleSelectChange('combo_id', e.target.value)} disabled={options.status === 'loading'}>
                <option value="">{options.status === 'loading' ? 'Loading…' : 'All Combos'}</option>
                {options.status === 'succeeded' && (options.combos || []).map((c) => (
                  <option key={c.combo_id || c.id} value={c.combo_id || c.id}>{c.title || c.name || `Combo #${c.combo_id || c.id}`}</option>
                ))}
              </select>
              <select className={selectClasses} value={filters.offer_id} onChange={(e) => handleSelectChange('offer_id', e.target.value)} disabled={options.status === 'loading'}>
                <option value="">{options.status === 'loading' ? 'Loading…' : 'All Offers'}</option>
                {options.status === 'succeeded' && (options.offers || []).map((o) => (
                  <option key={o.offer_id || o.id} value={o.offer_id || o.id}>{o.title || o.name || o.code || `Offer #${o.offer_id || o.id}`}</option>
                ))}
              </select>
            </div>

            {/* Row 3: Email + Phone + Dates + Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <input className={inputClasses} placeholder="User email" value={filters.user_email} onChange={(e) => handleSearchChange('user_email', e.target.value)} onKeyDown={handleFilterKeyDown} />
              <input className={inputClasses} placeholder="User phone" value={filters.user_phone} onChange={(e) => handleSearchChange('user_phone', e.target.value)} onKeyDown={handleFilterKeyDown} />
              <div className="flex gap-2">
                <input type="date" className={`${inputClasses} flex-1`} placeholder="From" value={filters.date_from} onChange={(e) => { handleFilterChange('date_from', e.target.value); setActiveRange('custom'); }} />
                <input type="date" className={`${inputClasses} flex-1`} placeholder="To" value={filters.date_to} onChange={(e) => { handleFilterChange('date_to', e.target.value); setActiveRange('custom'); }} />
              </div>
              <div className="flex gap-2">
                <button className={`flex-1 ${btnPrimary}`} onClick={applyFilters}>
                  <Search className="h-4 w-4" />
                  Apply
                </button>
                <button className={btnSecondary} onClick={resetFilters} title="Reset all filters">
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── User filter banner ── */}
      {(filters.user_email || filters.user_phone) && (
        <div className="flex items-center gap-3 bg-blue-50 text-blue-900 border border-blue-100 rounded-xl px-4 py-2.5 text-sm dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
          <Search className="h-4 w-4 flex-shrink-0" />
          <span>
            Showing bookings for
            {filters.user_email ? <> email <strong>{filters.user_email}</strong></> : null}
            {filters.user_email && filters.user_phone ? ' and' : ''}
            {filters.user_phone ? <> phone <strong>{filters.user_phone}</strong></> : null}
          </span>
          <button
            className="ml-auto text-xs font-semibold text-blue-700 hover:text-blue-900 dark:text-blue-400"
            onClick={() => {
              setFilters((prev) => ({ ...prev, user_email: '', user_phone: '' }));
              applyFilters();
            }}
          >Clear</button>
        </div>
      )}

      {/* ── Table ── */}
      <AdminTable
        keyField="order_id"
        columns={[
          { key: 'order_ref', title: 'ID', tdClass: 'whitespace-nowrap font-medium', render: (r) => r.order_ref || r.booking_ref || '—' },
          { key: 'booking_date', title: 'Date', tdClass: 'whitespace-nowrap', render: (r) => r.booking_date ? dayjs(r.booking_date).format('DD MMM, YYYY') : '—' },
          {
            key: 'user_email', title: 'Customer', render: (r) => (
              <div className="text-xs min-w-[140px]">
                <div className="font-medium text-gray-800 dark:text-neutral-200">{r.user_name || r.user_email || '—'}</div>
                <div className="text-gray-500">{r.user_phone || '—'}</div>
              </div>
            )
          },
          {
            key: 'item_title', title: 'Item', render: (r) => (
              <div className="flex flex-col min-w-[120px]">
                <span className="font-medium truncate max-w-[200px]">{r.item_title || '—'}</span>
                <span className="text-xs text-gray-500">
                  {r.item_count > 1 ? `${r.item_count} items` : (r.items?.[0]?.item_type === 'Combo' ? 'Combo' : 'Attraction')}
                  {r.quantity && r.quantity > 1 ? ` × ${r.quantity}` : ''}
                </span>
              </div>
            )
          },
          { key: 'final_amount', title: 'Amount', tdClass: 'whitespace-nowrap font-semibold', render: (r) => `₹${Number(r?.final_amount ?? r?.total_amount ?? 0).toLocaleString()}` },
          {
            key: 'payment_status', title: 'Payment', tdClass: 'whitespace-nowrap', render: (r) => {
              const status = r.payment_status || '—';
              const colors = {
                Completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
                Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                Failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                Cancelled: 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400',
              };
              return (
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
                  {status}
                </span>
              );
            }
          },
          {
            key: 'booking_status', title: 'Status', tdClass: 'whitespace-nowrap', render: (r) => {
              const bookingId = r.booking_id ?? r.id;
              const status = r.booking_status || '—';
              const isUpdating = statusUpdating === bookingId;
              const colorMap = {
                Booked: 'border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700',
                Redeemed: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700',
                Expired: 'border-orange-300 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700',
                Cancelled: 'border-gray-300 bg-gray-50 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-600',
              };
              return (
                <select
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all ${colorMap[status] || 'border-gray-200 bg-gray-50 text-gray-600'} ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}
                  value={status}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => { e.stopPropagation(); handleInlineStatusChange(r, e.target.value); }}
                  disabled={isUpdating}
                >
                  <option value="Booked">Booked</option>
                  <option value="Redeemed">Redeemed</option>
                  <option value="Expired">Expired</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              );
            }
          },
          {
            key: '_actions', title: '', tdClass: 'w-10', render: (r) => (
              <ActionMenu
                row={r}
                onView={(r) => navigate(`/admin/bookings/${r.order_id || r.booking_id || r.id}`)}
                onWhatsApp={handleResendWhatsApp}
                onEmail={handleResendEmail}
                onDownload={handleDownloadTicket}
              />
            )
          },
        ]}
        rows={rows}
        onRowClick={(r) => navigate(`/admin/bookings/${r.order_id || r.booking_id || r.id}`)}
        empty={list.status === 'loading' ? 'Loading…' : 'No bookings found'}
      />

      {/* ── Date Navigation + Pagination ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button className={btnSecondary} onClick={() => stepSingleDate(-1)} title="Previous date">
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Prev</span>
          </button>
          <div className="text-sm font-medium text-gray-700 dark:text-neutral-300 px-2">
            {activeRange === 'all' ? 'All bookings' : filters.date_from ? dayjs(filters.date_from).format('ddd, DD MMM YYYY') : 'No date selected'}
          </div>
          <button className={btnSecondary} onClick={() => stepSingleDate(1)} title="Next date">
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <TablePagination
        count={meta.total || meta.count || meta.totalBookings || rows.length}
        page={currPage}
        rowsPerPage={rowsPerPage}
        onPageChange={(p) => dispatch(listAdminBookings({ ...buildQuery(), page: p, limit: rowsPerPage }))}
        onRowsPerPageChange={(l) => {
          setRowsPerPage(l);
          dispatch(listAdminBookings({ ...buildQuery(), page: 1, limit: l }));
        }}
      />
    </div>
  );
}