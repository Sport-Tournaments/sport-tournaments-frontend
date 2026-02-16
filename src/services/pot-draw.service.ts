import { apiDelete, apiGet, apiPost } from './api';
import type { ApiResponse } from '@/types';

export interface AssignTeamToPotDto {
  registrationId: string;
  potNumber: number;
}

export interface ExecutePotDrawDto {
  numberOfGroups: number;
  ageGroupId?: string;
}

export interface PotAssignment {
  registrationId: string;
  clubName: string;
  coachName: string;
}

export interface PotResponse {
  potNumber: number;
  count: number;
  teams: PotAssignment[];
}

class PotDrawService {
  /**
   * Get all pot assignments for a tournament, optionally filtered by age group
   */
  async getPotAssignments(tournamentId: string, ageGroupId?: string) {
    const params = ageGroupId ? `?ageGroupId=${ageGroupId}` : '';
    return apiGet<ApiResponse<PotResponse[]>>(`/v1/tournaments/${tournamentId}/pots${params}`);
  }

  /**
   * Assign a single team to a pot
   */
  async assignTeamToPot(tournamentId: string, dto: AssignTeamToPotDto) {
    return apiPost<ApiResponse<unknown>>(`/v1/tournaments/${tournamentId}/pots/assign`, dto);
  }

  /**
   * Assign multiple teams to pots at once
   */
  async assignTeamsToPotsBulk(tournamentId: string, assignments: AssignTeamToPotDto[]) {
    return apiPost<ApiResponse<unknown>>(`/v1/tournaments/${tournamentId}/pots/bulk-assign`, {
      assignments,
    });
  }

  /**
   * Validate pot distribution for a specific age group
   */
  async validatePotDistribution(tournamentId: string, ageGroupId?: string) {
    const params = ageGroupId ? `?ageGroupId=${ageGroupId}` : '';
    return apiPost<ApiResponse<unknown>>(`/v1/tournaments/${tournamentId}/pots/validate${params}`);
  }

  /**
   * Execute pot-based draw to create groups
   */
  async executePotDraw(tournamentId: string, dto: ExecutePotDrawDto) {
    return apiPost<ApiResponse<unknown>>(`/v1/tournaments/${tournamentId}/pots/draw`, dto);
  }

  /**
   * Clear pot assignments for a tournament, optionally for a specific age group
   */
  async clearPotAssignments(tournamentId: string, ageGroupId?: string) {
    const params = ageGroupId ? `?ageGroupId=${ageGroupId}` : '';
    return apiDelete<ApiResponse<unknown>>(`/v1/tournaments/${tournamentId}/pots${params}`);
  }
}

export const potDrawService = new PotDrawService();
