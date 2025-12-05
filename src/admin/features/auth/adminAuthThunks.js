import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../../services/apiClient';
import endpoints from '../../../services/endpoints';
import adminApi from '../../services/adminApi';
import A from '../../services/adminEndpoints';
import { setAdminCredentials, setAdminPermissions, adminLogout } from './adminAuthSlice';

export const adminLogin = createAsyncThunk('adminAuth/adminLogin',
  async ({ email, password }, { dispatch, rejectWithValue }) => {
    try {
      // Public login with admin flag
      const res = await api.post(endpoints.auth.login(), { email, password, isAdmin: true });
      const token = res?.token;
      if (!token) throw new Error('No token from login');

      // Set admin credentials
      dispatch(setAdminCredentials({ 
        user: { ...res?.user, isAdmin: true }, 
        token, 
        expires_at: res?.expires_at || null 
      }));

      // Since we removed all permission restrictions, skip admin access verification
      // All authenticated users now have admin access
      await dispatch(adminHydratePermissions()).unwrap();
      return res;
    } catch (err) {
      dispatch(adminLogout());
      // Return serializable error message instead of Error object
      const errorMessage = err?.response?.data?.error || 
                          err?.response?.data?.message || 
                          err?.message || 
                          'Login failed';
      return rejectWithValue(errorMessage);
    }
  }
);

// Simplified permissions hydration - all authenticated users get full access
export const adminHydratePermissions = createAsyncThunk('adminAuth/hydratePerms',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      // Since we removed all permission restrictions, grant full access to all authenticated users
      const perms = ['all']; // Single permission representing full access
      dispatch(setAdminPermissions(perms));
      return perms;
    } catch (err) {
      dispatch(setAdminPermissions([]));
      // Return serializable error message
      const errorMessage = err?.response?.data?.error || 
                          err?.response?.data?.message || 
                          err?.message || 
                          'Failed to hydrate permissions';
      return rejectWithValue(errorMessage);
    }
  }
);