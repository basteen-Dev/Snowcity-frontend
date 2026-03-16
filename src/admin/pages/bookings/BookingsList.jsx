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

const inputClasses = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 dark:bg-slate-800 dark:border-slate-600 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all placeholder:text-gray-400';
const selectClasses = `${inputClasses} appearance-none cursor-pointer`;
const btnPrimary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 text-sm font-semibold shadow-sm shadow-blue-500/20 hover:shadow-md hover:shadow-blue-500/30 transition-all';
const btnSecondary = 'inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-600 dark:text-neutral-200 dark:hover:bg-neutral-800 transition-all';

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
  const isConfirmed = row.booking_status === 'CONFIRMED' || row.booking_status === 'Booked';

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
        <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-xl border border-gray-200 bg-white shadow-lg dark:bg-slate-800 dark:border-slate-600 py-1 animate-in fade-in slide-in-from-top-1">
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onView(row); }}
            className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          >
            <Eye size={15} className="text-blue-500" /> View Details
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onWhatsApp(row); }}
            disabled={!isConfirmed}
            className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors ${isConfirmed ? 'text-gray-700 hover:bg-gray-50 dark:text-neutral-200 dark:hover:bg-neutral-800' : 'text-gray-400 cursor-not-allowed opacity-50'}`}
          >
            <MessageSquare size={15} className={isConfirmed ? 'text-green-500' : 'text-gray-400'} /> Send WhatsApp
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onEmail(row); }}
            disabled={!isConfirmed}
            className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors ${isConfirmed ? 'text-gray-700 hover:bg-gray-50 dark:text-neutral-200 dark:hover:bg-neutral-800' : 'text-gray-400 cursor-not-allowed opacity-50'}`}
          >
            <Mail size={15} className={isConfirmed ? 'text-indigo-500' : 'text-gray-400'} /> Send Email
          </button>
          <div className="border-t border-gray-100 dark:border-slate-600 my-1" />
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onDownload(row); }}
            disabled={!isConfirmed}
            className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors ${isConfirmed ? 'text-gray-700 hover:bg-gray-50 dark:text-neutral-200 dark:hover:bg-neutral-800' : 'text-gray-400 cursor-not-allowed opacity-50'}`}
          >
            <Download size={15} className={isConfirmed ? 'text-cyan-500' : 'text-gray-400'} /> Download Ticket
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

  const [filters, setFilters] = React.useState({
    search: '',
    payment_status: '',
    booking_status: '',
    attraction_id: '',
    combo_id: '',
    offer_id: '',
    user_email: '',
    user_phone: '',
    item_type: '',
    date_from: dayjs().startOf('day').format('YYYY-MM-DD'),
    date_to: dayjs().endOf('day').format('YYYY-MM-DD')
  });
  const [options, setOptions] = React.useState({ status: 'idle', attractions: [], combos: [], offers: [] });
  const [activeRange, setActiveRange] = React.useState('today');
  const [rowsPerPage, setRowsPerPage] = React.useState(100);
  const [showFilters, setShowFilters] = React.useState(false); // Default: collapsed
  const searchTimerRef = React.useRef(null);
  const [statusUpdating, setStatusUpdating] = React.useState(null);
  const [autoSync, setAutoSync] = React.useState(true);

  const rows = React.useMemo(() => {
    let data = Array.isArray(list.data) ? list.data : [];

    // Check if a time filter is active (today, tomorrow, or custom range)
    const hasTimeFilter = !!(filters.date_from || filters.date_to);
    // Check if the user has explicitly selected a status filter
    const hasStatusFilter = !!filters.booking_status;
    // Check if a search is active
    const hasSearch = !!filters.search?.trim();

    // If filtering by time and no explicit status/search is active, hide cancelled bookings
    if (hasTimeFilter && !hasStatusFilter && !hasSearch) {
      return data.filter(it => it.booking_status !== 'Cancelled');
    }

    return data;
  }, [list.data, filters.date_from, filters.date_to, filters.booking_status, filters.search]);

  // Auto-sync: poll every 15s for new bookings
  React.useEffect(() => {
    // Initial load
    dispatch(listAdminBookings({ ...buildQuery(), page: 1, limit: rowsPerPage }));

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
    // If search is non-empty, we ignore date filters to search "all time"
    const hasSearch = !!(merged.search?.trim() || merged.user_email?.trim() || merged.user_phone?.trim());

    Object.entries(merged).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (typeof value === 'string' && value.trim() === '') return;

      // Ignore date filters if performing a search
      if (hasSearch && (key === 'date_from' || key === 'date_to')) return;

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
    setFilters((prev) => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => {
        dispatch(listAdminBookings({ ...buildQuery({ [field]: value }), page: 1, limit: rowsPerPage }));
      }, 400);
      return { ...prev, [field]: value };
    });
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
    setFilters((prev) => ({ ...prev, [field]: value }));
    dispatch(listAdminBookings({ ...buildQuery({ [field]: value }), page: 1, limit: rowsPerPage }));
  };

  // Inline ticket status toggle — propagate to all sibling bookings in same order
  const handleTicketStatusToggle = async (row) => {
    const bookingId = row.booking_id ?? row.id;
    if (!bookingId) return;
    const isConfirmed = row.booking_status === 'CONFIRMED' || row.booking_status === 'Booked';
    if (!isConfirmed) {
      window.alert('Ticket status can only be changed when booking is CONFIRMED.');
      return;
    }
    const currentTicketStatus = row.ticket_status || 'NOT_REDEEMED';
    const newTicketStatus = currentTicketStatus === 'REDEEMED' ? 'NOT_REDEEMED' : 'REDEEMED';
    const ok = window.confirm(`Change ticket status from "${currentTicketStatus}" to "${newTicketStatus}"?\n\nThis will update all items in this order.`);
    if (!ok) return;
    setStatusUpdating(bookingId);
    try {
      await dispatch(updateAdminBooking({ id: bookingId, patch: { ticket_status: newTicketStatus, propagate: true } })).unwrap();
      dispatch(listAdminBookings({ ...buildQuery(), page: currPage, limit: rowsPerPage }));
    } catch (err) {
      window.alert(err?.message || 'Failed to update ticket status');
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

  /* ─── Auto-sync control based on filters ───────────────── */
  const isFiltering = React.useMemo(() => {
    return Boolean(
      filters.search ||
      filters.payment_status ||
      filters.booking_status ||
      filters.attraction_id ||
      filters.combo_id ||
      filters.offer_id ||
      filters.user_email ||
      filters.user_phone ||
      filters.item_type ||
      activeRange !== 'today'
    );
  }, [filters, activeRange]);

  React.useEffect(() => {
    setAutoSync(!isFiltering);
  }, [isFiltering]);

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
    if (activeRange !== 'today') count++;
    return count;
  }, [filters, activeRange]);

  /* ─── Render ───────────────────────────────────────────── */

  // State for Custom Modal
  const [redeemModalOpen, setRedeemModalOpen] = React.useState(false);
  const [redeemModalState, setRedeemModalState] = React.useState('confirm'); // 'confirm' | 'success'
  const [selectedTicket, setSelectedTicket] = React.useState(null);

  const openRedeemModal = (row) => {
    setSelectedTicket(row);
    setRedeemModalState('confirm');
    setRedeemModalOpen(true);
  };

  const closeRedeemModal = () => {
    setRedeemModalOpen(false);
    setTimeout(() => { setSelectedTicket(null); setRedeemModalState('confirm'); }, 300);
  };

  const handleConfirmRedeem = async () => {
    if (!selectedTicket) return;
    const bookingId = selectedTicket.booking_id ?? selectedTicket.id;
    setStatusUpdating(bookingId);
    try {
      await dispatch(updateAdminBooking({ id: bookingId, patch: { ticket_status: 'REDEEMED', propagate: true } })).unwrap();
      setRedeemModalState('success');
      setTimeout(() => {
        closeRedeemModal();
        dispatch(listAdminBookings({ ...buildQuery(), page: currPage, limit: rowsPerPage }));
      }, 1800);
    } catch (err) {
      window.alert(err?.message || 'Failed to update ticket status');
      closeRedeemModal();
    } finally {
      setStatusUpdating(null);
    }
  };

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
            disabled={isFiltering}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-semibold border transition-all ${autoSync
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-400'
              : 'bg-gray-50 border-gray-200 text-gray-500 dark:bg-neutral-800 dark:border-slate-600 dark:text-neutral-400'} ${isFiltering ? 'opacity-60 cursor-not-allowed' : ''}`}
            title={isFiltering ? 'Live sync is disabled while filters are active' : autoSync ? 'Auto-sync ON (every 15s) — click to disable' : 'Auto-sync OFF — click to enable'}
          >
            <span className={`inline-block w-2 h-2 rounded-xl ${autoSync ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
            {autoSync ? 'Live' : 'Paused'}
          </button>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {quickRanges.map((range) => (
            <button
              key={range.key}
              onClick={() => applyQuickRange(range.key)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold border transition-all ${activeRange === range.key
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-sm shadow-blue-500/20'
                : 'border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50 dark:border-slate-600 dark:text-neutral-300 dark:hover:bg-neutral-800'}`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:bg-slate-800 dark:border-slate-700">
        {/* Always-visible: search bar + filter toggle */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              className={`${inputClasses} pl-9`}
              placeholder="Search Booking ID, Customer Name, Phone or Email"
              value={filters.search}
              onChange={(e) => handleSearchChange('search', e.target.value)}
              onKeyDown={handleFilterKeyDown}
            />
          </div>
          <button
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${showFilters
              ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-400'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-slate-600 dark:text-neutral-300 dark:hover:bg-neutral-800'}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-xl min-w-[18px] text-center">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showFilters && (
          <div className="px-4 pb-4 border-t border-gray-100 dark:border-slate-700 pt-3 space-y-3">
            {isSubadmin && (
              <div className="bg-blue-50 text-blue-900 border border-blue-200 rounded-xl px-3 py-2 text-xs dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                <strong>Subadmin Access:</strong> Viewing attractions and combos from your assigned bookings only.
              </div>
            )}

            {/* Row 1: Payment + Booking Status + Item Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="relative">
                <select className={selectClasses} value={filters.payment_status} onChange={(e) => handleSelectChange('payment_status', e.target.value)}>
                  <option value="">Payment: All</option>
                  <option value="INITIATED">Initiated</option>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Success</option>
                  <option value="Failed">Failed</option>
                  <option value="TIMED_OUT">Timed Out</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select className={selectClasses} value={filters.booking_status} onChange={(e) => handleSelectChange('booking_status', e.target.value)}>
                  <option value="">Booking: All</option>
                  <option value="PENDING_PAYMENT">Pending Payment</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="ABANDONED">Abandoned</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select className={selectClasses} value={filters.item_type} onChange={(e) => handleSelectChange('item_type', e.target.value)}>
                  <option value="">Item Type: All</option>
                  <option value="Attraction">Attraction</option>
                  <option value="Combo">Combo</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Row 2: Attraction + Combo + Offer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="relative">
                <select className={selectClasses} value={filters.attraction_id} onChange={(e) => handleSelectChange('attraction_id', e.target.value)} disabled={options.status === 'loading'}>
                  <option value="">{options.status === 'loading' ? 'Loading…' : 'All Attractions'}</option>
                  {options.status === 'succeeded' && (options.attractions || []).map((a) => (
                    <option key={a.attraction_id || a.id} value={a.attraction_id || a.id}>{a.title || a.name || `#${a.attraction_id || a.id}`}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select className={selectClasses} value={filters.combo_id} onChange={(e) => handleSelectChange('combo_id', e.target.value)} disabled={options.status === 'loading'}>
                  <option value="">{options.status === 'loading' ? 'Loading…' : 'All Combos'}</option>
                  {options.status === 'succeeded' && (options.combos || []).map((c) => (
                    <option key={c.combo_id || c.id} value={c.combo_id || c.id}>{c.name || c.title || `Combo #${c.combo_id || c.id}`}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select className={selectClasses} value={filters.offer_id} onChange={(e) => handleSelectChange('offer_id', e.target.value)} disabled={options.status === 'loading'}>
                  <option value="">{options.status === 'loading' ? 'Loading…' : 'All Offers'}</option>
                  {options.status === 'succeeded' && (options.offers || []).map((o) => (
                    <option key={o.offer_id || o.id} value={o.offer_id || o.id}>{o.title || o.name || o.code || `Offer #${o.offer_id || o.id}`}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
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
        keyField="booking_id"
        columns={[
          { key: 'order_ref', title: 'Booking Id' , tdClass: 'whitespace-nowrap text-blue-600 hover:underline cursor-pointer font-medium', render: (r) => <span className="booking-id">{r.order_ref || r.booking_ref || '—'}</span> },
          { key: 'booking_date', title: 'Date', tdClass: 'whitespace-nowrap text-gray-500', render: (r) => r.booking_date ? dayjs(r.booking_date).format('DD MMM, YYYY') : '—' },
          {
            key: 'user_email', title: 'Customer', render: (r) => (
              <div>
                <div className="customer-name">{r.user_name || r.user_email || '—'}</div>
                <div className="customer-phone">{r.user_phone || '—'}</div>
              </div>
            )
          },
          {
            key: 'item_title', title: 'Item', render: (r) => {
              // Group items by title to avoid redundant entries in the same order
              const items = Array.isArray(r.items) ? r.items : [];
              const groupedItems = items.reduce((acc, it) => {
                const title = it.item_title || 'Ticket';
                if (!acc[title]) acc[title] = 0;
                acc[title] += (it.quantity || 1);
                return acc;
              }, {});

              const groupEntries = Object.entries(groupedItems);

              return (
                <div className="flex flex-col min-w-[150px] gap-1">
                  {groupEntries.map(([title, qty], idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <span className="font-medium text-gray-700 dark:text-neutral-200 truncate max-w-[180px]" title={title}>
                        {title}
                      </span>
                      {qty > 1 && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold dark:bg-blue-900/30 dark:text-blue-400">
                          x{qty}
                        </span>
                      )}
                    </div>
                  ))}
                  {groupEntries.length === 0 && (
                    <span className="text-gray-400 italic text-xs">No items</span>
                  )}
                </div>
              );
            }
          },
          { key: 'final_amount', title: 'Amount', tdClass: 'whitespace-nowrap font-bold', render: (r) => `₹${Number(r?.final_amount ?? r?.total_amount ?? 0).toLocaleString()}` },
          {
            key: 'payment_status', title: 'Payment', tdClass: 'whitespace-nowrap', render: (r) => {
              const status = r.payment_status || '—';
              const colors = {
                Completed: 'badge-green',
                SUCCESS: 'badge-green',
                Pending: 'badge-orange',
                INITIATED: 'badge-blue',
                Failed: 'badge-red',
                TIMED_OUT: 'badge-orange',
                Cancelled: 'badge-gray',
              };
              const labels = { SUCCESS: 'Completed', INITIATED: 'Initiated', TIMED_OUT: 'Timed Out' };
              return (
                <span className={`badge ${colors[status] || 'badge-gray'}`}>
                  {labels[status] || status}
                </span>
              );
            }
          },
          {
            key: 'booking_status', title: 'Booking Status', tdClass: 'whitespace-nowrap', render: (r) => {
              const status = r.booking_status || '—';
              const colors = {
                PENDING_PAYMENT: 'badge-orange',
                CONFIRMED: 'badge-blue',
                Booked: 'badge-blue',
                Cancelled: 'badge-red',
                ABANDONED: 'badge-gray',
                REFUNDED: 'badge-purple',
                Redeemed: 'badge-green',
                Expired: 'badge-orange',
              };
              const labels = { PENDING_PAYMENT: 'Pending', CONFIRMED: 'Confirmed', Booked: 'Confirmed', Cancelled: 'Cancelled', ABANDONED: 'Abandoned', REFUNDED: 'Refunded' };
              return (
                <span className={`badge ${colors[status] || 'badge-gray'}`}>
                  {labels[status] || status}
                </span>
              );
            }
          },
          {
            key: 'ticket_status', title: 'Ticket', tdClass: 'whitespace-nowrap', render: (r) => {
              const bookingId = r.booking_id ?? r.id;
              const ticketStatus = r.ticket_status || 'NOT_REDEEMED';
              const isConfirmed = r.booking_status === 'CONFIRMED' || r.booking_status === 'Booked';
              const isUpdating = statusUpdating === bookingId;
              const isRedeemed = ticketStatus === 'REDEEMED';

              if (isRedeemed) {
                return <span className="badge badge-success">Redeemed</span>;
              }

              return (
                <button
                  onClick={(e) => { e.stopPropagation(); openRedeemModal(r); }}
                  disabled={!isConfirmed || isUpdating}
                  className={`redeem-btn ${(!isConfirmed || isUpdating) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={!isConfirmed ? 'Booking must be CONFIRMED to redeem ticket' : 'Click to redeem'}
                >
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24"><path d="M20 12V22H4V12M22 7H2v5h20V7zM12 22V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Redeem
                </button>
              );
            }
          },
          {
            key: '_actions', title: '', tdClass: 'w-10', render: (r) => (
              <ActionMenu
                row={r}
                onView={(r) => navigate(`/parkpanel/bookings/${r.booking_id || r.id}`)}
                onWhatsApp={handleResendWhatsApp}
                onEmail={handleResendEmail}
                onDownload={handleDownloadTicket}
              />
            )
          },
        ]}
        rows={rows}
        onRowClick={(r) => navigate(`/parkpanel/bookings/${r.booking_id || r.id}`)}
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
        count={meta.total || meta.count || meta.totalBookings || meta.totalCount || meta.total_items || rows.length}
        page={currPage}
        rowsPerPage={rowsPerPage}
        onPageChange={(p) => dispatch(listAdminBookings({ ...buildQuery(), page: p, limit: rowsPerPage }))}
        onRowsPerPageChange={(l) => {
          setRowsPerPage(l);
          dispatch(listAdminBookings({ ...buildQuery(), page: 1, limit: l }));
        }}
      />

      {/* ── Custom Redeem Modal Overlay ── */}
      {redeemModalOpen && selectedTicket && (
        <div className="custom-overlay" onClick={closeRedeemModal}>
          <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
            {redeemModalState === 'confirm' ? (
              <>
                <div className="custom-modal-header">
                  <div className="custom-modal-icon">
                    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
                      <path d="M20 12V22H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" stroke="#e07b00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <div className="custom-modal-title">Redeem Ticket</div>
                    <div className="custom-modal-sub">Verify details before marking as redeemed</div>
                  </div>
                </div>

                <div className="custom-modal-body">
                  <div className="ticket-card">
                    <div className="ticket-row">
                      <div className="ticket-field">
                        <label>Booking ID</label>
                        <div className="val highlight">{selectedTicket.order_ref || selectedTicket.booking_ref || selectedTicket.booking_id || selectedTicket.id || '—'}</div>
                      </div>
                      <div className="ticket-field" style={{ textAlign: 'right' }}>
                        <label>Transaction Amount</label>
                        <div className="val">{`₹${Number(selectedTicket?.final_amount ?? selectedTicket?.total_amount ?? 0).toLocaleString()}`}</div>
                      </div>
                    </div>
                    <hr className="ticket-divider" />
                    <div className="ticket-meta">
                      <div className="ticket-meta-item">
                        <label>Customer</label>
                        <div className="val">{selectedTicket.user_name || selectedTicket.user_email || '—'}</div>
                        <div className="sub">{selectedTicket.user_phone || '—'}</div>
                      </div>
                      <div className="ticket-meta-item">
                        <label>Items</label>
                        <div className="flex flex-col gap-1 mt-1">
                          {(Array.isArray(selectedTicket.items) ? selectedTicket.items : []).reduce((acc, it) => {
                            const title = it.item_title || 'Ticket';
                            const found = acc.find(x => x.title === title);
                            if (found) found.qty += (it.quantity || 1);
                            else acc.push({ title, qty: (it.quantity || 1) });
                            return acc;
                          }, []).map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1.5">
                              <div className="val">{item.title}</div>
                              {item.qty > 1 && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold dark:bg-blue-900/30 dark:text-blue-400">
                                  x{item.qty}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="sub mt-1">{selectedTicket.booking_date ? dayjs(selectedTicket.booking_date).format('DD MMM, YYYY') : '—'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="warn-box">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                      <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#e07b00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p>This action is <strong>irreversible</strong>. Once confirmed, this ticket cannot be redeemed again.</p>
                  </div>
                </div>

                <div className="custom-modal-footer">
                  <button className="btn-cancel" onClick={closeRedeemModal}>Cancel</button>
                  <button className="btn-confirm" onClick={handleConfirmRedeem} disabled={statusUpdating !== null}>
                    {statusUpdating ? 'Redeeming...' : (
                      <>
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        Yes, Redeem Ticket
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
                <div className="success-title">Ticket Redeemed!</div>
                <div className="success-sub">Booking marked as redeemed successfully.</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
