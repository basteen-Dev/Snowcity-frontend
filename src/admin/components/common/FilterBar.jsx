// src/parkpanel/components/common/FilterBar.jsx
import React from 'react';

/**
 * Standardized filter bar for admin list pages.
 * Renders children (inputs/selects) in a responsive grid with Apply/Reset buttons.
 *
 * Usage:
 *   <FilterBar onApply={load} onReset={reset} loading={loading}>
 *     <input ... />
 *     <select ... />
 *   </FilterBar>
 */
export default function FilterBar({
    children,
    onApply,
    onReset,
    loading = false,
    columns = 4,
    className = '',
}) {
    const handleSubmit = (e) => {
        e.preventDefault();
        onApply?.();
    };

    return (
        <form
            onSubmit={handleSubmit}
            className={`bg-white dark:bg-slate-800 rounded-2xl border border-gray-200/80 dark:border-slate-700 shadow-sm p-4 mb-5 ${className}`}
        >
            <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-${columns} gap-3`}>
                {React.Children.map(children, (child) => child)}
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 dark:bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 dark:hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                    {loading ? (
                        <>
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-xl animate-spin" />
                            Applying…
                        </>
                    ) : (
                        'Apply Filters'
                    )}
                </button>
                {onReset && (
                    <button
                        type="button"
                        onClick={onReset}
                        disabled={loading}
                        className="rounded-lg border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors"
                    >
                        Reset
                    </button>
                )}
            </div>
        </form>
    );
}
