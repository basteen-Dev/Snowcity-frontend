import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import adminApi from '../../services/adminApi';
import dayjs from 'dayjs';
import './reports.css';

// ─── Formatters ───────────────────────────────────────────────────────────────
const moneyFmt  = (v) => '₹' + Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money0Fmt = (v) => '₹' + Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const numFmt    = (v) => Number(v || 0).toLocaleString('en-IN');

// ─── Attraction config ────────────────────────────────────────────────────────
const ATTR = {
    SNOWCITY:  { label: 'Snow Park',          color: '#1454b8', tag: 'at-snow',  icon: '❄️'  },
    MADLABS:   { label: 'Madlabs',            color: '#5b21b6', tag: 'at-mad',   icon: '🧪'  },
    EYELUSION: { label: 'Eyelusion',          color: '#9d174d', tag: 'at-eye',   icon: '👁'  },
    DEVILS:    { label: "Devil's Darkhouse",  color: '#374159', tag: 'at-devil', icon: '👹'  },
    COMBO:     { label: 'Combo Tickets',      color: '#0d7a8a', tag: 'at-combo', icon: '🎟'  },
    OTHER:     { label: 'Other',              color: '#8a93a8', tag: 'at-other', icon: '📦'  },
};
const ATTR_ORDER = ['SNOWCITY', 'MADLABS', 'EYELUSION', 'DEVILS', 'COMBO', 'OTHER'];

// ─── Attraction detector (fallback if API doesn't return attraction key) ──────
function detectAttraction(name = '', attrField) {
    if (attrField && Array.isArray(attrField)) {
        if (attrField.length > 1) return 'COMBO';
        return attrField[0];
    }
    if (typeof attrField === 'string' && attrField) return attrField;
    const n = name.toUpperCase();
    if (n.includes('CMB') || n.includes('COMBO') || n.includes('SC, M-LABS') || n.includes('SC-MD')) return 'COMBO';
    if (n.includes('MADLAB') || n.includes('MAD LAB')) return 'MADLABS';
    if (n.includes('EYELUSION') || n.includes('EYL')) return 'EYELUSION';
    if (n.includes('DEVIL') || n.includes('SCARY') || n.includes('HANGMAN')) return 'DEVILS';
    return 'SNOWCITY';
}

// ─── Donut SVG ────────────────────────────────────────────────────────────────
function DonutChart({ attrGroups }) {
    const svgRef = useRef(null);
    const keys   = ATTR_ORDER.filter(k => k !== 'OTHER' && attrGroups[k] && attrGroups[k].net > 0);
    const total  = keys.reduce((a, k) => a + attrGroups[k].net, 0);

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg || !total) return;
        while (svg.firstChild) svg.removeChild(svg.firstChild);
        const cx = 70, cy = 70, r = 56, ir = 32;
        let angle = -Math.PI / 2;
        keys.forEach(k => {
            const sweep = (attrGroups[k].net / total) * Math.PI * 2;
            const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
            const x2 = cx + r * Math.cos(angle + sweep), y2 = cy + r * Math.sin(angle + sweep);
            const xi1 = cx + ir * Math.cos(angle), yi1 = cy + ir * Math.sin(angle);
            const xi2 = cx + ir * Math.cos(angle + sweep), yi2 = cy + ir * Math.sin(angle + sweep);
            const large = sweep > Math.PI ? 1 : 0;
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', `M${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} L${xi2},${yi2} A${ir},${ir} 0 ${large},0 ${xi1},${yi1} Z`);
            path.setAttribute('fill', ATTR[k].color);
            path.setAttribute('opacity', '0.88');
            svg.appendChild(path);
            angle += sweep;
        });
        const mkT = (txt, y, sz, fill, fw, mono) => {
            const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            t.setAttribute('x', cx); t.setAttribute('y', y); t.setAttribute('text-anchor', 'middle');
            t.setAttribute('font-size', sz); t.setAttribute('fill', fill); t.setAttribute('font-weight', fw);
            t.setAttribute('font-family', mono ? 'IBM Plex Mono,monospace' : 'inherit');
            t.textContent = txt; svg.appendChild(t);
        };
        mkT('NET', cy - 4, '9', '#8a93a8', '400', false);
        mkT(money0Fmt(total), cy + 10, '10', '#374159', '600', true);
    });

    if (!total) return null;
    return (
        <div className="cons-donut-wrap">
            <svg ref={svgRef} width="140" height="140" viewBox="0 0 140 140" style={{ flexShrink: 0 }} />
            <div className="cons-donut-legend">
                {keys.map(k => {
                    const pct = ((attrGroups[k].net / total) * 100).toFixed(1);
                    return (
                        <div key={k} className="cons-dl-row">
                            <div className="cons-dl-dot" style={{ background: ATTR[k].color }} />
                            <div className="cons-dl-lbl">{ATTR[k].label}</div>
                            <div className="cons-dl-vals">
                                <span className="cons-dl-pct">{pct}%</span>
                                <span className="cons-dl-amt">{money0Fmt(attrGroups[k].net)}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ConsolidatedReport() {
    const [data,        setData]        = useState(null);
    const [loading,     setLoading]     = useState(true);
    const [error,       setError]       = useState('');
    const [filterType,  setFilterType]  = useState('today');
    const [customFrom,  setCustomFrom]  = useState(dayjs().format('YYYY-MM-DD'));
    const [customTo,    setCustomTo]    = useState(dayjs().format('YYYY-MM-DD'));
    const [search,      setSearch]      = useState('');
    const [sortCol,     setSortCol]     = useState('date');
    const [sortDir,     setSortDir]     = useState(1);
    const [shown,       setShown]       = useState(100);
    const [detailOpen,  setDetailOpen]  = useState(false);

    // ── Date range ──
    const getDateRange = useCallback(() => {
        const today = dayjs().format('YYYY-MM-DD');
        switch (filterType) {
            case 'today':     return { from: today, to: today };
            case 'yesterday': { const y = dayjs().subtract(1, 'day').format('YYYY-MM-DD'); return { from: y, to: y }; }
            case 'mtd':       return { from: dayjs().startOf('month').format('YYYY-MM-DD'), to: today };
            case 'custom':    return { from: customFrom, to: customTo };
            default:          return { from: today, to: today };
        }
    }, [filterType, customFrom, customTo]);

    const activeDateLabel = useMemo(() => {
        const { from, to } = getDateRange();
        if (from === to) return dayjs(from).format('DD MMM YYYY');
        return `${dayjs(from).format('DD MMM')} – ${dayjs(to).format('DD MMM YYYY')}`;
    }, [getDateRange]);

    // ── Fetch ──
    useEffect(() => {
        let cancel = false;
        (async () => {
            setLoading(true);
            setError('');
            setShown(100);
            try {
                const { from, to } = getDateRange();
                
                let rawData = [];
                try {
                    // Make POST request to the POS API
                    const payload = {
                        username: 'snowcity_admin',
                        password: 'your_password_here',
                        from_date: from,
                        to_date: to
                    };
                    // Note: Update URL when POS team provides the actual endpoint
                    const res = await adminApi.post('https://your-domain.com/api/ticket-sales', payload);
                    rawData = res.data || res;
                } catch (apiError) {
                    console.warn("API fetch failed, using mock POS data for preview.", apiError);
                    // Mock data as provided in the API contract payload example
                    rawData = [
                        { "DT": `${from} 00:00:00`, "PRICECARDNAME": "BUY 3 GET 1 FREE - Online Offer (Weekend)", "TKT_QTY": 29, "TICKETAMOUNT": 134991.0, "CGSTAMT": 10295.83, "SGSTAMT": 10295.83, "NETAMT": 111060.34 },
                        { "DT": `${from} 00:00:00`, "PRICECARDNAME": "Complementory Offer 3+1", "TKT_QTY": 87, "TICKETAMOUNT": 0.0, "CGSTAMT": 0.0, "SGSTAMT": 0.0, "NETAMT": 0.0 },
                        { "DT": `${from} 00:00:00`, "PRICECARDNAME": "REGULAR ONLINE - Adult (Weekend)", "TKT_QTY": 1, "TICKETAMOUNT": 1287.9, "CGSTAMT": 98.23, "SGSTAMT": 98.23, "NETAMT": 948.34 },
                        { "DT": `${from} 00:00:00`, "PRICECARDNAME": "STUDENT THRILL PASS! (Weekend)", "TKT_QTY": 15, "TICKETAMOUNT": 17880.0, "CGSTAMT": 1363.8, "SGSTAMT": 1363.8, "NETAMT": 15152.4 },
                        { "DT": `${from} 00:00:00`, "PRICECARDNAME": "REGULAR - Child (Weekend)", "TKT_QTY": 12, "TICKETAMOUNT": 15264.0, "CGSTAMT": 1164.24, "SGSTAMT": 1164.24, "NETAMT": 12935.52 },
                        { "DT": `${from} 00:00:00`, "PRICECARDNAME": "REGULAR - Adult (Weekend)", "TKT_QTY": 48, "TICKETAMOUNT": 76320.0, "CGSTAMT": 5820.96, "SGSTAMT": 5820.96, "NETAMT": 64678.08 },
                        { "DT": `${from} 00:00:00`, "PRICECARDNAME": "BIRTHDAY BASH (Weekend)", "TKT_QTY": 2, "TICKETAMOUNT": 3021.0, "CGSTAMT": 230.41, "SGSTAMT": 230.41, "NETAMT": 2401.17 },
                        { "DT": `${from} 00:00:00`, "PRICECARDNAME": "Complementory Birthday Offer", "TKT_QTY": 2, "TICKETAMOUNT": 0.0, "CGSTAMT": 0.0, "SGSTAMT": 0.0, "NETAMT": 0.0 },
                        { "DT": `${from} 00:00:00`, "PRICECARDNAME": "REGULAR ONLINE - Sr. Citizen (Weekends)", "TKT_QTY": 1, "TICKETAMOUNT": 643.5, "CGSTAMT": 49.08, "SGSTAMT": 49.08, "NETAMT": 473.84 },
                        { "DT": `${from} 00:00:00`, "PRICECARDNAME": "REGULAR - Adult (Weekdays)", "TKT_QTY": 4, "TICKETAMOUNT": 5560.0, "CGSTAMT": 424.08, "SGSTAMT": 424.08, "NETAMT": 4711.84 },
                        { "DT": `${from} 00:00:00`, "PRICECARDNAME": "REGULAR - Sr. Citizen (Weekend)", "TKT_QTY": 3, "TICKETAMOUNT": 2385.0, "CGSTAMT": 181.92, "SGSTAMT": 181.92, "NETAMT": 2021.16 },
                        { "DT": `${from} 00:00:00`, "PRICECARDNAME": "Corporate Package (WD)", "TKT_QTY": 40, "TICKETAMOUNT": 43100.0, "CGSTAMT": 3287.34, "SGSTAMT": 3287.34, "NETAMT": 24025.42 },
                        { "DT": `${from} 00:00:00`, "PRICECARDNAME": "YEAR END FLASH SALE @849", "TKT_QTY": 10, "TICKETAMOUNT": 8490.0, "CGSTAMT": 647.5, "SGSTAMT": 647.5, "NETAMT": 7195.0 }
                    ];
                }

                if (Array.isArray(rawData)) {
                    // Map POS array structure to expected local structure
                    const mappedRows = rawData.map(r => {
                        const isCombo = Boolean(r.IS_COMBO || (r.ATTRACTION && r.ATTRACTION.length > 1));
                        let attraction = detectAttraction(r.PRICECARDNAME); // Base fallback
                        if (r.ATTRACTION && r.ATTRACTION.length > 0) {
                            attraction = isCombo ? 'COMBO' : r.ATTRACTION[0];
                        } else if (isCombo) {
                            attraction = 'COMBO';
                        }
                        
                        return {
                            date: r.DT,
                            attraction: attraction,
                            pricecardName: r.PRICECARDNAME,
                            isCombo: isCombo,
                            qty: Number(r.TKT_QTY || 0),
                            gross: Number(r.TICKETAMOUNT || 0),
                            cgst: Number(r.CGSTAMT || 0),
                            sgst: Number(r.SGSTAMT || 0),
                            net: Number(r.NETAMT || 0),
                        };
                    });
                    
                    let totalTickets = 0;
                    let totalGross = 0;
                    let totalCgst = 0;
                    let totalSgst = 0;
                    let totalNet = 0;
                    let totalComplementary = 0;
                    
                    mappedRows.forEach(r => {
                        const isComp = (r.gross === 0 && r.net === 0);
                        if (!isComp) {
                            totalTickets += r.qty;
                        } else {
                            totalComplementary += r.qty;
                        }
                        totalGross += r.gross;
                        totalCgst += r.cgst;
                        totalSgst += r.sgst;
                        totalNet += r.net;
                    });
                    
                    if (!cancel) {
                        setData({
                            summary: { totalTickets, totalGross, totalCgst, totalSgst, totalNet, totalComplementary },
                            rows: mappedRows
                        });
                    }
                } else {
                    if (!cancel) setData(rawData); // Fallback to old format
                }
            } catch (e) {
                if (!cancel) setError(e.message || 'Failed to load data');
            } finally {
                if (!cancel) setLoading(false);
            }
        })();
        return () => { cancel = true; };
    }, [filterType, customFrom, customTo, getDateRange]);

    // ── Derived values ──
    const summary = data?.summary || {};

    const attrGroups = useMemo(() => {
        // Prefer pre-aggregated attrSummary from API
        if (data?.attrSummary?.length) {
            const g = {};
            data.attrSummary.forEach(row => {
                const key = row.attraction || detectAttraction(row.pricecardName || '');
                if (!ATTR[key]) return;
                if (!g[key]) g[key] = { qty: 0, gross: 0, cgst: 0, sgst: 0, net: 0 };
                g[key].qty   += Number(row.qty   || 0);
                g[key].gross += Number(row.gross  || 0);
                g[key].cgst  += Number(row.cgst   || 0);
                g[key].sgst  += Number(row.sgst   || 0);
                g[key].net   += Number(row.net    || 0);
            });
            return g;
        }
        // Fallback: derive from raw rows
        const g = {};
        (data?.rows || []).forEach(r => {
            if (!r.net || Number(r.net) === 0) return;
            const key = r.attraction || detectAttraction(r.pricecardName || '');
            if (!ATTR[key]) return;
            if (!g[key]) g[key] = { qty: 0, gross: 0, cgst: 0, sgst: 0, net: 0 };
            g[key].qty   += Number(r.qty   || 0);
            g[key].gross += Number(r.gross  || 0);
            g[key].cgst  += Number(r.cgst   || 0);
            g[key].sgst  += Number(r.sgst   || 0);
            g[key].net   += Number(r.net    || 0);
        });
        return g;
    }, [data]);

    const dailyTrend = useMemo(() => {
        if (data?.dailyTrend?.length) return [...data.dailyTrend].sort((a, b) => a.date.localeCompare(b.date));
        // Derive from rows if not provided
        const byDate = {};
        (data?.rows || []).forEach(r => {
            const dt = (r.date || '').slice(0, 10);
            if (!dt) return;
            if (!byDate[dt]) byDate[dt] = { date: dt, net: 0, qty: 0 };
            byDate[dt].net += Number(r.net || 0);
            byDate[dt].qty += Number(r.qty || 0);
        });
        return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
    }, [data]);

    const isMultiDay = dailyTrend.length > 1;

    // ── Detail rows (filtered + sorted) ──
    const detailRows = useMemo(() => {
        let r = data?.rows || [];
        if (search.trim()) {
            const q = search.toLowerCase();
            r = r.filter(row => (row.pricecardName || '').toLowerCase().includes(q) || (row.attraction || '').toLowerCase().includes(q));
        }
        if (sortCol) {
            r = [...r].sort((a, b) => {
                const av = a[sortCol], bv = b[sortCol];
                if (typeof av === 'string') return av.localeCompare(bv) * sortDir;
                return ((av || 0) - (bv || 0)) * sortDir;
            });
        }
        return r;
    }, [data, search, sortCol, sortDir]);

    const handleSort = (col) => {
        if (sortCol === col) setSortDir(d => d * -1);
        else { setSortCol(col); setSortDir(1); }
    };
    const sortClass = (col) => sortCol === col ? (sortDir === 1 ? 'sort-asc' : 'sort-desc') : '';

    // ── Exports ──
    const exportCSV = (target) => {
        let cols, csvRows, name;
        if (target === 'attr') {
            cols    = ['Attraction', 'Tickets', 'Gross (₹)', 'CGST (₹)', 'SGST (₹)', 'Net Amount (₹)', 'Avg/Ticket'];
            csvRows = ATTR_ORDER.filter(k => k !== 'OTHER' && attrGroups[k]).map(k => [
                ATTR[k].label, attrGroups[k].qty,
                attrGroups[k].gross.toFixed(2), attrGroups[k].cgst.toFixed(2),
                attrGroups[k].sgst.toFixed(2), attrGroups[k].net.toFixed(2),
                (attrGroups[k].net / attrGroups[k].qty).toFixed(2),
            ]);
            name = `consolidated_attr_${activeDateLabel.replace(/ /g, '_')}`;
        } else {
            cols    = ['Date', 'Attraction', 'Price Card', 'Qty', 'Gross (₹)', 'CGST (₹)', 'SGST (₹)', 'Net (₹)'];
            csvRows = detailRows.map(r => [
                dayjs(r.date).format('DD MMM YYYY'),
                r.attraction || detectAttraction(r.pricecardName),
                r.pricecardName, r.qty,
                Number(r.gross || 0).toFixed(2), Number(r.cgst || 0).toFixed(2),
                Number(r.sgst || 0).toFixed(2), Number(r.net  || 0).toFixed(2),
            ]);
            name = `consolidated_detail_${activeDateLabel.replace(/ /g, '_')}`;
        }
        const csv  = [cols, ...csvRows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const a    = document.createElement('a');
        a.href     = URL.createObjectURL(blob);
        a.download = name + '.csv';
        a.click();
    };

    const exportExcel = (target) => {
        let cols, rows, name;
        if (target === 'attr') {
            cols = ['Attraction', 'Tickets', 'Gross (₹)', 'CGST (₹)', 'SGST (₹)', 'Net Amount (₹)', 'Avg/Ticket'];
            rows = ATTR_ORDER.filter(k => k !== 'OTHER' && attrGroups[k]).map(k => [
                ATTR[k].label, attrGroups[k].qty,
                attrGroups[k].gross.toFixed(2), attrGroups[k].cgst.toFixed(2),
                attrGroups[k].sgst.toFixed(2), attrGroups[k].net.toFixed(2),
                (attrGroups[k].net / attrGroups[k].qty).toFixed(2),
            ]);
            name = `consolidated_attr_${activeDateLabel.replace(/ /g, '_')}`;
        } else {
            cols = ['Date', 'Attraction', 'Price Card', 'Qty', 'Gross (₹)', 'CGST (₹)', 'SGST (₹)', 'Net (₹)'];
            rows = detailRows.map(r => [
                dayjs(r.date).format('DD MMM YYYY'),
                r.attraction || detectAttraction(r.pricecardName),
                r.pricecardName, r.qty,
                Number(r.gross || 0).toFixed(2), Number(r.cgst || 0).toFixed(2),
                Number(r.sgst || 0).toFixed(2), Number(r.net  || 0).toFixed(2),
            ]);
            name = `consolidated_attr_${activeDateLabel.replace(/ /g, '_')}`;
        }
        let tbl = '<table><thead><tr>' + cols.map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>';
        rows.forEach(r => { tbl += '<tr>' + r.map(c => `<td>${c}</td>`).join('') + '</tr>'; });
        tbl += '</tbody></table>';
        const blob = new Blob([tbl], { type: 'application/vnd.ms-excel' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name + '.xls';
        a.click();
    };

    // ── Render ──
    const attrKeys = ATTR_ORDER.filter(k => k !== 'OTHER' && attrGroups[k]);
    const totalNetAll = attrKeys.reduce((a, k) => a + (attrGroups[k]?.net || 0), 0);
    const maxQty = Math.max(...attrKeys.map(k => attrGroups[k]?.qty || 0), 1);

    return (
        <div className="rpt-wrapper">

            {/* ── Topbar ── */}
            <div className="rpt-topbar a1">
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div className="rpt-brand">
                        <div className="rpt-b-name">Consolidated Report</div><p style={{ color: 'red', fontSize: '12px', marginLeft: '10px', marginTop: '5px' }}>(Under Development)</p>
                    </div>
                </div>
                <div className="rpt-chip">🕐 {dayjs().format('ddd, DD MMM YYYY · HH:mm')}</div>
            </div>

            <div className="rpt-page">

                {/* ── Filter Strip ── */}
                <div className="filter-strip a2">
                    <div className="fs-group">
                        <span className="fs-label">Period</span>
                        <div className="date-pills">
                            {['today', 'yesterday', 'mtd'].map(p => (
                                <button key={p} className={`dp ${filterType === p ? 'active' : ''}`} onClick={() => setFilterType(p)}>
                                    {p === 'today' ? 'Today' : p === 'yesterday' ? 'Yesterday' : 'Month-to-Date'}
                                </button>
                            ))}
                            <div className="dp-custom">
                                <button className={`dp ${filterType === 'custom' ? 'active' : ''}`} onClick={() => setFilterType('custom')}>
                                    Custom
                                </button>
                                {filterType === 'custom' && (
                                    <>
                                        <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
                                        <input type="date" value={customTo}   onChange={e => setCustomTo(e.target.value)} />
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="export-btns" style={{ marginLeft: 'auto' }}>
                        <button className="exp-btn exp-excel" onClick={() => exportExcel('detail')}>⬇ Excel</button>
                        <button className="exp-btn exp-csv"   onClick={() => exportCSV('detail')}>⬇ CSV</button>
                        <button className="exp-btn exp-pdf"   onClick={() => window.print()}>⬇ PDF</button>
                    </div>
                </div>

                {error && <div className="rpt-error">⚠️ {error}</div>}

                {/* ══ § 1 — SUMMARY TOTALS ══ */}
                <div className="totals-bar a3">
                    <div className="totals-hd">
                        <span>📊 Summary — All Attractions · {activeDateLabel}</span>
                        <span style={{ fontSize: 11, opacity: 0.7, fontWeight: 400 }}>Paid tickets only · excludes complementary</span>
                    </div>
                    <div className="totals-grid tg-5">
                        <div className="tot-cell">
                            <div className="tot-lbl">Total Tickets</div>
                            <div className="tot-val tv-dark">{loading ? '…' : numFmt(summary.totalTickets)}</div>
                            <div className="tot-sub">Paid tickets sold</div>
                        </div>
                        <div className="tot-cell">
                            <div className="tot-lbl">Net Revenue</div>
                            <div className="tot-val tv-green">{loading ? '…' : money0Fmt(summary.totalNet)}</div>
                            <div className="tot-sub">After GST deduction</div>
                        </div>
                        <div className="tot-cell">
                            <div className="tot-lbl">Gross Amount</div>
                            <div className="tot-val tv-blue">{loading ? '…' : money0Fmt(summary.totalGross)}</div>
                            <div className="tot-sub">Before GST</div>
                        </div>
                        <div className="tot-cell">
                            <div className="tot-lbl">Total GST</div>
                            <div className="tot-val tv-red">{loading ? '…' : money0Fmt((summary.totalCgst || 0) + (summary.totalSgst || 0))}</div>
                            <div className="tot-sub">CGST + SGST combined</div>
                        </div>
                        <div className="tot-cell">
                            <div className="tot-lbl">Complementary</div>
                            <div className="tot-val tv-amber">{loading ? '…' : numFmt(summary.totalComplementary)}</div>
                            <div className="tot-sub">Zero-value tickets</div>
                        </div>
                    </div>
                </div>

                {/* ══ § 2 — ATTRACTION BREAKDOWN ══ */}
                {!loading && attrKeys.length > 0 && (
                    <>
                        <div className="cons-sec-hd cons-s2">
                            <div className="cons-shp">🎢 Attraction Breakdown</div>
                            <div className="cons-shb">Revenue and tickets per attraction · Combo tickets shown separately</div>
                            <div className="cons-shd">{activeDateLabel}</div>
                        </div>

                        {/* Attraction mini-cards */}
                        <div className="cons-attr-cards">
                            {attrKeys.map(k => {
                                const cfg = ATTR[k], d = attrGroups[k];
                                return (
                                    <div key={k} className="cons-attr-card" style={{ borderTopColor: cfg.color }}>
                                        <div className="cons-attr-lbl">{cfg.icon} {cfg.label}</div>
                                        <div className="cons-attr-val" style={{ color: cfg.color }}>{numFmt(d.qty)}</div>
                                        <div className="cons-attr-sub">{money0Fmt(d.net)} net</div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Charts row */}
                        <div className="cons-two-col">

                            {/* Bar chart */}
                            <div className="cons-panel">
                                <div className="cons-ph">
                                    <div>
                                        <div className="cons-pt">Tickets by Attraction</div>
                                        <div className="cons-ps">Paid tickets sold per attraction</div>
                                    </div>
                                    <span className="cons-pbadge cons-pb-blue">{activeDateLabel}</span>
                                </div>
                                <div className="cons-pbody">
                                    <div className="cons-bchart">
                                        {attrKeys.map(k => {
                                            const v = attrGroups[k]?.qty || 0;
                                            const h = v === 0 ? 3 : Math.max(6, (v / maxQty) * 120);
                                            return (
                                                <div key={k} className="cons-bcc">
                                                    <div className="cons-bcv" style={{ color: ATTR[k].color }}>{numFmt(v)}</div>
                                                    <div className="cons-bcb" style={{ height: h, background: ATTR[k].color, opacity: v === 0 ? 0.15 : 0.85 }} />
                                                    <div className="cons-bcl">{ATTR[k].label}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Donut chart */}
                            <div className="cons-panel">
                                <div className="cons-ph">
                                    <div>
                                        <div className="cons-pt">Revenue Share</div>
                                        <div className="cons-ps">Net revenue distribution by attraction</div>
                                    </div>
                                    <span className="cons-pbadge cons-pb-green">{activeDateLabel}</span>
                                </div>
                                <div className="cons-pbody">
                                    <DonutChart attrGroups={attrGroups} />
                                </div>
                            </div>
                        </div>

                        {/* Attraction summary table */}
                        <div className="cons-panel" style={{ marginBottom: 0 }}>
                            <div className="cons-ph">
                                <div>
                                    <div className="cons-pt">Attraction Summary</div>
                                    <div className="cons-ps">Aggregated totals with full GST breakdown</div>
                                </div>
                                <div className="export-btns">
                                    <button className="exp-btn exp-excel" onClick={() => exportExcel('attr')}>⬇ Excel</button>
                                    <button className="exp-btn exp-csv"   onClick={() => exportCSV('attr')}>⬇ CSV</button>
                                </div>
                            </div>
                            <div className="tbl-wrap">
                                <table style={{ minWidth: 800 }}>
                                    <thead>
                                        <tr>
                                            <th>Attraction</th>
                                            <th className="num">Tickets</th>
                                            <th className="num">Share</th>
                                            <th className="num">Gross (₹)</th>
                                            <th className="num">CGST (₹)</th>
                                            <th className="num">SGST (₹)</th>
                                            <th className="num">Net Amount (₹)</th>
                                            <th className="num">Avg / Ticket</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attrKeys.map((k, i) => {
                                            const d = attrGroups[k], cfg = ATTR[k];
                                            const pct = totalNetAll > 0 ? ((d.net / totalNetAll) * 100).toFixed(1) : 0;
                                            return (
                                                <tr key={k} className={i % 2 === 1 ? 'striped' : ''}>
                                                    <td>
                                                        <span className={`atag ${cfg.tag}`}>{cfg.icon} {cfg.label}</span>
                                                        {k === 'COMBO' && <span className="combo-badge" style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 3, background: '#e6f6f8', color: '#0d7a8a' }}>combo</span>}
                                                    </td>
                                                    <td className="num">{numFmt(d.qty)}</td>
                                                    <td className="num">
                                                        <div className="cons-mpb">
                                                            <div className="cons-mpb-t">
                                                                <div className="cons-mpb-f" style={{ width: `${pct}%`, background: cfg.color }} />
                                                            </div>
                                                            <span className="cons-mpb-p">{pct}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="num">{moneyFmt(d.gross)}</td>
                                                    <td className="num disc">{moneyFmt(d.cgst)}</td>
                                                    <td className="num disc">{moneyFmt(d.sgst)}</td>
                                                    <td className="num nett">{moneyFmt(d.net)}</td>
                                                    <td className="num">{d.qty > 0 ? moneyFmt(d.net / d.qty) : '—'}</td>
                                                </tr>
                                            );
                                        })}
                                        {/* Totals row */}
                                        {(() => {
                                            const tt = attrKeys.reduce((a, k) => ({
                                                qty:   a.qty   + (attrGroups[k]?.qty   || 0),
                                                gross: a.gross + (attrGroups[k]?.gross  || 0),
                                                cgst:  a.cgst  + (attrGroups[k]?.cgst   || 0),
                                                sgst:  a.sgst  + (attrGroups[k]?.sgst   || 0),
                                                net:   a.net   + (attrGroups[k]?.net    || 0),
                                            }), { qty: 0, gross: 0, cgst: 0, sgst: 0, net: 0 });
                                            return (
                                                <tr style={{ background: '#374159', color: '#fff', fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace' }}>
                                                    <td>TOTAL</td>
                                                    <td className="num">{numFmt(tt.qty)}</td>
                                                    <td className="num">100%</td>
                                                    <td className="num">{moneyFmt(tt.gross)}</td>
                                                    <td className="num">{moneyFmt(tt.cgst)}</td>
                                                    <td className="num">{moneyFmt(tt.sgst)}</td>
                                                    <td className="num" style={{ color: '#6ee7b7' }}>{moneyFmt(tt.net)}</td>
                                                    <td className="num">{tt.qty > 0 ? moneyFmt(tt.net / tt.qty) : '—'}</td>
                                                </tr>
                                            );
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* ══ § 3 — DAY-WISE TREND (multi-day only) ══ */}
                {!loading && isMultiDay && dailyTrend.length > 0 && (
                    <>
                        <div className="cons-sec-hd cons-s3">
                            <div className="cons-shp">📈 Day-wise Trend</div>
                            <div className="cons-shb">Net revenue collected each day over the selected period</div>
                            <div className="cons-shd">{activeDateLabel}</div>
                        </div>
                        <div className="cons-panel">
                            <div className="cons-ph">
                                <div>
                                    <div className="cons-pt">Daily Net Revenue</div>
                                    <div className="cons-ps">One bar per day · hover to see amount</div>
                                </div>
                                <span className="cons-pbadge cons-pb-slate">{dailyTrend.length} days</span>
                            </div>
                            <div className="cons-pbody">
                                {(() => {
                                    const maxV = Math.max(...dailyTrend.map(d => d.net), 1);
                                    return (
                                        <div className="cons-bchart">
                                            {dailyTrend.map(d => {
                                                const v = d.net, h = Math.max(4, (v / maxV) * 140);
                                                const lbl = dayjs(d.date).format('D MMM');
                                                return (
                                                    <div key={d.date} className="cons-bcc" style={{ minWidth: 36 }} title={`${lbl}: ${money0Fmt(v)}`}>
                                                        <div className="cons-bcv" style={{ color: '#096b48', fontSize: 9 }}>{money0Fmt(v)}</div>
                                                        <div className="cons-bcb" style={{ height: h, background: '#096b48', opacity: 0.82, borderRadius: '4px 4px 0 0' }} />
                                                        <div className="cons-bcl">{lbl}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    </>
                )}

                {/* ══ § 4 — PRICE CARD DETAIL TABLE (toggle) ══ */}
                {!loading && (
                    <>
                        <div style={{ textAlign: 'center', padding: '20px 0 4px' }}>
                            <button
                                className="cons-toggle-btn"
                                onClick={() => { setDetailOpen(v => !v); setShown(100); setSearch(''); }}
                            >
                                <span>{detailOpen ? '▲' : '▼'}</span>
                                {detailOpen ? ' Hide' : ' View'} Price Card Detail Table
                            </button>
                        </div>

                        {detailOpen && (
                            <>
                                <div className="cons-sec-hd cons-s4">
                                    <div className="cons-shp">🎫 Price Card Detail</div>
                                    <div className="cons-shb">Every price card sold · one row per price card per date · raw POS data</div>
                                    <div className="cons-shd">{activeDateLabel}</div>
                                </div>

                                <div className="tbl-wrap a4">
                                    <div className="tbl-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <div className="tbl-info">
                                            Showing <strong>{Math.min(shown, detailRows.length)}</strong> of <strong>{detailRows.length}</strong> records
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <input
                                                type="text"
                                                value={search}
                                                onChange={e => { setSearch(e.target.value); setShown(100); }}
                                                placeholder="Search price card…"
                                                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, outline: 'none', width: 220, color: 'var(--text)' }}
                                            />
                                            <div className="export-btns">
                                                <button className="exp-btn exp-excel" onClick={() => exportExcel('detail')}>⬇ Excel</button>
                                                <button className="exp-btn exp-csv"   onClick={() => exportCSV('detail')}>⬇ CSV</button>
                                                <button className="exp-btn exp-pdf"   onClick={() => window.print()}>⬇ PDF</button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="tbl-scroll">
                                        <table style={{ minWidth: 900 }}>
                                            <thead>
                                                <tr>
                                                    <th>S.No</th>
                                                    <th className={sortClass('date')}         onClick={() => handleSort('date')}>Date</th>
                                                    <th className={sortClass('attraction')}   onClick={() => handleSort('attraction')}>Attraction</th>
                                                    <th className={sortClass('pricecardName')} onClick={() => handleSort('pricecardName')}>Price Card / Ticket Type</th>
                                                    <th className={`num ${sortClass('qty')}`}   onClick={() => handleSort('qty')}>Qty</th>
                                                    <th className={`num ${sortClass('gross')}`} onClick={() => handleSort('gross')}>Gross (₹)</th>
                                                    <th className={`num ${sortClass('cgst')}`}  onClick={() => handleSort('cgst')}>CGST (₹)</th>
                                                    <th className={`num ${sortClass('sgst')}`}  onClick={() => handleSort('sgst')}>SGST (₹)</th>
                                                    <th className={`num ${sortClass('net')}`}   onClick={() => handleSort('net')}>Net (₹)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {detailRows.length === 0 ? (
                                                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>No records found</td></tr>
                                                ) : (
                                                    detailRows.slice(0, shown).map((r, i) => {
                                                        const key  = r.attraction || detectAttraction(r.pricecardName || '');
                                                        const cfg  = ATTR[key] || ATTR.OTHER;
                                                        const isComp = !r.net || Number(r.net) === 0;
                                                        return (
                                                            <tr key={i} className={i % 2 === 1 ? 'striped' : ''}>
                                                                <td className="sno">{i + 1}</td>
                                                                <td><span className="bk-date">{dayjs(r.date).format('DD MMM YYYY')}</span></td>
                                                                <td>
                                                                    <span className={`atag ${cfg.tag}`}>{cfg.icon} {cfg.label}</span>
                                                                    {r.isCombo && <span style={{ marginLeft: 5, fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: '#e6f6f8', color: '#0d7a8a' }}>combo</span>}
                                                                </td>
                                                                <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.pricecardName}>
                                                                    {r.pricecardName}
                                                                    {isComp && <span style={{ marginLeft: 5, fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: '#eef0f4', color: '#8a93a8', border: '1px solid #dde1e9' }}>COMP</span>}
                                                                </td>
                                                                <td className="num">{numFmt(r.qty)}</td>
                                                                <td className="num">{isComp ? '—' : moneyFmt(r.gross)}</td>
                                                                <td className="num disc">{isComp ? '—' : moneyFmt(r.cgst)}</td>
                                                                <td className="num disc">{isComp ? '—' : moneyFmt(r.sgst)}</td>
                                                                <td className="num nett">{isComp ? '—' : moneyFmt(r.net)}</td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {detailRows.length > shown && (
                                        <div className="load-more-wrap" style={{ display: 'block' }}>
                                            <button className="load-more-btn" onClick={() => setShown(s => s + 100)}>
                                                Load More &nbsp;·&nbsp; {detailRows.length - shown} remaining
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* Loading state */}
                {loading && (
                    <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)', fontSize: 14 }}>
                        ⏳ Loading consolidated report…
                    </div>
                )}

               
            </div>

            {/* ── Scoped styles ── */}
            <style>{`
                /* Section headers */
                .cons-sec-hd { display:flex; align-items:stretch; margin-bottom:16px; margin-top:28px; border-radius:10px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.07),0 0 0 1px rgba(0,0,0,0.04); }
                .cons-shp    { padding:10px 18px; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.7px; display:flex; align-items:center; gap:7px; white-space:nowrap; }
                .cons-shb    { padding:10px 18px; font-size:12px; color:var(--sub,#4a5268); background:#fff; border:1px solid var(--border,#dde1e9); border-left:none; flex:1; display:flex; align-items:center; line-height:1.5; }
                .cons-shd    { padding:10px 16px; font-family:'IBM Plex Mono',monospace; font-size:11px; font-weight:600; background:#fff; border:1px solid var(--border,#dde1e9); border-left:none; display:flex; align-items:center; white-space:nowrap; border-radius:0 10px 10px 0; }
                .cons-s2 .cons-shp { background:#096b48; color:#fff; } .cons-s2 .cons-shd { color:#096b48; }
                .cons-s3 .cons-shp { background:#374159; color:#fff; } .cons-s3 .cons-shd { color:#374159; }
                .cons-s4 .cons-shp { background:#5b21b6; color:#fff; } .cons-s4 .cons-shd { color:#5b21b6; }

                /* Attraction mini-cards */
                .cons-attr-cards { display:grid; grid-template-columns:repeat(5,1fr); gap:12px; margin-bottom:16px; }
                .cons-attr-card  { background:#fff; border:1px solid var(--border,#dde1e9); border-radius:10px; padding:16px 18px; box-shadow:0 1px 3px rgba(0,0,0,0.07); border-top:3px solid transparent; transition:box-shadow .15s,transform .15s; }
                .cons-attr-card:hover { box-shadow:0 4px 18px rgba(0,0,0,0.10); transform:translateY(-1px); }
                .cons-attr-lbl   { font-size:10px; text-transform:uppercase; letter-spacing:.7px; color:var(--muted,#8a93a8); font-weight:600; margin-bottom:8px; }
                .cons-attr-val   { font-family:'IBM Plex Mono',monospace; font-size:28px; font-weight:600; line-height:1; margin-bottom:5px; }
                .cons-attr-sub   { font-size:11px; color:var(--sub,#4a5268); }

                /* Two-col layout */
                .cons-two-col { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }

                /* Panel */
                .cons-panel  { background:#fff; border:1px solid var(--border,#dde1e9); border-radius:10px; box-shadow:0 1px 3px rgba(0,0,0,0.07); overflow:hidden; margin-bottom:16px; }
                .cons-ph     { padding:14px 20px 12px; border-bottom:1px solid var(--border,#dde1e9); display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
                .cons-pt     { font-size:14px; font-weight:600; }
                .cons-ps     { font-size:11px; color:var(--muted,#8a93a8); margin-top:3px; line-height:1.45; }
                .cons-pbody  { padding:18px 20px; }
                .cons-pbadge { font-size:10px; font-weight:700; padding:3px 10px; border-radius:5px; text-transform:uppercase; letter-spacing:.5px; white-space:nowrap; }
                .cons-pb-blue  { background:#e8f0fc; color:#1454b8; }
                .cons-pb-green { background:#e4f5ee; color:#096b48; }
                .cons-pb-slate { background:#edf0f5; color:#374159; }

                /* Bar chart */
                .cons-bchart { display:flex; align-items:flex-end; gap:10px; height:150px; }
                .cons-bcc    { flex:1; display:flex; flex-direction:column; align-items:center; gap:4px; min-width:0; }
                .cons-bcv    { font-family:'IBM Plex Mono',monospace; font-size:10px; font-weight:600; white-space:nowrap; }
                .cons-bcb    { width:100%; border-radius:4px 4px 0 0; min-height:3px; }
                .cons-bcl    { font-size:9px; color:var(--muted,#8a93a8); text-align:center; line-height:1.3; width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

                /* Donut */
                .cons-donut-wrap   { display:flex; align-items:center; gap:20px; }
                .cons-donut-legend { display:flex; flex-direction:column; gap:10px; flex:1; }
                .cons-dl-row  { display:flex; align-items:center; gap:8px; }
                .cons-dl-dot  { width:10px; height:10px; border-radius:3px; flex-shrink:0; }
                .cons-dl-lbl  { font-size:12px; flex:1; }
                .cons-dl-vals { text-align:right; }
                .cons-dl-pct  { font-family:'IBM Plex Mono',monospace; font-size:12px; font-weight:600; color:#374159; display:block; }
                .cons-dl-amt  { font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--muted,#8a93a8); display:block; }

                /* Mini progress bar */
                .cons-mpb   { display:flex; align-items:center; gap:7px; }
                .cons-mpb-t { flex:1; height:4px; background:var(--border,#dde1e9); border-radius:3px; overflow:hidden; min-width:40px; }
                .cons-mpb-f { height:100%; border-radius:3px; }
                .cons-mpb-p { font-size:10px; color:var(--muted,#8a93a8); min-width:32px; text-align:right; font-family:'IBM Plex Mono',monospace; }

                /* Toggle button */
                .cons-toggle-btn { display:inline-flex; align-items:center; gap:6px; padding:8px 22px; border-radius:8px; font-size:13px; font-weight:600; border:1px solid var(--border,#dde1e9); background:#fff; color:var(--sub,#4a5268); cursor:pointer; font-family:inherit; transition:all .15s; box-shadow:0 1px 3px rgba(0,0,0,0.07); }
                .cons-toggle-btn:hover { border-color:#1454b8; color:#1454b8; background:#e8f0fc; }
            `}</style>
        </div>
    );
}