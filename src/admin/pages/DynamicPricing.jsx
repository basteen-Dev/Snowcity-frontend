import React, { useState, useEffect } from 'react';
import adminApi from '../services/adminApi';
import A from '../services/adminEndpoints';

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
    price_adjustment_type: 'fixed',
    price_adjustment_value: 0,
    active: true,
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRule) {
        await adminApi.put(A.dynamicPricingById(editingRule.rule_id), formData);
      } else {
        await adminApi.post(A.dynamicPricing(), formData);
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
    setFormData({
      name: rule.name,
      description: rule.description || '',
      target_type: rule.target_type,
      target_id: rule.target_id || '',
      date_ranges: rule.date_ranges || [{ from: '', to: '' }],
      price_adjustment_type: rule.price_adjustment_type,
      price_adjustment_value: rule.price_adjustment_value,
      active: rule.active,
    });
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
      price_adjustment_type: 'fixed',
      price_adjustment_value: 0,
      active: true,
    });
    setEditingRule(null);
    setShowForm(false);
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
    setFormData({
      ...formData,
      date_ranges: newRanges,
    });
  };

  const getTargetOptions = () => {
    if (formData.target_type === 'attraction') {
      return attractions.map(attr => (
        <option key={attr.attraction_id} value={attr.attraction_id}>
          {attr.title}
        </option>
      ));
    } else if (formData.target_type === 'combo') {
      return combos.map(combo => (
        <option key={combo.combo_id} value={combo.combo_id}>
          {combo.name}
        </option>
      ));
    }
    return null;
  };

  // Date-specific pricing functions
  const loadDatePrices = async () => {
    if (!selectedItemId) {
      setDatePrices([]);
      return;
    }
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

  const handleDateSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDatePrice) {
        // Edit single date price
        const endpoint = selectedItemType === 'attraction' ? A.attractionDatePricesByDate(selectedItemId, dateFormData.selectedDates[0]) : A.comboDatePricesByDate(selectedItemId, dateFormData.selectedDates[0]);
        await adminApi.put(endpoint, { price: dateFormData.price });
      } else {
        // Add new prices - use bulk if multiple dates, single if one date
        if (dateFormData.selectedDates.length === 1) {
          const endpoint = selectedItemType === 'attraction' ? A.attractionDatePricesByDate(selectedItemId, dateFormData.selectedDates[0]) : A.comboDatePricesByDate(selectedItemId, dateFormData.selectedDates[0]);
          await adminApi.put(endpoint, { price: dateFormData.price });
        } else {
          // Bulk operation
          const datePrices = dateFormData.selectedDates.map(date => ({ date, price: dateFormData.price }));
          const endpoint = selectedItemType === 'attraction' ? A.attractionDatePricesBulk(selectedItemId) : A.comboDatePricesBulk(selectedItemId);
          await adminApi.post(endpoint, { datePrices });
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
    setEditingDatePrice(datePrice);
    setDateFormData({
      selectedDates: [datePrice.price_date],
      price_date: datePrice.price_date,
      price: datePrice.price,
    });
    setShowDateForm(true);
  };

  const handleDateDelete = async (date) => {
    if (!confirm('Are you sure you want to delete this date price?')) return;
    try {
      const endpoint = selectedItemType === 'attraction' ? A.attractionDatePricesByDate(selectedItemId, date) : A.comboDatePricesByDate(selectedItemId, date);
      await adminApi.delete(endpoint);
      loadDatePrices();
    } catch (error) {
      console.error('Error deleting date price:', error);
      alert('Error deleting date price: ' + error.message);
    }
  };

  const resetDateForm = () => {
    setDateFormData({
      selectedDates: editingDatePrice ? [] : [''],
      price: 0,
    });
    setEditingDatePrice(null);
    setShowDateForm(false);
  };

  const getSelectedItemOptions = () => {
    if (selectedItemType === 'attraction') {
      return attractions.map(attr => (
        <option key={attr.attraction_id} value={attr.attraction_id}>
          {attr.title}
        </option>
      ));
    } else if (selectedItemType === 'combo') {
      return combos.map(combo => (
        <option key={combo.combo_id} value={combo.combo_id}>
          {combo.name}
        </option>
      ));
    }
    return null;
  };

  // Functions for managing multiple dates in the form
  const addDateToForm = () => {
    setDateFormData({
      ...dateFormData,
      selectedDates: [...dateFormData.selectedDates, ''],
    });
  };

  const updateDateInForm = (index, value) => {
    const newDates = [...dateFormData.selectedDates];
    newDates[index] = value;
    setDateFormData({
      ...dateFormData,
      selectedDates: newDates,
    });
  };

  const removeDateFromForm = (index) => {
    if (dateFormData.selectedDates.length > 1) {
      setDateFormData({
        ...dateFormData,
        selectedDates: dateFormData.selectedDates.filter((_, i) => i !== index),
      });
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
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add New Rule
          </button>
        )}
        {activeTab === 'date-specific' && selectedItemId && (
          <button
            onClick={() => setShowDateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
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

      {activeTab === 'rules' && showForm && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingRule ? 'Edit Rule' : 'Add New Rule'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Rule Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Target Type</label>
                <select
                  value={formData.target_type}
                  onChange={(e) => setFormData({...formData, target_type: e.target.value, target_id: ''})}
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
                    onChange={(e) => setFormData({...formData, target_id: e.target.value})}
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
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({...formData, active: e.target.checked})}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Date Ranges</label>
                <button
                  type="button"
                  onClick={addDateRange}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Add Range
                </button>
              </div>
              {formData.date_ranges.map((range, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="date"
                    value={range.from}
                    onChange={(e) => updateDateRange(index, 'from', e.target.value)}
                    className="flex-1 p-2 border rounded"
                    required
                  />
                  <span className="self-center">to</span>
                  <input
                    type="date"
                    value={range.to}
                    onChange={(e) => updateDateRange(index, 'to', e.target.value)}
                    className="flex-1 p-2 border rounded"
                    required
                  />
                  {formData.date_ranges.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDateRange(index)}
                      className="text-red-600 hover:text-red-800 px-2"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Adjustment Type</label>
                <select
                  value={formData.price_adjustment_type}
                  onChange={(e) => setFormData({...formData, price_adjustment_type: e.target.value})}
                  className="w-full p-2 border rounded"
                >
                  <option value="fixed">Fixed Amount</option>
                  <option value="percentage">Percentage</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Adjustment Value ({formData.price_adjustment_type === 'percentage' ? '%' : '₹'})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price_adjustment_value}
                  onChange={(e) => setFormData({...formData, price_adjustment_value: parseFloat(e.target.value) || 0})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {editingRule ? 'Update' : 'Create'} Rule
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Target</th>
                <th className="px-4 py-3 text-left">Date Range</th>
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
                    {rule.price_adjustment_type === 'fixed' ? '₹' : ''}{rule.price_adjustment_value}
                    {rule.price_adjustment_type === 'percentage' ? '%' : ''}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${rule.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {rule.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleEdit(rule)}
                      className="text-blue-600 hover:text-blue-800 mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(rule.rule_id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {rules.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    No dynamic pricing rules found. Create your first rule to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Date-Specific Pricing Tab */}
      {activeTab === 'date-specific' && (
        <>
          {/* Item Selector */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Item Type</label>
                <select
                  value={selectedItemType}
                  onChange={(e) => {
                    setSelectedItemType(e.target.value);
                    setSelectedItemId('');
                    setDatePrices([]);
                  }}
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
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full p-2 border rounded"
                >
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
                      <button
                        type="button"
                        onClick={addDateToForm}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        + Add Date
                      </button>
                    )}
                  </div>
                  {dateFormData.selectedDates.map((date, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => updateDateInForm(index, e.target.value)}
                        className="flex-1 p-2 border rounded"
                        required
                      />
                      {dateFormData.selectedDates.length > 1 && !editingDatePrice && (
                        <button
                          type="button"
                          onClick={() => removeDateFromForm(index)}
                          className="text-red-600 hover:text-red-800 px-2"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={dateFormData.price}
                    onChange={(e) => setDateFormData({...dateFormData, price: parseFloat(e.target.value) || 0})}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    {editingDatePrice ? 'Update' : 'Create'} Price{dateFormData.selectedDates.length > 1 ? 's' : ''}
                  </button>
                  <button
                    type="button"
                    onClick={resetDateForm}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
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
                      <button
                        onClick={() => handleDateEdit(price)}
                        className="text-blue-600 hover:text-blue-800 mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDateDelete(price.price_date)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
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