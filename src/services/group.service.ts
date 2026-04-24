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
export async function getGroups(tournamentId: string, ageGroupId?: string): Promise<ApiResponse<Group[]>> {
  const params = ageGroupId ? `?ageGroupId=${ageGroupId}` : '';
  return apiGet<ApiResponse<Group[]>>(`/v1/tournaments/${tournamentId}/groups${params}`);
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

// Generate knockout bracket after all group matches are completed
export async function generateKnockoutBracket(
  tournamentId: string,
  ageGroupId?: string
): Promise<ApiResponse<any>> {
  const params = ageGroupId ? `?ageGroupId=${ageGroupId}` : '';
  return apiPost<ApiResponse<any>>(
    `/v1/tournaments/${tournamentId}/bracket/generate-knockout${params}`,
    {}
  );
}

// Schedule a match (set date/time and optional court number)
export async function scheduleMatch(
  tournamentId: string,
  matchId: string,
  data: { scheduledAt: string; courtNumber?: number; fieldName?: string },
  ageGroupId?: string
): Promise<ApiResponse<{ match: BracketMatch }>> {
  const params = ageGroupId ? `?ageGroupId=${ageGroupId}` : '';
  return apiPatch<ApiResponse<{ match: BracketMatch }>>(
    `/v1/tournaments/${tournamentId}/matches/${matchId}/schedule${params}`,
    data
  );
}

// Set manual tiebreak order for a group (organizer only)
export async function setGroupTiebreak(
  tournamentId: string,
  groupId: string,
  order: string[],
  ageGroupId?: string
): Promise<ApiResponse<{ success: boolean; bracketUpdated: boolean }>> {
  const params = ageGroupId ? `?ageGroupId=${ageGroupId}` : '';
  return apiPatch<ApiResponse<{ success: boolean; bracketUpdated: boolean }>>(
    `/v1/tournaments/${tournamentId}/groups/${groupId}/tiebreak${params}`,
    { order }
  );
}

// Update a specific group (teams array, groupLetter)
export async function updateGroup(
  tournamentId: string,
  groupId: string,
  data: { teams?: string[]; groupLetter?: string }
): Promise<ApiResponse<Group>> {
  return apiPatch<ApiResponse<Group>>(
    `/v1/tournaments/${tournamentId}/groups/${groupId}`,
    data
  );
}

// Swap two teams between two groups atomically (two sequential PATCH calls)
export async function swapGroupTeams(
  tournamentId: string,
  groupAId: string,
  groupATeams: string[],
  teamAId: string,
  groupBId: string,
  groupBTeams: string[],
  teamBId: string
): Promise<void> {
  const newGroupATeams = groupATeams.map((id) => (id === teamAId ? teamBId : id));
  const newGroupBTeams = groupBTeams.map((id) => (id === teamBId ? teamAId : id));
  await updateGroup(tournamentId, groupAId, { teams: newGroupATeams });
  await updateGroup(tournamentId, groupBId, { teams: newGroupBTeams });
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
  generateKnockoutBracket,
  scheduleMatch,
  setGroupTiebreak,
  updateGroup,
  swapGroupTeams,
};

export default groupService;
