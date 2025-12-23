import React, { useState, useEffect } from 'react';
import adminApi from '../services/adminApi';
import A from '../services/adminEndpoints';

const DynamicPricing = () => {
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

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dynamic Pricing Rules</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add New Rule
        </button>
      </div>

      {showForm && (
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
    </div>
  );
};

export default DynamicPricing;