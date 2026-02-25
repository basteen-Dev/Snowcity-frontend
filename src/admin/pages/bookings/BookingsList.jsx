import React from 'react';
import dayjs from 'dayjs';
import { useDispatch, useSelector } from 'react-redux';
import { listAdminBookings, updateAdminBooking, resendTicketAdmin, resendWhatsAppAdmin, resendEmailAdmin } from '../../features/bookings/adminBookingsSlice';
import AdminTable from '../../components/common/AdminTable';
import TablePagination from '../../components/common/TablePagination';
import { useNavigate } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';

import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import { FileText, FileSpreadsheet, Search, Filter, ChevronLeft, ChevronRight, RotateCcw, TrendingUp, DollarSign, Calendar, Ticket } from 'lucide-react';

/* ─── Shared UI ──────────────────────────────────────────── */

const SectionCard = ({ title, subtitle, children, className = '', headerRight }) => (
  <div className={`rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:bg-neutral-900 dark:border-neutral-800 ${className}`}>
    {(title || headerRight) && (
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <div>
          {title && <p className="text-sm font-semibold text-gray-900 dark:text-neutral-100">{title}</p>}
          {subtitle && <p className="text-xs text-gray-500 dark:text-neutral-400 mt-0.5">{subtitle}</p>}
        </div>
        {headerRight}
      </div>
    )}
    <div className="px-5 pb-5">{children}</div>
  </div>
);

const SummaryCard = ({ icon, label, value, note, accent = 'from-blue-500 to-indigo-600' }) => (
  <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm p-5 dark:bg-neutral-900 dark:border-neutral-800 group hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className="space-y-1">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</div>
        <div className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${accent}`}>{value}</div>
        {note && <div className="text-xs text-gray-500 dark:text-neutral-400">{note}</div>}
      </div>
      {icon && <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-neutral-800 text-gray-400">{icon}</div>}
    </div>
    <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-r ${accent} opacity-5 group-hover:opacity-10 transition-opacity`} />
  </div>
);

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString()}`;
const formatNumber = (value) => Number(value || 0).toLocaleString();

/* ─── Input styling ──────────────────────────────────────── */
const inputClasses = 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all placeholder:text-gray-400';
const selectClasses = `${inputClasses} appearance-none cursor-pointer`;
const btnPrimary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 text-sm font-semibold shadow-sm shadow-blue-500/20 hover:shadow-md hover:shadow-blue-500/30 transition-all';
const btnSecondary = 'inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800 transition-all';

const revenueFilterDefaults = Object.freeze({
  attraction: { from: '', to: '', attraction_id: '' },
  combo: { from: '', to: '', attraction_id: '', combo_id: '' },
});

const cloneRevenueFilters = () => ({
  attraction: { ...revenueFilterDefaults.attraction },
  combo: { ...revenueFilterDefaults.combo },
});

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

const formatTime12Hour = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
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
    payment_status: 'Pending',
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
  const [overview, setOverview] = React.useState({ status: 'idle', trend: [], summary: null });
  const [activeRange, setActiveRange] = React.useState('all');
  const [revenueData, setRevenueData] = React.useState({
    attraction: { status: 'idle', data: null },
    combo: { status: 'idle', data: null }
  });
  const [revenueFilters, setRevenueFilters] = React.useState(cloneRevenueFilters());
  const [rowsPerPage, setRowsPerPage] = React.useState(20);
  const [showFilters, setShowFilters] = React.useState(true);
  const searchTimerRef = React.useRef(null);
  const [statusUpdating, setStatusUpdating] = React.useState(null); // booking_id being updated

  React.useEffect(() => {
    dispatch(listAdminBookings({ page: 1, limit: rowsPerPage, payment_status: 'Pending' }));
    loadOverview();
    loadRevenueData('both');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const loadOverview = React.useCallback(async () => {
    setOverview((s) => ({ ...s, status: 'loading' }));
    try {
      const res = await adminApi.get(A.analyticsOverview(), {
        params: {
          from: filters.date_from || undefined,
          to: filters.date_to || undefined,
          attraction_id: filters.attraction_id || undefined
        }
      });
      const trend = Array.isArray(res?.trend) ? res.trend : [];
      setOverview({ status: 'succeeded', trend, summary: res?.summary || res });
    } catch (err) {
      setOverview((s) => ({ ...s, status: 'failed', error: err }));
    }
  }, [filters]);

  const loadRevenueData = React.useCallback(async (target = 'both') => {
    const targets = target === 'both' ? ['attraction', 'combo'] : [target];
    if (targets.includes('attraction')) {
      const af = revenueFilters.attraction;
      setRevenueData((prev) => ({ ...prev, attraction: { status: 'loading', data: null } }));
      try {
        const res = await adminApi.get(A.analyticsAttractionRevenue(), {
          params: {
            from: af.from || filters.date_from || undefined,
            to: af.to || filters.date_to || undefined,
            attraction_id: af.attraction_id || filters.attraction_id || undefined
          }
        });
        setRevenueData((prev) => ({ ...prev, attraction: { status: 'succeeded', data: res } }));
      } catch (err) {
        setRevenueData((prev) => ({ ...prev, attraction: { status: 'failed', error: err } }));
      }
    }
    if (targets.includes('combo')) {
      const cf = revenueFilters.combo;
      setRevenueData((prev) => ({ ...prev, combo: { status: 'loading', data: null } }));
      try {
        const res = await adminApi.get(A.analyticsComboRevenue(), {
          params: {
            from: cf.from || filters.date_from || undefined,
            to: cf.to || filters.date_to || undefined,
            attraction_id: cf.attraction_id || filters.attraction_id || undefined,
            combo_id: cf.combo_id || filters.combo_id || undefined
          }
        });
        setRevenueData((prev) => ({ ...prev, combo: { status: 'succeeded', data: res } }));
      } catch (err) {
        setRevenueData((prev) => ({ ...prev, combo: { status: 'failed', error: err } }));
      }
    }
  }, [filters, revenueFilters]);

  const downloadReport = React.useCallback((type, format) => {
    try {
      const params = {
        type,
        from: revenueFilters[type === 'attraction-revenue' ? 'attraction' : 'combo']?.from || filters.date_from || undefined,
        to: revenueFilters[type === 'attraction-revenue' ? 'attraction' : 'combo']?.to || filters.date_to || undefined,
        attraction_id: revenueFilters[type === 'attraction-revenue' ? 'attraction' : 'combo']?.attraction_id || filters.attraction_id || undefined,
        combo_id: revenueFilters[type === 'combo-revenue' ? 'combo' : 'attraction']?.combo_id || filters.combo_id || undefined
      };
      const url = `${A.analyticsReport(format)}?${new URLSearchParams(params).toString()}`;
      window.open(url, '_blank');
    } catch {
      alert('Failed to download report');
    }
  }, [filters, revenueFilters]);

  /* ─── Filter helpers ───────────────────────────────────── */

  const applyFilters = React.useCallback(() => {
    dispatch(listAdminBookings({ ...buildQuery(), page: 1, limit: rowsPerPage }));
    loadOverview();
    loadRevenueData('both');
  }, [buildQuery, dispatch, loadOverview, loadRevenueData, rowsPerPage]);

  const resetFilters = React.useCallback(() => {
    setFilters({ search: '', payment_status: 'Pending', booking_status: '', attraction_id: '', combo_id: '', offer_id: '', user_email: '', user_phone: '', item_type: '', date_from: '', date_to: '' });
    dispatch(listAdminBookings({ page: 1, limit: rowsPerPage, payment_status: 'Pending' }));
    setActiveRange('all');
    loadOverview();
  }, [dispatch, loadOverview, rowsPerPage]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  // Debounced auto-search for text inputs (400ms delay)
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

  // Clean up debounce timer on unmount
  React.useEffect(() => {
    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, []);

  // Auto-apply on Enter key in any filter input
  const handleFilterKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      applyFilters();
    }
  };

  // Auto-apply when select/dropdown changes
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

  // Inline status change with confirmation
  const handleInlineStatusChange = async (row, newStatus) => {
    const bookingId = row.booking_id ?? row.id;
    if (!bookingId) return;
    const oldStatus = row.booking_status || 'Unknown';
    if (newStatus === oldStatus) return;
    const ok = window.confirm(`Change booking #${row.booking_ref || bookingId} status from "${oldStatus}" to "${newStatus}"?`);
    if (!ok) return;
    setStatusUpdating(bookingId);
    try {
      await dispatch(updateAdminBooking({ id: bookingId, patch: { booking_status: newStatus } })).unwrap();
      // Refresh the list to get updated data
      dispatch(listAdminBookings({ ...buildQuery(), page: currPage, limit: rowsPerPage }));
    } catch (err) {
      window.alert(err?.message || 'Failed to update status');
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleRevenueFilterChange = (card, field, value) => {
    setRevenueFilters((prev) => ({
      ...prev,
      [card]: { ...prev[card], [field]: value },
    }));
  };

  const applyRevenueFilter = (card) => loadRevenueData(card);
  const resetRevenueFilter = (card) => {
    setRevenueFilters((prev) => ({
      ...prev,
      [card]: { ...revenueFilterDefaults[card] },
    }));
    loadRevenueData(card);
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
    loadOverview();
  }, [buildQuery, dispatch, loadOverview, rowsPerPage]);

  React.useEffect(() => {
    if (list.status === 'succeeded') loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.status]);

  const meta = list.meta || {};
  const currPage = meta.page || list.query.page || 1;

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
    if (filters.search) count++;
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">Bookings Intelligence</h1>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mt-0.5">Monitor and manage all bookings</p>
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

      {/* ── Summary Cards ── */}
      {overview.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard label="Paid Bookings" value={formatNumber(overview.summary.total_bookings)} note="Confirmed" icon={<Ticket className="h-5 w-5" />} />
          <SummaryCard label="Pending" value={formatNumber(overview.summary.pending_bookings)} note="Awaiting payment" accent="from-amber-400 to-orange-500" icon={<Calendar className="h-5 w-5" />} />
          <SummaryCard label="Attraction Revenue" value={formatCurrency(revenueData.attraction.data?.attraction_revenue)} note={`${formatNumber(revenueData.attraction.data?.attraction_bookings)} bookings`} accent="from-cyan-500 to-blue-600" icon={<TrendingUp className="h-5 w-5" />} />
          <SummaryCard label="Combo Revenue" value={formatCurrency(overview.summary.combo_revenue)} note={`${overview.summary.combo_bookings || 0} combos`} accent="from-indigo-500 to-purple-600" icon={<DollarSign className="h-5 w-5" />} />
        </div>
      )}

      {/* ── Revenue Cards ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Attraction Revenue */}
        <SectionCard title="Attraction Revenue" subtitle="Completed attraction bookings & revenue">
          <div className="flex flex-wrap gap-2 mb-3">
            <input type="date" className={`${inputClasses} flex-1 min-w-[120px]`} value={revenueFilters.attraction.from} onChange={(e) => handleRevenueFilterChange('attraction', 'from', e.target.value)} />
            <input type="date" className={`${inputClasses} flex-1 min-w-[120px]`} value={revenueFilters.attraction.to} onChange={(e) => handleRevenueFilterChange('attraction', 'to', e.target.value)} />
            <select className={`${selectClasses} flex-1 min-w-[140px]`} value={revenueFilters.attraction.attraction_id} onChange={(e) => handleRevenueFilterChange('attraction', 'attraction_id', e.target.value)} disabled={options.status === 'loading'}>
              <option value="">{options.status === 'loading' ? 'Loading...' : 'All attractions'}</option>
              {options.status === 'succeeded' && (options.attractions || []).map((a) => (
                <option key={a.attraction_id || a.id} value={a.attraction_id || a.id}>{a.title || a.name || `#${a.attraction_id || a.id}`}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <button className={btnPrimary} onClick={() => applyRevenueFilter('attraction')}>Apply</button>
            <button className={btnSecondary} onClick={() => resetRevenueFilter('attraction')}>Reset</button>
            <div className="flex-1" />
            <button className={btnSecondary} onClick={() => downloadReport('attraction-revenue', 'csv')}><FileSpreadsheet className="h-4 w-4" />CSV</button>
            <button className={btnSecondary} onClick={() => downloadReport('attraction-revenue', 'pdf')}><FileText className="h-4 w-4" />PDF</button>
          </div>
          <div className="rounded-xl border border-gray-100 dark:border-neutral-800 p-4 bg-gray-50/50 dark:bg-neutral-800/30">
            {revenueData.attraction.status === 'loading' ? (
              <div className="text-sm text-gray-500">Loading…</div>
            ) : revenueData.attraction.status === 'failed' ? (
              <div className="text-sm text-red-600">Failed to load data</div>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 uppercase text-xs tracking-wider">Bookings</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-neutral-100 mt-1">{formatNumber(revenueData.attraction.data?.attraction_bookings)}</div>
                </div>
                <div>
                  <div className="text-gray-500 uppercase text-xs tracking-wider">Revenue</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-neutral-100 mt-1">{formatCurrency(revenueData.attraction.data?.attraction_revenue)}</div>
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* Combo Revenue */}
        <SectionCard title="Combo Revenue" subtitle="Combo bookings & linked revenue">
          <div className="flex flex-wrap gap-2 mb-3">
            <input type="date" className={`${inputClasses} flex-1 min-w-[120px]`} value={revenueFilters.combo.from} onChange={(e) => handleRevenueFilterChange('combo', 'from', e.target.value)} />
            <input type="date" className={`${inputClasses} flex-1 min-w-[120px]`} value={revenueFilters.combo.to} onChange={(e) => handleRevenueFilterChange('combo', 'to', e.target.value)} />
            <select className={`${selectClasses} flex-1 min-w-[140px]`} value={revenueFilters.combo.attraction_id} onChange={(e) => handleRevenueFilterChange('combo', 'attraction_id', e.target.value)} disabled={options.status === 'loading'}>
              <option value="">{options.status === 'loading' ? 'Loading...' : 'All attractions'}</option>
              {options.status === 'succeeded' && (options.attractions || []).map((a) => (
                <option key={a.attraction_id || a.id} value={a.attraction_id || a.id}>{a.title || a.name || `#${a.attraction_id || a.id}`}</option>
              ))}
            </select>
            <select className={`${selectClasses} flex-1 min-w-[140px]`} value={revenueFilters.combo.combo_id} onChange={(e) => handleRevenueFilterChange('combo', 'combo_id', e.target.value)} disabled={options.status === 'loading'}>
              <option value="">{options.status === 'loading' ? 'Loading...' : 'All combos'}</option>
              {options.status === 'succeeded' && (options.combos || []).map((c) => (
                <option key={c.combo_id || c.id} value={c.combo_id || c.id}>{c.title || c.name || `Combo #${c.combo_id || c.id}`}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <button className={btnPrimary} onClick={() => applyRevenueFilter('combo')}>Apply</button>
            <button className={btnSecondary} onClick={() => resetRevenueFilter('combo')}>Reset</button>
            <div className="flex-1" />
            <button className={btnSecondary} onClick={() => downloadReport('combo-revenue', 'csv')}><FileSpreadsheet className="h-4 w-4" />CSV</button>
            <button className={btnSecondary} onClick={() => downloadReport('combo-revenue', 'pdf')}><FileText className="h-4 w-4" />PDF</button>
          </div>
          <div className="rounded-xl border border-gray-100 dark:border-neutral-800 p-4 bg-gray-50/50 dark:bg-neutral-800/30">
            {revenueData.combo.status === 'loading' ? (
              <div className="text-sm text-gray-500">Loading…</div>
            ) : revenueData.combo.status === 'failed' ? (
              <div className="text-sm text-red-600">Failed to load data</div>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 uppercase text-xs tracking-wider">Bookings</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-neutral-100 mt-1">{formatNumber(revenueData.combo.data?.combo_bookings)}</div>
                </div>
                <div>
                  <div className="text-gray-500 uppercase text-xs tracking-wider">Revenue</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-neutral-100 mt-1">{formatCurrency(revenueData.combo.data?.combo_revenue)}</div>
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* ── Filter Bar ── */}
      <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm dark:bg-neutral-900 dark:border-neutral-800">
        <button
          className="flex w-full items-center justify-between px-5 py-4 text-left"
          onClick={() => setShowFilters(!showFilters)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-neutral-100">Filters</p>
              <p className="text-xs text-gray-500 dark:text-neutral-400">
                {activeFilterCount > 0 ? `${activeFilterCount} active filter${activeFilterCount > 1 ? 's' : ''}` : 'No filters applied'}
              </p>
            </div>
          </div>
          <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${showFilters ? 'rotate-90' : ''}`} />
        </button>

        {showFilters && (
          <div className="px-5 pb-5 border-t border-gray-100 dark:border-neutral-800 pt-4 space-y-3">
            {isSubadmin && (
              <div className="bg-blue-50 text-blue-900 border border-blue-200 rounded-xl px-3 py-2 text-xs dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                <strong>Subadmin Access:</strong> Viewing attractions and combos from your assigned bookings only.
              </div>
            )}

            {/* Row 1: Search + Payment + Booking Status + Item Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                {filters.search && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="h-3 w-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" style={{ display: searchTimerRef.current ? 'block' : 'none' }} /></div>}
                <input
                  className={`${inputClasses} pl-9`}
                  placeholder="Search ref, email, phone…"
                  value={filters.search}
                  onChange={(e) => handleSearchChange('search', e.target.value)}
                  onKeyDown={handleFilterKeyDown}
                />
              </div>
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

            {/* Row 2: Attraction + Combo + Offer + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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
              <input className={inputClasses} placeholder="User email" value={filters.user_email} onChange={(e) => handleSearchChange('user_email', e.target.value)} onKeyDown={handleFilterKeyDown} />
            </div>

            {/* Row 3: Phone + Dates + Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <input className={inputClasses} placeholder="User phone" value={filters.user_phone} onChange={(e) => handleSearchChange('user_phone', e.target.value)} onKeyDown={handleFilterKeyDown} />
              <input type="date" className={inputClasses} placeholder="From date" value={filters.date_from} onChange={(e) => { handleFilterChange('date_from', e.target.value); setActiveRange('custom'); }} />
              <input type="date" className={inputClasses} placeholder="To date" value={filters.date_to} onChange={(e) => { handleFilterChange('date_to', e.target.value); setActiveRange('custom'); }} />
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
          { key: 'booking_ref', title: 'Ref', tdClass: 'whitespace-nowrap font-medium' },
          { key: 'booking_date', title: 'Date', tdClass: 'whitespace-nowrap', render: (r) => r.booking_date ? dayjs(r.booking_date).format('DD MMM, YYYY') : '—' },
          {
            key: 'user_email', title: 'User', render: (r) => (
              <div className="text-xs min-w-[140px]">
                <div className="font-medium text-gray-800 dark:text-neutral-200">{r.user_name || r.user_email || '—'}</div>
                <div className="text-gray-500">{r.user_phone || '—'}</div>
              </div>
            )
          },
          {
            key: 'item_title', title: 'Item', render: (r) => (
              <div className="flex flex-col min-w-[120px]">
                <span className="font-medium truncate max-w-[200px]">{r.item_title || r.attraction_title || '—'}</span>
                <span className="text-xs text-gray-500">
                  {r.item_type === 'Combo' ? 'Combo' : 'Attraction'}
                  {r.quantity && r.quantity > 1 ? ` × ${r.quantity}` : ''}
                </span>
              </div>
            )
          },
          {
            key: 'slot', title: 'Slot', tdClass: 'whitespace-nowrap', render: (r) => {
              if (r.slot_start_time && r.slot_end_time) {
                return `${formatTime12Hour(r.slot_start_time)} - ${formatTime12Hour(r.slot_end_time)}`;
              }
              if (r.slot_label) return r.slot_label;
              if (r.booking_time) return formatTime12Hour(r.booking_time);
              return '—';
            }
          },
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
          { key: 'final_amount', title: 'Amount', tdClass: 'whitespace-nowrap font-semibold', render: (r) => `₹${Number(r?.final_amount ?? r?.total_amount ?? 0).toLocaleString()}` },
        ]}
        rows={rows}
        onRowClick={(r) => navigate(`/admin/bookings/${r.booking_id ?? r.id}`)}
        empty={list.status === 'loading' ? 'Loading…' : 'No bookings found'}
        actions={[
          { label: 'View', title: 'View details', className: 'bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400', onClick: (r) => navigate(`/admin/bookings/${r.booking_id ?? r.id}`) },
          { label: 'WhatsApp', title: 'Resend via WhatsApp', className: 'bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-400', onClick: (r) => handleResendWhatsApp(r) },
          { label: 'Email', title: 'Resend via email', className: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 dark:text-indigo-400', onClick: (r) => handleResendEmail(r) },
        ]}
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

      {/* ── Trend Chart ── */}
      <SectionCard title="Bookings Trend" subtitle="Paid bookings vs revenue over time">
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={overview.trend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
              <Legend />
              <Line type="monotone" dataKey="bookings" stroke="#2563eb" name="Bookings" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="revenue" stroke="#16a34a" name="Revenue" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>
    </div>
  );
}