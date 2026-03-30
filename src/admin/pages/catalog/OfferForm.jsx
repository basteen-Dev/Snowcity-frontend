import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import ImageUploader from '../../components/common/ImageUploader';
import useCatalogTargets from '../../hooks/useCatalogTargets';
import SaveOverlay from '../../components/common/SaveOverlay';
import toast from 'react-hot-toast';

const RULES = ['holiday', 'happy_hour', 'weekday_special', 'dynamic_pricing', 'date_slot_pricing', 'buy_x_get_y', 'first_n_tickets'];
const DISCOUNT_TYPES = [
  { value: 'percent', label: 'Percentage (%)' },
  { value: 'amount', label: 'Flat Amount' }
];

const TARGET_TYPES = [
  { value: 'attraction', label: 'Attraction' },
  { value: 'combo', label: 'Combo' }
];

const BASE_RULE = {
  target_type: 'attraction',
  target_id: '',
  target_ids: [],
  applies_to_all: false,
  // buy_x_get_y fields
  buy_qty: 1,
  get_qty: 1,
  get_target_type: 'attraction',
  get_target_id: '',
  get_discount_type: '',
  get_discount_value: '',
  date_from: '',
  date_to: '',
  time_from: '',
  time_to: '',
  slot_type: '',
  slot_id: '',
  rule_discount_type: '',
  rule_discount_value: '',
  priority: 100,
  day_type: '',
  specific_days: [],
  is_holiday: false,
  specific_date: '',
  specific_dates: [],
  next_specific_date: '',
  combo_child_adjustments: {},
  ticket_limit: '',
  offer_price: '',
};

const RULE_TEMPLATES = [
  {
    key: 'happy-hour',
    label: 'Happy Hour Window',
    badge: 'Time-based',
    description: 'Reward mid-day visitors with an automatic discount window.',
    ruleType: 'happy_hour',
    defaults: {
      day_type: 'weekday',
      time_from: '14:00',
      time_to: '17:00',
      rule_discount_type: 'percent',
      rule_discount_value: 20,
    },
  },
  {
    key: 'weekend-boost',
    label: 'Weekend Boost',
    badge: 'Day-based',
    description: 'Highlight premium or discounted pricing for weekends.',
    ruleType: 'weekday_special',
    defaults: {
      day_type: 'weekend',
      rule_discount_type: 'percent',
      rule_discount_value: 10,
    },
  },
  {
    key: 'date-slot',
    label: 'Specific Date Slot',
    badge: 'Slot',
    description: 'Target a single date or slot for campaigns and events.',
    ruleType: 'date_slot_pricing',
    defaults: {
      specific_date: '',
      specific_time: '',
      rule_discount_type: 'amount',
      rule_discount_value: 200,
    },
  },
  {
    key: 'date-price-increase',
    label: 'Date Price Increase',
    badge: 'Price Increase',
    description: 'Increase prices for specific dates (use negative discount values).',
    ruleType: 'date_slot_pricing',
    defaults: {
      specific_date: '',
      rule_discount_type: 'amount',
      rule_discount_value: -500, // Negative for price increase
    },
  },
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const createRule = (overrides = {}) => ({
  ...BASE_RULE,
  ...overrides,
});

const formatDiscountValue = (value, type) => {
  const num = Number(value || 0);
  if (!num) return 'Inherit offer discount';
  if (num < 0) {
    // Negative values mean price increases
    const absValue = Math.abs(num);
    return type === 'amount' ? `+₹${absValue.toFixed(2)}` : `+${absValue}%`;
  }
  return type === 'amount' ? `₹${num.toFixed(2)}` : `${num}%`;
};

const formatRuleSummary = (rule, getTargetLabel) => {
  const parts = [];
  if (rule.applies_to_all) {
    parts.push(`All ${rule.target_type}s`);
  } else if (rule.target_id) {
    const label = getTargetLabel ? getTargetLabel(rule) : '';
    parts.push(label || `${rule.target_type} #${rule.target_id}`);
  } else {
    parts.push('Target pending');
  }

  if (rule.day_type === 'custom' && Array.isArray(rule.specific_days) && rule.specific_days.length) {
    const labels = rule.specific_days
      .map((idx) => DAY_LABELS[idx])
      .filter(Boolean);
    parts.push(labels.length ? labels.join(', ') : 'Custom days');
  } else if (rule.day_type) {
    parts.push(rule.day_type.replace('_', ' '));
  } else if (rule.is_holiday) {
    parts.push('Holiday only');
  } else {
    parts.push('All days');
  }

  if (rule.time_from || rule.time_to) {
    parts.push(`${rule.time_from || '00:00'}–${rule.time_to || '23:59'}`);
  } else {
    parts.push('All day');
  }

  if (Array.isArray(rule.specific_dates) && rule.specific_dates.length) {
    parts.push(`${rule.specific_dates.length} date${rule.specific_dates.length > 1 ? 's' : ''}`);
  }

  parts.push(formatDiscountValue(rule.rule_discount_value, rule.rule_discount_type));
  return parts.join(' · ');
};

export default function OfferForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { attractions, combos, status: targetsStatus } = useCatalogTargets();

  const [state, setState] = React.useState({
    status: isEdit ? 'loading' : 'idle',
    error: null,
    form: {
      title: '',
      description: '',
      image_url: '',
      image_alt: '',
      rule_type: '',
      discount_type: 'percent',
      discount_value: 0,
      max_discount: '',
      valid_from: '',
      valid_to: '',
      sort_order: 0,
      active: true,
      rules: [],
    }
  });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!isEdit) return;

    (async () => {
      try {
        const res = await adminApi.get(`${A.offers()}/${id}`);
        const o = res?.offer || res || {};
        setState((s) => ({
          ...s,
          status: 'idle',
          form: {
            title: o.title || '',
            description: o.description || '',
            image_url: o.image_url || '',
            image_alt: o.image_alt || '',
            rule_type: o.rule_type || '',
            discount_type: o.discount_type || 'percent',
            discount_value: Number(o.discount_value ?? o.discount_percent ?? 0),
            max_discount: o.max_discount ?? '',
            valid_from: o.valid_from ? new Date(o.valid_from).toISOString().split('T')[0] : '',
            valid_to: o.valid_to ? new Date(o.valid_to).toISOString().split('T')[0] : '',
            sort_order: o.sort_order || 0,
            active: !!o.active,
            rules: Array.isArray(o.rules)
              ? (() => {
                  const mapSingleRule = (r) => createRule({
                    target_type: r.target_type || 'attraction',
                    target_id: r.target_id ?? '',
                    target_ids: r.target_ids || (r.target_id ? [String(r.target_id)] : []),
                    applies_to_all: !!r.applies_to_all,
                    date_from: r.date_from ? new Date(r.date_from).toISOString().split('T')[0] : '',
                    date_to: r.date_to ? new Date(r.date_to).toISOString().split('T')[0] : '',
                    time_from: r.time_from || '',
                    time_to: r.time_to || '',
                    slot_type: r.slot_type || '',
                    slot_id: r.slot_id ?? '',
                    rule_discount_type: r.rule_discount_type || '',
                    rule_discount_value: r.rule_discount_value ?? '',
                    priority: r.priority ?? 100,
                    day_type: r.day_type || '',
                    specific_days: r.specific_days || [],
                    is_holiday: !!r.is_holiday,
                    specific_date: r.specific_date ? new Date(r.specific_date).toISOString().split('T')[0] : '',
                    specific_dates: r.specific_date
                      ? [new Date(r.specific_date).toISOString().split('T')[0]]
                      : [],
                    specific_time: r.specific_time || '',
                    next_specific_date: '',
                    combo_child_adjustments: r.combo_child_adjustments || {},
                    buy_qty: r.buy_qty ?? 1,
                    get_qty: r.get_qty ?? 1,
                    get_target_type: r.get_target_type || 'attraction',
                    get_target_id: r.get_target_id ?? '',
                    get_discount_type: r.get_discount_type || '',
                    get_discount_value: r.get_discount_value ?? '',
                    ticket_limit: r.ticket_limit ?? '',
                    offer_price: r.offer_price ?? '',
                  });

                  if ((o.rule_type === 'first_n_tickets' || o.rule_type === 'buy_x_get_y') && o.rules.length > 0) {
                    const combinedRule = mapSingleRule(o.rules[0]);
                    combinedRule.target_ids = o.rules
                      .map(r => r.target_id)
                      .filter(id => id != null && id !== '')
                      .map(String);
                    return [combinedRule];
                  }
                  return o.rules.map(mapSingleRule);
                })()
              : [],
          },
        }));
      } catch (err) { setState((s) => ({ ...s, status: 'failed', error: err })); }
    })();
  }, [id, isEdit]);

  const updateForm = React.useCallback((partial) => {
    setState((s) => ({ ...s, form: { ...s.form, ...partial } }));
  }, []);

  const updateRule = React.useCallback((idx, partial) => {
    setState((s) => {
      const nextRules = [...(s.form.rules || [])];
      nextRules[idx] = { ...nextRules[idx], ...partial };
      // Clear target_id/target_ids when switching target_type to prevent invalid selection
      if (partial.target_type) {
        if (nextRules[idx].target_id) {
          const isValidTarget = partial.target_type === 'attraction'
            ? attractions.some(a => a.id === Number(nextRules[idx].target_id))
            : combos.some(c => c.id === Number(nextRules[idx].target_id));
          if (!isValidTarget) {
            nextRules[idx].target_id = '';
            nextRules[idx].combo_child_adjustments = {};
          }
        }
        if (nextRules[idx].target_ids && nextRules[idx].target_ids.length > 0) {
          nextRules[idx].target_ids = [];
        }
      }
      if (partial.target_id || partial.target_ids) {
         nextRules[idx].combo_child_adjustments = {};
      }
      return { ...s, form: { ...s.form, rules: nextRules } };
    });
  }, [attractions, combos]);

  const addRule = React.useCallback(() => {
    setState((s) => ({
      ...s,
      form: {
        ...s.form,
        rules: [...(s.form.rules || []), createRule()],
      },
    }));
  }, []);

  const resolveTargetLabel = React.useCallback((rule) => {
    if (!rule || !rule.target_id) return '';
    const list = rule.target_type === 'combo' ? combos : attractions;
    const id = Number(rule.target_id);
    const item = list.find((it) => Number(it.id) === id);
    return item ? (item.title || item.name || '') : '';
  }, [attractions, combos]);

  const applyTemplate = React.useCallback((template) => {
    setState((s) => ({
      ...s,
      form: {
        ...s.form,
        rule_type: template.ruleType,
        rules: [
          ...(s.form.rules || []),
          createRule({
            ...template.defaults,
            rule_discount_type: template.defaults.rule_discount_type ?? '',
            rule_discount_value: template.defaults.rule_discount_value ?? '',
          }),
        ],
      },
    }));
  }, []);

  const removeRule = React.useCallback((idx) => {
    setState((s) => {
      const nextRules = [...(s.form.rules || [])];
      nextRules.splice(idx, 1);
      return { ...s, form: { ...s.form, rules: nextRules } };
    });
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const loadingToast = toast.loading(isEdit ? 'Updating offer...' : 'Creating offer...');
    try {
      const normalizeDate = (value) => {
        const v = (value ?? '').toString().trim();
        return v ? v : null;
      };
      const normalizeTime = (value) => {
        const v = (value ?? '').toString().trim();
        return v ? v : null;
      };
      const normalizeString = (value) => {
        const v = (value ?? '').toString().trim();
        return v ? v : null;
      };

      const resolvedRules = (state.form.rules || []).flatMap((rule) => {
        if (rule.applies_to_all) return [{ ...rule, target_id: null, target_ids: [] }];
        if ((state.form.rule_type === 'first_n_tickets' || state.form.rule_type === 'buy_x_get_y') && Array.isArray(rule.target_ids) && rule.target_ids.length > 0) {
          return rule.target_ids.map(id => ({ ...rule, target_id: id }));
        }
        return [{ ...rule }];
      });

      const invalidRules = resolvedRules.filter((rule) => !rule.applies_to_all && (rule.target_id === null || rule.target_id === undefined || rule.target_id === ''));
      if (invalidRules.length > 0) {
        toast.dismiss(loadingToast);
        setState((s) => ({ ...s, error: { message: 'Please select at least one Target Item or enable "Valid for ANY".' } }));
        setSaving(false);
        return;
      }

      const expandedRules = [];
      resolvedRules.forEach((rule) => {
        const { specific_dates = [], next_specific_date, ...rest } = rule;
        const normalizedList = Array.isArray(specific_dates)
          ? specific_dates.filter(Boolean)
          : [];
        if (normalizedList.length) {
          normalizedList.forEach((date) => {
            expandedRules.push({ ...rest, specific_date: normalizeDate(date) });
          });
        } else {
          expandedRules.push({ ...rest, specific_date: normalizeDate(rest.specific_date) });
        }
      });

      const payload = {
        ...state.form,
        discount_type: state.form.discount_type || 'percent',
        discount_value: Number(state.form.discount_value || 0),
        discount_percent: state.form.discount_type === 'percent' ? Number(state.form.discount_value || 0) : 0,
        max_discount: state.form.max_discount === '' ? null : Number(state.form.max_discount),
        valid_from: normalizeDate(state.form.valid_from),
        valid_to: normalizeDate(state.form.valid_to),
        rules: expandedRules.map((rule) => ({
          ...rule,
          target_id: rule.applies_to_all ? null : (rule.target_id === '' ? null : Number(rule.target_id)),
          slot_id: rule.slot_id === '' ? null : Number(rule.slot_id),
          rule_discount_value: rule.rule_discount_value === '' ? null : Number(rule.rule_discount_value),
          priority: 100, // Fixed default, not user-configurable
          date_from: normalizeDate(rule.date_from),
          date_to: normalizeDate(rule.date_to),
          time_from: normalizeTime(rule.time_from),
          time_to: normalizeTime(rule.time_to),
          specific_date: normalizeDate(rule.specific_date),
          specific_time: normalizeTime(rule.specific_time),
          rule_discount_type: normalizeString(rule.rule_discount_type),
          slot_type: normalizeString(rule.slot_type),
          day_type: normalizeString(rule.day_type),
          combo_child_adjustments: rule.combo_child_adjustments && Object.keys(rule.combo_child_adjustments).length > 0 ? rule.combo_child_adjustments : null,
          specific_dates: undefined,
          next_specific_date: undefined,
          buy_qty: rule.buy_qty !== '' && rule.buy_qty != null ? Number(rule.buy_qty) : null,
          get_qty: rule.get_qty !== '' && rule.get_qty != null ? Number(rule.get_qty) : null,
          get_target_type: normalizeString(rule.get_target_type),
          get_target_id: rule.get_target_id === '' || rule.get_target_id == null ? null : Number(rule.get_target_id),
          get_discount_type: normalizeString(rule.get_discount_type),
          get_discount_value: rule.get_discount_value === '' || rule.get_discount_value == null ? null : Number(rule.get_discount_value),
          ticket_limit: rule.ticket_limit === '' || rule.ticket_limit == null ? null : Number(rule.ticket_limit),
          offer_price: rule.offer_price === '' || rule.offer_price == null ? null : Number(rule.offer_price),
        })).map(({ target_ids, ...rest }) => rest), // Remove target_ids before sending to API
      };
      if (isEdit) await adminApi.put(`${A.offers()}/${id}`, payload);
      else await adminApi.post(A.offers(), payload);

      toast.success(isEdit ? 'Offer updated successfully' : 'Offer created successfully', { id: loadingToast });
      navigate('/catalog/offers');
    } catch (err) {
      toast.error(err.message || 'Save failed', { id: loadingToast });
      setState((s) => ({ ...s, error: err }));
    } finally {
      setSaving(false);
    }
  };

  if (state.status === 'loading') return <div>Loading…</div>;
  if (state.status === 'failed') return <div className="text-red-600">{state.error?.message || 'Failed to load'}</div>;

  const f = state.form;

  return (
    <div className="relative">
      <SaveOverlay visible={saving} label={isEdit ? 'Updating offer…' : 'Saving offer…'} />
      <form onSubmit={save} className="max-w-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
        <h1 className="text-xl font-semibold mb-4">{isEdit ? 'Edit' : 'New'} Offer</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Title</label>
            <input className="w-full rounded-md border px-3 py-2 dark:bg-slate-800 dark:border-slate-600 dark:text-neutral-200" value={f.title} onChange={(e) => updateForm({ title: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Description</label>
            <textarea rows={4} className="w-full rounded-md border px-3 py-2 dark:bg-slate-800 dark:border-slate-600 dark:text-neutral-200" value={f.description} onChange={(e) => updateForm({ description: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <ImageUploader label="Image" value={f.image_url} onChange={(url) => updateForm({ image_url: url })} altText={f.image_alt} onAltChange={(alt) => updateForm({ image_alt: alt })} folder="offers" requiredPerm="uploads:write" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Rule Type</label>
            <select className="w-full rounded-md border px-3 py-2 dark:bg-slate-800 dark:border-slate-600 dark:text-neutral-200" value={f.rule_type} onChange={(e) => {
              const rule_type = e.target.value;
              let nextRules = f.rules || [];
              if ((rule_type === 'buy_x_get_y' || rule_type === 'first_n_tickets') && nextRules.length === 0) {
                nextRules = [createRule()];
              }
              updateForm({ rule_type, rules: nextRules });
            }}>
              <option key="__default-rule-type__" value="">—</option>
              {RULES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Discount Type</label>
            <select className="w-full rounded-md border px-3 py-2 dark:bg-slate-800 dark:border-slate-600 dark:text-neutral-200" value={f.discount_type} onChange={(e) => updateForm({ discount_type: e.target.value })}>
              {DISCOUNT_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Discount Value</label>
            <input type="number" className="w-full rounded-md border px-3 py-2 dark:bg-slate-800 dark:border-slate-600 dark:text-neutral-200" value={f.discount_value} onChange={(e) => updateForm({ discount_value: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Max Discount (optional)</label>
            <input type="number" className="w-full rounded-md border px-3 py-2 dark:bg-slate-800 dark:border-slate-600 dark:text-neutral-200" value={f.max_discount ?? ''} onChange={(e) => updateForm({ max_discount: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Valid From</label>
            <input type="date" className="w-full rounded-md border px-3 py-2 dark:bg-slate-800 dark:border-slate-600 dark:text-neutral-200" value={f.valid_from || ''} onChange={(e) => updateForm({ valid_from: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Valid To</label>
            <input type="date" className="w-full rounded-md border px-3 py-2 dark:bg-slate-800 dark:border-slate-600 dark:text-neutral-200" value={f.valid_to || ''} onChange={(e) => updateForm({ valid_to: e.target.value })} />
          </div>
          <div className="flex items-center gap-2 md:col-span-2">
            <input id="active" type="checkbox" checked={!!f.active} onChange={(e) => updateForm({ active: e.target.checked })} />
            <label htmlFor="active" className="text-sm text-gray-700 dark:text-neutral-200">Active</label>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Order Option (Frontend Arrangement)</label>
            <input type="number" className="w-full rounded-md border px-3 py-2 dark:bg-slate-800 dark:border-slate-600 dark:text-neutral-200" value={f.sort_order || 0} onChange={(e) => updateForm({ sort_order: Number(e.target.value || 0) })} placeholder="0" />
          </div>
        </div>

        <div className="mt-6">
          {f.rule_type === 'first_n_tickets' && f.rules?.[0] ? (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/30 p-5 rounded-xl border border-amber-200 shadow-sm space-y-6">
              <div className="flex items-center gap-2 border-b border-amber-100 pb-3">
                <div className="bg-amber-600 text-white rounded-lg p-1.5 shadow-sm">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-amber-900">First N Tickets Configuration</h2>
                  <p className="text-xs text-amber-700/70">Limited quantity offers — first come, first served with a cap.</p>
                </div>
              </div>

              {/* Target Section */}
              <div className="bg-white rounded-lg p-4 border border-amber-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 mb-3 border-b pb-2">1. Target Product</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Target Type</label>
                    <select className="w-full rounded-md border px-3 py-2 bg-gray-50 focus:bg-white" value={f.rules[0].target_type || 'attraction'} onChange={(e) => updateRule(0, { target_type: e.target.value, target_id: '' })}>
                      {TARGET_TYPES.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Target Items {f.rules[0].target_ids?.length > 0 ? `(${f.rules[0].target_ids.length} selected)` : ''}
                    </label>
                    <div className={`w-full rounded-md border bg-gray-50 overflow-y-auto ${f.rules[0].applies_to_all ? 'opacity-60 cursor-not-allowed' : ''}`} style={{ maxHeight: '160px' }}>
                      {(f.rules[0].target_type === 'attraction' ? attractions : combos).map((item) => {
                        const isChecked = Array.isArray(f.rules[0].target_ids) && f.rules[0].target_ids.includes(String(item.id));
                        return (
                          <label key={`fnt-${item.id}`} className="flex items-start gap-2 px-3 py-2 hover:bg-white cursor-pointer border-b last:border-0 border-gray-100">
                            <input
                              type="checkbox"
                              className="mt-0.5 w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500 disabled:opacity-50"
                              disabled={f.rules[0].applies_to_all || targetsStatus === 'loading'}
                              checked={isChecked}
                              onChange={(e) => {
                                const current = Array.isArray(f.rules[0].target_ids) ? f.rules[0].target_ids : [];
                                const idStr = String(item.id);
                                if (e.target.checked) {
                                  updateRule(0, { target_ids: [...current, idStr] });
                                } else {
                                  updateRule(0, { target_ids: current.filter(cid => cid !== idStr) });
                                }
                              }}
                            />
                            <span className="text-sm font-medium text-gray-700 leading-tight">{item.title || item.name}</span>
                          </label>
                        );
                      })}
                      {(f.rules[0].target_type === 'attraction' ? attractions : combos).length === 0 && (
                        <div className="p-3 text-xs text-gray-500">No items available.</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer bg-slate-50 border p-2 rounded-md hover:bg-slate-100 transition-colors w-max">
                      <input type="checkbox" className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500" checked={!!f.rules[0].applies_to_all} onChange={(e) => updateRule(0, { applies_to_all: e.target.checked })} />
                      Any {f.rules[0].target_type === 'combo' ? 'Combo' : 'Attraction'}
                    </label>
                  </div>
                </div>
              </div>

              {/* Pricing & Limits Section */}
              <div className="bg-white rounded-lg p-4 border border-amber-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 mb-3 border-b pb-2">2. Pricing & Ticket Limit</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Offer Price (₹)</label>
                    <input type="number" min={0} className="w-full rounded-md border px-3 py-2 bg-gray-50 focus:bg-white font-mono" value={f.rules[0].offer_price ?? ''} onChange={(e) => updateRule(0, { offer_price: e.target.value })} placeholder="e.g. 199" />
                    <div className="text-[11px] text-gray-500 mt-1">The fixed price customers pay per ticket under this offer.</div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ticket Limit (per day)</label>
                    <input type="number" min={1} className="w-full rounded-md border px-3 py-2 bg-gray-50 focus:bg-white font-mono" value={f.rules[0].ticket_limit ?? ''} onChange={(e) => updateRule(0, { ticket_limit: e.target.value })} placeholder="e.g. 100" />
                    <div className="text-[11px] text-gray-500 mt-1">Maximum tickets available per day. Shows "Sold Out" when reached.</div>
                  </div>
                </div>
              </div>

              {/* Eligibility Section */}
              <div className="bg-white rounded-lg p-4 border border-amber-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 mb-3 border-b pb-2">3. Eligibility Window</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Day Condition</label>
                    <select
                      className="w-full rounded-md border px-3 py-2 bg-gray-50 focus:bg-white"
                      value={f.rules[0].day_type || ''}
                      onChange={(e) => updateRule(0, {
                        day_type: e.target.value,
                        specific_days: e.target.value === 'custom' ? [] : [],
                      })}
                    >
                      <option value="">All Days</option>
                      <option value="weekday">Weekdays (Mon-Fri)</option>
                      <option value="weekend">Weekends (Sat-Sun)</option>
                      <option value="custom">Custom Days (e.g. Tuesdays)</option>
                    </select>
                  </div>
                  {f.rules[0].day_type === 'custom' && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Valid on Days</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dayIdx) => (
                          <label key={day} className="flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 px-2 py-1.5 rounded cursor-pointer hover:bg-slate-100">
                            <input
                              type="checkbox"
                              className="text-amber-600 rounded focus:ring-amber-500"
                              checked={(f.rules[0].specific_days || []).includes(dayIdx)}
                              onChange={(e) => {
                                const days = f.rules[0].specific_days || [];
                                if (e.target.checked) updateRule(0, { specific_days: [...days, dayIdx] });
                                else updateRule(0, { specific_days: days.filter(d => d !== dayIdx) });
                              }}
                            />
                            <span className="font-medium text-gray-700">{day}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-4 text-xs font-medium text-amber-700 bg-amber-50 px-3 py-2 rounded-md border border-amber-200">
                  ⚠️ Prior-date booking only — same-day bookings are not allowed for this offer type.
                </div>
              </div>
            </div>
          ) : f.rule_type === 'buy_x_get_y' && f.rules?.[0] ? (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/30 p-5/9 rounded-xl border border-blue-200 shadow-sm space-y-6 p-5">
              <div className="flex items-center gap-2 border-b border-blue-100 pb-3">
                <div className="bg-blue-600 text-white rounded-lg p-1.5 shadow-sm">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-blue-900">Buy X Get Y Configuration</h2>
                  <p className="text-xs text-blue-700/70">Define the purchase requirements and free/discounted rewards.</p>
                </div>
              </div>

              {/* Requirement Section */}
              <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 mb-3 border-b pb-2">1. Buy Requirement</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Target Type</label>
                    <select className="w-full rounded-md border px-3 py-2 bg-gray-50 focus:bg-white" value={f.rules[0].target_type || 'attraction'} onChange={(e) => updateRule(0, { target_type: e.target.value, target_id: '' })}>
                      {TARGET_TYPES.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Target Items {f.rules[0].target_ids?.length > 0 ? `(${f.rules[0].target_ids.length} selected)` : ''}
                    </label>
                    <div className={`w-full rounded-md border bg-gray-50 overflow-y-auto ${f.rules[0].applies_to_all ? 'opacity-60 cursor-not-allowed' : ''}`} style={{ maxHeight: '160px' }}>
                      {(f.rules[0].target_type === 'attraction' ? attractions : combos).map((item) => {
                        const isChecked = Array.isArray(f.rules[0].target_ids) && f.rules[0].target_ids.includes(String(item.id));
                        return (
                          <label key={`req-${item.id}`} className="flex items-start gap-2 px-3 py-2 hover:bg-white cursor-pointer border-b last:border-0 border-gray-100">
                            <input
                              type="checkbox"
                              className="mt-0.5 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 disabled:opacity-50"
                              disabled={f.rules[0].applies_to_all || targetsStatus === 'loading'}
                              checked={isChecked}
                              onChange={(e) => {
                                const current = Array.isArray(f.rules[0].target_ids) ? f.rules[0].target_ids : [];
                                const idStr = String(item.id);
                                if (e.target.checked) {
                                  updateRule(0, { target_ids: [...current, idStr] });
                                } else {
                                  updateRule(0, { target_ids: current.filter(cid => cid !== idStr) });
                                }
                              }}
                            />
                            <span className="text-sm font-medium text-gray-700 leading-tight">{item.title || item.name}</span>
                          </label>
                        );
                      })}
                      {(f.rules[0].target_type === 'attraction' ? attractions : combos).length === 0 && (
                        <div className="p-3 text-xs text-gray-500">No items available.</div>
                      )}
                    </div>
                    {(!f.rules[0].applies_to_all && (!f.rules[0].target_ids || f.rules[0].target_ids.length === 0)) ? (
                      <div className="mt-1.5 text-[11px] font-semibold text-red-600">Please select at least one item or enable "Any"</div>
                    ) : null}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Buy Quantity</label>
                    <input type="number" min={1} className="w-full rounded-md border px-3 py-2 bg-gray-50 focus:bg-white font-mono" value={f.rules[0].buy_qty ?? 1} onChange={(e) => updateRule(0, { buy_qty: Number(e.target.value || 1) })} />
                  </div>
                  <div className="md:col-span-3">
                    <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer bg-slate-50 border p-2 rounded-md hover:bg-slate-100 transition-colors w-max">
                      <input id="applies-to-all-main" type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={!!f.rules[0].applies_to_all} onChange={(e) => updateRule(0, { applies_to_all: e.target.checked })} />
                      Valid for <span className="text-blue-700 font-bold underline decoration-blue-300">ANY</span> {f.rules[0].target_type === 'combo' ? 'Combo' : 'Attraction'} in our catalog
                    </label>
                  </div>
                </div>
              </div>

              {/* Reward Section */}
              <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 mb-3 border-b pb-2">2. Get Reward</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Reward Type</label>
                    <select className="w-full rounded-md border px-3 py-2 bg-gray-50 focus:bg-white" value={f.rules[0].get_target_type || 'attraction'} onChange={(e) => updateRule(0, { get_target_type: e.target.value, get_target_id: '' })}>
                      {TARGET_TYPES.map((opt) => (
                         <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Reward Item <span className="font-normal text-gray-400">(Leave blank for claim at counter)</span></label>
                    <select className="w-full rounded-md border px-3 py-2 bg-gray-50 focus:bg-white" value={f.rules[0].get_target_id ?? ''} disabled={targetsStatus === 'loading'} onChange={(e) => updateRule(0, { get_target_id: e.target.value })}>
                      <option value="">(Claim at counter / Equal or lesser)</option>
                      {(f.rules[0].get_target_type === 'attraction' ? attractions : combos).map((item) => (
                        <option key={`rew-${item.id}`} value={item.id}>{item.title || item.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Get Quantity</label>
                    <input type="number" min={1} className="w-full rounded-md border px-3 py-2 bg-gray-50 focus:bg-white font-mono" value={f.rules[0].get_qty ?? 1} onChange={(e) => updateRule(0, { get_qty: Number(e.target.value || 1) })} />
                  </div>
                  <div>
                     <label className="block text-xs font-semibold text-gray-600 mb-1.5">Discount Type</label>
                     <select className="w-full rounded-md border px-3 py-2 bg-gray-50 focus:bg-white" value={f.rules[0].get_discount_type || 'Free'} onChange={(e) => updateRule(0, { get_discount_type: e.target.value })}>
                       <option value="Free">100% Free</option>
                       <option value="percent">Percentage (%)</option>
                       <option value="amount">Flat Amount</option>
                     </select>
                  </div>
                  {f.rules[0].get_discount_type && f.rules[0].get_discount_type !== 'Free' ? (
                     <div>
                       <label className="block text-xs font-semibold text-gray-600 mb-1.5">Discount Value</label>
                       <input type="number" min={0} className="w-full rounded-md border px-3 py-2 bg-gray-50 focus:bg-white font-mono" value={f.rules[0].get_discount_value ?? ''} onChange={(e) => updateRule(0, { get_discount_value: e.target.value })} />
                     </div>
                  ) : null}
                </div>
              </div>

              {/* Eligibility Section */}
              <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-800 mb-3 border-b pb-2">3. Eligibility Window</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Day Condition</label>
                    <select
                      className="w-full rounded-md border px-3 py-2 bg-gray-50 focus:bg-white"
                      value={f.rules[0].day_type || ''}
                      onChange={(e) => updateRule(0, {
                        day_type: e.target.value,
                        specific_days: e.target.value === 'custom' ? [] : [],
                        specific_dates: e.target.value === 'holiday' ? [] : (f.rules[0].specific_dates || []),
                      })}
                    >
                      <option value="">All Days</option>
                      <option value="weekday">Weekdays (Mon-Fri)</option>
                      <option value="weekend">Weekends (Sat-Sun)</option>
                      <option value="holiday">Holidays Only</option>
                      <option value="custom">Custom Days (e.g. Mondays)</option>
                    </select>
                  </div>
                  {f.rules[0].day_type === 'custom' && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Valid on Days</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dayIdx) => (
                          <label key={day} className="flex items-center gap-1.5 text-xs bg-slate-50 border border-slate-200 px-2 py-1.5 rounded cursor-pointer hover:bg-slate-100">
                            <input
                              type="checkbox"
                              className="text-blue-600 rounded focus:ring-blue-500"
                              checked={(f.rules[0].specific_days || []).includes(dayIdx)}
                              onChange={(e) => {
                                const days = f.rules[0].specific_days || [];
                                if (e.target.checked) updateRule(0, { specific_days: [...days, dayIdx] });
                                else updateRule(0, { specific_days: days.filter(d => d !== dayIdx) });
                              }}
                            />
                            <span className="font-medium text-gray-700">{day}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {f.rules[0].day_type === 'holiday' && (
                    <div className="md:col-span-2 flex items-center">
                      <div className="text-xs font-medium text-amber-700 bg-amber-50 px-3 py-2 rounded-md border border-amber-200">
                        This offer will exclusively trigger on declared system holidays.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Rules</h2>
            <div className="flex items-center gap-2">
              <button type="button" onClick={addRule} className="text-sm rounded-md border px-3 py-1">
                Add Rule
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {RULE_TEMPLATES.map((tpl) => (
              <button
                key={tpl.key}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className="rounded-2xl border border-gray-200 hover:border-gray-400 text-left p-3 bg-white/70 dark:bg-slate-800/60 shadow-sm"
              >
                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-500">
                  <span>{tpl.badge}</span>
                  <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-xl">Template</span>
                </div>
                <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-neutral-100">{tpl.label}</div>
                <p className="mt-1 text-xs text-gray-500 min-h-[32px]">{tpl.description}</p>
              </button>
            ))}
          </div>
          {!(f.rules || []).length ? (
            <div className="text-sm text-gray-500">No rules yet. Add one to target specific attractions or combos.</div>
          ) : null}
          <div className="space-y-4 mt-3">
            {(f.rules || []).map((rule, idx) => (
              <div key={`rule-${idx}`} className="border rounded-lg p-4 space-y-3">
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-semibold">Rule #{idx + 1}</div>
                    <div className="text-xs text-gray-500">{formatRuleSummary(rule, resolveTargetLabel)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-xl border px-2 py-0.5 text-[11px] text-gray-600">
                      {rule.target_type === 'combo' ? 'Combo' : 'Attraction'}
                    </span>
                    <button type="button" onClick={() => removeRule(idx)} className="text-xs text-red-600">
                      Remove
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Target Type</label>
                    <select className="w-full rounded-md border px-3 py-2" value={rule.target_type} onChange={(e) => updateRule(idx, { target_type: e.target.value })}>
                      {TARGET_TYPES.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Target</label>
                    <select
                      className="w-full rounded-md border px-3 py-2"
                      value={rule.target_id ?? ''}
                      disabled={rule.applies_to_all || targetsStatus === 'loading'}
                      onChange={(e) => updateRule(idx, { target_id: e.target.value })}
                    >
                      <option key={`__default-target-${idx}__`} value="">Select {rule.target_type === 'combo' ? 'Combo' : 'Attraction'}</option>
                      {(rule.target_type === 'attraction' ? attractions : combos).map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.title || item.name}
                        </option>
                      ))}
                    </select>
                    {(!rule.applies_to_all && (!rule.target_id || rule.target_id === '')) ? (
                      <div className="mt-1 text-xs text-red-600">Select a target or enable Applies to all</div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <input id={`applies-${idx}`} type="checkbox" checked={!!rule.applies_to_all} onChange={(e) => updateRule(idx, { applies_to_all: e.target.checked })} />
                    <label htmlFor={`applies-${idx}`} className="text-xs text-gray-600">Applies to all of this type</label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Date From</label>
                    <input type="date" className="w-full rounded-md border px-3 py-2" value={rule.date_from || ''} onChange={(e) => updateRule(idx, { date_from: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Date To</label>
                    <input type="date" className="w-full rounded-md border px-3 py-2" value={rule.date_to || ''} onChange={(e) => updateRule(idx, { date_to: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Time From</label>
                    <input type="time" className="w-full rounded-md border px-3 py-2" value={rule.time_from || ''} onChange={(e) => updateRule(idx, { time_from: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Time To</label>
                    <input type="time" className="w-full rounded-md border px-3 py-2" value={rule.time_to || ''} onChange={(e) => updateRule(idx, { time_to: e.target.value })} />
                  </div>
                </div>
                {f.rule_type === 'dynamic_pricing' && rule.target_type === 'combo' && rule.target_id ? (
                  <div className="border-t pt-3 mt-3">
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Child Attraction Price Increments (Dynamic Pricing)</label>
                    <div className="text-xs text-gray-500 mb-3">
                      Instead of a flat discount, specify a price increment for individual attractions within this combo. 
                      Use negative values to decrease the price (e.g. -100) or positive to increase (+50).
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {combos.find(c => c.id === Number(rule.target_id))?.attraction_ids?.map((attrId, i) => {
                        const attr = attractions.find(a => a.id === Number(attrId));
                        return (
                          <div key={attrId} className="flex flex-col">
                            <label className="text-xs text-gray-600 mb-1">{attr?.title || `Attraction #${attrId}`}</label>
                            <input
                              type="number"
                              className="w-full rounded-md border px-3 py-2"
                              placeholder="0"
                              value={rule.combo_child_adjustments?.[attrId] ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                const currentAdjustments = { ...(rule.combo_child_adjustments || {}) };
                                if (val === '') {
                                  delete currentAdjustments[attrId];
                                } else {
                                  currentAdjustments[attrId] = Number(val);
                                }
                                updateRule(idx, { combo_child_adjustments: currentAdjustments });
                              }}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : null}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Slot Type</label>
                    <select className="w-full rounded-md border px-3 py-2" value={rule.slot_type || ''} onChange={(e) => updateRule(idx, { slot_type: e.target.value })}>
                      <option value="">—</option>
                      <option value="attraction">Attraction</option>
                      <option value="combo">Combo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Slot ID</label>
                    <input type="number" className="w-full rounded-md border px-3 py-2" value={rule.slot_id ?? ''} onChange={(e) => updateRule(idx, { slot_id: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Rule Discount Type</label>
                    <select className="w-full rounded-md border px-3 py-2" value={rule.rule_discount_type || ''} onChange={(e) => updateRule(idx, { rule_discount_type: e.target.value })}>
                      <option key={`__default-rule-discount-type-${idx}__`} value="">Use Offer Default</option>
                      {DISCOUNT_TYPES.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Rule Discount Value <span className="text-xs text-blue-600">(negative for price increase)</span></label>
                    <input type="number" className="w-full rounded-md border px-3 py-2" value={rule.rule_discount_value ?? ''} onChange={(e) => updateRule(idx, { rule_discount_value: e.target.value })} placeholder="Optional" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Day Type</label>
                    <select
                      className="w-full rounded-md border px-3 py-2"
                      value={rule.day_type || ''}
                      onChange={(e) => updateRule(idx, {
                        day_type: e.target.value,
                        specific_days: e.target.value === 'custom' ? [] : [],
                        specific_dates: e.target.value === 'holiday' ? [] : (rule.specific_dates || []),
                      })}
                    >
                      <option value="">All Days</option>
                      <option value="weekday">Weekdays (Mon-Fri)</option>
                      <option value="weekend">Weekends (Sat-Sun)</option>
                      <option value="holiday">Holidays Only</option>
                      <option value="custom">Custom Days</option>
                    </select>
                  </div>
                  {rule.day_type === 'custom' && (
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Select Days</label>
                      <div className="flex flex-wrap gap-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dayIdx) => (
                          <label key={day} className="flex items-center gap-1 text-xs">
                            <input
                              type="checkbox"
                              checked={(rule.specific_days || []).includes(dayIdx)}
                              onChange={(e) => {
                                const days = rule.specific_days || [];
                                if (e.target.checked) {
                                  updateRule(idx, { specific_days: [...days, dayIdx] });
                                } else {
                                  updateRule(idx, { specific_days: days.filter(d => d !== dayIdx) });
                                }
                              }}
                            />
                            {day}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {rule.day_type === 'holiday' && (
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Holiday Pricing</label>
                      <div className="text-xs text-gray-600">This rule will apply only to declared holidays</div>
                    </div>
                  )}
                </div>
                <div className="border-t pt-3 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Add Specific Date</label>
                      <input
                        type="date"
                        className="w-full rounded-md border px-3 py-2"
                        value={rule.next_specific_date || ''}
                        onChange={(e) => updateRule(idx, { next_specific_date: e.target.value })}
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        className="px-3 py-2 text-xs rounded-md border"
                        disabled={!rule.next_specific_date}
                        onClick={() => {
                          if (!rule.next_specific_date) return;
                          const existing = Array.isArray(rule.specific_dates) ? rule.specific_dates : [];
                          if (!existing.includes(rule.next_specific_date)) {
                            updateRule(idx, {
                              specific_dates: [...existing, rule.next_specific_date].sort(),
                              next_specific_date: '',
                            });
                          } else {
                            updateRule(idx, { next_specific_date: '' });
                          }
                        }}
                      >
                        Add Date
                      </button>
                    </div>
                    <div className="text-xs text-gray-500">
                      Select one or more calendar dates. Rules targeting specific weekdays will still constrain these dates.
                    </div>
                  </div>
                  {Array.isArray(rule.specific_dates) && rule.specific_dates.length > 0 && (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Selected Dates</label>
                      <div className="flex flex-wrap gap-2">
                        {rule.specific_dates.map((d) => (
                          <span key={`${idx}-date-${d}`} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-xl">
                            {new Date(d).toLocaleDateString()}
                            <button
                              type="button"
                              className="text-red-500"
                              onClick={() => {
                                updateRule(idx, {
                                  specific_dates: rule.specific_dates.filter((date) => date !== d),
                                });
                              }}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {f.rule_type === 'date_slot_pricing' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t pt-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Specific Date</label>
                      <input
                        type="date"
                        className="w-full rounded-md border px-3 py-2"
                        value={rule.specific_date || ''}
                        onChange={(e) => updateRule(idx, { specific_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Specific Slot Time</label>
                      <input
                        type="time"
                        className="w-full rounded-md border px-3 py-2"
                        value={rule.specific_time || ''}
                        onChange={(e) => updateRule(idx, { specific_time: e.target.value })}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Slot ID (Optional)</label>
                      <input
                        type="number"
                        className="w-full rounded-md border px-3 py-2"
                        value={rule.slot_id ?? ''}
                        onChange={(e) => updateRule(idx, { slot_id: e.target.value })}
                        placeholder="Leave empty for all slots on this date/time"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-xs text-gray-600">
                        This rule will apply only to the specific date and time slot selected.
                        If slot ID is provided, it will apply only to that specific slot.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
            </>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <button type="submit" disabled={saving} className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
          <button type="button" className="rounded-md border px-4 py-2 text-sm" onClick={() => navigate(-1)}>Cancel</button>
        </div>

        {state.error ? <div className="mt-2 text-sm text-red-600">{state.error?.message || 'Error'}</div> : null}
      </form>
    </div>
  );
}
