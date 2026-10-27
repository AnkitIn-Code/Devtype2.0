// src/services/adminService.js
import { apiFetch } from './api';

export const adminService = {
  /**
   * Fetch platform aggregate statistics.
   */
  async getOverview() {
    const res = await apiFetch('/api/v1/admin/overview');
    return res.data;
  },

  /**
   * Paginated user list with search and filters.
   */
  async getUsers({ page = 0, size = 15, search = '', status = '', role = '', accountType = '' } = {}) {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('size', size);
    if (search.trim()) params.set('search', search.trim());
    if (status) params.set('status', status);
    if (role) params.set('role', role);
    if (accountType) params.set('accountType', accountType);

    const res = await apiFetch(`/api/v1/admin/users?${params.toString()}`);
    return res.data;
  },

  /**
   * Get single user details and aggregated performance stats.
   */
  async getUserDetail(userId) {
    const res = await apiFetch(`/api/v1/admin/users/${userId}`);
    return res.data;
  },

  /**
   * Suspend or reactivate user account with mandatory reason.
   */
  async updateUserStatus(userId, { status, reason }) {
    const res = await apiFetch(`/api/v1/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
    return res.data;
  },

  /**
   * Promote or demote user role with mandatory reason.
   */
  async updateUserRole(userId, { role, reason }) {
    const res = await apiFetch(`/api/v1/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role, reason }),
    });
    return res.data;
  },

  /**
   * List platform abuse reports with optional status and category filters.
   */
  async getReports({ page = 0, size = 15, status = '', category = '' } = {}) {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('size', size);
    if (status) params.set('status', status);
    if (category) params.set('category', category);

    const res = await apiFetch(`/api/v1/admin/reports?${params.toString()}`);
    return res.data;
  },

  async getReport(reportId) {
    const res = await apiFetch(`/api/v1/admin/reports/${reportId}`);
    return res.data;
  },

  /**
   * Review a moderation abuse report.
   */
  async reviewReport(reportId, { status, resolutionNote }) {
    const res = await apiFetch(`/api/v1/admin/reports/${reportId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, resolutionNote }),
    });
    return res.data;
  },

  /**
   * Read-only administrative audit log feed.
   */
  async getAuditLogs({ page = 0, size = 20, actionType = '', targetType = '', adminUserId = '' } = {}) {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('size', size);
    if (actionType) params.set('actionType', actionType);
    if (targetType) params.set('targetType', targetType);
    if (adminUserId) params.set('adminUserId', adminUserId);

    const res = await apiFetch(`/api/v1/admin/audit-logs?${params.toString()}`);
    return res.data;
  },

  /**
   * Submit an abuse report as an authenticated user.
   */
  async submitReport({ reportedUserId, category, description }) {
    const res = await apiFetch('/api/v1/reports', {
      method: 'POST',
      body: JSON.stringify({ reportedUserId, category, description }),
    });
    return res.data;
  },

  /**
   * Fetch live production metrics summary (health, JVM, memory, threads, HTTP, DB pool, auth).
   */
  async getMetricsSummary() {
    const res = await apiFetch('/api/v1/admin/metrics/summary');
    return res.data;
  },

  /**
   * Fetch timeseries configuration / metadata info.
   */
  async getMetricsTimeseries() {
    const res = await apiFetch('/api/v1/admin/metrics/timeseries');
    return res.data;
  },
};
