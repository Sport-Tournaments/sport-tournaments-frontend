import { apiGet, apiPost } from './api';
import type { ApiResponse, Team, CreateTeamDto } from '@/types';

const TEAMS_BASE = '/v1/teams';

export async function getTeamsByClub(clubId: string): Promise<ApiResponse<Team[]>> {
  return apiGet<ApiResponse<Team[]>>(`${TEAMS_BASE}?clubId=${encodeURIComponent(clubId)}`);
}

export async function createTeam(data: CreateTeamDto): Promise<ApiResponse<Team>> {
  return apiPost<ApiResponse<Team>>(TEAMS_BASE, data);
}

export const teamService = {
  getTeamsByClub,
  createTeam,
};

export default teamService;