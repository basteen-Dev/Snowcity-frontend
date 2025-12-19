import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/apiClient';
import endpoints from '../../services/endpoints';

const toErr = (e) =>
  e && typeof e === 'object'
    ? { message: e.message || 'Failed to load gallery', status: e.status || 0, code: e.code || null, data: e.data || null }
    : { message: String(e || 'Failed to load gallery') };

export const fetchGallery = createAsyncThunk(
  'gallery/fetchGallery',
  async (params = { active: true, limit: 50, page: 1 }, { signal, rejectWithValue }) => {
    try {
      const res = await api.get(endpoints.gallery.list(), { params, signal });
      // Handle both { data, meta } format and direct array format
      const items = res?.data?.data || (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
      return { items, params };
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

const gallerySlice = createSlice({
  name: 'gallery',
  initialState: { 
    items: [], 
    status: 'idle', 
    error: null, 
    lastFetched: null,
    filters: null 
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGallery.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchGallery.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items || [];
        state.filters = action.payload.params;
        state.lastFetched = Date.now();
      })
      .addCase(fetchGallery.rejected, (state, action) => {
        state.status = 'failed';
        state.error = toErr(action.payload || action.error);
      });
  }
});

export default gallerySlice.reducer;
