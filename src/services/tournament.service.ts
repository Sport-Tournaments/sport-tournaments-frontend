import { apiGet, apiPost, apiPatch, apiDelete, apiPut } from './api';
import { buildQueryString } from '@/utils/helpers';
import type {
  Tournament,
  CreateTournamentDto,
  UpdateTournamentDto,
  AdminUpdateTournamentDto,
  TournamentFilters,
  TournamentStatistics,
  ApiResponse,
  PaginatedResponse,
  AgeGroup,
} from '@/types';

const TOURNAMENTS_BASE = '/v1/tournaments';

// Get all tournaments with pagination and filters
export async function getTournaments(
  filters?: TournamentFilters
): Promise<PaginatedResponse<Tournament>> {
  const queryString = filters ? buildQueryString(filters as Record<string, unknown>) : '';
  return apiGet<PaginatedResponse<Tournament>>(
    `${TOURNAMENTS_BASE}${queryString ? `?${queryString}` : ''}`
  );
}

// Search tournaments with advanced filters
export async function searchTournaments(
  filters?: TournamentFilters
): Promise<PaginatedResponse<Tournament>> {
  const queryString = filters ? buildQueryString(filters as Record<string, unknown>) : '';
  return apiGet<PaginatedResponse<Tournament>>(
    `${TOURNAMENTS_BASE}/search${queryString ? `?${queryString}` : ''}`
  );
}

// Get featured tournaments
export async function getFeaturedTournaments(
  limit = 6
): Promise<ApiResponse<Tournament[]>> {
  return apiGet<ApiResponse<Tournament[]>>(`${TOURNAMENTS_BASE}/featured?limit=${limit}`);
}

// Get upcoming tournaments
export async function getUpcomingTournaments(
  limit = 6
): Promise<ApiResponse<Tournament[]>> {
  return apiGet<ApiResponse<Tournament[]>>(`${TOURNAMENTS_BASE}/upcoming?limit=${limit}`);
}

// Get tournaments created by current user
export async function getMyTournaments(): Promise<ApiResponse<Tournament[]>> {
  return apiGet<ApiResponse<Tournament[]>>(`${TOURNAMENTS_BASE}/my-tournaments`);
}

// Get tournament by ID
export async function getTournamentById(id: string): Promise<ApiResponse<Tournament>> {
  return apiGet<ApiResponse<Tournament>>(`${TOURNAMENTS_BASE}/${id}`);
}

// Create a new tournament
export async function createTournament(
  data: CreateTournamentDto
): Promise<ApiResponse<Tournament>> {
  return apiPost<ApiResponse<Tournament>>(TOURNAMENTS_BASE, data);
}

// Update tournament
export async function updateTournament(
  id: string,
  data: UpdateTournamentDto
): Promise<ApiResponse<Tournament>> {
  return apiPatch<ApiResponse<Tournament>>(`${TOURNAMENTS_BASE}/${id}`, data);
}

// Admin update tournament
export async function adminUpdateTournament(
  id: string,
  data: AdminUpdateTournamentDto
): Promise<ApiResponse<Tournament>> {
  return apiPatch<ApiResponse<Tournament>>(`${TOURNAMENTS_BASE}/${id}/admin`, data);
}

// Delete tournament
export async function deleteTournament(id: string): Promise<ApiResponse<void>> {
  return apiDelete<ApiResponse<void>>(`${TOURNAMENTS_BASE}/${id}`);
}

// Publish tournament
export async function publishTournament(id: string): Promise<ApiResponse<Tournament>> {
  return apiPost<ApiResponse<Tournament>>(`${TOURNAMENTS_BASE}/${id}/publish`);
}

// Cancel tournament
export async function cancelTournament(id: string): Promise<ApiResponse<Tournament>> {
  return apiPost<ApiResponse<Tournament>>(`${TOURNAMENTS_BASE}/${id}/cancel`);
}

// Start tournament
export async function startTournament(id: string): Promise<ApiResponse<Tournament>> {
  return apiPost<ApiResponse<Tournament>>(`${TOURNAMENTS_BASE}/${id}/start`);
}

// Complete tournament
export async function completeTournament(id: string): Promise<ApiResponse<Tournament>> {
  return apiPost<ApiResponse<Tournament>>(`${TOURNAMENTS_BASE}/${id}/complete`);
}

// Track regulations download
export async function trackRegulationsDownload(id: string): Promise<ApiResponse<void>> {
  return apiPost<ApiResponse<void>>(`${TOURNAMENTS_BASE}/${id}/download-regulations`);
}

// Get invitation code for private tournament
export async function getInvitationCode(
  id: string
): Promise<ApiResponse<{ code: string; expiresAt?: string }>> {
  const response = await apiGet<ApiResponse<{ invitationCode: string; expiresAt?: string }>>(
    `${TOURNAMENTS_BASE}/${id}/invitation-code`
  );
  // Transform backend response to match expected format
  return {
    ...response,
    data: response.data ? {
      code: response.data.invitationCode,
      expiresAt: response.data.expiresAt,
    } : undefined,
  };
}

// Regenerate invitation code
export async function regenerateInvitationCode(
  id: string,
  expiresInDays?: number
): Promise<ApiResponse<{ code: string; expiresAt?: string }>> {
  const response = await apiPost<ApiResponse<{ invitationCode: string; expiresAt?: string }>>(
    `${TOURNAMENTS_BASE}/${id}/regenerate-invitation-code`,
    { expiresInDays }
  );
  // Transform backend response to match expected format
  return {
    ...response,
    data: response.data ? {
      code: response.data.invitationCode,
      expiresAt: response.data.expiresAt,
    } : undefined,
  };
}

// Validate invitation code
export async function validateInvitationCode(
  code: string
): Promise<ApiResponse<{ valid: boolean; tournament?: Tournament }>> {
  return apiPost<ApiResponse<{ valid: boolean; tournament?: Tournament }>>(
    `${TOURNAMENTS_BASE}/validate-invitation-code`,
    { code }
  );
}

// Get tournament statistics (Admin only)
export async function getTournamentStatistics(): Promise<ApiResponse<TournamentStatistics>> {
  return apiGet<ApiResponse<TournamentStatistics>>(`${TOURNAMENTS_BASE}/statistics`);
}

// Update age groups for a tournament
export async function updateTournamentAgeGroups(
  id: string,
  ageGroups: Omit<AgeGroup, 'id'>[] | AgeGroup[]
): Promise<ApiResponse<AgeGroup[]>> {
  return apiPut<ApiResponse<AgeGroup[]>>(`${TOURNAMENTS_BASE}/${id}/age-groups`, { ageGroups });
}

export const tournamentService = {
  getTournaments,
  searchTournaments,
  getFeaturedTournaments,
  getUpcomingTournaments,
  getMyTournaments,
  getTournamentById,
  createTournament,
  updateTournament,
  adminUpdateTournament,
  deleteTournament,
  publishTournament,
  cancelTournament,
  startTournament,
  completeTournament,
  trackRegulationsDownload,
  getInvitationCode,
  regenerateInvitationCode,
  validateInvitationCode,
  getTournamentStatistics,
  updateTournamentAgeGroups,
};

export default tournamentService;
