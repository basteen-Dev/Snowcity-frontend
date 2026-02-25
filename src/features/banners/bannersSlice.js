import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/apiClient';
import endpoints from '../../services/endpoints';
import { loadSliceCache, saveSliceCache, isFresh } from '../../utils/sliceCache';

const toErr = (e) =>
  e && typeof e === 'object'
    ? { message: e.message || 'Failed to load banners', status: e.status || 0, code: e.code || null, data: e.data || null }
    : { message: String(e || 'Failed to load banners') };

export const fetchBanners = createAsyncThunk(
  'banners/fetchBanners',
  async (_, { signal, rejectWithValue, getState }) => {
    const { banners } = getState();
    if (isFresh(banners.lastFetched)) {
      return banners.items;
    }
    try {
      const res = await api.get(endpoints.banners.list(), { params: { active: true, page: 1, limit: 12 }, signal });
      const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      saveSliceCache('banners', items);
      return items;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

const cached = loadSliceCache('banners');
const initialState = {
  items: cached?.items || [],
  status: 'idle',
  error: null,
  lastFetched: cached?.lastFetched || null
};

const bannersSlice = createSlice({
  name: 'banners',
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchBanners.pending, (s) => { s.status = 'loading'; s.error = null; });
    b.addCase(fetchBanners.fulfilled, (s, a) => { s.status = 'succeeded'; s.items = a.payload || []; s.lastFetched = Date.now(); });
    b.addCase(fetchBanners.rejected, (s, a) => { s.status = 'failed'; s.error = toErr(a.payload || a.error); });
  }
});

export default bannersSlice.reducer;