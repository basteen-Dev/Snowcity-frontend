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

  return (
    <div className="overflow-x-auto rounded-lg border bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 dark:bg-neutral-800 text-gray-600 dark:text-neutral-300">
          <tr>
            {showSelection && (
              <th className="px-3 py-2">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-gray-300 dark:border-neutral-600 dark:bg-neutral-700"
                />
              </th>
            )}
            {columns.map((c) => (
              <th key={c.key} className={`px-3 py-2 text-left ${c.thClass || ''}`}>{c.title}</th>
            ))}
            {actions.length > 0 && (
              <th className="px-3 py-2 text-left">Actions</th>
            )}
          </tr>
        </thead>
        <tbody className="text-gray-800 dark:text-neutral-200">
          {rows.length ? rows.map((r, i) => (
            <tr
              key={r[keyField] ?? i}
              className="border-t border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800 cursor-pointer"
              onClick={() => onRowClick && onRowClick(r)}
            >
              {showSelection && (
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(r[keyField])}
                    onChange={(e) => handleCheckboxChange(r, e.target.checked)}
                    className="rounded border-gray-300 dark:border-neutral-600 dark:bg-neutral-700"
                  />
                </td>
              )}
              {columns.map((c) => (
                <td key={c.key} className={`px-3 py-2 ${c.tdClass || ''}`}>{c.render ? c.render(r) : r[c.key]}</td>
              ))}
              {actions.length > 0 && (
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  <div className="flex gap-1">
                    {actions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => action.onClick(r)}
                        className={`text-xs px-2 py-1 rounded ${action.className || 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
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
              <td className="px-3 py-6 text-center text-gray-500 dark:text-neutral-400" colSpan={columns.length + (showSelection ? 1 : 0) + (actions.length > 0 ? 1 : 0)}>
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}