import { apiGet, apiPost, apiPatch, apiDelete } from './api';
import type { ApiResponse, Team, CreateTeamDto, UpdateTeamDto } from '@/types';

const TEAMS_BASE = '/v1/teams';

export async function getTeamsByClub(clubId: string): Promise<ApiResponse<Team[]>> {
  return apiGet<ApiResponse<Team[]>>(`${TEAMS_BASE}?clubId=${encodeURIComponent(clubId)}`);
}

export async function getAllTeams(params?: {
  clubId?: string;
  search?: string;
}): Promise<ApiResponse<Team[]>> {
  const query = new URLSearchParams();
  if (params?.clubId) query.set('clubId', params.clubId);
  if (params?.search) query.set('search', params.search);
  const qs = query.toString();
  return apiGet<ApiResponse<Team[]>>(`${TEAMS_BASE}${qs ? `?${qs}` : ''}`);
}

export async function getTeamById(id: string): Promise<ApiResponse<Team>> {
  return apiGet<ApiResponse<Team>>(`${TEAMS_BASE}/${id}`);
}

export async function createTeam(data: CreateTeamDto): Promise<ApiResponse<Team>> {
  return apiPost<ApiResponse<Team>>(TEAMS_BASE, data);
}

export async function updateTeam(id: string, data: UpdateTeamDto): Promise<ApiResponse<Team>> {
  return apiPatch<ApiResponse<Team>>(`${TEAMS_BASE}/${id}`, data);
}

export async function deleteTeam(id: string): Promise<ApiResponse<void>> {
  return apiDelete<ApiResponse<void>>(`${TEAMS_BASE}/${id}`);
}

export async function searchTeams(params: {
  q: string;
  clubId?: string;
  limit?: number;
}): Promise<ApiResponse<Team[]>> {
  const query = new URLSearchParams();
  query.set('q', params.q);
  if (params.clubId) query.set('clubId', params.clubId);
  if (params.limit) query.set('limit', String(params.limit));
  return apiGet<ApiResponse<Team[]>>(`${TEAMS_BASE}/search?${query.toString()}`);
}

export const teamService = {
  getTeamsByClub,
  getAllTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  searchTeams,
};

export default teamService;