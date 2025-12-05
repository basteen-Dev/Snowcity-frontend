import axios from 'axios';

const ADMIN_API_BASE_URL =
  import.meta.env?.VITE_ADMIN_API_BASE_URL ||
  import.meta.env?.VITE_API_BASE_URL ||
  '';

const httpAdmin = axios.create({
  baseURL: ADMIN_API_BASE_URL,
  timeout: 20000,
  withCredentials: false,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
});

let adminToken = null;
let handlers = { getToken: () => adminToken, onUnauthorized: null };

export function adminSetAuthToken(token) { adminToken = token || null; }
export function adminSetAuthHandlers({ getToken, onUnauthorized } = {}) {
  if (typeof getToken === 'function') handlers.getToken = getToken;
  if (typeof onUnauthorized === 'function') handlers.onUnauthorized = onUnauthorized;
}

const isTransient = (err) => {
  const code = err?.code; const status = err?.response?.status;
  return !status && (code === 'ECONNABORTED' || code === 'ERR_NETWORK' || code === 'ENETUNREACH' || code === 'EAI_AGAIN');
};
const normalizeErr = (error) => {
  const res = error?.response;
  const data = res?.data; const status = res?.status || 0;
  const message = data?.message || data?.error || error?.message || 'Request failed';
  const code = data?.code || res?.headers?.['x-error-code'] || error?.code || null;
  const out = { message, status, code, data: typeof data === 'object' ? data : null };
  if (import.meta.env?.DEV) out.debug = String(error?.message || '');
  return out;
};

httpAdmin.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  const token = (handlers.getToken && handlers.getToken()) || adminToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
httpAdmin.interceptors.response.use(
  (res) => res,
  async (error) => {
    const cfg = error?.config || {};
    const status = error?.response?.status;
    if (cfg.method === 'get' && !cfg._retry && isTransient(error)) {
      cfg._retry = true;
      try { return await httpAdmin(cfg); } catch (e) { error = e; }
    }
    if (status === 401 && typeof handlers.onUnauthorized === 'function') {
      try { await handlers.onUnauthorized(); } catch {}
    }
    return Promise.reject(normalizeErr(error));
  }
);

const adminApi = {
  async get(url, config = {}) {
    const { fullResponse = false, ...axiosConfig } = config;
    const res = await httpAdmin.get(url, axiosConfig);
    return fullResponse ? res : res.data;
  },
  async post(url, body, config = {}) {
    const { fullResponse = false, ...axiosConfig } = config;
    const res = await httpAdmin.post(url, body, axiosConfig);
    return fullResponse ? res : res.data;
  },
  async put(url, body, config = {}) {
    const { fullResponse = false, ...axiosConfig } = config;
    const res = await httpAdmin.put(url, body, axiosConfig);
    return fullResponse ? res : res.data;
  },
  async patch(url, body, config = {}) {
    const { fullResponse = false, ...axiosConfig } = config;
    const res = await httpAdmin.patch(url, body, axiosConfig);
    return fullResponse ? res : res.data;
  },
  async delete(url, config = {}) {
    const { fullResponse = false, ...axiosConfig } = config;
    const res = await httpAdmin.delete(url, axiosConfig);
    return fullResponse ? res : res.data;
  },
  async upload(url, file, extra = {}) {
    const fd = new FormData();
    fd.append('file', file);
    Object.entries(extra).forEach(([k, v]) => fd.append(k, v));
    const res = await httpAdmin.post(url, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  }
};

export { httpAdmin, adminApi };
export default adminApi;