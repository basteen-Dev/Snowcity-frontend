import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/apiClient';
import endpoints from '../../services/endpoints';

const toErr = (e) =>
  e && typeof e === 'object'
    ? { message: e.message || 'Failed to load blogs', status: e.status || 0, code: e.code || null, data: e.data || null }
    : { message: String(e || 'Failed to load blogs') };

export const fetchBlogs = createAsyncThunk(
  'blogs/fetchBlogs',
  async (params = { active: true, limit: 3, page: 1 }, { signal, rejectWithValue }) => {
    try {
      const res = await api.get(endpoints.blogs.list(), { params, signal });
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : (res?.data && typeof res.data === 'object' && Array.isArray(res.data.data))
            ? res.data.data
            : [];
      return { items: list, page: params.page || 1, hasMore: list.length >= (params.limit || 12) };
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

const blogsSlice = createSlice({
  name: 'blogs',
  initialState: { items: [], status: 'idle', error: null, lastFetched: null, currentPage: 0, hasMore: true },
  reducers: {
    clearBlogs: (state) => {
      state.items = [];
      state.currentPage = 0;
      state.hasMore = true;
      state.status = 'idle';
      state.error = null;
    }
  },
  extraReducers: (b) => {
    b.addCase(fetchBlogs.pending, (s, a) => {
      s.status = 'loading';
      s.error = null;
    });
    b.addCase(fetchBlogs.fulfilled, (s, a) => {
      s.status = 'succeeded';
      const { items, page, hasMore } = a.payload;
      if (page === 1) {
        s.items = items;
      } else {
        s.items = [...s.items, ...items];
      }
      s.currentPage = page;
      s.hasMore = hasMore;
      s.lastFetched = Date.now();
    });
    b.addCase(fetchBlogs.rejected, (s, a) => {
      s.status = 'failed';
      s.error = toErr(a.payload || a.error);
    });
  }
});

export const { clearBlogs } = blogsSlice.actions;
export default blogsSlice.reducer;