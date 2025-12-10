import React from 'react';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
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

export default function AttractionRevenue() {
  const { user } = useSelector((s) => s.adminAuth);
  const [attractions, setAttractions] = React.useState([]);
  const [attractionsStatus, setAttractionsStatus] = React.useState('idle');
  const [revenueData, setRevenueData] = React.useState(null);
  const [revenueStatus, setRevenueStatus] = React.useState('idle');
  const [filters, setFilters] = React.useState({
    attraction_id: '',
    from: '',
    to: ''
  });

  // Load attractions (respecting subadmin scope)
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setAttractionsStatus('loading');
      try {
        const res = await adminApi.get(A.attractions(), { params: { limit: 1000 } });
        if (cancelled) return;
        
        let allAttractions = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : [];
        
        // Filter by user scopes if subadmin
        const userRoles = Array.isArray(user?.roles) ? user.roles.map(r => String(r).toLowerCase()) : [];
        const userScopes = user?.scopes || {};
        const isSubadmin = userRoles.includes('subadmin') && !userRoles.includes('admin') && !userRoles.includes('root');
        
        if (isSubadmin) {
          const allowedAttractionIds = userScopes.attraction || [];
          if (allowedAttractionIds.length > 0) {
            allAttractions = allAttractions.filter(a => 
              allowedAttractionIds.includes(a.attraction_id) || allowedAttractionIds.includes(a.id)
            );
            // Auto-select first if not selected
            if (!filters.attraction_id && allAttractions.length > 0) {
              setFilters(f => ({ ...f, attraction_id: allAttractions[0].attraction_id || allAttractions[0].id }));
            }
          }
        }
        
        setAttractions(allAttractions);
        setAttractionsStatus('succeeded');
      } catch (err) {
        if (cancelled) return;
        console.error('Error loading attractions:', err);
        setAttractionsStatus('failed');
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Load revenue data
  const loadRevenueData = React.useCallback(async () => {
    setRevenueStatus('loading');
    try {
      const params = {};
      if (filters.attraction_id) params.attraction_id = filters.attraction_id;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      
      const res = await adminApi.get(A.analyticsAttractionRevenue(), { params });
      setRevenueData(res || {});
      setRevenueStatus('succeeded');
    } catch (err) {
      console.error('Error loading revenue data:', err);
      setRevenueStatus('failed');
    }
  }, [filters]);

  const downloadReport = React.useCallback((format) => {
    try {
      const params = {
        type: 'attraction-revenue',
        ...(filters.attraction_id && { attraction_id: filters.attraction_id }),
        ...(filters.from && { from: filters.from }),
        ...(filters.to && { to: filters.to })
      };
      const url = `${A.analyticsReport(format)}?${new URLSearchParams(params).toString()}`;
      window.open(url, '_blank');
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download report');
    }
  }, [filters]);

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">Attraction Revenue</h1>
        <p className="text-sm text-gray-600 dark:text-neutral-400">Track revenue from attraction bookings</p>
      </div>

      <SectionCard title="Filters" subtitle="Slice data by attraction and date range" className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <select 
            className="rounded-lg border px-3 py-2 disabled:opacity-50"
            value={filters.attraction_id}
            onChange={(e) => setFilters({ ...filters, attraction_id: e.target.value })}
            disabled={attractionsStatus === 'loading'}
          >
            <option value="">
              {attractionsStatus === 'loading' ? 'Loading...' : 'All Attractions'}
            </option>
            {attractionsStatus === 'succeeded' && attractions.map((a) => (
              <option key={a.attraction_id || a.id} value={a.attraction_id || a.id}>
                {a.title || a.name || `#${a.attraction_id || a.id}`}
              </option>
            ))}
          </select>
          
          <input 
            type="date"
            className="rounded-lg border px-3 py-2"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            placeholder="From date"
          />
          
          <input 
            type="date"
            className="rounded-lg border px-3 py-2"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            placeholder="To date"
          />
          
          <div className="flex gap-2">
            <button 
              className="flex-1 rounded-lg bg-gray-900 text-white px-3 py-2 text-sm"
              onClick={loadRevenueData}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          label="Total Bookings"
          value={formatNumber(revenueData?.attraction_bookings)}
          accent="from-blue-500 to-indigo-600"
        />
        <SummaryCard
          label="Total Revenue"
          value={formatCurrency(revenueData?.attraction_revenue)}
          accent="from-green-500 to-emerald-600"
        />
        <SummaryCard
          label="Average Per Booking"
          value={formatCurrency((revenueData?.attraction_revenue || 0) / (revenueData?.attraction_bookings || 1))}
          accent="from-purple-500 to-pink-600"
        />
      </div>

      <SectionCard title="Revenue Report" subtitle="Download detailed reports" className="p-4">
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-neutral-800"
            onClick={() => downloadReport('csv')}
          >
            <FileSpreadsheet className="h-4 w-4" />
            CSV
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-neutral-800"
            onClick={() => downloadReport('pdf')}
          >
            <FileText className="h-4 w-4" />
            PDF
          </button>
        </div>
      </SectionCard>

      {revenueStatus === 'loading' && (
        <div className="text-sm text-gray-500 text-center py-8">Loading revenue data...</div>
      )}
      {revenueStatus === 'failed' && (
        <div className="text-sm text-red-600 text-center py-8">Failed to load revenue data</div>
      )}
    </div>
  );
}
