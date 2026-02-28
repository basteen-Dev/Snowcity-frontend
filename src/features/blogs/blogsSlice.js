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
  async (params = { active: true, limit: 12, page: 1 }, { signal, rejectWithValue, getState }) => {
    const { blogs } = getState();
    // Cache check only if default params and already have data
    if (!params?.search && params?.page === 1 && isFresh(blogs.lastFetched) && blogs.items.length && !params?.force) {
      return {
        items: blogs.items,
        page: 1,
        hasMore: blogs.hasMore,
        totalCount: blogs.totalCount,
        totalPages: blogs.totalPages,
        fromCache: true
      };
    }
    try {
      const res = await api.get(endpoints.blogs.list(), { params, signal });

      // Robust extraction of items from various possible response structures
      let items = [];
      let meta = {};

      if (res?.data) {
        if (Array.isArray(res.data)) {
          items = res.data;
        } else if (res.data.items && Array.isArray(res.data.items)) {
          items = res.data.items;
        } else {
          // Fallback if data is the item itself or some other structure
          items = res.data ? [res.data] : [];
        }
        meta = res.meta || {};
      } else if (Array.isArray(res)) {
        items = res;
      }

      const payload = {
        items,
        page: params.page || 1,
        hasMore: meta.hasMore ?? (items.length >= (params.limit || 12)),
        totalCount: meta.totalCount || items.length,
        totalPages: meta.totalPages || 1,
        append: params.append || false
      };

      // Cache only if it's the main list
      if (!params?.search && params?.page === 1 && !params?.append) {
        saveSliceCache('blogs_v2', payload);
      }

      return payload;
    } catch (err) {
      return rejectWithValue(err);
    }
  }
);

const cached = loadSliceCache('blogs_v2');
const initialState = {
  items: cached?.items?.items || [],
  status: 'idle',
  error: null,
  lastFetched: cached?.lastFetched || null,
  currentPage: cached?.items?.page || 1,
  hasMore: cached?.items?.hasMore ?? true,
  totalCount: cached?.items?.totalCount || 0,
  totalPages: cached?.items?.totalPages || 0
};

const blogsSlice = createSlice({
  name: 'blogs',
  initialState,
  reducers: {
    clearBlogs: (state) => {
      state.items = [];
      state.currentPage = 1;
      state.hasMore = true;
      state.status = 'idle';
      state.error = null;
      state.totalCount = 0;
      state.totalPages = 0;
    }
  },
  extraReducers: (b) => {
    b.addCase(fetchBlogs.pending, (s, a) => {
      s.status = 'loading';
      s.error = null;
    });
    b.addCase(fetchBlogs.fulfilled, (s, a) => {
      s.status = 'succeeded';
      const { items, page, hasMore, totalCount, totalPages, fromCache, append } = a.payload;
      if (fromCache) {
        return;
      }
      if (append) {
        s.items = [...s.items, ...items];
      } else {
        s.items = items;
      }
      s.currentPage = page;
      s.hasMore = hasMore;
      s.totalCount = totalCount;
      s.totalPages = totalPages;
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