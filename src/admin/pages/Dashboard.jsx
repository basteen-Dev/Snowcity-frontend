// src/parkpanel/pages/Dashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import adminApi from '../services/adminApi';
import { useAdminRole } from '../hooks/useAdminRole';
import './OpsDashboard.css';

const numberFmt = (v = 0) => Number(v || 0).toLocaleString('en-IN');
const moneyFmt = (v = 0) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

export default function Dashboard() {
  const { isStaff, scopes } = useAdminRole();
  const allowedAttrs = scopes?.attraction || [];
  
  const canSeeSnow = !isStaff || allowedAttrs.includes('*') || allowedAttrs.includes(18);
  const canSeeMadlabs = !isStaff || allowedAttrs.includes('*') || allowedAttrs.includes(21);
  const canSeeEye = !isStaff || allowedAttrs.includes('*') || allowedAttrs.includes(22);
  const canSeeDevil = !isStaff || allowedAttrs.includes('*') || allowedAttrs.includes(23) || allowedAttrs.includes(24);

  const [filterType, setFilterType] = useState('today');
  const [customFrom, setCustomFrom] = useState(dayjs().format('YYYY-MM-DD'));
  const [customTo, setCustomTo] = useState(dayjs().format('YYYY-MM-DD'));
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  // Compute date label for display
  const activeDateLabel = useMemo(() => {
    if (filterType === 'today') return dayjs().format('DD MMM YYYY');
    if (filterType === 'tomorrow') return dayjs().add(1, 'day').format('DD MMM YYYY');
    if (filterType === 'yesterday') return dayjs().subtract(1, 'day').format('DD MMM YYYY');
    if (filterType === 'mtd') return `${dayjs().startOf('month').format('DD')} – ${dayjs().format('DD MMM YYYY')}`;
    if (filterType === 'custom') {
      if (customFrom === customTo) return dayjs(customFrom).format('DD MMM YYYY');
      return `${dayjs(customFrom).format('DD MMM')} – ${dayjs(customTo).format('DD MMM YYYY')}`;
    }
    return '';
  }, [filterType, customFrom, customTo]);

  const loadData = async () => {
    setLoading(true);
    try {
      let from, to;
      if (filterType === 'today') {
        from = to = dayjs().format('YYYY-MM-DD');
      } else if (filterType === 'tomorrow') {
        from = to = dayjs().add(1, 'day').format('YYYY-MM-DD');
      } else if (filterType === 'yesterday') {
        from = to = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
      } else if (filterType === 'mtd') {
        from = dayjs().startOf('month').format('YYYY-MM-DD');
        to = dayjs().format('YYYY-MM-DD');
      } else {
        from = customFrom;
        to = customTo;
      }

      setError(null);
      const res = await adminApi.get('/api/parkpanel/analytics/ops-dashboard', { params: { from, to } });
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
      setError(err?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterType, customFrom, customTo]);

  const visitor = data?.visitorSummary || { totalGuests: 0, snow: 0, madlabs: 0, eyelusion: 0, devil: 0 };
  const revenue = data?.revenueSummary || { ticketing: 0, addons: 0 };
  const attractions = data?.attractionBreakdown || [];
  const txn = data?.transactionSummary || { bookingsPlaced: 0, revenuePlaced: 0, guestsPlaced: 0, attractions: [] };

  const totalRev = revenue.ticketing + revenue.addons;
  const maxRevStream = Math.max(revenue.ticketing, revenue.addons, 1);
  const revPct = (v) => Math.round((v / maxRevStream) * 100);

  return (
    <div className="ops-wrapper">
      {/* TOPBAR */}
      <div className="topbar a1">
        <div className="brand">
    
          <div>
            <div className="b-name">Dashboard</div>
            
          </div>
        </div>
        <div className="tr">
          <div className="chip"><div className="ldot"></div>{loading ? 'Refreshing...' : 'Live'}</div>
          <div className="chip">🕐 {dayjs().format('ddd, DD MMM YYYY · HH:mm')}</div>
        </div>
      </div>

      {/* DATE FILTER BAR */}
      <div className="filter-bar a1">
        <span className="fl">Period</span>
        <button
          className={`fb ${filterType === 'today' ? 'active' : ''}`}
          onClick={() => setFilterType('today')}
        >Today</button>
        <button
          className={`fb ${filterType === 'tomorrow' ? 'active' : ''}`}
          onClick={() => setFilterType('tomorrow')}
        >Tomorrow</button>
        <button
          className={`fb ${filterType === 'yesterday' ? 'active' : ''}`}
          onClick={() => setFilterType('yesterday')}
        >Yesterday</button>
        <button
          className={`fb ${filterType === 'mtd' ? 'active' : ''}`}
          onClick={() => setFilterType('mtd')}
        >Month-to-Date</button>
        <div className="custom-wrap">
          <button
            className={`fb ${filterType === 'custom' ? 'active' : ''}`}
            onClick={() => setFilterType('custom')}
          >Custom</button>
          {filterType === 'custom' && (
            <>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
              <span className="text-xs text-gray-400">to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </>
          )}
        </div>
        <div className="active-date">{activeDateLabel}</div>
      </div>

      {/* PAGE */}
      <div className="page">

        {error && (
          <div style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red)', borderRadius: 'var(--r)', padding: '14px 20px', marginBottom: '16px', fontSize: '13px', fontWeight: 500 }}>
            ⚠️ {error}
          </div>
        )}

        {/* §1 VISITOR SUMMARY */}
        <div className="sec-hd s1 a2">
          <div className="sec-hd-pill">🎢 Visitor Summary</div>
          <div className="sec-hd-body"></div>
          <div className="sec-hd-date">Visit Date: {activeDateLabel}</div>
        </div>

        <div className="scards sc5 a2">
          <div className="sc c-dark">
            <div className="sc-lbl">Total Passes</div>
            <div className="sc-val">{numberFmt(visitor.totalGuests)}</div>
            <div className="sc-sub">All parks & attractions</div>
          </div>
          {canSeeSnow && (
          <div className="sc c-blue">
            <div className="sc-lbl">❄️ Snow Park</div>
            <div className="sc-val">{numberFmt(visitor.snow)}</div>
            <div className="sc-sub">{visitor.snow > 0 ? 'Visitors' : 'No visitors'} today</div>
          </div>
          )}
          {canSeeMadlabs && (
          <div className="sc c-purple">
            <div className="sc-lbl">🧪 Madlabs</div>
            <div className="sc-val">{numberFmt(visitor.madlabs)}</div>
            <div className="sc-sub">{visitor.madlabs > 0 ? 'Visitors' : 'No visitors'} today</div>
          </div>
          )}
          {canSeeEye && (
          <div className="sc c-pink">
            <div className="sc-lbl">👁 Eyelusion</div>
            <div className="sc-val">{numberFmt(visitor.eyelusion)}</div>
            <div className="sc-sub">{visitor.eyelusion > 0 ? 'Visitors' : 'No visitors'} today</div>
          </div>
          )}
          {canSeeDevil && (
          <div className="sc c-slate">
            <div className="sc-lbl">👹 Devil's Darkhouse</div>
            <div className="sc-val">{numberFmt(visitor.devil)}</div>
            <div className="sc-sub">{visitor.devil > 0 ? 'Visitors' : 'No visitors'} today</div>
          </div>
          )}
        </div>

        {/* §2 REVENUE SUMMARY */}
        <div className="sec-hd s2 a3">
          <div className="sec-hd-pill">💰 Revenue Summary</div>
          <div className="sec-hd-body"></div>
          <div className="sec-hd-date">Visit Date: {activeDateLabel}</div>
        </div>

        <div className="scards sc3 a3">
          <div className="sc c-green">
            <div className="sc-lbl">Grand Total</div>
            <div className="sc-val">{moneyFmt(totalRev)}</div>
            <div className="sc-sub">Ticketing + Add-ons</div>
          </div>
          <div className="sc c-blue">
            <div className="sc-lbl">Ticketing</div>
            <div className="sc-val">{moneyFmt(revenue.ticketing)}</div>
            <div className="sc-sub">Attraction & combo ticket prices</div>
          </div>
          <div className="sc c-amber">
            <div className="sc-lbl">Add-ons</div>
            <div className="sc-val">{moneyFmt(revenue.addons)}</div>
            
          </div>
        </div>

        {/* Revenue breakdown panel */}
        <div className="panel a3" style={{ marginBottom: '32px' }}>
          <div className="ph">
            <div>
              <div className="pt">Revenue Breakdown</div>
              <div className="ps">Ticketing vs Add-ons — revenue for the selected visit date</div>
            </div>
            <div className="pbadge pb-green">Visit: {activeDateLabel}</div>
          </div>
          <div className="pbody" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
            <div>
              <div className="sec-lbl" style={{ color: 'var(--blue)' }}>Ticketing Revenue</div>
              <div className="ri"><div className="ri-ic">🎫</div><div className="ri-lbl">Attraction & Combo Tickets</div><div className="ri-bar"><div className="ri-fil" style={{ width: `${revPct(revenue.ticketing)}%`, background: 'var(--blue)' }}></div></div><div className="ri-amt" style={{ color: 'var(--blue)' }}>{moneyFmt(revenue.ticketing)}</div></div>
              <div className="sec-lbl" style={{ color: 'var(--muted)', marginTop: '12px' }}>Non-Ticketing Revenue</div>
              <div className="ri"><div className="ri-ic">🧤</div><div className="ri-lbl">Add-ons </div><div className="ri-bar"><div className="ri-fil" style={{ width: `${revPct(revenue.addons)}%`, background: 'var(--amber)' }}></div></div><div className="ri-amt" style={{ color: 'var(--amber)' }}>{moneyFmt(revenue.addons)}</div></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div className="rev-total">
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Grand Total</div>
                  <div style={{ fontSize: '11px', color: 'var(--sub)', marginTop: '2px' }}>Ticketing {moneyFmt(revenue.ticketing)} + Add-ons {moneyFmt(revenue.addons)}</div>
                </div>
                <div style={{ fontSize: '26px', fontWeight: '700', color: 'var(--green)' }}>{moneyFmt(totalRev)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* §3 ATTRACTION-WISE BREAKDOWN */}
        <div className="sec-hd s3 a4">
          <div className="sec-hd-pill">📊 Attraction-wise Breakdown</div>
          <div className="sec-hd-body"> </div>
          <div className="sec-hd-date">{activeDateLabel}</div>
        </div>

        <div className="two-col a4">
          {/* GUEST COUNT */}
          <div className="panel">
            <div className="ph">
              <div>
                <div className="pt">Guest Count by Attraction</div>
                <div className="ps">How many guests visited each attraction</div>
              </div>
              <div className="pbadge pb-blue">Visit: {activeDateLabel}</div>
            </div>
            <div className="pbody">
              <table className="tbl">
                <thead><tr><th>Attraction</th><th>Guests</th><th>Share</th><th>Tickets</th></tr></thead>
                <tbody>
                  {(attractions.length > 0 ? attractions : [{ title: 'No data', guests: 0, revenue: 0, tickets: 0 }]).map((attr, i) => {
                    const totalG = visitor.totalGuests || 1;
                    const pct = Math.round((attr.guests / totalG) * 100);
                    const tagClass = attr.title.toLowerCase().includes('snow') ? 'at-snow' : attr.title.toLowerCase().includes('mad') ? 'at-mad' : attr.title.toLowerCase().includes('devil') ? 'at-devil' : 'at-eye';
                    return (
                      <tr key={i}>
                        <td><span className={`atag ${tagClass}`}>{attr.title}</span></td>
                        <td>{numberFmt(attr.guests || 0)}</td>
                        <td>
                          <div className="mpb">
                            <div className="mpb-track"><div className="mpb-fill" style={{ width: `${pct}%`, background: 'var(--blue)' }}></div></div>
                            <span className="mpb-pct">{pct}%</span>
                          </div>
                        </td>
                        <td>{numberFmt(attr.tickets || 0)}</td>
                      </tr>
                    );
                  })}
                  <tr className="tot">
                    <td>Total</td>
                    <td>{numberFmt(visitor.totalGuests)}</td>
                    <td></td>
                    <td>{numberFmt(attractions.reduce((acc, curr) => acc + curr.tickets, 0))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ATTRACTION REVENUE */}
          <div className="panel">
            <div className="ph">
              <div>
                <div className="pt">Revenue by Attraction</div>
                <div className="ps">Ticketed-attraction revenue breakdown</div>
              </div>
              <div className="pbadge pb-green">Collected: {activeDateLabel}</div>
            </div>
            <div className="pbody">
              <table className="tbl">
                <thead><tr><th>Attraction</th><th>Revenue</th><th>Share</th><th>Avg/Guest</th></tr></thead>
                <tbody>
                  {(attractions.length > 0 ? attractions : [{ title: 'No data', guests: 0, revenue: 0, tickets: 0 }]).map((attr, i) => {
                    const totalR = attractions.reduce((acc, curr) => acc + curr.revenue, 0) || 1;
                    const pct = Math.round((attr.revenue / totalR) * 100);
                    const avg = attr.guests ? Math.round(attr.revenue / attr.guests) : 0;
                    const tagClass = attr.title.toLowerCase().includes('snow') ? 'at-snow' : attr.title.toLowerCase().includes('mad') ? 'at-mad' : attr.title.toLowerCase().includes('devil') ? 'at-devil' : 'at-eye';
                    return (
                      <tr key={i}>
                        <td><span className={`atag ${tagClass}`}>{attr.title}</span></td>
                        <td style={{ color: 'var(--green)' }}>{moneyFmt(attr.revenue || 0)}</td>
                        <td>
                          <div className="mpb">
                            <div className="mpb-track"><div className="mpb-fill" style={{ width: `${pct}%`, background: 'var(--green)' }}></div></div>
                            <span className="mpb-pct">{pct}%</span>
                          </div>
                        </td>
                        <td>{moneyFmt(avg)}</td>
                      </tr>
                    );
                  })}
                  <tr className="tot">
                    <td>Total</td>
                    <td style={{ color: 'var(--green)' }}>{moneyFmt(attractions.reduce((acc, curr) => acc + curr.revenue, 0))}</td>
                    <td></td>
                    <td>{moneyFmt(Math.round(attractions.reduce((acc, curr) => acc + curr.revenue, 0) / (visitor.totalGuests || 1)))} avg</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* §4 TRANSACTION SUMMARY */}
        <div className="sec-hd s4 a5" style={{ marginTop: '32px' }}>
          <div className="sec-hd-pill">📋 Booking Summary</div>
          <div className="sec-hd-body"></div>
          <div className="sec-hd-date">Visit Date: {activeDateLabel}</div>
        </div>

        <div className="scards sc3 a5">
          <div className="sc c-slate">
            <div className="sc-lbl">Total Bookings</div>
            <div className="sc-val">{numberFmt(txn.bookingsPlaced)}</div>
            <div className="sc-sub">Confirmed orders for this date</div>
          </div>
          <div className="sc c-green">
            <div className="sc-lbl">Booking Value</div>
            <div className="sc-val">{moneyFmt(txn.revenuePlaced)}</div>
            <div className="sc-sub">Total paid amount</div>
          </div>
          <div className="sc c-blue">
            <div className="sc-lbl">Total Guests</div>
            <div className="sc-val">{numberFmt(txn.guestsPlaced)}</div>
            <div className="sc-sub">People visiting on this date</div>
          </div>
        </div>

        <div className="panel a6" style={{ marginBottom: '16px' }}>
          <div className="ph">
            <div>
              <div className="pt">Bookings by Attraction</div>
              <div className="ps">Attraction-wise split for the selected visit date</div>
            </div>
            <div className="pbadge pb-slate">Visit: {activeDateLabel}</div>
          </div>
          <div className="pbody">
            <table className="tbl">
              <thead><tr><th>Attraction</th><th>Bookings</th><th>Guests</th><th>Value</th></tr></thead>
              <tbody>
                {(txn.attractions.length > 0 ? txn.attractions : [{ title: 'No bookings', bookings: 0, guests: 0, value: 0 }]).map((attr, i) => {
                  const tagClass = attr.title.toLowerCase().includes('snow') ? 'at-snow' : attr.title.toLowerCase().includes('mad') ? 'at-mad' : attr.title.toLowerCase().includes('devil') ? 'at-devil' : 'at-eye';
                  return (
                    <tr key={i}>
                      <td><span className={`atag ${tagClass}`}>{attr.title}</span></td>
                      <td>{numberFmt(attr.bookings)}</td>
                      <td>{numberFmt(attr.guests)}</td>
                      <td style={{ color: 'var(--green)' }}>{moneyFmt(attr.value)}</td>
                    </tr>
                  );
                })}
                <tr className="tot">
                  <td>Total</td>
                  <td>{numberFmt(txn.bookingsPlaced)}</td>
                  <td>{numberFmt(txn.guestsPlaced)}</td>
                  <td style={{ color: 'var(--green)' }}>{moneyFmt(txn.revenuePlaced)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER */}
      </div>
    </div>
  );
}
