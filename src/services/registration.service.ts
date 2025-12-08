import { apiGet, apiPost, apiPatch, apiDelete } from './api';
import { buildQueryString } from '@/utils/helpers';
import type {
  Registration,
  CreateRegistrationDto,
  UpdateRegistrationDto,
  AdminUpdateRegistrationDto,
  RegistrationFilters,
  RegistrationStatistics,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

// Register a team for a tournament
export async function registerForTournament(
  tournamentId: string,
  data: CreateRegistrationDto
): Promise<ApiResponse<Registration>> {
  return apiPost<ApiResponse<Registration>>(
    `/v1/tournaments/${tournamentId}/register`,
    data
  );
}

// Get all registrations for a tournament
export async function getTournamentRegistrations(
  tournamentId: string,
  filters?: RegistrationFilters
): Promise<PaginatedResponse<Registration>> {
  const queryString = filters ? buildQueryString(filters as Record<string, unknown>) : '';
  return apiGet<PaginatedResponse<Registration>>(
    `/v1/tournaments/${tournamentId}/registrations${queryString ? `?${queryString}` : ''}`
  );
}

// Get registration statistics for a tournament
export async function getRegistrationStatistics(
  tournamentId: string
): Promise<ApiResponse<RegistrationStatistics>> {
  return apiGet<ApiResponse<RegistrationStatistics>>(
    `/v1/tournaments/${tournamentId}/registrations/status`
  );
}

// Get all registrations for current user's clubs
export async function getMyRegistrations(): Promise<ApiResponse<Registration[]>> {
  return apiGet<ApiResponse<Registration[]>>('/v1/registrations/my-registrations');
}

// Get registration by ID
export async function getRegistrationById(id: string): Promise<ApiResponse<Registration>> {
  return apiGet<ApiResponse<Registration>>(`/v1/registrations/${id}`);
}

// Update registration
export async function updateRegistration(
  id: string,
  data: UpdateRegistrationDto
): Promise<ApiResponse<Registration>> {
  return apiPatch<ApiResponse<Registration>>(`/v1/registrations/${id}`, data);
}

// Admin update registration
export async function adminUpdateRegistration(
  id: string,
  data: AdminUpdateRegistrationDto
): Promise<ApiResponse<Registration>> {
  return apiPatch<ApiResponse<Registration>>(`/v1/registrations/${id}/admin`, data);
}

// Delete registration
export async function deleteRegistration(id: string): Promise<ApiResponse<void>> {
  return apiDelete<ApiResponse<void>>(`/v1/registrations/${id}`);
}

// Approve registration
export async function approveRegistration(id: string): Promise<ApiResponse<Registration>> {
  return apiPost<ApiResponse<Registration>>(`/v1/registrations/${id}/approve`);
}

// Reject registration
export async function rejectRegistration(id: string): Promise<ApiResponse<Registration>> {
  return apiPost<ApiResponse<Registration>>(`/v1/registrations/${id}/reject`);
}

// Withdraw registration
export async function withdrawRegistration(id: string): Promise<ApiResponse<Registration>> {
  return apiPost<ApiResponse<Registration>>(`/v1/registrations/${id}/withdraw`);
}

export const registrationService = {
  registerForTournament,
  getTournamentRegistrations,
  getRegistrationStatistics,
  getMyRegistrations,
  getRegistrationById,
  updateRegistration,
  adminUpdateRegistration,
  deleteRegistration,
  approveRegistration,
  rejectRegistration,
  withdrawRegistration,
};

export default registrationService;
