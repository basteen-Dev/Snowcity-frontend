import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/apiClient';
import endpoints from '../../services/endpoints';
import { loadSliceCache, saveSliceCache, isFresh } from '../../utils/sliceCache';

const toErr = (e) =>
  e && typeof e === 'object'
    ? { message: e.message || 'Failed to load blogs', status: e.status || 0, code: e.code || null, data: e.data || null }
    : { message: String(e || 'Failed to load blogs') };

export const fetchBlogs = createAsyncThunk(
  'blogs/fetchBlogs',
  async (params = { active: true, limit: 3, page: 1 }, { signal, rejectWithValue, getState }) => {
    const { blogs } = getState();
    // Cache check only if default params and already have data
    if (!params?.search && params?.page === 1 && isFresh(blogs.lastFetched) && blogs.items.length) {
      return { items: blogs.items, page: 1, hasMore: blogs.hasMore, fromCache: true };
    }
    try {
      const res = await api.get(endpoints.blogs.list(), { params, signal });
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : (res?.data && typeof res.data === 'object' && Array.isArray(res.data.data))
            ? res.data.data
            : [];

      const payload = { items: list, page: params.page || 1, hasMore: list.length >= (params.limit || 12) };

      // Cache only if it's the default main list fetch (page 1)
      if (!params?.search && params?.page === 1) {
        saveSliceCache('blogs', payload);
      }

      return payload;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

const cached = loadSliceCache('blogs');
const initialState = {
  items: cached?.items?.items || [],
  status: 'idle',
  error: null,
  lastFetched: cached?.lastFetched || null,
  currentPage: cached?.items?.page || 0,
  hasMore: cached?.items?.hasMore ?? true
};

const blogsSlice = createSlice({
  name: 'blogs',
  initialState,
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
      const { items, page, hasMore, fromCache } = a.payload;
      if (fromCache) {
        // Already loaded from initialState, but fulfilled to update status
        return;
      }
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