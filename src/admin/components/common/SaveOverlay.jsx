import React from 'react';

export default function SaveOverlay({ visible, label = 'Saving…' }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="px-6 py-4 rounded-2xl bg-white shadow-2xl flex items-center gap-3 text-gray-900 dark:bg-neutral-900 dark:text-neutral-50">
        <span className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  );
}
