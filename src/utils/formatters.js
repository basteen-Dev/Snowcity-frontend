export const formatCurrency = (n, { minimumFractionDigits = 0, maximumFractionDigits = 0 } = {}) => {
  const amount = Number(n || 0);
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
  return `₹${formatted}`;
};

export const formatDate = (d) => {
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return String(d || ''); }
};