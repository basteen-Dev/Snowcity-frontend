import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/apiClient';
import endpoints from '../../services/endpoints';
import { loadSliceCache, saveSliceCache, isFresh } from '../../utils/sliceCache';

const toErr = (e) =>
  e && typeof e === 'object'
    ? { message: e.message || 'Failed to load attractions', status: e.status || 0, code: e.code || null, data: e.data || null }
    : { message: String(e || 'Failed to load attractions') };

export const fetchAttractions = createAsyncThunk(
  'attractions/fetchAttractions',
  async (params = { active: true, page: 1, limit: 12 }, { signal, rejectWithValue, getState }) => {
    const { attractions } = getState();
    // Cache check only if default params and already have data
    if (!params?.search && isFresh(attractions.lastFetched) && attractions.items.length) {
      return attractions.items;
    }
    try {
      const res = await api.get(endpoints.attractions.list(), { params, signal });
      const list = res?.data?.data || (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);

      // Cache only if it's the default main list fetch
      if (!params?.search && params?.page === 1) {
        saveSliceCache('attractions', list);
      }

      return list;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

const cached = loadSliceCache('attractions');
const initialState = {
  items: cached?.items || [],
  status: 'idle',
  error: null,
  lastFetched: cached?.lastFetched || null
};

const attractionsSlice = createSlice({
  name: 'attractions',
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchAttractions.pending, (s) => { s.status = 'loading'; s.error = null; });
    b.addCase(fetchAttractions.fulfilled, (s, a) => {
      s.status = 'succeeded';
      s.items = a.payload || [];
      s.lastFetched = Date.now();
    });
    b.addCase(fetchAttractions.rejected, (s, a) => { s.status = 'failed'; s.error = toErr(a.payload || a.error); });
  }
});

export default attractionsSlice.reducer;