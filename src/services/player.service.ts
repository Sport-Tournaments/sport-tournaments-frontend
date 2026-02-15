import { apiGet, apiPost, apiPatch, apiDelete } from './api';
import type { ApiResponse, Player, CreatePlayerDto, UpdatePlayerDto, PlayerAutocomplete } from '@/types';

const PLAYERS_BASE = '/v1/players';

export async function getPlayers(params?: {
  teamId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<ApiResponse<Player[]>> {
  const query = new URLSearchParams();
  if (params?.teamId) query.set('teamId', params.teamId);
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', String(params.page));
  if (params?.pageSize) query.set('pageSize', String(params.pageSize));
  const qs = query.toString();
  return apiGet<ApiResponse<Player[]>>(`${PLAYERS_BASE}${qs ? `?${qs}` : ''}`);
}

export async function getPlayerById(id: string): Promise<ApiResponse<Player>> {
  return apiGet<ApiResponse<Player>>(`${PLAYERS_BASE}/${id}`);
}

export async function createPlayer(data: CreatePlayerDto): Promise<ApiResponse<Player>> {
  return apiPost<ApiResponse<Player>>(PLAYERS_BASE, data);
}

export async function updatePlayer(id: string, data: UpdatePlayerDto): Promise<ApiResponse<Player>> {
  return apiPatch<ApiResponse<Player>>(`${PLAYERS_BASE}/${id}`, data);
}

export async function deletePlayer(id: string): Promise<ApiResponse<void>> {
  return apiDelete<ApiResponse<void>>(`${PLAYERS_BASE}/${id}`);
}

export async function searchPlayers(params: {
  q: string;
  teamId?: string;
  limit?: number;
}): Promise<ApiResponse<Player[]>> {
  const query = new URLSearchParams();
  query.set('q', params.q);
  if (params.teamId) query.set('teamId', params.teamId);
  if (params.limit) query.set('limit', String(params.limit));
  return apiGet<ApiResponse<Player[]>>(`${PLAYERS_BASE}/search?${query.toString()}`);
}

export async function autocompletePlayer(params: {
  q: string;
  teamId?: string;
  limit?: number;
}): Promise<ApiResponse<PlayerAutocomplete[]>> {
  const query = new URLSearchParams();
  query.set('q', params.q);
  if (params.teamId) query.set('teamId', params.teamId);
  if (params.limit) query.set('limit', String(params.limit));
  return apiGet<ApiResponse<PlayerAutocomplete[]>>(`${PLAYERS_BASE}/autocomplete?${query.toString()}`);
}

export const playerService = {
  getPlayers,
  getPlayerById,
  createPlayer,
  updatePlayer,
  deletePlayer,
  searchPlayers,
  autocompletePlayer,
};

export default playerService;
