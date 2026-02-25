import React from 'react';

export default function AdminTable({
  columns = [],
  rows = [],
  keyField = 'id',
  empty = 'No data',
  onRowClick,
  showSelection = false,
  selectedItems = [],
  onSelectionChange,
  actions = []
}) {
  const handleCheckboxChange = (row, checked) => {
    if (onSelectionChange) {
      if (checked) {
        onSelectionChange([...selectedItems, row[keyField]]);
      } else {
        onSelectionChange(selectedItems.filter(id => id !== row[keyField]));
      }
    }
  };

  const handleSelectAll = (checked) => {
    if (onSelectionChange) {
      if (checked) {
        onSelectionChange(rows.map(row => row[keyField]));
      } else {
        onSelectionChange([]);
      }
    }
  };

  const isAllSelected = rows.length > 0 && selectedItems.length === rows.length;
  const isIndeterminate = selectedItems.length > 0 && selectedItems.length < rows.length;
  const colCount = columns.length + (showSelection ? 1 : 0) + (actions.length > 0 ? 1 : 0);

  return (
    <div className="rounded-2xl border border-gray-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50/80 dark:bg-neutral-800/60 border-b border-gray-200 dark:border-neutral-700">
              {showSelection && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 dark:border-neutral-600 dark:bg-neutral-700 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-400 ${c.thClass || ''}`}
                >
                  {c.title}
                </th>
              ))}
              {actions.length > 0 && (
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-neutral-400">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
            {rows.length ? rows.map((r, i) => (
              <tr
                key={r[keyField] ?? i}
                className={[
                  'transition-colors duration-100',
                  onRowClick ? 'cursor-pointer' : '',
                  i % 2 === 0
                    ? 'bg-white dark:bg-neutral-900'
                    : 'bg-gray-50/40 dark:bg-neutral-800/20',
                  'hover:bg-blue-50/50 dark:hover:bg-neutral-800/60',
                ].join(' ')}
                onClick={() => onRowClick && onRowClick(r)}
              >
                {showSelection && (
                  <td className="w-10 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(r[keyField])}
                      onChange={(e) => handleCheckboxChange(r, e.target.checked)}
                      className="rounded border-gray-300 dark:border-neutral-600 dark:bg-neutral-700 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                )}
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`px-4 py-3 text-gray-700 dark:text-neutral-200 ${c.tdClass || ''}`}
                  >
                    {c.render ? c.render(r) : r[c.key]}
                  </td>
                ))}
                {actions.length > 0 && (
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      {actions.map((action, idx) => (
                        <button
                          key={idx}
                          onClick={() => action.onClick(r)}
                          className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${action.className || 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-300'}`}
                          title={action.title}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            )) : (
              <tr>
                <td className="px-4 py-10 text-center text-gray-400 dark:text-neutral-500" colSpan={colCount}>
                  <div className="flex flex-col items-center gap-1">
                    <svg className="w-8 h-8 text-gray-300 dark:text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <span className="text-sm">{empty}</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}