import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Corporate-grade table pagination.
 */
export default function TablePagination({
    count = 0,
    page = 1,
    rowsPerPage = 25,
    onPageChange,
    onRowsPerPageChange,
    rowsPerPageOptions = [10, 25, 50, 100],
    component: Component = 'div',
    className = ''
}) {
    const from = count === 0 ? 0 : (page - 1) * rowsPerPage + 1;
    const to = Math.min(count, page * rowsPerPage);
    const totalPages = Math.ceil(count / rowsPerPage) || 1;

    // Build page numbers to show (max 5 visible)
    const pageNumbers = React.useMemo(() => {
        if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const pages = [];
        const start = Math.max(1, Math.min(page - 2, totalPages - 4));
        for (let i = start; i <= Math.min(start + 4, totalPages); i++) pages.push(i);
        return pages;
    }, [page, totalPages]);

    return (
        <Component className={`flex flex-col sm:flex-row items-center justify-between gap-3 py-3 px-4 text-sm text-gray-600 dark:text-neutral-400 bg-white dark:bg-neutral-900 rounded-b-2xl border-t border-gray-100 dark:border-neutral-800 ${className}`}>
            <div className="flex items-center gap-2">
                <span className="whitespace-nowrap text-gray-500 dark:text-neutral-500">Rows:</span>
                <select
                    className="bg-transparent border border-gray-200 dark:border-neutral-700 rounded-lg px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 cursor-pointer dark:bg-neutral-900"
                    value={rowsPerPage}
                    onChange={(e) => onRowsPerPageChange && onRowsPerPageChange(Number(e.target.value))}
                >
                    {rowsPerPageOptions.map((opt) => (
                        <option key={opt} value={opt} className="bg-white dark:bg-neutral-900">
                            {opt}
                        </option>
                    ))}
                </select>
                <span className="whitespace-nowrap text-gray-500 dark:text-neutral-500">
                    {from}–{to} of {count}
                </span>
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange && onPageChange(page - 1)}
                    disabled={page <= 1}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-gray-200 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous page"
                >
                    <ChevronLeft size={16} />
                </button>

                {totalPages > 1 && pageNumbers.map((p) => (
                    <button
                        key={p}
                        onClick={() => onPageChange && onPageChange(p)}
                        className={[
                            'inline-flex items-center justify-center h-8 w-8 rounded-lg text-sm font-medium transition-colors',
                            p === page
                                ? 'bg-gray-900 dark:bg-blue-600 text-white shadow-sm'
                                : 'border border-gray-200 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300',
                        ].join(' ')}
                    >
                        {p}
                    </button>
                ))}

                <button
                    onClick={() => onPageChange && onPageChange(page + 1)}
                    disabled={page >= totalPages}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-gray-200 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next page"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </Component>
    );
}
