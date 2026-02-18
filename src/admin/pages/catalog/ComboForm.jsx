import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import ImageUploader from '../../components/common/ImageUploader';

export default function ComboForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [state, setState] = React.useState({
    status: isEdit ? 'loading' : 'idle',
    error: null,
    attractions: [],
    form: {
      name: '',
      slug: '',
      attraction_ids: isEdit ? [] : ['', ''], // Start with 2 empty slots for new combos
      attraction_prices: {},
      total_price: 0,
      image_url: '',
      desktop_image_url: '',
      discount_percent: 0,
      active: true,
      meta_title: '',
      short_description: ''
    }
  });

  // Load attractions for pickers
  React.useEffect(() => {
    (async () => {
      try {
        const res = await adminApi.get(A.attractions());
        const attractions = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setState((s) => ({ ...s, attractions }));
      } catch { }
    })();
  }, []);

  // Load combo if editing
  React.useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const res = await adminApi.get(A.comboById(id));
        const c = res?.combo || res || {};

        // Handle both legacy and new format
        let formdata = {
          name: c.name || '',
          slug: c.slug || '',
          attraction_ids: [],
          attraction_prices: {},
          total_price: 0,
          image_url: c.image_url || '',
          desktop_image_url: c.desktop_image_url || '',
          discount_percent: c.discount_percent || 0,
          active: !!c.active,
          meta_title: c.meta_title || '',
          short_description: c.short_description || ''
        };

        // Check if it's legacy format (has attraction_1_id and attraction_2_id)
        if (c.attraction_1_id && c.attraction_2_id) {
          // Legacy format - convert to new format
          formdata.attraction_ids = [c.attraction_1_id, c.attraction_2_id];
          formdata.attraction_prices = {
            [c.attraction_1_id]: (c.combo_price || 0) / 2,
            [c.attraction_2_id]: (c.combo_price || 0) / 2
          };
          formdata.total_price = c.combo_price || 0;
        } else {
          // New format
          formdata.attraction_ids = c.attraction_ids || [];
          formdata.attraction_prices = c.attraction_prices || {};
          formdata.total_price = Number(c.total_price || 0);
        }

        setState((s) => ({ ...s, status: 'idle', form: formdata }));
      } catch (err) { setState((s) => ({ ...s, status: 'failed', error: err })); }
    })();
  }, [id, isEdit]);

  const save = async (e) => {
    e.preventDefault();
    try {
      const f = state.form;
      if (!f.name || f.name.trim() === '') {
        alert('Please enter a combo name'); return;
      }
      if (!f.attraction_ids || f.attraction_ids.length < 2) {
        alert('Select at least two attractions'); return;
      }

      // Validate attraction prices
      for (const attractionId of f.attraction_ids) {
        if (!f.attraction_prices[attractionId] || f.attraction_prices[attractionId] <= 0) {
          const attraction = state.attractions.find(a => a.attraction_id === attractionId);
          alert(`Please set a valid price for ${attraction?.title || 'attraction'}`);
          return;
        }
      }

      const payload = {
        name: f.name.trim(),
        slug: f.slug?.trim() || null,
        attraction_ids: f.attraction_ids,
        attraction_prices: f.attraction_prices,
        total_price: Number(f.total_price || 0),
        image_url: f.image_url?.trim() || null,
        desktop_image_url: f.desktop_image_url?.trim() || null,
        discount_percent: Number(f.discount_percent || 0),
        active: !!f.active,
        meta_title: f.meta_title?.trim() || null,
        short_description: f.short_description?.trim() || null
      };

      if (isEdit) await adminApi.put(A.comboById(id), payload);
      else await adminApi.post(A.combos(), payload);
      navigate('/admin/catalog/combos');
    } catch (err) {
      console.error('Combo save error:', err);
      console.error('Error data:', err?.data);
      console.error('Error status:', err?.status);
      console.error('Error details:', err?.data?.details);
      setState((s) => ({ ...s, error: err }));
    }
  };

  if (state.status === 'loading') return <div>Loading…</div>;
  if (state.status === 'failed') return <div className="text-red-600">{state.error?.message || 'Failed to load'}</div>;

  // Show save error if any
  if (state.error && state.error !== 'Failed to load') {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Error</h2>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800 font-semibold mb-2">
            {state.error?.data?.error || 'Save Failed'}
          </div>
          <div className="text-red-700 text-sm mb-2">
            {state.error?.data?.message || state.error?.message}
          </div>
          {state.error?.data?.details && (
            <div className="mt-3">
              <div className="text-red-800 font-medium text-sm mb-1">Validation Details:</div>
              <ul className="text-red-700 text-sm list-disc list-inside">
                {state.error.data.details.map((detail, idx) => (
                  <li key={idx}>
                    <strong>{detail.field}:</strong> {detail.message}
                    {detail.value !== undefined && (
                      <span className="text-red-600 ml-1">(value: {JSON.stringify(detail.value)})</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={() => setState((s) => ({ ...s, error: null }))}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  const f = state.form;
  const list = state.attractions || [];

  // Helper functions
  const generateTimeSlots = (attractionCount) => {
    const slots = [];
    const startHour = 10; // 10:00 AM
    const endHour = 20;   // 8:00 PM
    const slotDuration = attractionCount; // hours per slot

    for (let hour = startHour; hour + slotDuration <= endHour; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + slotDuration).toString().padStart(2, '0')}:00`;

      slots.push({
        start_date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD
        end_date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD
        start_time: startTime,
        end_time: endTime,
        capacity: 10, // default capacity
        available: true
      });
    }

    return slots;
  };

  const addAttraction = () => {
    setState((s) => ({ ...s, form: { ...s.form, attraction_ids: [...s.form.attraction_ids, ''] } }));
  };

  const removeAttraction = (index) => {
    const newIds = state.form.attraction_ids.filter((_, i) => i !== index);
    const newPrices = { ...state.form.attraction_prices };
    delete newPrices[state.form.attraction_ids[index]];
    setState((s) => ({
      ...s,
      form: {
        ...s.form,
        attraction_ids: newIds,
        attraction_prices: newPrices
      }
    }));
    calculateTotalPrice(newIds, newPrices);
  };

  const updateAttraction = (index, value) => {
    const oldId = state.form.attraction_ids[index];
    const newIds = [...state.form.attraction_ids];
    newIds[index] = value;

    const newPrices = { ...state.form.attraction_prices };
    if (oldId && oldId !== value) {
      delete newPrices[oldId];
    }
    if (value && !newPrices[value]) {
      const attraction = state.attractions.find(a => a.attraction_id === value);
      newPrices[value] = attraction?.price || 0;
    }

    setState((s) => ({
      ...s,
      form: {
        ...s.form,
        attraction_ids: newIds,
        attraction_prices: newPrices
      }
    }));
    calculateTotalPrice(newIds, newPrices);
  };

  const updateAttractionPrice = (attractionId, price) => {
    const newPrices = { ...state.form.attraction_prices, [attractionId]: Number(price || 0) };
    setState((s) => ({ ...s, form: { ...s.form, attraction_prices: newPrices } }));
    calculateTotalPrice(state.form.attraction_ids, newPrices);
  };

  const calculateTotalPrice = (attractionIds, attractionPrices) => {
    const total = attractionIds.reduce((sum, id) => {
      return sum + (Number(attractionPrices[id]) || 0);
    }, 0);
    setState((s) => ({ ...s, form: { ...s.form, total_price: total } }));
  };

  const getSelectedAttractions = () => {
    return state.form.attraction_ids
      .filter(id => id && id !== '')
      .map(id => state.attractions.find(a => a.attraction_id === id))
      .filter(Boolean);
  };

  return (
    <form onSubmit={save} className="max-w-4xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl p-4">
      <h1 className="text-xl font-semibold mb-4">{isEdit ? 'Edit' : 'New'} Combo</h1>

      {/* Combo Name */}
      <div className="mb-4">
        <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Combo Name *</label>
        <input
          type="text"
          className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200"
          value={f.name}
          onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, name: e.target.value } }))}
          placeholder="Enter combo name"
          required
        />
      </div>

      {/* Combo Slug */}
      <div className="mb-4">
        <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Slug (URL-friendly identifier)</label>
        <input
          type="text"
          className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200"
          value={f.slug}
          onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, slug: e.target.value } }))}
          placeholder="auto-generated-from-name"
        />
        <div className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
          Leave empty to auto-generate from name. Used in URLs like /combo-your-slug-here
        </div>
      </div>

      {/* Short Description */}
      <div className="mb-4">
        <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Short Description (for lists/previews)</label>
        <textarea
          className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200"
          rows={2}
          value={f.short_description}
          onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, short_description: e.target.value } }))}
          placeholder="Brief summary of the combo"
        />
      </div>

      {/* Meta Title */}
      <div className="mb-4">
        <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Meta Title (SEO title)</label>
        <input
          type="text"
          className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200"
          value={f.meta_title}
          onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, meta_title: e.target.value } }))}
          placeholder="Custom page title for SEO (leave empty to use default)"
        />
        <div className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
          Optional custom title for search engines and browser tabs
        </div>
      </div>

      {/* Attractions Selection */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm text-gray-600 dark:text-neutral-300">Attractions *</label>
          <button
            type="button"
            onClick={addAttraction}
            className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700"
          >
            + Add Attraction
          </button>
        </div>

        {f.attraction_ids.length === 0 && (
          <div className="text-gray-500 text-sm mb-2">No attractions selected. Add at least 2 attractions.</div>
        )}

        {f.attraction_ids.map((attractionId, index) => (
          <div key={index} className="flex gap-2 mb-2">
            <select
              className="flex-1 rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200"
              value={attractionId}
              onChange={(e) => updateAttraction(index, e.target.value)}
            >
              <option value="">— Select attraction —</option>
              {list.map((a) => (
                <option
                  key={a.attraction_id}
                  value={a.attraction_id}
                  disabled={f.attraction_ids.includes(String(a.attraction_id)) && String(a.attraction_id) !== attractionId}
                >
                  {a.title}
                </option>
              ))}
            </select>

            {attractionId && (
              <input
                type="number"
                className="w-32 rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200"
                value={f.attraction_prices[attractionId] || ''}
                onChange={(e) => updateAttractionPrice(attractionId, e.target.value)}
                placeholder="Price"
                min="0"
                step="0.01"
              />
            )}

            {f.attraction_ids.length > 2 && (
              <button
                type="button"
                onClick={() => removeAttraction(index)}
                className="px-2 py-1 text-red-600 border border-red-300 rounded-md hover:bg-red-50"
              >
                Remove
              </button>
            )}
          </div>
        ))}

        {f.attraction_ids.length > 0 && f.attraction_ids.length < 2 && (
          <div className="text-orange-600 text-sm mt-1">Please select at least 2 attractions</div>
        )}
      </div>

      {/* Total Price Display */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-neutral-800 rounded-md">
        <div className="text-sm text-gray-600 dark:text-neutral-300">Total Combo Price</div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white">₹{Number(f.total_price || 0).toFixed(2)}</div>
        {f.attraction_ids.length > 0 && (
          <div className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
            Based on {f.attraction_ids.length} attraction(s)
          </div>
        )}
      </div>

      {/* Image uploader */}
      <div className="mb-4">
        <ImageUploader
          label="Combo Image"
          value={f.image_url}
          onChange={(url) => setState((s) => ({ ...s, form: { ...s.form, image_url: url } }))}
          folder="combos"
        />
      </div>
      <div className="mb-4">
        <ImageUploader
          label="Desktop Image (optional)"
          value={f.desktop_image_url}
          onChange={(url) => setState((s) => ({ ...s, form: { ...s.form, desktop_image_url: url } }))}
          folder="combos"
        />
      </div>

      {/* Discount and Active */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Discount %</label>
          <input
            type="number"
            className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200"
            value={f.discount_percent}
            onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, discount_percent: Number(e.target.value || 0) } }))}
            min="0"
            max="100"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="active"
            type="checkbox"
            checked={!!f.active}
            onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, active: e.target.checked } }))}
          />
          <label htmlFor="active" className="text-sm text-gray-700 dark:text-neutral-200">Active</label>
        </div>
      </div>

      {/* Manual total price input */}
      <div className="mb-4">
        <label className="block text-sm text-gray-600 dark:text-neutral-300 mb-1">Override Total Price (optional)</label>
        <input
          type="number"
          className="w-full rounded-md border px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200"
          value={f.total_price}
          onChange={(e) => setState((s) => ({ ...s, form: { ...s.form, total_price: Number(e.target.value || 0) } }))}
          min="0"
          step="0.01"
        />
        <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">Automatically sums attraction prices; adjust if needed.</p>
      </div>

      <div className="mt-4 flex gap-2">
        <button type="submit" className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm">Save</button>
        {isEdit && (
          <button
            type="button"
            className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700"
            onClick={() => navigate(`/admin/catalog/combo-slots?combo_id=${id}`)}
          >
            View Slots
          </button>
        )}
        <button type="button" className="rounded-md border px-4 py-2 text-sm" onClick={() => navigate(-1)}>Cancel</button>
      </div>

      {state.error ? <div className="mt-2 text-sm text-red-600">{state.error?.message || 'Error'}</div> : null}
    </form>
  );
}