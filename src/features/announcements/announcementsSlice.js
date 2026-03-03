import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/apiClient';
import endpoints from '../../services/endpoints';
import { loadSliceCache, saveSliceCache, isFresh } from '../../utils/sliceCache';

const toErr = (e) =>
    e && typeof e === 'object'
        ? { message: e.message || 'Failed to load announcements', status: e.status || 0, code: e.code || null, data: e.data || null }
        : { message: String(e || 'Failed to load announcements') };

export const fetchActiveAnnouncements = createAsyncThunk(
    'announcements/fetchActive',
    async (_, { signal, rejectWithValue, getState }) => {
        const { announcements } = getState();
        if (isFresh(announcements.lastFetched) && announcements.items.length) {
            return announcements.items;
        }
        try {
            const res = await api.get(endpoints.announcements.active(), { signal });
            const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
            saveSliceCache('announcements', list);
            return list;
        } catch (err) {
            return rejectWithValue(err);
        }
    }
);

const cached = loadSliceCache('announcements');
const initialState = {
    items: cached?.items || [],
    status: 'idle',
    error: null,
    lastFetched: cached?.lastFetched || null
};

const announcementsSlice = createSlice({
    name: 'announcements',
    initialState,
    reducers: {},
    extraReducers: (b) => {
        b.addCase(fetchActiveAnnouncements.pending, (s) => { s.status = 'loading'; s.error = null; });
        b.addCase(fetchActiveAnnouncements.fulfilled, (s, a) => { s.status = 'succeeded'; s.items = a.payload || []; s.lastFetched = Date.now(); });
        b.addCase(fetchActiveAnnouncements.rejected, (s, a) => { s.status = 'failed'; s.error = toErr(a.payload || a.error); });
    }
});

export default announcementsSlice.reducer;
