import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/apiClient';

const toErr = (e) =>
  e && typeof e === 'object'
    ? { message: e.message || 'Failed to load SEO settings', status: e.status || 0, code: e.code || null, data: e.data || null }
    : { message: String(e || 'Failed to load SEO settings') };

/**
 * fetchPageSeo — Public: returns all page_seo entries from the database.
 * Used for dynamic slug-based SEO overrides on the frontend.
 */
export const fetchPageSeo = createAsyncThunk(
  'seo/fetchPageSeo',
  async (_, { signal, rejectWithValue }) => {
    try {
      const res = await api.get('/api/site-settings/page-seo', { signal });
      return Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

const initialState = {
  items: [],
  status: 'idle',
  error: null,
  lastFetched: null
};

const seoSlice = createSlice({
  name: 'seo',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPageSeo.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchPageSeo.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload || [];
        state.lastFetched = Date.now();
      })
      .addCase(fetchPageSeo.rejected, (state, action) => {
        state.status = 'failed';
        state.error = toErr(action.payload || action.error);
      });
  }
});

export default seoSlice.reducer;
