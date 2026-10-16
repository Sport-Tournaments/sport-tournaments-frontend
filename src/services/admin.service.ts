import api from './api';
import { User, Tournament, PaginatedResponse, QueryParams, PlatformStatistics } from '@/types';

export interface AdminActivityItem {
  type: 'user' | 'tournament' | 'registration';
  id: string;
  title: string;
  subtitle?: string;
  status?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalTournaments: number;
  totalClubs: number;
  totalRegistrations: number;
  pendingRegistrations: number;
  activeTournaments: number;
  ongoingTournaments?: number;
  recentUsers: number;
  newUsersThisWeek?: number;
  recentTournaments?: number;
  revenue: number;
  tournamentStatuses?: { status: string; count: number }[];
  topCountries?: { country: string; count: number }[];
  registrationTrend?: { month: string; count: number }[];
  recentActivity?: AdminActivityItem[];
}

/** Maps GET /admin/statistics ({ overview, distributions, trends, ... }) to DashboardStats. */
export function normalizeDashboardStats(payload: any): DashboardStats {
  const body = payload?.data?.overview ? payload.data : payload;
  const o = body?.overview ?? body ?? {};
  const num = (v: unknown) => Number(v) || 0;
  return {
    totalUsers: num(o.totalUsers),
    totalTournaments: num(o.totalTournaments),
    totalClubs: num(o.totalClubs),
    totalRegistrations: num(o.totalRegistrations),
    pendingRegistrations: num(o.pendingRegistrations),
    activeTournaments: num(o.activeTournaments),
    ongoingTournaments: num(o.ongoingTournaments),
    recentUsers: num(o.recentUsers),
    newUsersThisWeek: num(o.newUsersThisWeek),
    recentTournaments: num(o.recentTournaments),
    revenue: num(o.totalRevenue ?? o.revenue),
    tournamentStatuses: (body?.distributions?.tournamentStatuses ?? []).map((r: any) => ({
      status: String(r.status),
      count: num(r.count),
    })),
    topCountries: (body?.topCountries ?? [])
      .filter((r: any) => r.country)
      .map((r: any) => ({ country: String(r.country), count: num(r.count) })),
    registrationTrend: (body?.trends?.registrations ?? []).map((r: any) => ({
      month: String(r.month),
      count: num(r.count),
    })),
    recentActivity: Array.isArray(body?.recentActivity) ? body.recentActivity : [],
  };
}

const ADMIN_BASE = '/v1/admin';

export const adminService = {
  // Platform Statistics
  getPlatformStatistics: async (): Promise<PlatformStatistics> => {
    const response = await api.get<PlatformStatistics>(`${ADMIN_BASE}/statistics`);
    return response.data;
  },

  // Dashboard (alias for backward compatibility)
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get(`${ADMIN_BASE}/statistics`);
    return normalizeDashboardStats(response.data);
  },

  // Users
  getUsers: async (params?: QueryParams): Promise<PaginatedResponse<User>> => {
    const response = await api.get<PaginatedResponse<User>>(`${ADMIN_BASE}/users`, { params });
    return response.data;
  },

  getUser: async (id: string): Promise<User> => {
    const response = await api.get<User>(`${ADMIN_BASE}/users/${id}`);
    return response.data;
  },

  updateUserRole: async (id: string, role: string): Promise<User> => {
    const response = await api.put<User>(`${ADMIN_BASE}/users/${id}/role`, { role });
    return response.data;
  },

  updateUserStatus: async (id: string, data: { isActive?: boolean; isVerified?: boolean }): Promise<User> => {
    const response = await api.put<User>(`${ADMIN_BASE}/users/${id}/status`, data);
    return response.data;
  },

  deleteUser: async (id: string, reason?: string): Promise<void> => {
    await api.delete(`${ADMIN_BASE}/users/${id}`, { data: { reason } });
  },

  // Tournaments
  getTournaments: async (params?: QueryParams): Promise<PaginatedResponse<Tournament>> => {
    const response = await api.get<PaginatedResponse<Tournament>>(`${ADMIN_BASE}/tournaments`, { params });
    return response.data;
  },

  forceCancelTournament: async (id: string, reason?: string): Promise<Tournament> => {
    const response = await api.post<Tournament>(`${ADMIN_BASE}/tournaments/${id}/cancel`, { reason });
    return response.data;
  },

  featureTournament: async (id: string, featured: boolean): Promise<Tournament> => {
    const response = await api.put<Tournament>(`${ADMIN_BASE}/tournaments/${id}/feature`, { featured });
    return response.data;
  },

  // Payments
  getPayments: async (params?: QueryParams): Promise<PaginatedResponse<unknown>> => {
    const response = await api.get<PaginatedResponse<unknown>>(`${ADMIN_BASE}/payments`, { params });
    return response.data;
  },

  getPaymentReport: async (startDate: string, endDate: string): Promise<unknown> => {
    const response = await api.get<unknown>(`${ADMIN_BASE}/payments/report`, {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Notifications
  sendBroadcastNotification: async (title: string, message: string, targetRole?: string): Promise<void> => {
    await api.post(`${ADMIN_BASE}/notifications/broadcast`, { title, message, targetRole });
  },

  // Audit logs
  getAuditLog: async (page?: number, limit?: number): Promise<PaginatedResponse<unknown>> => {
    const response = await api.get<PaginatedResponse<unknown>>(`${ADMIN_BASE}/audit-log`, { params: { page, limit } });
    return response.data;
  },

  // Settings (stub - not yet implemented in backend)
  /** @todo Implement settings endpoint in backend */
  updateSettings: async (_settings: object): Promise<void> => {
    console.warn('adminService.updateSettings is not yet implemented in backend');
    // When implemented, uncomment:
    // await api.put(`${ADMIN_BASE}/settings`, settings);
  },

  // Legacy compatibility aliases (deprecated)
  /** @deprecated Use updateUserRole instead */
  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    console.warn('adminService.updateUser is deprecated, use updateUserRole or updateUserStatus');
    const response = await api.put<User>(`${ADMIN_BASE}/users/${id}/status`, data);
    return response.data;
  },
};
