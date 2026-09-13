'use client';

import axios from 'axios';
import { apiUrl } from './config.js';

const TOKEN_KEY = 'crackers-admin-token';

/**
 * Admin API client.
 *
 * Entirely client-side and loaded only under /admin, so none of this - nor
 * axios itself - ends up in the bundle a customer downloads.
 *
 * The token lives in localStorage rather than an httpOnly cookie because the
 * storefront and the API are on different origins, where a cookie would need
 * SameSite=None plus CORS credentials. The trade-off is accepted knowingly:
 * the admin surface is small, tokens are short-lived, and every request is
 * re-authorised against a live account on the server.
 */
export function getToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export const client = axios.create({
  baseURL: apiUrl,
  timeout: 20000,
  headers: { Accept: 'application/json' },
});

client.interceptors.request.use((request) => {
  const token = getToken();
  if (token) request.headers.Authorization = `Bearer ${token}`;
  return request;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    // An expired or revoked token should drop the session immediately rather
    // than leaving the panel in a half-signed-in state.
    if (error.response?.status === 401) {
      setToken(null);
      if (typeof window !== 'undefined' && !window.location.pathname.endsWith('/admin')) {
        window.location.href = '/admin';
      }
    }
    return Promise.reject(error);
  },
);

/** Extract a message worth showing from an axios error. */
export function errorMessage(error, fallback = 'Something went wrong') {
  const data = error?.response?.data;
  if (data?.details?.length) {
    return data.details.map((d) => `${d.field.split('.').pop()}: ${d.message}`).join(', ');
  }
  return data?.message || error?.message || fallback;
}

// --- Auth -----------------------------------------------------------------

export async function login(email, password) {
  const { data } = await client.post('/auth/login', { email, password });
  setToken(data.token);
  return data.admin;
}

export async function fetchMe() {
  const { data } = await client.get('/auth/me');
  return data.admin;
}

export function logout() {
  setToken(null);
}

// --- Products -------------------------------------------------------------

export async function listAdminProducts(params = {}) {
  const { data } = await client.get('/products', {
    params: { ...params, includeInactive: true, limit: params.limit ?? 50 },
  });
  return data;
}

export async function getAdminProduct(id) {
  const { data } = await client.get(`/products/${id}`);
  return data.product;
}

export async function createProduct(payload) {
  const { data } = await client.post('/products', payload);
  return data.product;
}

export async function updateProduct(id, payload) {
  const { data } = await client.put(`/products/${id}`, payload);
  return data.product;
}

export async function deleteProduct(id) {
  await client.delete(`/products/${id}`);
}

/**
 * Download the price list.
 *
 * Fetched through the axios client rather than pointed at with a plain link,
 * because the endpoint is admin-only and a browser navigation would not carry
 * the Authorization header - it would just render a 401. The blob is saved via
 * a temporary object URL, and the filename is taken from the response so the
 * server stays the one deciding it.
 */
export async function downloadPriceListPdf({ includeInactive = false } = {}) {
  let data;
  let headers;

  try {
    ({ data, headers } = await client.get('/products/export/pdf', {
      params: includeInactive ? { includeInactive: true } : undefined,
      responseType: 'blob',
    }));
  } catch (error) {
    // responseType 'blob' applies to error bodies too, so the server's JSON
    // message arrives as a Blob and errorMessage would see nothing useful.
    // Re-reading it as text puts the real reason back on the error.
    const body = error?.response?.data;
    if (body instanceof Blob) {
      try {
        error.response.data = JSON.parse(await body.text());
      } catch {
        // Not JSON - leave the original error for the caller's fallback.
      }
    }
    throw error;
  }

  const match = /filename="([^"]+)"/.exec(headers['content-disposition'] ?? '');
  const filename = match?.[1] ?? 'price-list.pdf';

  const url = window.URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoked on the next tick: releasing it synchronously can cancel the
  // download in some browsers before it has started reading the blob.
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);

  return filename;
}

// --- Categories -----------------------------------------------------------

export async function listAdminCategories() {
  const { data } = await client.get('/categories');
  return data.categories;
}

export async function createCategory(payload) {
  const { data } = await client.post('/categories', payload);
  return data.category;
}

export async function updateCategory(id, payload) {
  const { data } = await client.put(`/categories/${id}`, payload);
  return data.category;
}

export async function deleteCategory(id) {
  await client.delete(`/categories/${id}`);
}

// --- Announcements (offers strip) -----------------------------------------

export async function listAdminAnnouncements() {
  const { data } = await client.get('/announcements');
  return data.announcements;
}

export async function createAnnouncement(payload) {
  const { data } = await client.post('/announcements', payload);
  return data.announcement;
}

export async function updateAnnouncement(id, payload) {
  const { data } = await client.put(`/announcements/${id}`, payload);
  return data.announcement;
}

export async function deleteAnnouncement(id) {
  await client.delete(`/announcements/${id}`);
}

export async function getStripSettings() {
  const { data } = await client.get('/announcements/settings');
  return data.settings;
}

export async function updateStripSettings(payload) {
  const { data } = await client.put('/announcements/settings', payload);
  return data.settings;
}

// --- Uploads --------------------------------------------------------------

export async function uploadImage(file, folder = 'products') {
  const form = new FormData();
  form.append('image', file);
  form.append('folder', folder);

  const { data } = await client.post('/uploads/image', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.image;
}

// --- Enquiries ------------------------------------------------------------

export async function listEnquiries(params = {}) {
  const { data } = await client.get('/order-enquiries', { params });
  return data;
}

export async function updateEnquiryStatus(id, status) {
  const { data } = await client.patch(`/order-enquiries/${id}/status`, { status });
  return data.enquiry;
}
