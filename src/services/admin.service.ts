import api from './api';
import { User, Tournament, Club, PaginatedResponse, QueryParams, PlatformStatistics } from '@/types';

export interface DashboardStats {
  totalUsers: number;
  totalTournaments: number;
  totalClubs: number;
  totalRegistrations: number;
  pendingRegistrations: number;
  activeTournaments: number;
  recentUsers: number;
  revenue: number;
}

const ADMIN_BASE = '/v1/admin';

export const adminService = {
  // Platform Statistics
  getPlatformStatistics: async (): Promise<PlatformStatistics> => {
    const response = await api.get(`${ADMIN_BASE}/statistics`);
    return response.data;
  },

  // Dashboard (alias for backward compatibility)
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get(`${ADMIN_BASE}/statistics`);
    return response.data;
  },

  // Users
  getUsers: async (params?: QueryParams): Promise<PaginatedResponse<User>> => {
    const response = await api.get(`${ADMIN_BASE}/users`, { params });
    return response.data;
  },

  getUser: async (id: string): Promise<User> => {
    const response = await api.get(`${ADMIN_BASE}/users/${id}`);
    return response.data;
  },

  updateUserRole: async (id: string, role: string): Promise<User> => {
    const response = await api.put(`${ADMIN_BASE}/users/${id}/role`, { role });
    return response.data;
  },

  updateUserStatus: async (id: string, data: { isActive?: boolean; isVerified?: boolean }): Promise<User> => {
    const response = await api.put(`${ADMIN_BASE}/users/${id}/status`, data);
    return response.data;
  },

  deleteUser: async (id: string, reason?: string): Promise<void> => {
    await api.delete(`${ADMIN_BASE}/users/${id}`, { data: { reason } });
  },

  // Tournaments
  getTournaments: async (params?: QueryParams): Promise<PaginatedResponse<Tournament>> => {
    const response = await api.get(`${ADMIN_BASE}/tournaments`, { params });
    return response.data;
  },

  forceCancelTournament: async (id: string, reason?: string): Promise<Tournament> => {
    const response = await api.post(`${ADMIN_BASE}/tournaments/${id}/cancel`, { reason });
    return response.data;
  },

  featureTournament: async (id: string, featured: boolean): Promise<Tournament> => {
    const response = await api.put(`${ADMIN_BASE}/tournaments/${id}/feature`, { featured });
    return response.data;
  },

  // Payments
  getPayments: async (params?: QueryParams): Promise<PaginatedResponse<any>> => {
    const response = await api.get(`${ADMIN_BASE}/payments`, { params });
    return response.data;
  },

  getPaymentReport: async (startDate: string, endDate: string): Promise<any> => {
    const response = await api.get(`${ADMIN_BASE}/payments/report`, {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Notifications
  sendBroadcastNotification: async (title: string, message: string, targetRole?: string): Promise<void> => {
    await api.post(`${ADMIN_BASE}/notifications/broadcast`, { title, message, targetRole });
  },

  // Audit logs
  getAuditLog: async (page?: number, limit?: number): Promise<PaginatedResponse<any>> => {
    const response = await api.get(`${ADMIN_BASE}/audit-log`, { params: { page, limit } });
    return response.data;
  },

  // Settings (stub - not yet implemented in backend)
  /** @todo Implement settings endpoint in backend */
  updateSettings: async (settings: Record<string, any>): Promise<void> => {
    console.warn('adminService.updateSettings is not yet implemented in backend');
    // When implemented, uncomment:
    // await api.put(`${ADMIN_BASE}/settings`, settings);
  },

  // Legacy compatibility aliases (deprecated)
  /** @deprecated Use updateUserRole instead */
  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    console.warn('adminService.updateUser is deprecated, use updateUserRole or updateUserStatus');
    const response = await api.put(`${ADMIN_BASE}/users/${id}/status`, data);
    return response.data;
  },
};
