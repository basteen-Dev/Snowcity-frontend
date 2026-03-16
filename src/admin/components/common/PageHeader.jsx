// src/parkpanel/components/common/PageHeader.jsx
import React from 'react';

/**
 * Corporate-grade page header with title, subtitle, and action buttons.
 * Usage:
 *   <PageHeader title="Attractions" subtitle="Manage your attractions catalog">
 *     <button>New Attraction</button>
 *   </PageHeader>
 */
export default function PageHeader({ title, subtitle, children, className = '' }) {
    return (
        <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-gray-200/80 dark:border-slate-700 shadow-sm px-6 py-5 mb-6 ${className}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                    <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-neutral-50 truncate">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="mt-0.5 text-sm text-gray-500 dark:text-neutral-400">{subtitle}</p>
                    )}
                </div>
                {children && (
                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
}
