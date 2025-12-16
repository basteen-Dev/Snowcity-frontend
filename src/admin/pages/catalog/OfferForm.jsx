import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import ImageUploader from '../../components/common/ImageUploader';
import useCatalogTargets from '../../hooks/useCatalogTargets';

const RULES = ['holiday', 'happy_hour', 'weekday_special', 'dynamic_pricing', 'date_slot_pricing', 'buy_x_get_y'];
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
  specific_time: '',
  specific_dates: [],
  next_specific_date: '',
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
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const createRule = (overrides = {}) => ({
  ...BASE_RULE,
  ...overrides,
});

const formatDiscountValue = (value, type) => {
  const num = Number(value || 0);
  if (!num) return 'Inherit offer discount';
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
      rule_type: '',
      discount_type: 'percent',
      discount_value: 0,
      max_discount: '',
      valid_from: '',
      valid_to: '',
      active: true,
      rules: [],
    }
  });

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
            rule_type: o.rule_type || '',
            discount_type: o.discount_type || 'percent',
            discount_value: Number(o.discount_value ?? o.discount_percent ?? 0),
            max_discount: o.max_discount ?? '',
            valid_from: o.valid_from ? new Date(o.valid_from).toISOString().split('T')[0] : '',
            valid_to: o.valid_to ? new Date(o.valid_to).toISOString().split('T')[0] : '',
            active: !!o.active,
            rules: Array.isArray(o.rules)
              ? o.rules.map((r) =>
                  createRule({
                    target_type: r.target_type || 'attraction',
                    target_id: r.target_id ?? '',
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
                  })
                )
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
      // Clear target_id when switching target_type to prevent invalid selection
      if (partial.target_type && nextRules[idx].target_id) {
        const isValidTarget = partial.target_type === 'attraction' 
          ? attractions.some(a => a.id === Number(nextRules[idx].target_id))
          : combos.some(c => c.id === Number(nextRules[idx].target_id));
        if (!isValidTarget) {
          nextRules[idx].target_id = '';
        }
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

      const resolvedRules = (state.form.rules || []).map((rule) => (
        rule.applies_to_all ? { ...rule, target_id: null } : { ...rule }
      ));

      const invalidRules = resolvedRules.filter((rule) => !rule.applies_to_all && (rule.target_id === null || rule.target_id === undefined || rule.target_id === ''));
      if (invalidRules.length > 0) {
        setState((s) => ({ ...s, error: { message: 'Please select a target from the list or enable "Applies to all".' } }));
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
          priority: Number(rule.priority ?? 100),
          date_from: normalizeDate(rule.date_from),
          date_to: normalizeDate(rule.date_to),
          time_from: normalizeTime(rule.time_from),
          time_to: normalizeTime(rule.time_to),
          specific_date: normalizeDate(rule.specific_date),
          specific_time: normalizeTime(rule.specific_time),
          rule_discount_type: normalizeString(rule.rule_discount_type),
          slot_type: normalizeString(rule.slot_type),
          day_type: normalizeString(rule.day_type),
          specific_dates: undefined,
          next_specific_date: undefined,
        })),
      };
      if (isEdit) await adminApi.put(`${A.offers()}/${id}`, payload);
      else await adminApi.post(A.offers(), payload);
      navigate('/admin/catalog/offers');
    } catch (err) { setState((s) => ({ ...s, error: err })); }
  };

  if (state.status === 'loading') return <div>Loading…</div>;
  if (state.status === 'failed') return <div className="text-red-600">{state.error?.message || 'Failed to load'}</div>;

  const f = state.form;

  return (
    <form onSubmit={save} className="max-w-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-4">
      <h1 className="text-xl font-semibold mb-4">{isEdit ? 'Edit' : 'New'} Offer</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Title</label>
          <input className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.title} onChange={(e) => updateForm({ title: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Description</label>
          <textarea rows={4} className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.description} onChange={(e) => updateForm({ description: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <ImageUploader label="Image" value={f.image_url} onChange={(url) => updateForm({ image_url: url })} folder="offers" requiredPerm="uploads:write" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Rule Type</label>
          <select className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.rule_type} onChange={(e) => updateForm({ rule_type: e.target.value })}>
            <option key="__default-rule-type__" value="">—</option>
            {RULES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Discount Type</label>
          <select className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.discount_type} onChange={(e) => updateForm({ discount_type: e.target.value })}>
            {DISCOUNT_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Discount Value</label>
          <input type="number" className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.discount_value} onChange={(e) => updateForm({ discount_value: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Max Discount (optional)</label>
          <input type="number" className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.max_discount ?? ''} onChange={(e) => updateForm({ max_discount: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Valid From</label>
          <input type="date" className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.valid_from || ''} onChange={(e) => updateForm({ valid_from: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Valid To</label>
          <input type="date" className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200" value={f.valid_to || ''} onChange={(e) => updateForm({ valid_to: e.target.value })} />
        </div>
        <div className="flex items-center gap-2 md:col-span-2">
          <input id="active" type="checkbox" checked={!!f.active} onChange={(e) => updateForm({ active: e.target.checked })} />
          <label htmlFor="active" className="text-sm text-gray-700 dark:text-neutral-200">Active</label>
        </div>
      </div>

      <div className="mt-6">
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
              className="rounded-2xl border border-gray-200 hover:border-gray-400 text-left p-3 bg-white/70 dark:bg-neutral-900/60 shadow-sm"
            >
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-gray-500">
                <span>{tpl.badge}</span>
                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Template</span>
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
                  <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] text-gray-600">
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
              {/* Buy X Get Y specific UI */}
              {f.rule_type === 'buy_x_get_y' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Buy Quantity (X)</label>
                    <input type="number" min={1} className="w-full rounded-md border px-3 py-2" value={rule.buy_qty ?? 1} onChange={(e) => updateRule(idx, { buy_qty: Number(e.target.value || 1) })} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Get Quantity (Y)</label>
                    <input type="number" min={1} className="w-full rounded-md border px-3 py-2" value={rule.get_qty ?? 1} onChange={(e) => updateRule(idx, { get_qty: Number(e.target.value || 1) })} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Get Target Type</label>
                    <select className="w-full rounded-md border px-3 py-2" value={rule.get_target_type || 'attraction'} onChange={(e) => updateRule(idx, { get_target_type: e.target.value, get_target_id: '' })}>
                      {TARGET_TYPES.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Get Target</label>
                    <select className="w-full rounded-md border px-3 py-2" value={rule.get_target_id ?? ''} disabled={rule.applies_to_all || targetsStatus === 'loading'} onChange={(e) => updateRule(idx, { get_target_id: e.target.value })}>
                      <option value="">Select {rule.get_target_type === 'combo' ? 'Combo' : 'Attraction'}</option>
                      {(rule.get_target_type === 'attraction' ? attractions : combos).map((item) => (
                        <option key={`get-${item.id}`} value={item.id}>{item.title || item.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Get Discount Type</label>
                    <select className="w-full rounded-md border px-3 py-2" value={rule.get_discount_type || ''} onChange={(e) => updateRule(idx, { get_discount_type: e.target.value })}>
                      <option value="">None / Free</option>
                      <option value="percent">Percentage (%)</option>
                      <option value="amount">Flat Amount</option>
                    </select>
                  </div>
                  {rule.get_discount_type ? (
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Get Discount Value</label>
                      <input type="number" min={0} className="w-full rounded-md border px-3 py-2" value={rule.get_discount_value ?? ''} onChange={(e) => updateRule(idx, { get_discount_value: e.target.value })} />
                    </div>
                  ) : null}
                </div>
              ) : null}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Priority</label>
                  <input type="number" className="w-full rounded-md border px-3 py-2" value={rule.priority ?? 100} onChange={(e) => updateRule(idx, { priority: e.target.value })} />
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
                  <label className="block text-xs text-gray-500 mb-1">Rule Discount Value</label>
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
                        <span key={`${idx}-date-${d}`} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
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
      </div>

      <div className="mt-4 flex gap-2">
        <button type="submit" className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm">Save</button>
        <button type="button" className="rounded-md border px-4 py-2 text-sm" onClick={() => navigate(-1)}>Cancel</button>
      </div>

      {state.error ? <div className="mt-2 text-sm text-red-600">{state.error?.message || 'Error'}</div> : null}
    </form>
  );
}
