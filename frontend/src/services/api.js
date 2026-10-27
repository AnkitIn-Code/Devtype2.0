// src/services/api.js

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export class ApiError extends Error {
  constructor(message, status = 0, validationErrors = [], raw = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.validationErrors = validationErrors;
    this.raw = raw;
  }
}

/**
 * Universal JSON fetcher for backend REST communication.
 * Automatically handles JSON serialization, Bearer token injection,
 * and standard DevType error envelopes.
 */
export async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // If token is present and not explicitly omitted, inject Authorization header
  const token = localStorage.getItem('devtype_auth_token');
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netErr) {
    throw new ApiError(
      'Unable to connect to DevType server. Please verify the backend is running.',
      0,
      [],
      netErr
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    // Backend returns ErrorResponse: { status, error, message, validationErrors }
    const message =
      data?.message ||
      data?.error ||
      `Request failed with status ${response.status}`;
    const validationErrors = Array.isArray(data?.validationErrors)
      ? data.validationErrors
      : [];

    throw new ApiError(message, response.status, validationErrors, data);
  }

  return data;
}
