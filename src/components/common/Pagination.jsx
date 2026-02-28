import React from 'react';

/**
 * Reusable Pagination component for the Snowcity frontend.
 * 
 * @param {Object} props
 * @param {number} props.currentPage - Current active page (1-indexed)
 * @param {number} props.totalPages - Total number of pages
 * @param {function} props.onPageChange - Callback when a page is selected
 */
export default function Pagination({ currentPage, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        const showMax = 5;

        if (totalPages <= showMax) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            let start = Math.max(1, currentPage - 2);
            let end = Math.min(totalPages, start + showMax - 1);

            if (end === totalPages) {
                start = Math.max(1, end - showMax + 1);
            }

            for (let i = start; i <= end; i++) pages.push(i);
        }
        return pages;
    };

    const pages = getPageNumbers();

    return (
        <nav className="flex items-center justify-center gap-2 mt-12" aria-label="Pagination">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
            </button>

            <div className="hidden sm:flex items-center gap-2">
                {pages[0] > 1 && (
                    <>
                        <button
                            onClick={() => onPageChange(1)}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            1
                        </button>
                        {pages[0] > 2 && <span className="text-gray-400">...</span>}
                    </>
                )}

                {pages.map((p) => (
                    <button
                        key={p}
                        onClick={() => onPageChange(p)}
                        className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${p === currentPage
                                ? 'bg-blue-600 text-white border border-blue-600 shadow-md'
                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                            }`}
                    >
                        {p}
                    </button>
                ))}

                {pages[pages.length - 1] < totalPages && (
                    <>
                        {pages[pages.length - 1] < totalPages - 1 && <span className="text-gray-400">...</span>}
                        <button
                            onClick={() => onPageChange(totalPages)}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            {totalPages}
                        </button>
                    </>
                )}
            </div>

            <div className="flex sm:hidden items-center px-4 text-sm font-medium text-gray-700">
                Page {currentPage} of {totalPages}
            </div>

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                Next
                <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </nav>
    );
}
