// src/services/authService.js
import { apiFetch } from './api';

const TOKEN_KEY = 'devtype_auth_token';
const USER_KEY = 'devtype_auth_user';

export const authService = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  getStoredUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setStoredUser(user) {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  },

  removeStoredUser() {
    localStorage.removeItem(USER_KEY);
  },

  /**
   * Registers a new user.
   * Backend endpoint: POST /api/v1/auth/register
   * Payload: { displayName, username, email, password }
   * Response: ApiResponse<AuthResponse>
   */
  async register({ displayName, username, email, password }) {
    const payload = {
      displayName: displayName.trim(),
      username: username.trim(),
      email: email.trim(),
      password,
    };

    const response = await apiFetch('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    // response is { success: true, message: "...", data: { accessToken, user, ... } }
    const authData = response?.data;
    if (authData?.accessToken) {
      this.setToken(authData.accessToken);
    }
    if (authData?.user) {
      this.setStoredUser(authData.user);
    }

    return authData;
  },

  /**
   * Authenticates user credentials.
   * Backend endpoint: POST /api/v1/auth/login
   * Payload: { usernameOrEmail, password }
   * Response: ApiResponse<AuthResponse>
   */
  async login({ usernameOrEmail, password }) {
    const payload = {
      usernameOrEmail: usernameOrEmail.trim(),
      password,
    };

    const response = await apiFetch('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const authData = response?.data;
    if (authData?.accessToken) {
      this.setToken(authData.accessToken);
    }
    if (authData?.user) {
      this.setStoredUser(authData.user);
    }

    return authData;
  },

  /**
   * Fetches the profile of the currently authenticated developer.
   * Backend endpoint: GET /api/v1/users/me
   */
  async getCurrentUser() {
    const response = await apiFetch('/api/v1/users/me', {
      method: 'GET',
    });

    const userProfile = response?.data;
    if (userProfile) {
      this.setStoredUser(userProfile);
    }
    return userProfile;
  },

  /**
   * Updates profile fields (e.g. displayName, avatarUrl) on the backend server.
   * Backend endpoint: PUT /api/v1/users/me
   */
  async updateProfile({ displayName, avatarUrl }) {
    const payload = {};
    if (displayName) payload.displayName = displayName.trim();
    if (avatarUrl) payload.avatarUrl = avatarUrl.trim();

    const response = await apiFetch('/api/v1/users/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    const updated = response?.data;
    if (updated) {
      this.setStoredUser(updated);
    }
    return updated;
  },

  /**
   * Clears all local auth tokens and state.
   */
  logout() {
    this.removeToken();
    this.removeStoredUser();
  },
};
