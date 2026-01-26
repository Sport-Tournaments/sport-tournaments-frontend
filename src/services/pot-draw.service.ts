import { apiDelete, apiGet, apiPost } from './api';
import type { ApiResponse } from '@/types';

export interface AssignTeamToPotDto {
  registrationId: string;
  potNumber: number;
}

export interface ExecutePotDrawDto {
  numberOfGroups: number;
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
   * Get all pot assignments for a tournament
   */
  async getPotAssignments(tournamentId: string) {
    return apiGet<ApiResponse<PotResponse[]>>(`/v1/tournaments/${tournamentId}/pots`);
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
   * Validate pot distribution
   */
  async validatePotDistribution(tournamentId: string) {
    return apiPost<ApiResponse<unknown>>(`/v1/tournaments/${tournamentId}/pots/validate`);
  }

  /**
   * Execute pot-based draw to create groups
   */
  async executePotDraw(tournamentId: string, dto: ExecutePotDrawDto) {
    return apiPost<ApiResponse<unknown>>(`/v1/tournaments/${tournamentId}/pots/draw`, dto);
  }

  /**
   * Clear all pot assignments for a tournament
   */
  async clearPotAssignments(tournamentId: string) {
    return apiDelete<ApiResponse<unknown>>(`/v1/tournaments/${tournamentId}/pots`);
  }
}

export const potDrawService = new PotDrawService();
