import React, { useState, useEffect, useMemo, useCallback } from 'react';
import adminApi from '../../services/adminApi';
import dayjs from 'dayjs';
import './reports.css';

const moneyFmt = (v) => '₹' + Number(v || 0).toLocaleString('en-IN');
const numFmt = (v) => Number(v || 0).toLocaleString('en-IN');
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function GuestReport() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterType, setFilterType] = useState('today');
    const [customFrom, setCustomFrom] = useState(dayjs().format('YYYY-MM-DD'));
    const [customTo, setCustomTo] = useState(dayjs().format('YYYY-MM-DD'));
    const [sortCol, setSortCol] = useState('date');
    const [sortDir, setSortDir] = useState(1);
    const [shown, setShown] = useState(100);

    const getDateRange = useCallback(() => {
        const today = dayjs().format('YYYY-MM-DD');
        switch (filterType) {
            case 'today': return { from: today, to: today };
            case 'yesterday': { const y = dayjs().subtract(1, 'day').format('YYYY-MM-DD'); return { from: y, to: y }; }
            case 'tomorrow': { const t = dayjs().add(1, 'day').format('YYYY-MM-DD'); return { from: t, to: t }; }
            case 'mtd': return { from: dayjs().startOf('month').format('YYYY-MM-DD'), to: today };
            case 'custom': return { from: customFrom, to: customTo };
            default: return { from: today, to: today };
        }
    }, [filterType, customFrom, customTo]);

    const activeDateLabel = useMemo(() => {
        const { from, to } = getDateRange();
        if (from === to) return dayjs(from).format('DD MMM YYYY');
        return `${dayjs(from).format('DD MMM')} – ${dayjs(to).format('DD MMM YYYY')}`;
    }, [getDateRange]);

    useEffect(() => {
        let cancel = false;
        (async () => {
            setLoading(true);
            setError('');
            try {
                const { from, to } = getDateRange();
                const res = await adminApi.get(`/api/parkpanel/analytics/reports/guests?from=${from}&to=${to}`);
                if (!cancel) setData(res);
            } catch (e) {
                if (!cancel) setError(e.message || 'Failed to load');
            } finally {
                if (!cancel) setLoading(false);
            }
        })();
        return () => { cancel = true; };
    }, [filterType, customFrom, customTo, getDateRange]);

    const rows = useMemo(() => {
        let r = data?.rows || [];
        if (sortCol) {
            r = [...r].sort((a, b) => {
                const av = a[sortCol], bv = b[sortCol];
                if (typeof av === 'string') return av.localeCompare(bv) * sortDir;
                return ((av || 0) - (bv || 0)) * sortDir;
            });
        }
        return r;
    }, [data, sortCol, sortDir]);

    const summary = data?.summary || {};

    const handleSort = (col) => {
        if (sortCol === col) setSortDir(d => d * -1);
        else { setSortCol(col); setSortDir(1); }
    };

    const sortClass = (col) => sortCol === col ? (sortDir === 1 ? 'sort-asc' : 'sort-desc') : '';

    const maxOf = (key) => Math.max(...rows.map(r => r[key] || 0), 1);

    const exportCSV = () => {
        const cols = ['S.No', 'Visit Date', 'Day', 'Snow Park', 'Madlabs', 'Eyelusion', "Devil's Darkhouse", 'F&B Add-ons', 'Total Guests', 'Total Amount'];
        const csvRows = rows.map(r => [r.sno, dayjs(r.date).format('DD MMM YYYY'), DAYS[new Date(r.date).getDay()], r.snow, r.mad, r.eye, r.devil, r.fb, r.total, r.amt]);
        const t = summary;
        csvRows.push(['TOTAL', '', '', t.snow, t.mad, t.eye, t.devil, t.fb, t.total, t.amt]);
        const csv = [cols, ...csvRows].map(r => r.join(',')).join('\n');
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = `guest_report_${activeDateLabel.replace(/ /g, '_')}.csv`; a.click();
    };

    const exportExcel = () => {
        const cols = ['S.No', 'Visit Date', 'Day', 'Snow Park', 'Madlabs', 'Eyelusion', "Devil's Darkhouse", 'F&B Add-ons', 'Total Guests', 'Total Amount'];
        let tbl = '<table><thead><tr>' + cols.map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>';
        rows.forEach(r => {
            tbl += `<tr><td>${r.sno}</td><td>${dayjs(r.date).format('DD MMM YYYY')}</td><td>${DAYS[new Date(r.date).getDay()]}</td><td>${r.snow}</td><td>${r.mad}</td><td>${r.eye}</td><td>${r.devil}</td><td>${r.fb}</td><td>${r.total}</td><td>${r.amt}</td></tr>`;
        });
        const t = summary;
        tbl += `<tr><td>TOTAL</td><td></td><td></td><td>${t.snow}</td><td>${t.mad}</td><td>${t.eye}</td><td>${t.devil}</td><td>${t.fb}</td><td>${t.total}</td><td>${t.amt}</td></tr>`;
        tbl += '</tbody></table>';
        const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([tbl], { type: 'application/vnd.ms-excel' }));
        a.download = `guest_report_${activeDateLabel.replace(/ /g, '_')}.xls`; a.click();
    };

    const isToday = (d) => dayjs(d).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');

    return (
        <div className="rpt-wrapper">
            <div className="rpt-topbar a1">
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div className="rpt-brand">
                        <div className="rpt-b-icon">🎡</div>
                        <div>
                            <div className="rpt-b-name">Guest - Reports</div>
                        </div>
                    </div>
                </div>
                <div className="rpt-chip">🕐 {dayjs().format('ddd, DD MMM YYYY · HH:mm')}</div>
            </div>

            <div className="rpt-page">
                {/* FILTER STRIP */}
                <div className="filter-strip a2">
                    <span className="fs-label">Period</span>
                    <div className="date-pills">
                        {['today', 'yesterday', 'tomorrow', 'mtd'].map(p => (
                            <button key={p} className={`dp ${filterType === p ? 'active' : ''}`} onClick={() => setFilterType(p)}>
                                {p === 'today' ? 'Today' : p === 'yesterday' ? 'Yesterday' : p === 'tomorrow' ? 'Tomorrow' : 'Month-to-Date'}
                            </button>
                        ))}
                        <div className="dp-custom">
                            <button className={`dp ${filterType === 'custom' ? 'active' : ''}`} onClick={() => setFilterType('custom')}>Custom</button>
                            {filterType === 'custom' && (
                                <>
                                    <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={{ display: 'inline-block' }} />
                                    <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} style={{ display: 'inline-block' }} />
                                </>
                            )}
                        </div>
                    </div>
                    <div className="fs-sep" />
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--slate)', fontFamily: '"IBM Plex Mono", monospace' }}>Visit Date: {activeDateLabel}</div>
                    <div className="export-btns">
                        <button className="exp-btn exp-excel" onClick={exportExcel}>⬇ Excel</button>
                        <button className="exp-btn exp-csv" onClick={exportCSV}>⬇ CSV</button>
                        <button className="exp-btn exp-pdf" onClick={() => window.print()}>⬇ PDF</button>
                    </div>
                </div>

                {error && <div className="rpt-error">⚠️ {error}</div>}

                {/* TOTALS */}
                <div className="totals-bar a3">
                    <div className="totals-hd">
                        <span>📊 Guest Summary Totals — Visit Date: {activeDateLabel}</span>
                        <span style={{ fontSize: 11, opacity: .7, fontWeight: 400 }}>Totals pinned here — scroll table for daily detail</span>
                    </div>
                    <div className="totals-grid tg-7">
                        <div className="tot-cell"><div className="tot-lbl">Total Guests</div><div className="tot-val tv-dark">{numFmt(summary.total)}</div><div className="tot-sub">All attractions</div></div>
                        <div className="tot-cell"><div className="tot-lbl">❄️ Snow Park</div><div className="tot-val tv-blue">{numFmt(summary.snow)}</div><div className="tot-sub">Guests</div></div>
                        <div className="tot-cell"><div className="tot-lbl">🧪 Madlabs</div><div className="tot-val tv-purple">{numFmt(summary.mad)}</div><div className="tot-sub">Guests</div></div>
                        <div className="tot-cell"><div className="tot-lbl">👁 Eyelusion</div><div className="tot-val tv-pink">{numFmt(summary.eye)}</div><div className="tot-sub">Guests</div></div>
                        <div className="tot-cell"><div className="tot-lbl">👹 Devil's</div><div className="tot-val tv-devil">{numFmt(summary.devil)}</div><div className="tot-sub">Guests</div></div>
                        <div className="tot-cell"><div className="tot-lbl">🍔 Add-ons</div><div className="tot-val tv-amber">{numFmt(summary.fb)}</div><div className="tot-sub">Orders</div></div>
                        <div className="tot-cell"><div className="tot-lbl">💰 Total Amt</div><div className="tot-val tv-green">{moneyFmt(summary.amt)}</div><div className="tot-sub">Collected</div></div>
                    </div>
                </div>

                {/* TABLE */}
                <div className="tbl-wrap a4">
                    <div className="tbl-toolbar">
                        <div className="tbl-info">
                            Showing <strong>{Math.min(shown, rows.length)}</strong> of <strong>{rows.length}</strong> rows
                            &nbsp;·&nbsp; Each row = one visit date &nbsp;·&nbsp; Counts = number of guests
                        </div>
                    </div>
                    <div className="tbl-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th className={sortClass('sno')} onClick={() => handleSort('sno')}>S.No</th>
                                    <th className={sortClass('date')} onClick={() => handleSort('date')}>Visit Date</th>
                                    <th>Day</th>
                                    <th className={`num col-snow ${sortClass('snow')}`} onClick={() => handleSort('snow')}>❄️ Snow Park</th>
                                    <th className={`num col-mad ${sortClass('mad')}`} onClick={() => handleSort('mad')}>🧪 Madlabs</th>
                                    <th className={`num col-eye ${sortClass('eye')}`} onClick={() => handleSort('eye')}>👁 Eyelusion</th>
                                    <th className={`num col-devil ${sortClass('devil')}`} onClick={() => handleSort('devil')}>👹 Devil's</th>
                                    <th className={`num col-fb ${sortClass('fb')}`} onClick={() => handleSort('fb')}>🍔 Add-ons</th>
                                    <th className={`num ${sortClass('total')}`} onClick={() => handleSort('total')}>Total Guests</th>
                                    <th className={`num col-total ${sortClass('amt')}`} onClick={() => handleSort('amt')}>Total Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Loading…</td></tr>
                                ) : rows.length === 0 ? (
                                    <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>No guest data found</td></tr>
                                ) : (
                                    <>
                                        {rows.slice(0, shown).map((r, i) => (
                                            <tr key={i} className={i % 2 === 1 ? 'striped' : ''}>
                                                <td style={{ color: 'var(--muted)', fontSize: 12 }}>{r.sno}</td>
                                                <td>
                                                    <div className="date-cell" style={isToday(r.date) ? { color: 'var(--blue)', fontWeight: 700 } : {}}>
                                                        {dayjs(r.date).format('DD MMM YYYY')}
                                                        {isToday(r.date) && <span style={{ fontSize: 10, background: 'var(--blue-bg)', color: 'var(--blue)', padding: '1px 6px', borderRadius: 4, fontWeight: 600, marginLeft: 6 }}>TODAY</span>}
                                                    </div>
                                                </td>
                                                <td style={{ fontSize: 12, color: 'var(--sub)' }}>{DAYS[new Date(r.date).getDay()]}</td>
                                                {[{ k: 'snow', c: '--blue' }, { k: 'mad', c: '--purple' }, { k: 'eye', c: '--pink' }, { k: 'devil', c: '--slate' }, { k: 'fb', c: '--amber' }].map(({ k, c }) => (
                                                    <td key={k} className="num">
                                                        <div className="gc-cell">
                                                            <span className="gc-num" style={{ color: r[k] > 0 ? `var(${c})` : 'var(--muted)' }}>{r[k] > 0 ? numFmt(r[k]) : '—'}</span>
                                                            <div className="gc-bar"><div className="gc-fill" style={{ width: `${Math.round(r[k] / maxOf(k) * 100)}%`, background: `var(${c})` }} /></div>
                                                        </div>
                                                    </td>
                                                ))}
                                                <td className="num">
                                                    <div className="gc-cell">
                                                        <span className="gc-num" style={{ color: 'var(--slate)', fontSize: 15 }}>{numFmt(r.total)}</span>
                                                        <div className="gc-bar"><div className="gc-fill" style={{ width: `${Math.round(r.total / maxOf('total') * 100)}%`, background: 'var(--slate)' }} /></div>
                                                    </div>
                                                </td>
                                                <td className="num"><span className="amt-cell">{moneyFmt(r.amt)}</span></td>
                                            </tr>
                                        ))}
                                        <tr className="tot-row">
                                            <td colSpan={2} style={{ color: '#fff' }}>TOTAL</td>
                                            <td />
                                            <td className="num">{numFmt(summary.snow)}</td>
                                            <td className="num">{numFmt(summary.mad)}</td>
                                            <td className="num">{numFmt(summary.eye)}</td>
                                            <td className="num">{numFmt(summary.devil)}</td>
                                            <td className="num">{numFmt(summary.fb)}</td>
                                            <td className="num">{numFmt(summary.total)}</td>
                                            <td className="num" style={{ color: '#6ee7b7' }}>{moneyFmt(summary.amt)}</td>
                                        </tr>
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {rows.length > shown && (
                        <div className="load-more-wrap" style={{ display: 'block' }}>
                            <button className="load-more-btn" onClick={() => setShown(s => s + 100)}>
                                Load More &nbsp;·&nbsp; {rows.length - shown} remaining
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
