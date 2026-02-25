import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Professional Table Pagination component
 * @param {Object} props
 * @param {number} props.count - Total number of items
 * @param {number} props.page - Current page (1-indexed)
 * @param {number} props.rowsPerPage - Number of rows per page
 * @param {function} props.onPageChange - Callback when page changes: (newPage) => void
 * @param {function} props.onRowsPerPageChange - Callback when rows per page changes: (newRowsPerPage) => void
 * @param {number[]} [props.rowsPerPageOptions=[10, 25, 50, 100]] - List of available rows per page
 * @param {string} [props.component="div"] - The wrapping component
 * @param {string} [props.className=""] - Additional CSS classes
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

    return (
        <Component className={`flex flex-col sm:flex-row items-center justify-end gap-4 py-3 px-4 text-sm text-gray-700 dark:text-neutral-300 border-t border-gray-100 dark:border-neutral-800 ${className}`}>
            <div className="flex items-center gap-2">
                <span className="whitespace-nowrap">Rows per page:</span>
                <select
                    className="bg-transparent border-none focus:ring-0 cursor-pointer font-medium"
                    value={rowsPerPage}
                    onChange={(e) => onRowsPerPageChange && onRowsPerPageChange(Number(e.target.value))}
                >
                    {rowsPerPageOptions.map((opt) => (
                        <option key={opt} value={opt} className="bg-white dark:bg-neutral-900">
                            {opt}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex items-center gap-6">
                <span className="whitespace-nowrap">
                    {from}–{to} of {count}
                </span>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onPageChange && onPageChange(page - 1)}
                        disabled={page <= 1}
                        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Previous page"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={() => onPageChange && onPageChange(page + 1)}
                        disabled={page >= totalPages}
                        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        aria-label="Next page"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </Component>
    );
}
