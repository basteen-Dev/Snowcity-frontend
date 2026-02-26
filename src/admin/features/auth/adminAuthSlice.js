import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  token: null,
  expires_at: null,
  checked: false,
  perms: [],
  roles: [],
  scopes: null,         // { attraction: [...], combo: [...], module_permissions: [...] }
  isSuperAdmin: false,
};

const adminAuthSlice = createSlice({
  name: 'adminAuth',
  initialState,
  reducers: {
    setAdminCredentials(state, action) {
      const { user, token, expires_at } = action.payload || {};
      state.user = user || null;
      state.token = token || null;
      state.expires_at = expires_at || null;
      state.checked = true;
    },
    setAdminPermissions(state, action) {
      state.perms = Array.isArray(action.payload) ? action.payload : [];
    },
    setAdminProfile(state, action) {
      const { roles = [], perms = [], scopes = null, is_super_admin = false } = action.payload || {};
      state.roles = roles;
      state.perms = perms;
      state.scopes = scopes;
      state.isSuperAdmin = is_super_admin;
      // Also update user.roles so sidebar can read it
      if (state.user) {
        state.user = { ...state.user, roles };
      }
    },
    adminLogout(state) {
      state.user = null;
      state.token = null;
      state.expires_at = null;
      state.checked = true;
      state.perms = [];
      state.roles = [];
      state.scopes = null;
      state.isSuperAdmin = false;
    },
  },
});

export const { setAdminCredentials, setAdminPermissions, setAdminProfile, adminLogout } = adminAuthSlice.actions;
export default adminAuthSlice.reducer;