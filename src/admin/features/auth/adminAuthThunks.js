import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../services/apiClient';
import endpoints from '../../../services/endpoints';
import adminApi from '../../services/adminApi';
import { setAdminCredentials, setAdminProfile, adminLogout } from './adminAuthSlice';

/**
 * Login thunk: authenticate, then fetch /me to get roles, perms, scopes.
 */
export const adminLogin = createAsyncThunk('adminAuth/adminLogin',
  async ({ email, password }, { dispatch, rejectWithValue }) => {
    try {
      const res = await api.post(endpoints.auth.login(), { email, password, isAdmin: true });
      const token = res?.token;
      if (!token) throw new Error('No token from login');

      dispatch(setAdminCredentials({
        user: { ...res?.user, isAdmin: true },
        token,
        expires_at: res?.expires_at || null,
      }));

      // Fetch full profile (roles, perms, scopes)
      await dispatch(adminHydratePermissions()).unwrap();
      return res;
    } catch (err) {
      dispatch(adminLogout());
      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Login failed';
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Hydrate roles, permissions, and scopes from /api/admin/admins/me
 */
export const adminHydratePermissions = createAsyncThunk('adminAuth/hydratePerms',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      // Call the /me endpoint which returns roles, perms, and scopes
      const profile = await adminApi.get('/api/admin/admins/me');

      // Normalize
      const roles = Array.isArray(profile?.roles) ? profile.roles : [];
      const perms = Array.isArray(profile?.perms) ? profile.perms : [];
      const scopes = profile?.scopes || null;
      const is_super_admin = Boolean(profile?.is_super_admin);

      dispatch(setAdminProfile({ roles, perms, scopes, is_super_admin }));
      return { roles, perms, scopes, is_super_admin };
    } catch (err) {
      // If /me fails (e.g. old backend), fall back to granting basic access
      console.warn('adminHydratePermissions: /me failed, using fallback', err?.message);
      dispatch(setAdminProfile({ roles: [], perms: ['all'], scopes: null, is_super_admin: false }));
      return { roles: [], perms: ['all'], scopes: null, is_super_admin: false };
    }
  }
);