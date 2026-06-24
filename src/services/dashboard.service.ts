import { apiGet } from './api';
import type { ApiResponse, Club, Registration, Tournament } from '@/types';

export interface DashboardSummary {
  stats: {
    tournaments: number;
    clubs: number;
    registrations: number;
    approved: number;
    pending: number;
  };
  recentTournaments: Tournament[];
  recentClubs: Club[];
  recentRegistrations: Registration[];
}

export async function getDashboardSummary(): Promise<ApiResponse<DashboardSummary>> {
  return apiGet<ApiResponse<DashboardSummary>>('/v1/dashboard/summary');
}

export const dashboardService = {
  getDashboardSummary,
};

export default dashboardService;
