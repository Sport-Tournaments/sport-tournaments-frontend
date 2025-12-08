import api from './api';
import { User, Tournament, Club, PaginatedResponse, QueryParams } from '@/types';

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

export const adminService = {
  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },

  // Users
  getUsers: async (params?: QueryParams): Promise<PaginatedResponse<User>> => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  getUser: async (id: string): Promise<User> => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await api.patch(`/admin/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/admin/users/${id}`);
  },

  // Clubs
  verifyClub: async (id: string): Promise<Club> => {
    const response = await api.post(`/admin/clubs/${id}/verify`);
    return response.data;
  },

  unverifyClub: async (id: string): Promise<Club> => {
    const response = await api.post(`/admin/clubs/${id}/unverify`);
    return response.data;
  },

  // Tournaments
  featureTournament: async (id: string, featured: boolean): Promise<Tournament> => {
    const response = await api.patch(`/admin/tournaments/${id}`, { featured });
    return response.data;
  },

  // Settings
  getSettings: async (): Promise<Record<string, any>> => {
    const response = await api.get('/admin/settings');
    return response.data;
  },

  updateSettings: async (settings: Record<string, any>): Promise<void> => {
    await api.put('/admin/settings', settings);
  },

  // Reports
  getReports: async (type: string, params?: QueryParams): Promise<any> => {
    const response = await api.get(`/admin/reports/${type}`, { params });
    return response.data;
  },

  // System
  clearCache: async (): Promise<void> => {
    await api.post('/admin/system/clear-cache');
  },

  exportData: async (type: string): Promise<Blob> => {
    const response = await api.get(`/admin/system/export/${type}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Audit logs
  getAuditLogs: async (params?: QueryParams): Promise<PaginatedResponse<any>> => {
    const response = await api.get('/admin/audit-logs', { params });
    return response.data;
  },
};
