import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from './api';
import { buildQueryString } from '@/utils/helpers';
import type {
  User,
  UpdateUserDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
  AdminActionDto,
  PlatformStatistics,
  AuditLogEntry,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

// Users
const USERS_BASE = '/v1/users';

export async function getUserProfile(): Promise<ApiResponse<User>> {
  return apiGet<ApiResponse<User>>(`${USERS_BASE}/profile`);
}

export async function updateUserProfile(data: UpdateUserDto): Promise<ApiResponse<User>> {
  return apiPatch<ApiResponse<User>>(`${USERS_BASE}/profile`, data);
}

export async function getUsers(filters?: {
  page?: number;
  pageSize?: number;
  role?: string;
  country?: string;
  isActive?: boolean;
  isVerified?: boolean;
  search?: string;
}): Promise<PaginatedResponse<User>> {
  const queryString = filters ? buildQueryString(filters as Record<string, unknown>) : '';
  return apiGet<PaginatedResponse<User>>(
    `${USERS_BASE}${queryString ? `?${queryString}` : ''}`
  );
}

export async function getUserById(id: string): Promise<ApiResponse<User>> {
  return apiGet<ApiResponse<User>>(`${USERS_BASE}/${id}`);
}

export async function deleteUser(id: string): Promise<ApiResponse<void>> {
  return apiDelete<ApiResponse<void>>(`${USERS_BASE}/${id}`);
}

export async function activateUser(id: string): Promise<ApiResponse<User>> {
  return apiPatch<ApiResponse<User>>(`${USERS_BASE}/${id}/activate`);
}

export async function deactivateUser(id: string): Promise<ApiResponse<User>> {
  return apiPatch<ApiResponse<User>>(`${USERS_BASE}/${id}/deactivate`);
}

export async function getUserStatistics(): Promise<ApiResponse<Record<string, unknown>>> {
  return apiGet<ApiResponse<Record<string, unknown>>>(`${USERS_BASE}/statistics`);
}

// Admin
const ADMIN_BASE = '/v1/admin';

export async function getPlatformStatistics(): Promise<ApiResponse<PlatformStatistics>> {
  return apiGet<ApiResponse<PlatformStatistics>>(`${ADMIN_BASE}/statistics`);
}

export async function getAdminUsers(filters?: {
  search?: string;
  role?: string;
  isActive?: boolean;
  isVerified?: boolean;
  country?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<User>> {
  const queryString = filters ? buildQueryString(filters as Record<string, unknown>) : '';
  return apiGet<PaginatedResponse<User>>(
    `${ADMIN_BASE}/users${queryString ? `?${queryString}` : ''}`
  );
}

export async function getAdminUserDetails(id: string): Promise<ApiResponse<User>> {
  return apiGet<ApiResponse<User>>(`${ADMIN_BASE}/users/${id}`);
}

export async function deactivateAdminUser(
  id: string,
  data: AdminActionDto
): Promise<ApiResponse<void>> {
  return apiDelete<ApiResponse<void>>(`${ADMIN_BASE}/users/${id}`);
}

export async function updateUserRole(
  id: string,
  data: UpdateUserRoleDto
): Promise<ApiResponse<User>> {
  return apiPut<ApiResponse<User>>(`${ADMIN_BASE}/users/${id}/role`, data);
}

export async function updateUserStatus(
  id: string,
  data: UpdateUserStatusDto
): Promise<ApiResponse<User>> {
  return apiPut<ApiResponse<User>>(`${ADMIN_BASE}/users/${id}/status`, data);
}

export async function getAdminTournaments(filters?: {
  search?: string;
  status?: string;
  organizerId?: string;
  country?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<unknown>> {
  const queryString = filters ? buildQueryString(filters as Record<string, unknown>) : '';
  return apiGet<PaginatedResponse<unknown>>(
    `${ADMIN_BASE}/tournaments${queryString ? `?${queryString}` : ''}`
  );
}

export async function forceCancelTournament(
  id: string,
  data: AdminActionDto
): Promise<ApiResponse<void>> {
  return apiPost<ApiResponse<void>>(`${ADMIN_BASE}/tournaments/${id}/cancel`, data);
}

export async function featureTournament(id: string, featured: boolean): Promise<ApiResponse<void>> {
  return apiPut<ApiResponse<void>>(`${ADMIN_BASE}/tournaments/${id}/feature`, { featured });
}

export async function getAdminPayments(filters?: {
  status?: string;
  tournamentId?: string;
  userId?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<unknown>> {
  const queryString = filters ? buildQueryString(filters as Record<string, unknown>) : '';
  return apiGet<PaginatedResponse<unknown>>(
    `${ADMIN_BASE}/payments${queryString ? `?${queryString}` : ''}`
  );
}

export async function getPaymentReport(
  startDate: string,
  endDate: string
): Promise<ApiResponse<unknown>> {
  return apiGet<ApiResponse<unknown>>(
    `${ADMIN_BASE}/payments/report?startDate=${startDate}&endDate=${endDate}`
  );
}

export async function sendBroadcastNotification(
  data: Record<string, unknown>
): Promise<ApiResponse<void>> {
  return apiPost<ApiResponse<void>>(`${ADMIN_BASE}/notifications/broadcast`, data);
}

export async function getAuditLog(
  page: number,
  limit: number
): Promise<PaginatedResponse<AuditLogEntry>> {
  return apiGet<PaginatedResponse<AuditLogEntry>>(
    `${ADMIN_BASE}/audit-log?page=${page}&limit=${limit}`
  );
}

export const userService = {
  getUserProfile,
  updateUserProfile,
  getUsers,
  getUserById,
  deleteUser,
  activateUser,
  deactivateUser,
  getUserStatistics,
};

export const adminService = {
  getPlatformStatistics,
  getAdminUsers,
  getAdminUserDetails,
  deactivateAdminUser,
  updateUserRole,
  updateUserStatus,
  getAdminTournaments,
  forceCancelTournament,
  featureTournament,
  getAdminPayments,
  getPaymentReport,
  sendBroadcastNotification,
  getAuditLog,
};

export default { userService, adminService };
