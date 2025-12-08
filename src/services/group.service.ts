import { apiGet, apiPost, apiPatch, apiDelete } from './api';
import type {
  Group,
  Bracket,
  ExecuteDrawDto,
  CreateGroupDto,
  UpdateBracketDto,
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

export const groupService = {
  executeDraw,
  resetDraw,
  getGroups,
  createGroup,
  getBracket,
  updateBracket,
};

export default groupService;
