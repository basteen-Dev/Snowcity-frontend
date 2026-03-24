import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Shared report export utilities for CSV, Excel, and PDF.
 * Industry-standard approaches for data export.
 */

/* ────────────── CSV (RFC 4180 compliant) ────────────── */

/**
 * Properly escape a CSV cell value.
 * Wraps in double-quotes if the value contains commas, quotes, or newlines.
 */
function escapeCSVCell(value) {
    if (value == null) return '';
    const str = String(value);
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

/**
 * Export data as a properly formatted CSV file.
 * @param {string[]} columns - Column header names
 * @param {Array<Array>} dataRows - 2D array of row data
 * @param {string} filename - Filename without extension
 */
export function exportToCSV(columns, dataRows, filename) {
    const header = columns.map(escapeCSVCell).join(',');
    const body = dataRows.map(row => row.map(escapeCSVCell).join(','));
    // BOM for Excel UTF-8 compatibility
    const bom = '\uFEFF';
    const csv = bom + [header, ...body].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);
}

/* ────────────── Excel (.xlsx) ────────────── */

/**
 * Export data as a real .xlsx Excel workbook.
 * @param {string[]} columns - Column header names
 * @param {Array<Array>} dataRows - 2D array of row data
 * @param {string} filename - Filename without extension
 * @param {string} [sheetName='Report'] - Name of the worksheet
 * @param {Array<number>} [colWidths] - Optional column widths (in characters)
 */
export function exportToExcel(columns, dataRows, filename, sheetName = 'Report', colWidths) {
    const wsData = [columns, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Auto-size columns if not provided
    if (colWidths) {
        ws['!cols'] = colWidths.map(w => ({ wch: w }));
    } else {
        ws['!cols'] = columns.map((col, i) => {
            let maxLen = String(col).length;
            dataRows.forEach(row => {
                const cellLen = String(row[i] ?? '').length;
                if (cellLen > maxLen) maxLen = cellLen;
            });
            return { wch: Math.min(maxLen + 2, 40) };
        });
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, `${filename}.xlsx`);
}

/* ────────────── PDF ────────────── */

/**
 * Export data as a formatted PDF document with autoTable.
 * @param {string[]} columns - Column header names
 * @param {Array<Array>} dataRows - 2D array of row data
 * @param {string} filename - Filename without extension
 * @param {string} title - Report title displayed at the top
 * @param {Array<{label: string, value: string}>} [summaryItems] - Optional summary key-value pairs
 */
export function exportToPDF(columns, dataRows, filename, title, summaryItems) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageWidth / 2, 15, { align: 'center' });

    // Timestamp
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120);
    const now = new Date();
    const timestamp = now.toLocaleDateString('en-IN', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
    doc.text(`Generated: ${timestamp}`, pageWidth / 2, 21, { align: 'center' });
    doc.setTextColor(0);

    let startY = 26;

    // Summary section
    if (summaryItems?.length) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Summary', 14, startY);
        startY += 4;

        const summaryRows = summaryItems.map(item => [item.label, item.value]);
        autoTable(doc, {
            startY,
            head: [['Metric', 'Value']],
            body: summaryRows,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
            margin: { left: 14, right: 14 },
            tableWidth: 120,
        });
        startY = doc.lastAutoTable.finalY + 8;
    }

    // Main data table
    autoTable(doc, {
        startY,
        head: [columns],
        body: dataRows,
        theme: 'striped',
        headStyles: {
            fillColor: [44, 62, 80],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 8,
            halign: 'center',
        },
        bodyStyles: {
            fontSize: 7.5,
            cellPadding: 2,
        },
        alternateRowStyles: { fillColor: [245, 248, 255] },
        margin: { left: 10, right: 10 },
        styles: { overflow: 'linebreak' },
        didDrawPage: (data) => {
            // Footer with page numbers
            const pageCount = doc.internal.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(
                `Page ${data.pageNumber} of ${pageCount}`,
                pageWidth / 2,
                doc.internal.pageSize.getHeight() - 8,
                { align: 'center' }
            );
        },
    });

    doc.save(`${filename}.pdf`);
}
