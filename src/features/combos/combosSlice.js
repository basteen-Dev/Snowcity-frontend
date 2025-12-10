import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/apiClient';
import endpoints from '../../services/endpoints';

const toErr = (e) =>
  e && typeof e === 'object'
    ? {
        message: e.message || 'Failed to load combos',
        status: e.status || 0,
        code: e.code || null,
        data: e.data || null
      }
    : { message: String(e || 'Failed to load combos') };

const pickList = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.results)) return res.results;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
};

export const fetchCombos = createAsyncThunk(
  'combos/fetchCombos',
  async (params = { active: true, page: 1, limit: 12 }, { signal, rejectWithValue }) => {
    try {
      const res = await api.get(endpoints.combos.list(), { params, signal });
      const items = pickList(res);
      const meta = res?.meta || res?.data?.meta || null;
      return { items, meta };
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

const combosSlice = createSlice({
  name: 'combos',
  initialState: { items: [], status: 'idle', error: null, lastFetched: null, meta: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchCombos.pending, (s) => {
      s.status = 'loading';
      s.error = null;
    });
    b.addCase(fetchCombos.fulfilled, (s, a) => {
      s.status = 'succeeded';
      s.items = a.payload?.items || [];
      s.meta = a.payload?.meta || null;
      s.lastFetched = Date.now();
    });
    b.addCase(fetchCombos.rejected, (s, a) => {
      s.status = 'failed';
      s.error = toErr(a.payload || a.error);
    });
  }
});

export default combosSlice.reducer;