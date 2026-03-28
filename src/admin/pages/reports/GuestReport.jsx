import React, { useState, useEffect, useMemo, useCallback } from 'react';
import adminApi from '../../services/adminApi';
import { useAdminRole } from '../../hooks/useAdminRole';
import dayjs from 'dayjs';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/reportExportUtils';
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

    const { isStaff, scopes } = useAdminRole();
    const allowedAttrs = scopes?.attraction || [];
    const canSeeSnow = !isStaff || allowedAttrs.includes('*') || allowedAttrs.includes(18);
    const canSeeMadlabs = !isStaff || allowedAttrs.includes('*') || allowedAttrs.includes(21);
    const canSeeEye = !isStaff || allowedAttrs.includes('*') || allowedAttrs.includes(22);
    const canSeeDevil = !isStaff || allowedAttrs.includes('*') || allowedAttrs.includes(23) || allowedAttrs.includes(24);

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

    const COLS = [
        'S.No', 'Visit Date', 'Day',
        ...(canSeeSnow ? ['Snow Park'] : []),
        ...(canSeeMadlabs ? ['Madlabs'] : []),
        ...(canSeeEye ? ['Eyelusion'] : []),
        ...(canSeeDevil ? ["Devil's Darkhouse"] : []),
        ...(isStaff ? [] : ['F&B Add-ons']),
        'Total Guests',
        'Total Amount (₹)'
    ];
    const buildRows = (includeTotals = false) => {
        const dataRows = rows.map(r => [
            r.sno,
            dayjs(r.date).format('DD MMM YYYY'),
            DAYS[new Date(r.date).getDay()],
            ...(canSeeSnow ? [r.snow] : []),
            ...(canSeeMadlabs ? [r.mad] : []),
            ...(canSeeEye ? [r.eye] : []),
            ...(canSeeDevil ? [r.devil] : []),
            ...(isStaff ? [] : [r.fb]),
            r.total, r.amt,
        ]);
        if (includeTotals) {
            const t = summary;
            dataRows.push(['TOTAL', '', '',
                ...(canSeeSnow ? [t.snow] : []),
                ...(canSeeMadlabs ? [t.mad] : []),
                ...(canSeeEye ? [t.eye] : []),
                ...(canSeeDevil ? [t.devil] : []),
                ...(isStaff ? [] : [t.fb]),
                t.total, t.amt]);
        }
        return dataRows;
    };
    const fileLabel = activeDateLabel.replace(/ /g, '_');

    const handleExportCSV = () => exportToCSV(COLS, buildRows(true), `guest_report_${fileLabel}`);

    const handleExportExcel = () => exportToExcel(COLS, buildRows(true), `guest_report_${fileLabel}`, 'Guest Report');

    const handleExportPDF = () => {
        const summaryItems = [
            { label: 'Total Guests', value: numFmt(summary.total) },
            ...(canSeeSnow ? [{ label: '❄️ Snow Park', value: numFmt(summary.snow) }] : []),
            ...(canSeeMadlabs ? [{ label: '🧪 Madlabs', value: numFmt(summary.mad) }] : []),
            ...(canSeeEye ? [{ label: '👁 Eyelusion', value: numFmt(summary.eye) }] : []),
            ...(canSeeDevil ? [{ label: '👹 Devil\'s', value: numFmt(summary.devil) }] : []),
            ...(isStaff ? [] : [{ label: '🍔 Add-ons', value: numFmt(summary.fb) }]),
            { label: '💰 Total Amount', value: moneyFmt(summary.amt) },
        ];
        exportToPDF(COLS, buildRows(true), `guest_report_${fileLabel}`, `Guest Report — ${activeDateLabel}`, summaryItems);
    };

    const isToday = (d) => dayjs(d).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');

    return (
        <div className="rpt-wrapper">
            <div className="rpt-topbar a1">
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div className="rpt-brand">
             
                        <div>
                            <div className="rpt-b-name">Guest Report</div>
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
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--slate)' }}>Visit Date: {activeDateLabel}</div>
                    <div className="export-btns">
                        <button className="exp-btn exp-excel" onClick={handleExportExcel}>⬇ Excel</button>
                        <button className="exp-btn exp-csv" onClick={handleExportCSV}>⬇ CSV</button>
                        <button className="exp-btn exp-pdf" onClick={handleExportPDF}>⬇ PDF</button>
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
                        {canSeeSnow && <div className="tot-cell"><div className="tot-lbl">❄️ Snow Park</div><div className="tot-val tv-blue">{numFmt(summary.snow)}</div><div className="tot-sub">Guests</div></div>}
                        {canSeeMadlabs && <div className="tot-cell"><div className="tot-lbl">🧪 Madlabs</div><div className="tot-val tv-purple">{numFmt(summary.mad)}</div><div className="tot-sub">Guests</div></div>}
                        {canSeeEye && <div className="tot-cell"><div className="tot-lbl">👁 Eyelusion</div><div className="tot-val tv-pink">{numFmt(summary.eye)}</div><div className="tot-sub">Guests</div></div>}
                        {canSeeDevil && <div className="tot-cell"><div className="tot-lbl">👹 Devil's</div><div className="tot-val tv-devil">{numFmt(summary.devil)}</div><div className="tot-sub">Guests</div></div>}
                        {!isStaff && <div className="tot-cell"><div className="tot-lbl">🍔 Add-ons</div><div className="tot-val tv-amber">{numFmt(summary.fb)}</div><div className="tot-sub">Orders</div></div>}
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
                                    {canSeeSnow && <th className={`num col-snow ${sortClass('snow')}`} onClick={() => handleSort('snow')}>❄️ Snow Park</th>}
                                    {canSeeMadlabs && <th className={`num col-mad ${sortClass('mad')}`} onClick={() => handleSort('mad')}>🧪 Madlabs</th>}
                                    {canSeeEye && <th className={`num col-eye ${sortClass('eye')}`} onClick={() => handleSort('eye')}>👁 Eyelusion</th>}
                                    {canSeeDevil && <th className={`num col-devil ${sortClass('devil')}`} onClick={() => handleSort('devil')}>👹 Devil's</th>}
                                    {!isStaff && <th className={`num col-fb ${sortClass('fb')}`} onClick={() => handleSort('fb')}>🍔 Add-ons</th>}
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
                                                {[
                                                    ...(canSeeSnow ? [{ k: 'snow', c: '--blue' }] : []),
                                                    ...(canSeeMadlabs ? [{ k: 'mad', c: '--purple' }] : []),
                                                    ...(canSeeEye ? [{ k: 'eye', c: '--pink' }] : []),
                                                    ...(canSeeDevil ? [{ k: 'devil', c: '--slate' }] : []),
                                                    ...(!isStaff ? [{ k: 'fb', c: '--amber' }] : [])
                                                ].map(({ k, c }) => (
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
                                            {canSeeSnow && <td className="num">{numFmt(summary.snow)}</td>}
                                            {canSeeMadlabs && <td className="num">{numFmt(summary.mad)}</td>}
                                            {canSeeEye && <td className="num">{numFmt(summary.eye)}</td>}
                                            {canSeeDevil && <td className="num">{numFmt(summary.devil)}</td>}
                                            {!isStaff && <td className="num">{numFmt(summary.fb)}</td>}
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
