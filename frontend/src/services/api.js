import axios from 'axios';

/**
 * Shared Axios instance.
 *
 * The backend authenticates via a `token` cookie (set on login), so there is
 * no Authorization header to attach — we only need `withCredentials` so the
 * browser sends the cookie. In development the Vite proxy makes `/api`
 * same-origin.
 *
 * 401 handling lives in the RTK Query layer (store/api.js), which dispatches
 * `sessionExpired` so the store — not a window event — owns sign-out.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 15000,
});

/** All controllers respond with `{ success, message, data }`; return `data`. */
export const unwrap = (response) => response.data?.data;

/** For controllers that support pagination metadata, returns `{ items, pagination }` when present, else `data`. */
export const unwrapWithPagination = (response) => {
  if (response.data?.pagination) {
    return {
      items: response.data.data || [],
      pagination: response.data.pagination,
    };
  }
  return response.data?.data;
};

/** Best-effort human readable error message from an Axios error. */
export function getErrorMessage(error) {
  return error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Something went wrong';
}

export default api;
