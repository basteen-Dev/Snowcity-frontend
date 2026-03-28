import React, { useState, useEffect, useMemo, useCallback } from 'react';
import adminApi from '../../services/adminApi';
import { useAdminRole } from '../../hooks/useAdminRole';
import dayjs from 'dayjs';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/reportExportUtils';
import './reports.css';

const moneyFmt = (v) => '₹' + Number(v || 0).toLocaleString('en-IN');
const numFmt = (v) => Number(v || 0).toLocaleString('en-IN');

export default function TransactionReport() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { isStaff } = useAdminRole();
    const [filterType, setFilterType] = useState('today');
    const [txnType, setTxnType] = useState(isStaff ? 'ticketing' : 'both');
    const [customFrom, setCustomFrom] = useState(dayjs().format('YYYY-MM-DD'));
    const [customTo, setCustomTo] = useState(dayjs().format('YYYY-MM-DD'));
    const [search, setSearch] = useState('');
    const [sortCol, setSortCol] = useState('');
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
                const res = await adminApi.get(`/api/parkpanel/analytics/reports/transactions?from=${from}&to=${to}&type=${txnType}`);
                if (!cancel) setData(res);
            } catch (e) {
                if (!cancel) setError(e.message || 'Failed to load');
            } finally {
                if (!cancel) setLoading(false);
            }
        })();
        return () => { cancel = true; };
    }, [filterType, customFrom, customTo, txnType, getDateRange]);

    const rows = useMemo(() => {
        let r = data?.rows || [];
        if (search.trim()) {
            const q = search.toLowerCase();
            r = r.filter(row => String(row.bookingId).toLowerCase().includes(q) || row.description?.toLowerCase().includes(q));
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

    const summary = data?.summary || {};

    const handleSort = (col) => {
        if (sortCol === col) setSortDir(d => d * -1);
        else { setSortCol(col); setSortDir(1); }
    };

    const sortClass = (col) => sortCol === col ? (sortDir === 1 ? 'sort-asc' : 'sort-desc') : '';

    const tagClass = (desc) => {
        const d = (desc || '').toLowerCase();
        if (d.includes('snow')) return 'at-snow';
        if (d.includes('mad')) return 'at-mad';
        if (d.includes('devil')) return 'at-devil';
        if (d.includes('eye')) return 'at-eye';
        if (d.includes('food') || d.includes('voucher')) return 'at-fb';
        return 'at-retail';
    };

    const COLS = ['S.No', 'Booking ID', 'Booking Date', 'Visit Date', 'Description', 'Price (₹)', 'Discount (₹)', 'Qty', 'Nett Amount (₹)'];
    const buildRows = () => rows.map(r => [
        r.sno,
        r.bookingId,
        dayjs(r.bookingDate).format('DD MMM YYYY HH:mm'),
        dayjs(r.visitDate).format('DD MMM YYYY'),
        r.isComboChild ? `${r.description} (combo child)` : r.description,
        r.unitPrice,
        r.discount,
        r.quantity,
        r.nett,
    ]);
    const fileLabel = activeDateLabel.replace(/ /g, '_');

    const handleExportCSV = () => exportToCSV(COLS, buildRows(), `transactions_${fileLabel}`);

    const handleExportExcel = () => exportToExcel(COLS, buildRows(), `transactions_${fileLabel}`, 'Transactions');

    const handleExportPDF = () => {
        const summaryItems = [
            { label: 'Total Records', value: String(summary.totalRecords ?? 0) },
            { label: 'Total Qty', value: String(summary.totalQty ?? 0) },
            { label: 'Gross Amount', value: moneyFmt(summary.totalGross) },
            { label: 'Total Discount', value: summary.totalDiscount > 0 ? `− ${moneyFmt(summary.totalDiscount)}` : '—' },
            { label: 'Nett Amount', value: moneyFmt(summary.totalNett) },
            { label: 'Avg per Ticket', value: moneyFmt(summary.avgPerTicket) },
        ];
        exportToPDF(COLS, buildRows(), `transactions_${fileLabel}`, `Transaction Report — ${activeDateLabel}`, summaryItems);
    };

    return (
        <div className="rpt-wrapper">
            <div className="rpt-topbar a1">
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div className="rpt-brand">
                        <div>
                            <div className="rpt-b-name">Transaction Reports</div>
                        </div>
                    </div>
                </div>
                <div className="rpt-chip">🕐 {dayjs().format('ddd, DD MMM YYYY · HH:mm')}</div>
            </div>

            <div className="rpt-page">
                {/* FILTER STRIP */}
                <div className="filter-strip a2">
                    <div className="fs-group">
                        <span className="fs-label">Type</span>
                        <div className="tgl">
                            {['ticketing', 'addons', 'both'].filter(t => !isStaff || t === 'ticketing').map(t => (
                                <button key={t} className={`tgl-btn ${txnType === t ? 'active' : ''}`} onClick={() => setTxnType(t)}>
                                    {t === 'ticketing' ? '🎫 Ticketing' : t === 'addons' ? '🧤 Add-ons' : '⊕ Both'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="fs-sep" />
                    <div className="fs-group">
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
                    </div>
                    <div className="export-btns">
                        <button className="exp-btn exp-excel" onClick={handleExportExcel}>⬇ Excel</button>
                        <button className="exp-btn exp-csv" onClick={handleExportCSV}>⬇ CSV</button>
                        <button className="exp-btn exp-pdf" onClick={handleExportPDF}>⬇ PDF</button>
                    </div>
                </div>

                {error && <div className="rpt-error">⚠️ {error}</div>}

                {/* SUMMARY TOTALS */}
                <div className="totals-bar a3">
                    <div className="totals-hd">
                        <span>📊 Summary Totals — {txnType === 'ticketing' ? 'Ticketing' : txnType === 'addons' ? 'Add-ons' : 'All'} · {activeDateLabel}</span>
                        <span style={{ fontSize: 11, opacity: .7, fontWeight: 400 }}>Totals for entire period</span>
                    </div>
                    <div className="totals-grid tg-6">
                        <div className="tot-cell"><div className="tot-lbl">Total Records</div><div className="tot-val tv-dark">{numFmt(summary.totalRecords)}</div><div className="tot-sub">Transactions</div></div>
                        <div className="tot-cell"><div className="tot-lbl">Total Qty</div><div className="tot-val tv-blue">{numFmt(summary.totalQty)}</div><div className="tot-sub">Tickets / items</div></div>
                        <div className="tot-cell"><div className="tot-lbl">Gross Amount</div><div className="tot-val tv-dark">{moneyFmt(summary.totalGross)}</div><div className="tot-sub">Before discounts</div></div>
                        <div className="tot-cell"><div className="tot-lbl">Total Discount</div><div className="tot-val tv-red">{summary.totalDiscount > 0 ? `− ${moneyFmt(summary.totalDiscount)}` : '—'}</div><div className="tot-sub">Applied discounts</div></div>
                        <div className="tot-cell"><div className="tot-lbl">Nett Amount</div><div className="tot-val tv-green">{moneyFmt(summary.totalNett)}</div><div className="tot-sub">Collected revenue</div></div>
                        <div className="tot-cell"><div className="tot-lbl">Avg per Ticket</div><div className="tot-val tv-amber">{moneyFmt(summary.avgPerTicket)}</div><div className="tot-sub">Nett / qty</div></div>
                    </div>
                </div>

                {/* TABLE */}
                <div className="tbl-wrap a4">
                    <div className="tbl-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div className="tbl-info">
                            Showing <strong>{Math.min(shown, rows.length)}</strong> of <strong>{rows.length}</strong> records &nbsp;·&nbsp;
                            <span className="vd-legend"><span className="vd-dot" /> <span style={{ color: 'var(--visit-col)', fontWeight: 500 }}>Green date</span> = Visit Date · Grey = Booking Date</span>
                        </div>
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Booking ID/Desc…"
                            style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, outline: 'none', width: '240px', color: 'var(--text)' }} />
                    </div>
                    <div className="tbl-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th className={sortClass('sno')} onClick={() => handleSort('sno')}>S.No</th>
                                    <th className={sortClass('bookingId')} onClick={() => handleSort('bookingId')}>Booking ID</th>
                                    <th className={sortClass('bookingDate')} onClick={() => handleSort('bookingDate')}>Booking Date & Time</th>
                                    <th className={sortClass('visitDate')} onClick={() => handleSort('visitDate')}>Visit Date</th>
                                    <th className={sortClass('description')} onClick={() => handleSort('description')}>Ticket / Item Description</th>
                                    <th className={`num ${sortClass('unitPrice')}`} onClick={() => handleSort('unitPrice')}>Price (₹)</th>
                                    <th className={`num ${sortClass('discount')}`} onClick={() => handleSort('discount')}>Discount (₹)</th>
                                    <th className={`num ${sortClass('quantity')}`} onClick={() => handleSort('quantity')}>Qty</th>
                                    <th className={`num ${sortClass('nett')}`} onClick={() => handleSort('nett')}>Nett Amount (₹)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Loading…</td></tr>
                                ) : rows.length === 0 ? (
                                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>No transactions found</td></tr>
                                ) : rows.slice(0, shown).map((r, i) => (
                                    <tr key={i} className={i % 2 === 1 ? 'striped' : ''}>
                                        <td className="sno">{r.sno}</td>
                                        <td><span className="bk-id">{r.bookingId}</span></td>
                                        <td><span className="bk-date">{dayjs(r.bookingDate).format('DD MMM YYYY HH:mm')}</span></td>
                                        <td><span className="bk-date">{dayjs(r.visitDate).format('DD MMM YYYY')}</span></td>
                                        <td>
                                            <span className={`atag ${tagClass(r.description)}`}>{r.description}</span>
                                            {r.isComboChild && <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: '6px', fontWeight: 500 }}>(combo child)</span>}
                                        </td>
                                        <td className="num">{numFmt(r.unitPrice)}</td>
                                        <td className="num disc">{r.discount > 0 ? `− ${numFmt(r.discount)}` : '—'}</td>
                                        <td className="num">{r.quantity}</td>
                                        <td className="num nett">{moneyFmt(r.nett)}</td>
                                    </tr>
                                ))}
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
