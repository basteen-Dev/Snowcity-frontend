import React from 'react';
import dayjs from 'dayjs';
import { useDispatch, useSelector } from 'react-redux';
import { listAdminBookings, resendTicketAdmin } from '../../features/bookings/adminBookingsSlice';
import AdminTable from '../../components/common/AdminTable';
import AdminPagination from '../../components/common/AdminPagination';
import { useNavigate } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';

import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
import { FileText, FileSpreadsheet } from 'lucide-react';

const SectionCard = ({ title, subtitle, children, className = '' }) => (
  <div className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:bg-neutral-900 dark:border-neutral-800 ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-neutral-100">{title}</p>
        {subtitle ? <p className="text-xs text-gray-500">{subtitle}</p> : null}
      </div>
    </div>
    {children}
  </div>
);

const SummaryCard = ({ icon, label, value, note, accent = 'from-blue-500 to-indigo-600' }) => (
  <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 dark:bg-neutral-900 dark:border-neutral-800">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</div>
        <div className={`mt-2 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${accent}`}>{value}</div>
      </div>
      {icon}
    </div>
    {note ? <div className="text-xs text-gray-500 mt-2">{note}</div> : null}
  </div>
);

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString()}`;
const formatNumber = (value) => Number(value || 0).toLocaleString();

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
    // Handle case where data is an object with items inside
    const firstValue = Object.values(res.data)[0];
    if (Array.isArray(firstValue)) return firstValue;
  }
  return [];
};

const formatYMD = (value) => dayjs(value).format('YYYY-MM-DD');
const today = formatYMD(new Date());
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

export default function BookingsList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list } = useSelector((s) => s.adminBookings);
  const { user } = useSelector((s) => s.adminAuth);
  const rows = React.useMemo(() => (Array.isArray(list.data) ? list.data : []), [list.data]);
  const rowLookup = React.useMemo(() => {
    const map = new Map();
    rows.forEach((row) => {
      if (row?.booking_id) {
        map.set(row.booking_id, row);
      }
    });
    return map;
  }, [rows]);
  const childCounts = React.useMemo(() => {
    const counts = {};
    rows.forEach((row) => {
      if (row?.parent_booking_id) {
        counts[row.parent_booking_id] = (counts[row.parent_booking_id] || 0) + 1;
      }
    });
    return counts;
  }, [rows]);
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

  React.useEffect(() => {
    dispatch(listAdminBookings({ page: 1, limit: 20 }));
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
        
        // Debug logging
        console.log('API Responses:', {
          attractionsRes,
          combosRes,
          offersRes
        });
        
        // Get user roles and scopes
        const userRoles = Array.isArray(user?.roles) ? user.roles.map(r => String(r).toLowerCase()) : [];
        const userScopes = user?.scopes || {};
        const isSubadmin = userRoles.includes('subadmin') && !userRoles.includes('admin') && !userRoles.includes('root');
        
        // Parse all lists
        let allAttractions = normalizeOptionList(attractionsRes);
        let allCombos = normalizeOptionList(combosRes);
        const allOffers = normalizeOptionList(offersRes);
        
        // Filter based on scopes if subadmin
        let filteredAttractions = allAttractions;
        let filteredCombos = allCombos;
        
        if (isSubadmin) {
          const allowedAttractionIds = userScopes.attraction || [];
          const allowedComboIds = userScopes.combo || [];
          
          console.log('Subadmin scopes:', { allowedAttractionIds, allowedComboIds });
          
          // Filter attractions by allowed IDs
          if (allowedAttractionIds.length > 0) {
            filteredAttractions = allAttractions.filter(a => 
              allowedAttractionIds.includes(a.attraction_id) || allowedAttractionIds.includes(a.id)
            );
          } else {
            filteredAttractions = [];
          }
          
          // Filter combos by allowed IDs
          if (allowedComboIds.length > 0) {
            filteredCombos = allCombos.filter(c => 
              allowedComboIds.includes(c.combo_id) || allowedComboIds.includes(c.id)
            );
          } else {
            filteredCombos = [];
          }
        }
        
        const normalizedData = {
          status: 'succeeded',
          attractions: filteredAttractions,
          combos: filteredCombos,
          offers: allOffers,
        };
        
        console.log('Normalized data:', normalizedData);
        
        setOptions(normalizedData);
      } catch (err) {
        if (cancelled) return;
        console.error('Error loading options:', err);
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
      const attractionFilter = revenueFilters.attraction;
      setRevenueData((prev) => ({ ...prev, attraction: { status: 'loading', data: null } }));
      try {
        const attractionRes = await adminApi.get(A.analyticsAttractionRevenue(), {
          params: {
            from: attractionFilter.from || filters.date_from || undefined,
            to: attractionFilter.to || filters.date_to || undefined,
            attraction_id: attractionFilter.attraction_id || filters.attraction_id || undefined
          }
        });
        setRevenueData((prev) => ({ ...prev, attraction: { status: 'succeeded', data: attractionRes } }));
      } catch (err) {
        setRevenueData((prev) => ({ ...prev, attraction: { status: 'failed', error: err } }));
      }
    }

    if (targets.includes('combo')) {
      const comboFilter = revenueFilters.combo;
      setRevenueData((prev) => ({ ...prev, combo: { status: 'loading', data: null } }));
      try {
        const comboRes = await adminApi.get(A.analyticsComboRevenue(), {
          params: {
            from: comboFilter.from || filters.date_from || undefined,
            to: comboFilter.to || filters.date_to || undefined,
            attraction_id: comboFilter.attraction_id || filters.attraction_id || undefined,
            combo_id: comboFilter.combo_id || filters.combo_id || undefined
          }
        });
        setRevenueData((prev) => ({ ...prev, combo: { status: 'succeeded', data: comboRes } }));
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
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download report');
    }
  }, [filters, revenueFilters]);

  const onSearch = () => {
    dispatch(listAdminBookings({ ...buildQuery(), page: 1, limit: 20 }));
    loadOverview();
    loadRevenueData('both');
  };

  const handleRevenueFilterChange = (card, field, value) => {
    setRevenueFilters((prev) => ({
      ...prev,
      [card]: { ...prev[card], [field]: value },
    }));
  };

  const applyRevenueFilter = (card) => {
    loadRevenueData(card);
  };

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
    const payload = {
      ...buildQuery({ date_from: formatted, date_to: formatted }),
      page: 1,
      limit: 20
    };
    dispatch(listAdminBookings(payload));
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
    const payload = {
      ...buildQuery({
        date_from: from ? from.format('YYYY-MM-DD') : undefined,
        date_to: to ? to.format('YYYY-MM-DD') : undefined
      }),
      page: 1,
      limit: 20
    };
    dispatch(listAdminBookings(payload));
    loadOverview();
  }, [buildQuery, dispatch, loadOverview]);

  React.useEffect(() => {
    if (list.status === 'succeeded') loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.status]);

  const meta = list.meta || {};
  const totalPages = meta.totalPages || meta.total_pages || 1;
  const currPage = meta.page || list.query.page || 1;

  const openParentBooking = React.useCallback((parentId) => {
    if (!parentId) return;
    navigate(`/admin/bookings/${parentId}`);
  }, [navigate]);

  const ticketUrl = React.useCallback((path) => {
    if (!path) return null;
    if (/^https?:/i.test(path)) return path;
    const base = import.meta.env?.VITE_API_BASE_URL || '';
    if (base) return `${base.replace(/\/$/, '')}${path}`;
    return path;
  }, []);

  const viewUserBookings = (r) => {
    const payload = {
      user_email: r.user_email || '',
      user_phone: r.user_phone || ''
    };
    setFilters((prev) => ({ ...prev, ...payload }));
    const query = buildQuery({ ...payload, page: 1 });
    dispatch(listAdminBookings({ ...query, page: 1, limit: 20 }));
  };

  const handleDownloadTicket = (row) => {
    if (!row.ticket_pdf) {
      window.alert('Ticket PDF not available yet.');
      return;
    }
    const url = ticketUrl(row.ticket_pdf);
    if (url) window.open(url, '_blank', 'noopener');
  };

  const handleResendTicket = async (row) => {
    if (!row.booking_id) return;
    if (!window.confirm('Resend ticket email to this user?')) return;
    try {
      await dispatch(resendTicketAdmin({ id: row.booking_id })).unwrap();
      window.alert('Ticket resend initiated.');
    } catch (err) {
      window.alert(err?.message || 'Failed to resend ticket');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Bookings Intelligence</h1>
        <div className="flex gap-2 flex-wrap">
          {quickRanges.map((range) => (
            <button
              key={range.key}
              onClick={() => applyQuickRange(range.key)}
              className={`rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${activeRange === range.key ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600 hover:border-gray-500'}`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {overview.summary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard label="Paid Bookings" value={Number(overview.summary.total_bookings || 0).toLocaleString()} note="Confirmed" />
          <SummaryCard label="Pending" value={Number(overview.summary.pending_bookings || 0).toLocaleString()} note="Awaiting payment" accent="from-amber-400 to-orange-500" />
          <SummaryCard label="Combo Revenue" value={formatCurrency(overview.summary.combo_revenue)} note={`${overview.summary.combo_bookings || 0} combos`} accent="from-indigo-500 to-purple-600" />
          <SummaryCard label="Offer Revenue" value={formatCurrency(overview.summary.offer_revenue)} note={`${overview.summary.offer_bookings || 0} offers`} accent="from-emerald-500 to-green-600" />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard
          title="Attraction Revenue"
          subtitle="Completed attraction bookings & revenue"
        >
          <div className="flex flex-wrap gap-3 mb-4">
            <input
              type="date"
              className="rounded-lg border px-3 py-2 flex-1"
              value={revenueFilters.attraction.from}
              onChange={(e) => handleRevenueFilterChange('attraction', 'from', e.target.value)}
            />
            <input
              type="date"
              className="rounded-lg border px-3 py-2 flex-1"
              value={revenueFilters.attraction.to}
              onChange={(e) => handleRevenueFilterChange('attraction', 'to', e.target.value)}
            />
            <select
              className="rounded-lg border px-3 py-2 flex-1 disabled:opacity-50"
              value={revenueFilters.attraction.attraction_id}
              onChange={(e) => handleRevenueFilterChange('attraction', 'attraction_id', e.target.value)}
              disabled={options.status === 'loading'}
            >
              <option value="">
                {options.status === 'loading' ? 'Loading...' : 'All attractions'}
              </option>
              {options.status === 'succeeded' && (options.attractions || []).length > 0 ? (
                (options.attractions || []).map((a) => (
                  <option key={a.attraction_id || a.id} value={a.attraction_id || a.id}>
                    {a.title || a.name || `#${a.attraction_id || a.id}`}
                  </option>
                ))
              ) : null}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <button className="rounded-lg bg-gray-900 text-white px-3 py-2 text-sm" onClick={() => applyRevenueFilter('attraction')}>
              Apply
            </button>
            <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => resetRevenueFilter('attraction')}>
              Reset
            </button>
            <div className="flex-1" />
            <button
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
              onClick={() => downloadReport('attraction-revenue', 'csv')}
            >
              <FileSpreadsheet className="h-4 w-4" />
              CSV
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
              onClick={() => downloadReport('attraction-revenue', 'pdf')}
            >
              <FileText className="h-4 w-4" />
              PDF
            </button>
          </div>
          <div className="rounded-xl border border-gray-100 p-4 bg-gray-50">
            {revenueData.attraction.status === 'loading' ? (
              <div className="text-sm text-gray-500">Loading…</div>
            ) : revenueData.attraction.status === 'failed' ? (
              <div className="text-sm text-red-600">Failed to load data</div>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-500 uppercase text-xs">Bookings</div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {formatNumber(revenueData.attraction.data?.attraction_bookings)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 uppercase text-xs">Revenue</div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(revenueData.attraction.data?.attraction_revenue)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Combo Revenue"
          subtitle="Combo bookings & linked revenue"
        >
          <div className="flex flex-wrap gap-3 mb-4">
            <input
              type="date"
              className="rounded-lg border px-3 py-2 flex-1"
              value={revenueFilters.combo.from}
              onChange={(e) => handleRevenueFilterChange('combo', 'from', e.target.value)}
            />
            <input
              type="date"
              className="rounded-lg border px-3 py-2 flex-1"
              value={revenueFilters.combo.to}
              onChange={(e) => handleRevenueFilterChange('combo', 'to', e.target.value)}
            />
            <select
              className="rounded-lg border px-3 py-2 flex-1 disabled:opacity-50"
              value={revenueFilters.combo.attraction_id}
              onChange={(e) => handleRevenueFilterChange('combo', 'attraction_id', e.target.value)}
              disabled={options.status === 'loading'}
            >
              <option value="">
                {options.status === 'loading' ? 'Loading...' : 'All attractions'}
              </option>
              {options.status === 'succeeded' && (options.attractions || []).length > 0 ? (
                (options.attractions || []).map((a) => (
                  <option key={a.attraction_id || a.id} value={a.attraction_id || a.id}>
                    {a.title || a.name || `#${a.attraction_id || a.id}`}
                  </option>
                ))
              ) : null}
            </select>
            <select
              className="rounded-lg border px-3 py-2 flex-1 disabled:opacity-50"
              value={revenueFilters.combo.combo_id}
              onChange={(e) => handleRevenueFilterChange('combo', 'combo_id', e.target.value)}
              disabled={options.status === 'loading'}
            >
              <option value="">
                {options.status === 'loading' ? 'Loading...' : 'All combos'}
              </option>
              {options.status === 'succeeded' && (options.combos || []).length > 0 ? (
                (options.combos || []).map((c) => (
                  <option key={c.combo_id || c.id} value={c.combo_id || c.id}>
                    {c.title || c.name || `Combo #${c.combo_id || c.id}`}
                  </option>
                ))
              ) : null}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <button className="rounded-lg bg-gray-900 text-white px-3 py-2 text-sm" onClick={() => applyRevenueFilter('combo')}>
              Apply
            </button>
            <button className="rounded-lg border px-3 py-2 text-sm" onClick={() => resetRevenueFilter('combo')}>
              Reset
            </button>
            <div className="flex-1" />
            <button
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
              onClick={() => downloadReport('combo-revenue', 'csv')}
            >
              <FileSpreadsheet className="h-4 w-4" />
              CSV
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
              onClick={() => downloadReport('combo-revenue', 'pdf')}
            >
              <FileText className="h-4 w-4" />
              PDF
            </button>
          </div>
          <div className="rounded-xl border border-gray-100 p-4 bg-gray-50">
            {revenueData.combo.status === 'loading' ? (
              <div className="text-sm text-gray-500">Loading…</div>
            ) : revenueData.combo.status === 'failed' ? (
              <div className="text-sm text-red-600">Failed to load data</div>
            ) : (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-500 uppercase text-xs">Combo bookings</div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {formatNumber(revenueData.combo.data?.combo_bookings)}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 uppercase text-xs">Combo revenue</div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(revenueData.combo.data?.combo_revenue)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Filters" subtitle="Slice bookings by channel, product, and time" className="p-4">
        {(() => {
          const userRoles = Array.isArray(user?.roles) ? user.roles.map(r => String(r).toLowerCase()) : [];
          const isSubadmin = userRoles.includes('subadmin') && !userRoles.includes('admin') && !userRoles.includes('root');
          return isSubadmin ? (
            <div className="bg-blue-50 text-blue-900 border border-blue-200 rounded-lg px-3 py-2 text-xs mb-3">
              <strong>Subadmin Access:</strong> Viewing attractions and combos from your assigned bookings only.
            </div>
          ) : null;
        })()}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
          <input className="rounded-lg border px-3 py-2" placeholder="Search ref / user" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          <select className="rounded-lg border px-3 py-2" value={filters.payment_status} onChange={(e) => setFilters({ ...filters, payment_status: e.target.value })}>
            <option value="">Payment: All</option>
            <option>Pending</option><option>Completed</option><option>Failed</option><option>Cancelled</option>
          </select>
          <select className="rounded-lg border px-3 py-2" value={filters.booking_status} onChange={(e) => setFilters({ ...filters, booking_status: e.target.value })}>
            <option value="">Booking: All</option>
            <option>Booked</option><option>Redeemed</option><option>Expired</option><option>Cancelled</option>
          </select>
          <select className="rounded-lg border px-3 py-2" value={filters.item_type} onChange={(e) => setFilters({ ...filters, item_type: e.target.value })}>
            <option value="">Item Type</option>
            <option value="Attraction">Attraction</option>
            <option value="Combo">Combo</option>
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
          <select 
            className="rounded-lg border px-3 py-2 disabled:opacity-50" 
            value={filters.attraction_id} 
            onChange={(e) => setFilters({ ...filters, attraction_id: e.target.value })}
            disabled={options.status === 'loading'}
          >
            <option value="">
              {options.status === 'loading' ? 'Loading attractions...' : 'Attraction'}
            </option>
            {options.status === 'succeeded' && (options.attractions || []).length > 0 ? (
              (options.attractions || []).map((a) => (
                <option key={a.attraction_id || a.id} value={a.attraction_id || a.id}>
                  {a.title || a.name || `#${a.attraction_id || a.id}`}
                </option>
              ))
            ) : options.status === 'failed' ? (
              <option disabled>Failed to load attractions</option>
            ) : null}
          </select>
          <select 
            className="rounded-lg border px-3 py-2 disabled:opacity-50" 
            value={filters.combo_id} 
            onChange={(e) => setFilters({ ...filters, combo_id: e.target.value })}
            disabled={options.status === 'loading'}
          >
            <option value="">
              {options.status === 'loading' ? 'Loading combos...' : 'Combo'}
            </option>
            {options.status === 'succeeded' && (options.combos || []).length > 0 ? (
              (options.combos || []).map((c) => (
                <option key={c.combo_id || c.id} value={c.combo_id || c.id}>
                  {c.title || c.name || `Combo #${c.combo_id || c.id}`}
                </option>
              ))
            ) : options.status === 'failed' ? (
              <option disabled>Failed to load combos</option>
            ) : null}
          </select>
          <select 
            className="rounded-lg border px-3 py-2 disabled:opacity-50" 
            value={filters.offer_id} 
            onChange={(e) => setFilters({ ...filters, offer_id: e.target.value })}
            disabled={options.status === 'loading'}
          >
            <option value="">
              {options.status === 'loading' ? 'Loading offers...' : 'Offer'}
            </option>
            {options.status === 'succeeded' && (options.offers || []).length > 0 ? (
              (options.offers || []).map((o) => (
                <option key={o.offer_id || o.id} value={o.offer_id || o.id}>
                  {o.title || o.name || o.code || `Offer #${o.offer_id || o.id}`}
                </option>
              ))
            ) : options.status === 'failed' ? (
              <option disabled>Failed to load offers</option>
            ) : null}
          </select>
          <input className="rounded-lg border px-3 py-2" placeholder="User email" value={filters.user_email} onChange={(e) => setFilters({ ...filters, user_email: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
          <input className="rounded-lg border px-3 py-2" placeholder="User phone" value={filters.user_phone} onChange={(e) => setFilters({ ...filters, user_phone: e.target.value })} />
          <input type="date" className="rounded-lg border px-3 py-2" value={filters.date_from} onChange={(e) => { const val = e.target.value; setFilters({ ...filters, date_from: val, date_to: val }); setActiveRange('custom'); }} />
          <input type="date" className="rounded-lg border px-3 py-2" value={filters.date_to} onChange={(e) => { const val = e.target.value; setFilters({ ...filters, date_from: val, date_to: val }); setActiveRange('custom'); }} />
          <div className="flex gap-2">
            <button className="flex-1 rounded-lg bg-gray-900 text-white px-3 py-2" onClick={onSearch}>Apply</button>
            <button
              className="rounded-lg border px-3 py-2"
              onClick={() => {
                setFilters({ search: '', payment_status: '', booking_status: '', attraction_id: '', combo_id: '', offer_id: '', user_email: '', user_phone: '', item_type: '', date_from: '', date_to: '' });
                dispatch(listAdminBookings({ page: 1, limit: 20 }));
                setActiveRange('all');
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </SectionCard>

      {filters.user_email || filters.user_phone ? (
        <div className="bg-blue-50 text-blue-900 border border-blue-100 rounded-xl px-4 py-2 text-sm">
          Showing bookings for
          {filters.user_email ? <> email <strong>{filters.user_email}</strong></> : null}
          {filters.user_phone ? <> phone <strong>{filters.user_phone}</strong></> : null}
        </div>
      ) : null}

      {filters.user_email || filters.user_phone ? (
        <div className="mb-4 text-sm text-gray-600">
          Showing results for
          {filters.user_email ? <> email <strong>{filters.user_email}</strong></> : null}
          {filters.user_phone ? <> phone <strong>{filters.user_phone}</strong></> : null}
        </div>
      ) : null}

      <AdminTable
        keyField="booking_id"
        columns={[
          { key: 'booking_ref', title: 'Ref' },
          { key: 'booking_date', title: 'Date', render: (r) => r.booking_date ? dayjs(r.booking_date).format('DD MMM, YYYY') : '—' },
          { key: 'user_email', title: 'User', render: (r) => (
            <div className="text-xs">
              <div>{r.user_email || '—'}</div>
              <div className="text-gray-500">{r.user_phone || '—'}</div>
            </div>
          ) },
          { key: 'item_title', title: 'Item', render: (r) => (
            <div className="flex flex-col">
              <span>{r.item_title || r.attraction_title || '—'}</span>
              <span className="text-xs text-gray-500">{r.item_type === 'Combo' ? 'Combo' : 'Attraction'}</span>
            </div>
          ) },
          { key: 'combo_title', title: 'Combo/Offer', render: (r) => (
            <div className="flex flex-col text-xs">
              {r.combo_title ? <span>Combo: {r.combo_title}</span> : null}
              {r.offer_title ? <span>Offer: {r.offer_title}</span> : <span className="text-gray-400">—</span>}
            </div>
          ) },
          { key: 'quantity', title: 'Qty', render: (r) => r.quantity ? `${r.quantity}` : '1' },
          { key: 'combo_context', title: 'Combo Context', render: (r) => {
            const isParent = r.item_type === 'Combo';
            const isChild = Boolean(r.parent_booking_id);
            const parentRow = isChild ? rowLookup.get(r.parent_booking_id) : null;
            const parentLabel = parentRow?.booking_ref || parentRow?.booking_id || r.parent_booking_id;
            const childCount = childCounts[r.booking_id] || 0;
            const badge = (label, tone = 'indigo') => (
              <span className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium bg-${tone}-100 text-${tone}-700`}>
                {label}
              </span>
            );

            if (isParent) {
              return (
                <div className="flex flex-col gap-1 text-xs">
                  {badge('Combo parent')}
                  <span className="text-gray-600">
                    {childCount
                      ? `${childCount} linked ${childCount === 1 ? 'attraction booking' : 'attraction bookings'}`
                      : 'Child bookings syncing…'}
                  </span>
                </div>
              );
            }

            if (isChild) {
              return (
                <div className="flex flex-col gap-1 text-xs">
                  {badge('Combo child', 'emerald')}
                  <div className="flex flex-col gap-1">
                    <span className="text-gray-600">
                      Parent booking {parentLabel ? `#${parentLabel}` : '—'}
                      {parentRow?.item_title ? ` · ${parentRow.item_title}` : ''}
                    </span>
                    <button
                      className="w-fit text-indigo-600 hover:underline"
                      type="button"
                      onClick={(e) => { e.stopPropagation(); openParentBooking(r.parent_booking_id); }}
                    >
                      View parent
                    </button>
                  </div>
                </div>
              );
            }

            return <span className="text-xs text-gray-400">Standalone booking</span>;
          } },
          { key: 'slot', title: 'Slot', render: (r) => {
            // Debug logging to see what data we have
            console.log('🔍 DEBUG Admin BookingsList item:', {
              booking_id: r.booking_id,
              slot_start_time: r.slot_start_time,
              slot_end_time: r.slot_end_time,
              booking_time: r.booking_time,
              slot_label: r.slot_label
            });
            
            // Format time for display
            const formatTime12Hour = (time24) => {
              if (!time24) return '';
              const [hours, minutes] = time24.split(':');
              const hour = parseInt(hours);
              const ampm = hour >= 12 ? 'PM' : 'AM';
              const hour12 = hour % 12 || 12;
              return `${hour12}:${minutes} ${ampm}`;
            };
            
            if (r.slot_start_time && r.slot_end_time) {
              const formatted = `${formatTime12Hour(r.slot_start_time)} - ${formatTime12Hour(r.slot_end_time)}`;
              console.log('🔍 DEBUG Admin using formatted slot times:', formatted);
              return formatted;
            }
            if (r.slot_label) {
              console.log('🔍 DEBUG Admin using slot_label:', r.slot_label);
              return r.slot_label;
            }
            if (r.booking_time) {
              const formatted = formatTime12Hour(r.booking_time);
              console.log('🔍 DEBUG Admin using booking_time:', formatted);
              return formatted;
            }
            console.log('🔍 DEBUG Admin no timing info available');
            return '—';
          } },
          { key: 'payment_status', title: 'Payment' },
          { key: 'booking_status', title: 'Status' },
          { key: 'final_amount', title: 'Amount', render: (r) => `₹${r?.final_amount ?? r?.total_amount ?? 0}` },
          { key: '__actions', title: '', render: (r) => (
            <div className="flex flex-wrap justify-end gap-3 text-xs">
              <button className="text-blue-600 hover:underline" onClick={(e) => { e.stopPropagation(); navigate(`/admin/bookings/${r.booking_id ?? r.id}`); }}>Details</button>
              {r.user_email || r.user_phone ? (
                <button className="text-gray-600 hover:underline" onClick={(e) => { e.stopPropagation(); viewUserBookings(r); }}>User bookings</button>
              ) : null}
              <button
                className={`hover:underline ${r.ticket_pdf ? 'text-emerald-600' : 'text-gray-400 cursor-not-allowed'}`}
                onClick={(e) => { e.stopPropagation(); handleDownloadTicket(r); }}
                disabled={!r.ticket_pdf}
              >
                Download ticket
              </button>
              <button
                className="text-orange-600 hover:underline"
                onClick={(e) => { e.stopPropagation(); handleResendTicket(r); }}
              >
                Resend ticket
              </button>
            </div>
          ) }
        ]}
        rows={rows}
        onRowClick={(r) => navigate(`/admin/bookings/${r.booking_id ?? r.id}`)}
        empty={list.status === 'loading' ? 'Loading…' : 'No bookings'}
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          className="rounded-md border px-3 py-2 text-sm"
          onClick={() => stepSingleDate(-1)}
        >
          ◀ Prev Date
        </button>
        <div className="text-sm text-gray-600">
          {activeRange === 'all' ? 'All bookings' : filters.date_from ? dayjs(filters.date_from).format('dddd, DD MMM YYYY') : 'No date selected'}
        </div>
        <button
          className="rounded-md border px-3 py-2 text-sm"
          onClick={() => stepSingleDate(1)}
        >
          Next Date ▶
        </button>
      </div>

      <AdminPagination
        page={currPage}
        totalPages={totalPages}
        onPage={(p) => dispatch(listAdminBookings({ ...buildQuery(), page: p, limit: 20 }))}
      />

      <SectionCard title="Bookings Trend" subtitle="Paid bookings vs revenue" className="p-4">
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={overview.trend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="bucket" />
              <YAxis />
              <Tooltip />
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