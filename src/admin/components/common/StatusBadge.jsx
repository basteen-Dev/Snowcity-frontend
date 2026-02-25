// src/admin/components/common/StatusBadge.jsx
import React from 'react';

/**
 * Consistent status badge for use across all admin tables.
 *
 * Usage:
 *   <StatusBadge status="active" />
 *   <StatusBadge status="pending" />
 *   <StatusBadge status={row.active ? 'active' : 'inactive'} />
 */

const VARIANTS = {
    active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 ring-emerald-600/20',
    inactive: 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400 ring-gray-500/20',
    pending: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 ring-amber-600/20',
    completed: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 ring-blue-600/20',
    paid: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 ring-emerald-600/20',
    failed: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-red-600/20',
    cancelled: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 ring-rose-600/20',
    expired: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 ring-orange-600/20',
    booked: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 ring-indigo-600/20',
    redeemed: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 ring-teal-600/20',
};

const DEFAULT_VARIANT = 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400 ring-gray-500/20';

export default function StatusBadge({ status, label, className = '' }) {
    const key = String(status || '').toLowerCase().trim();
    const colors = VARIANTS[key] || DEFAULT_VARIANT;
    const display = label || (key.charAt(0).toUpperCase() + key.slice(1)) || 'Unknown';

    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${colors} ${className}`}
        >
            {display}
        </span>
    );
}
