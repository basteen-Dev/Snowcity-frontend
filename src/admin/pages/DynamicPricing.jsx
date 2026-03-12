import React, { useState, useEffect } from 'react';
import adminApi from '../services/adminApi';
import A from '../services/adminEndpoints';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DynamicPricing = () => {
  const [activeTab, setActiveTab] = useState('rules');
  const [rules, setRules] = useState([]);
  const [attractions, setAttractions] = useState([]);
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_type: 'attraction',
    target_id: '',
    date_ranges: [{ from: '', to: '' }],
    day_selection_mode: 'all_days',
    selected_weekdays: [],
    custom_dates: [],
    child_price_adjustments: {},
    price_adjustment_type: 'fixed',
    price_adjustment_value: 0,
    active: true,
  });

  // Combo children state for the rules form
  const [comboChildren, setComboChildren] = useState([]);

  // Date-specific pricing state
  const [selectedItemType, setSelectedItemType] = useState('attraction');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [datePrices, setDatePrices] = useState([]);
  const [showDateForm, setShowDateForm] = useState(false);
  const [editingDatePrice, setEditingDatePrice] = useState(null);
  const [dateFormData, setDateFormData] = useState({
    selectedDates: [],
    price: 0,
  });

  // Combo child prices state for date-specific tab
  const [comboChildPrices, setComboChildPrices] = useState(null);
  const [childPricesLoading, setChildPricesLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rulesRes, attractionsRes, combosRes] = await Promise.all([
        adminApi.get(A.dynamicPricing()),
        adminApi.get(A.attractions(), { params: { active: true, limit: 100 } }),
        adminApi.get(A.combos(), { params: { active: true, limit: 100 } })
      ]);
      setRules(rulesRes.data || []);
      setAttractions(attractionsRes.data || []);
      setCombos(combosRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRules = async () => {
    try {
      const response = await adminApi.get(A.dynamicPricing());
      setRules(response.data || []);
    } catch (error) {
      console.error('Error loading rules:', error);
    }
  };

  // Load combo children when combo is selected in rules form
  const loadComboChildren = (comboId) => {
    if (!comboId) {
      setComboChildren([]);
      return;
    }
    const combo = combos.find(c => String(c.combo_id) === String(comboId));
    if (combo && combo.attractions && combo.attractions.length > 0) {
      setComboChildren(combo.attractions);
    } else if (combo && combo.attraction_ids) {
      // Build from attraction_ids
      const children = combo.attraction_ids.map(id => {
        const attr = attractions.find(a => a.attraction_id === id || String(a.attraction_id) === String(id));
        return {
          attraction_id: id,
          title: attr?.title || `Attraction ${id}`,
          price: Number(combo.attraction_prices?.[id] || combo.attraction_prices?.[String(id)] || attr?.base_price || 0),
        };
      });
      setComboChildren(children);
    } else {
      setComboChildren([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      // Clean up payload based on day_selection_mode
      if (payload.day_selection_mode !== 'custom_weekdays') {
        payload.selected_weekdays = null;
      }
      if (payload.day_selection_mode !== 'specific_dates') {
        payload.custom_dates = null;
      }
      // Only send child_price_adjustments for combos
      if (payload.target_type !== 'combo') {
        payload.child_price_adjustments = null;
      }
      // Calculate total from children if combo
      if (payload.target_type === 'combo' && comboChildren.length > 0) {
        const childAdj = payload.child_price_adjustments || {};
        let total = 0;
        comboChildren.forEach(child => {
          total += Number(childAdj[child.attraction_id]) || 0;
        });
        payload.price_adjustment_value = total;
      }

      if (editingRule) {
        await adminApi.put(A.dynamicPricingById(editingRule.rule_id), payload);
      } else {
        await adminApi.post(A.dynamicPricing(), payload);
      }
      loadRules();
      resetForm();
    } catch (error) {
      console.error('Error saving rule:', error);
      alert('Error saving rule: ' + error.message);
    }
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    const fd = {
      name: rule.name,
      description: rule.description || '',
      target_type: rule.target_type,
      target_id: rule.target_id || '',
      date_ranges: rule.date_ranges || [{ from: '', to: '' }],
      day_selection_mode: rule.day_selection_mode || 'all_days',
      selected_weekdays: rule.selected_weekdays || [],
      custom_dates: (rule.custom_dates || []).map(d => {
        const dt = new Date(d);
        return dt.toISOString().split('T')[0];
      }),
      child_price_adjustments: rule.child_price_adjustments || {},
      price_adjustment_type: rule.price_adjustment_type,
      price_adjustment_value: rule.price_adjustment_value,
      active: rule.active,
    };
    setFormData(fd);
    if (rule.target_type === 'combo' && rule.target_id) {
      loadComboChildren(rule.target_id);
    }
    setShowForm(true);
  };

  const handleDelete = async (ruleId) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;
    try {
      await adminApi.delete(A.dynamicPricingById(ruleId));
      loadRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
      alert('Error deleting rule: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      target_type: 'attraction',
      target_id: '',
      date_ranges: [{ from: '', to: '' }],
      day_selection_mode: 'all_days',
      selected_weekdays: [],
      custom_dates: [],
      child_price_adjustments: {},
      price_adjustment_type: 'fixed',
      price_adjustment_value: 0,
      active: true,
    });
    setEditingRule(null);
    setShowForm(false);
    setComboChildren([]);
  };

  const addDateRange = () => {
    setFormData({
      ...formData,
      date_ranges: [...formData.date_ranges, { from: '', to: '' }],
    });
  };

  const removeDateRange = (index) => {
    if (formData.date_ranges.length > 1) {
      setFormData({
        ...formData,
        date_ranges: formData.date_ranges.filter((_, i) => i !== index),
      });
    }
  };

  const updateDateRange = (index, field, value) => {
    const newRanges = [...formData.date_ranges];
    newRanges[index][field] = value;
    setFormData({ ...formData, date_ranges: newRanges });
  };

  const getTargetOptions = () => {
    if (formData.target_type === 'attraction') {
      return attractions.map(attr => (
        <option key={attr.attraction_id} value={attr.attraction_id}>{attr.title}</option>
      ));
    } else if (formData.target_type === 'combo') {
      return combos.map(combo => (
        <option key={combo.combo_id} value={combo.combo_id}>{combo.name}</option>
      ));
    }
    return null;
  };

  // Toggle weekday selection
  const toggleWeekday = (dayIndex) => {
    const current = formData.selected_weekdays || [];
    const updated = current.includes(dayIndex)
      ? current.filter(d => d !== dayIndex)
      : [...current, dayIndex];
    setFormData({ ...formData, selected_weekdays: updated });
  };

  // Custom dates for specific_dates mode
  const addCustomDate = () => {
    setFormData({ ...formData, custom_dates: [...(formData.custom_dates || []), ''] });
  };

  const updateCustomDate = (index, value) => {
    const newDates = [...(formData.custom_dates || [])];
    newDates[index] = value;
    setFormData({ ...formData, custom_dates: newDates });
  };

  const removeCustomDate = (index) => {
    const newDates = (formData.custom_dates || []).filter((_, i) => i !== index);
    setFormData({ ...formData, custom_dates: newDates });
  };

  // Update child price adjustment
  const updateChildPrice = (attractionId, value) => {
    setFormData({
      ...formData,
      child_price_adjustments: {
        ...formData.child_price_adjustments,
        [attractionId]: parseFloat(value) || 0,
      },
    });
  };

  // Calculate total from child prices
  const getChildPriceTotal = () => {
    if (!comboChildren.length) return 0;
    let total = 0;
    comboChildren.forEach(child => {
      total += Number(formData.child_price_adjustments?.[child.attraction_id]) || 0;
    });
    return total;
  };

  // Format day selection mode for display
  const formatDayMode = (rule) => {
    const mode = rule.day_selection_mode || 'all_days';
    switch (mode) {
      case 'all_days': return 'All Days';
      case 'weekends_only': return 'Weekends Only';
      case 'custom_weekdays': {
        const days = (rule.selected_weekdays || []).map(d => WEEKDAY_LABELS[d]).join(', ');
        return `Custom: ${days}`;
      }
      case 'specific_dates': {
        const count = (rule.custom_dates || []).length;
        return `${count} Specific Date${count !== 1 ? 's' : ''}`;
      }
      default: return mode;
    }
  };

  // Date-specific pricing functions
  const toYMD = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const loadDatePrices = async () => {
    if (!selectedItemId) { setDatePrices([]); return; }
    try {
      const endpoint = selectedItemType === 'attraction' ? A.attractionDatePrices(selectedItemId) : A.comboDatePrices(selectedItemId);
      const response = await adminApi.get(endpoint);
      setDatePrices(response.data || []);
    } catch (error) {
      console.error('Error loading date prices:', error);
      setDatePrices([]);
    }
  };

  useEffect(() => {
    if (activeTab === 'date-specific' && selectedItemId) {
      loadDatePrices();
    }
  }, [selectedItemId, activeTab]);

  const loadComboChildPrices = async (comboId, date) => {
    if (!comboId || !date) { setComboChildPrices(null); return; }
    setChildPricesLoading(true);
    try {
      const response = await adminApi.get(A.comboChildDatePrices(comboId, date));
      if (response.data) {
        setComboChildPrices(response.data);
        if (dateFormData.price === 0 && response.data.suggested_total > 0) {
          setDateFormData(prev => ({ ...prev, price: response.data.suggested_total }));
        }
      }
    } catch (error) {
      console.error('Error loading combo child prices:', error);
      setComboChildPrices(null);
    } finally {
      setChildPricesLoading(false);
    }
  };

  const handleDateSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDatePrice) {
        const endpoint = selectedItemType === 'attraction' ? A.attractionDatePricesByDate(selectedItemId, dateFormData.selectedDates[0]) : A.comboDatePricesByDate(selectedItemId, dateFormData.selectedDates[0]);
        await adminApi.put(endpoint, { price: dateFormData.price });
      } else {
        if (dateFormData.selectedDates.length === 1) {
          const endpoint = selectedItemType === 'attraction' ? A.attractionDatePricesByDate(selectedItemId, dateFormData.selectedDates[0]) : A.comboDatePricesByDate(selectedItemId, dateFormData.selectedDates[0]);
          await adminApi.put(endpoint, { price: dateFormData.price });
        } else {
          const datePricesPayload = dateFormData.selectedDates.map(date => ({ date, price: dateFormData.price }));
          const endpoint = selectedItemType === 'attraction' ? A.attractionDatePricesBulk(selectedItemId) : A.comboDatePricesBulk(selectedItemId);
          await adminApi.post(endpoint, { datePrices: datePricesPayload });
        }
      }
      loadDatePrices();
      resetDateForm();
    } catch (error) {
      console.error('Error saving date price:', error);
      alert('Error saving date price: ' + error.message);
    }
  };

  const handleDateEdit = (datePrice) => {
    const formattedDate = toYMD(datePrice.price_date);
    setEditingDatePrice(datePrice);
    setDateFormData({ selectedDates: [formattedDate], price_date: formattedDate, price: datePrice.price });
    setComboChildPrices(null);
    setShowDateForm(true);
    if (selectedItemType === 'combo') {
      loadComboChildPrices(selectedItemId, formattedDate);
    }
  };

  const handleDateDelete = async (dateStr) => {
    if (!confirm('Are you sure you want to delete this date price?')) return;
    try {
      const formattedDate = toYMD(dateStr);
      const endpoint = selectedItemType === 'attraction' ? A.attractionDatePricesByDate(selectedItemId, formattedDate) : A.comboDatePricesByDate(selectedItemId, formattedDate);
      await adminApi.delete(endpoint);
      loadDatePrices();
    } catch (error) {
      console.error('Error deleting date price:', error);
      alert('Error deleting date price: ' + error.message);
    }
  };

  const resetDateForm = () => {
    setDateFormData({ selectedDates: [''], price: 0 });
    setEditingDatePrice(null);
    setShowDateForm(false);
    setComboChildPrices(null);
  };

  const getSelectedItemOptions = () => {
    if (selectedItemType === 'attraction') {
      return attractions.map(attr => (
        <option key={attr.attraction_id} value={attr.attraction_id}>{attr.title}</option>
      ));
    } else if (selectedItemType === 'combo') {
      return combos.map(combo => (
        <option key={combo.combo_id} value={combo.combo_id}>{combo.name}</option>
      ));
    }
    return null;
  };

  const addDateToForm = () => {
    setDateFormData({ ...dateFormData, selectedDates: [...dateFormData.selectedDates, ''] });
  };

  const updateDateInForm = (index, value) => {
    const newDates = [...dateFormData.selectedDates];
    newDates[index] = value;
    setDateFormData({ ...dateFormData, selectedDates: newDates });
    if (selectedItemType === 'combo' && index === 0 && value) {
      loadComboChildPrices(selectedItemId, value);
    }
  };

  const removeDateFromForm = (index) => {
    if (dateFormData.selectedDates.length > 1) {
      setDateFormData({ ...dateFormData, selectedDates: dateFormData.selectedDates.filter((_, i) => i !== index) });
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dynamic Pricing</h1>
        {activeTab === 'rules' && (
          <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Add New Rule
          </button>
        )}
        {activeTab === 'date-specific' && selectedItemId && (
          <button onClick={() => setShowDateForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Add Date Price
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex mb-6">
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 ${activeTab === 'rules' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} rounded-l`}
        >
          Dynamic Rules
        </button>
        <button
          onClick={() => setActiveTab('date-specific')}
          className={`px-4 py-2 ${activeTab === 'date-specific' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} rounded-r`}
        >
          Date-Specific Pricing
        </button>
      </div>

      {/* ============ RULES TAB - FORM ============ */}
      {activeTab === 'rules' && showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingRule ? 'Edit Rule' : 'Add New Rule'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name & Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Rule Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-2 border rounded" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full p-2 border rounded" />
              </div>
            </div>

            {/* Target Type, Target ID, Active */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Target Type</label>
                <select
                  value={formData.target_type}
                  onChange={(e) => {
                    setFormData({ ...formData, target_type: e.target.value, target_id: '', child_price_adjustments: {} });
                    setComboChildren([]);
                  }}
                  className="w-full p-2 border rounded"
                >
                  <option value="attraction">Attraction</option>
                  <option value="combo">Combo</option>
                  <option value="all">All</option>
                </select>
              </div>
              {formData.target_type !== 'all' && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {formData.target_type === 'attraction' ? 'Attraction' : 'Combo'}
                  </label>
                  <select
                    value={formData.target_id}
                    onChange={(e) => {
                      setFormData({ ...formData, target_id: e.target.value, child_price_adjustments: {} });
                      if (formData.target_type === 'combo') {
                        loadComboChildren(e.target.value);
                      }
                    }}
                    className="w-full p-2 border rounded"
                    required
                  >
                    <option value="">Select...</option>
                    {getTargetOptions()}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Active</label>
                <input type="checkbox" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} className="mt-1" />
              </div>
            </div>

            {/* Date Ranges */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Date Ranges</label>
                <button type="button" onClick={addDateRange} className="text-blue-600 hover:text-blue-800 text-sm">+ Add Range</button>
              </div>
              {formData.date_ranges.map((range, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input type="date" value={range.from} onChange={(e) => updateDateRange(index, 'from', e.target.value)} className="flex-1 p-2 border rounded" required />
                  <span className="self-center">to</span>
                  <input type="date" value={range.to} onChange={(e) => updateDateRange(index, 'to', e.target.value)} className="flex-1 p-2 border rounded" required />
                  {formData.date_ranges.length > 1 && (
                    <button type="button" onClick={() => removeDateRange(index)} className="text-red-600 hover:text-red-800 px-2">×</button>
                  )}
                </div>
              ))}
            </div>

            {/* Day Selection Mode */}
            <div>
              <label className="block text-sm font-medium mb-1">Apply To Days</label>
              <select value={formData.day_selection_mode} onChange={(e) => setFormData({ ...formData, day_selection_mode: e.target.value })} className="w-full p-2 border rounded">
                <option value="all_days">All Days (within date range)</option>
                <option value="weekends_only">Weekends Only (Sat & Sun)</option>
                <option value="custom_weekdays">Custom Weekdays</option>
                <option value="specific_dates">Specific Dates</option>
              </select>
            </div>

            {/* Custom Weekdays checkboxes */}
            {formData.day_selection_mode === 'custom_weekdays' && (
              <div>
                <label className="block text-sm font-medium mb-2">Select Weekdays</label>
                <div className="flex flex-wrap gap-3">
                  {WEEKDAY_LABELS.map((label, index) => (
                    <label key={index} className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={(formData.selected_weekdays || []).includes(index)} onChange={() => toggleWeekday(index)} className="rounded" />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Specific Dates picker */}
            {formData.day_selection_mode === 'specific_dates' && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">Specific Dates</label>
                  <button type="button" onClick={addCustomDate} className="text-blue-600 hover:text-blue-800 text-sm">+ Add Date</button>
                </div>
                {(formData.custom_dates || []).map((date, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input type="date" value={date} onChange={(e) => updateCustomDate(index, e.target.value)} className="flex-1 p-2 border rounded" required />
                    <button type="button" onClick={() => removeCustomDate(index)} className="text-red-600 hover:text-red-800 px-2">×</button>
                  </div>
                ))}
                {(formData.custom_dates || []).length === 0 && (
                  <p className="text-gray-400 text-sm">No dates added yet. Click + Add Date above.</p>
                )}
              </div>
            )}

            {/* ======= COMBO CHILD PRICE ADJUSTMENTS ======= */}
            {formData.target_type === 'combo' && comboChildren.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-green-800 mb-3">
                  Child Attraction Dynamic Prices
                </h3>
                <p className="text-xs text-green-600 mb-3">
                  Set the new dynamic price for each child attraction. The combo's total adjustment will be auto-calculated.
                </p>
                <div className="space-y-3">
                  {comboChildren.map((child, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 flex-1 min-w-0">
                        {child.title}
                        <span className="text-xs text-gray-400 ml-1">(Base: ₹{Number(child.price || child.attraction_price || 0)})</span>
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-500">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.child_price_adjustments?.[child.attraction_id] || ''}
                          onChange={(e) => updateChildPrice(child.attraction_id, e.target.value)}
                          placeholder="0"
                          className="w-28 p-2 border rounded text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-green-200 mt-3 pt-2 flex justify-between items-center">
                  <span className="text-sm font-semibold text-green-800">Total (auto-calculated)</span>
                  <span className="text-lg font-bold text-green-700">₹{getChildPriceTotal()}</span>
                </div>
              </div>
            )}

            {/* Adjustment Type & Value — show only for non-combo or when no children */}
            {(formData.target_type !== 'combo' || comboChildren.length === 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Adjustment Type</label>
                  <select value={formData.price_adjustment_type} onChange={(e) => setFormData({ ...formData, price_adjustment_type: e.target.value })} className="w-full p-2 border rounded">
                    <option value="fixed">Fixed Amount</option>
                    <option value="percentage">Percentage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Adjustment Value ({formData.price_adjustment_type === 'percentage' ? '%' : '₹'})
                  </label>
                  <input type="number" step="0.01" value={formData.price_adjustment_value} onChange={(e) => setFormData({ ...formData, price_adjustment_value: parseFloat(e.target.value) || 0 })} className="w-full p-2 border rounded" required />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                {editingRule ? 'Update' : 'Create'} Rule
              </button>
              <button type="button" onClick={resetForm} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============ RULES TAB - TABLE ============ */}
      {activeTab === 'rules' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Target</th>
                <th className="px-4 py-3 text-left">Date Range</th>
                <th className="px-4 py-3 text-left">Apply To</th>
                <th className="px-4 py-3 text-left">Adjustment</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map(rule => (
                <tr key={rule.rule_id} className="border-t">
                  <td className="px-4 py-3">{rule.name}</td>
                  <td className="px-4 py-3">
                    {rule.target_type === 'all' ? 'All' :
                      rule.target_type === 'attraction' ?
                        attractions.find(a => a.attraction_id === rule.target_id)?.title || `Attraction ${rule.target_id}` :
                        combos.find(c => c.combo_id === rule.target_id)?.name || `Combo ${rule.target_id}`}
                  </td>
                  <td className="px-4 py-3">
                    {rule.date_ranges?.map((range, idx) => (
                      <div key={idx}>
                        {new Date(range.from).toLocaleDateString()} - {new Date(range.to).toLocaleDateString()}
                      </div>
                    )) || 'No ranges'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                      {formatDayMode(rule)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {rule.child_price_adjustments && Object.keys(rule.child_price_adjustments).length > 0 ? (
                      <span className="text-xs text-green-700">
                        ₹{rule.price_adjustment_value} (per-child)
                      </span>
                    ) : (
                      <>
                        {rule.price_adjustment_type === 'fixed' ? '₹' : ''}{rule.price_adjustment_value}
                        {rule.price_adjustment_type === 'percentage' ? '%' : ''}
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${rule.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {rule.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleEdit(rule)} className="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
                    <button onClick={() => handleDelete(rule.rule_id)} className="text-red-600 hover:text-red-800">Delete</button>
                  </td>
                </tr>
              ))}
              {rules.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                    No dynamic pricing rules found. Create your first rule to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ============ DATE-SPECIFIC PRICING TAB ============ */}
      {activeTab === 'date-specific' && (
        <>
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Item Type</label>
                <select
                  value={selectedItemType}
                  onChange={(e) => { setSelectedItemType(e.target.value); setSelectedItemId(''); setDatePrices([]); setComboChildPrices(null); }}
                  className="w-full p-2 border rounded"
                >
                  <option value="attraction">Attraction</option>
                  <option value="combo">Combo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  {selectedItemType === 'attraction' ? 'Attraction' : 'Combo'}
                </label>
                <select value={selectedItemId} onChange={(e) => setSelectedItemId(e.target.value)} className="w-full p-2 border rounded">
                  <option value="">Select...</option>
                  {getSelectedItemOptions()}
                </select>
              </div>
            </div>
          </div>

          {showDateForm && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingDatePrice ? 'Edit Date Price' : 'Add Date Price'}
              </h2>
              <form onSubmit={handleDateSubmit} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">Dates</label>
                    {!editingDatePrice && (
                      <button type="button" onClick={addDateToForm} className="text-blue-600 hover:text-blue-800 text-sm">+ Add Date</button>
                    )}
                  </div>
                  {dateFormData.selectedDates.map((date, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input type="date" value={date} onChange={(e) => updateDateInForm(index, e.target.value)} className="flex-1 p-2 border rounded" required />
                      {dateFormData.selectedDates.length > 1 && !editingDatePrice && (
                        <button type="button" onClick={() => removeDateFromForm(index)} className="text-red-600 hover:text-red-800 px-2">×</button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Combo Child Prices Panel */}
                {selectedItemType === 'combo' && comboChildPrices && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-blue-800 mb-3">
                      Child Attraction Prices for {comboChildPrices.date}
                    </h3>
                    <div className="space-y-2">
                      {comboChildPrices.children?.map((child, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span className="text-gray-700">{child.title}</span>
                          <div className="flex items-center gap-2">
                            {child.date_price !== null ? (
                              <>
                                <span className="line-through text-gray-400">₹{child.base_price}</span>
                                <span className="font-semibold text-blue-700">₹{child.date_price}</span>
                                <span className="text-xs bg-blue-100 text-blue-600 px-1 rounded">date price</span>
                              </>
                            ) : (
                              <span className="font-semibold text-gray-700">₹{child.base_price}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-blue-200 mt-3 pt-2 flex justify-between items-center">
                      <span className="text-sm font-semibold text-blue-800">Suggested Total</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-blue-700">₹{comboChildPrices.suggested_total}</span>
                        <button type="button" onClick={() => setDateFormData({ ...dateFormData, price: comboChildPrices.suggested_total })} className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">
                          Use This Price
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {selectedItemType === 'combo' && childPricesLoading && (
                  <div className="text-sm text-gray-500 italic">Loading child attraction prices...</div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">Price (₹)</label>
                  <input type="number" step="0.01" value={dateFormData.price} onChange={(e) => setDateFormData({ ...dateFormData, price: parseFloat(e.target.value) || 0 })} className="w-full p-2 border rounded" required />
                </div>

                <div className="flex gap-2">
                  <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    {editingDatePrice ? 'Update' : 'Create'} Price{dateFormData.selectedDates.length > 1 ? 's' : ''}
                  </button>
                  <button type="button" onClick={resetDateForm} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Price</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {datePrices.map(price => (
                  <tr key={price.price_date} className="border-t">
                    <td className="px-4 py-3">{new Date(price.price_date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">₹{price.price}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDateEdit(price)} className="text-blue-600 hover:text-blue-800 mr-2">Edit</button>
                      <button onClick={() => handleDateDelete(price.price_date)} className="text-red-600 hover:text-red-800">Delete</button>
                    </td>
                  </tr>
                ))}
                {datePrices.length === 0 && (
                  <tr>
                    <td colSpan="3" className="px-4 py-8 text-center text-gray-500">
                      {selectedItemId ? 'No date-specific prices found. Add your first date price.' : 'Select an item to view date prices.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default DynamicPricing;
