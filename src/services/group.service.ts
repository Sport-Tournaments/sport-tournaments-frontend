import { apiGet, apiPost, apiPatch, apiDelete } from './api';
import type {
  Group,
  Bracket,
  ExecuteDrawDto,
  CreateGroupDto,
  UpdateBracketDto,
  MatchesResponse,
  UpdateMatchAdvancementDto,
  UpdateMatchScoreDto,
  BracketMatch,
  ApiResponse,
} from '@/types';

// Execute random group draw
export async function executeDraw(
  tournamentId: string,
  data: ExecuteDrawDto
): Promise<ApiResponse<Group[]>> {
  return apiPost<ApiResponse<Group[]>>(
    `/v1/tournaments/${tournamentId}/draw`,
    data
  );
}

// Reset draw and clear all groups
export async function resetDraw(tournamentId: string): Promise<ApiResponse<void>> {
  return apiDelete<ApiResponse<void>>(`/v1/tournaments/${tournamentId}/draw`);
}

// Get all groups and team assignments
export async function getGroups(tournamentId: string): Promise<ApiResponse<Group[]>> {
  return apiGet<ApiResponse<Group[]>>(`/v1/tournaments/${tournamentId}/groups`);
}

// Create a new group
export async function createGroup(
  tournamentId: string,
  data: CreateGroupDto
): Promise<ApiResponse<Group>> {
  return apiPost<ApiResponse<Group>>(`/v1/tournaments/${tournamentId}/groups`, data);
}

// Get full bracket/schedule
export async function getBracket(tournamentId: string): Promise<ApiResponse<Bracket>> {
  return apiGet<ApiResponse<Bracket>>(`/v1/tournaments/${tournamentId}/bracket`);
}

// Manually adjust bracket
export async function updateBracket(
  tournamentId: string,
  data: UpdateBracketDto
): Promise<ApiResponse<Bracket>> {
  return apiPatch<ApiResponse<Bracket>>(
    `/v1/tournaments/${tournamentId}/bracket`,
    data
  );
}

// Get all matches for tournament (optionally filtered by age group)
export async function getMatches(
  tournamentId: string,
  ageGroupId?: string
): Promise<ApiResponse<MatchesResponse>> {
  const params = ageGroupId ? `?ageGroupId=${ageGroupId}` : '';
  return apiGet<ApiResponse<MatchesResponse>>(
    `/v1/tournaments/${tournamentId}/matches${params}`
  );
}

// Manually set advancing team for a match
export async function setMatchAdvancement(
  tournamentId: string,
  matchId: string,
  data: UpdateMatchAdvancementDto,
  ageGroupId?: string
): Promise<ApiResponse<{ match: BracketMatch; bracketUpdated: boolean }>> {
  const params = ageGroupId ? `?ageGroupId=${ageGroupId}` : '';
  return apiPatch<ApiResponse<{ match: BracketMatch; bracketUpdated: boolean }>>(
    `/v1/tournaments/${tournamentId}/matches/${matchId}/advance${params}`,
    data
  );
}

// Update match score
export async function updateMatchScore(
  tournamentId: string,
  matchId: string,
  data: UpdateMatchScoreDto,
  ageGroupId?: string
): Promise<ApiResponse<{ match: BracketMatch; bracketUpdated: boolean }>> {
  const params = ageGroupId ? `?ageGroupId=${ageGroupId}` : '';
  return apiPatch<ApiResponse<{ match: BracketMatch; bracketUpdated: boolean }>>(
    `/v1/tournaments/${tournamentId}/matches/${matchId}/score${params}`,
    data
  );
}

// Generate bracket structure for tournament
export async function generateBracket(
  tournamentId: string,
  ageGroupId?: string
): Promise<ApiResponse<any>> {
  const params = ageGroupId ? `?ageGroupId=${ageGroupId}` : '';
  return apiPost<ApiResponse<any>>(
    `/v1/tournaments/${tournamentId}/bracket/generate${params}`,
    {}
  );
}

export const groupService = {
  executeDraw,
  resetDraw,
  getGroups,
  createGroup,
  getBracket,
  updateBracket,
  getMatches,
  setMatchAdvancement,
  updateMatchScore,
  generateBracket,
};

export default groupService;
