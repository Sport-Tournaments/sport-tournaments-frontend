import { apiGet, apiPost, apiPatch, apiDelete } from './api';
import { buildQueryString } from '@/utils/helpers';
import type {
  Club,
  CreateClubDto,
  UpdateClubDto,
  AdminUpdateClubDto,
  ClubFilters,
  ClubStatistics,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

const CLUBS_BASE = '/v1/clubs';

// Get all clubs with pagination and filters
export async function getClubs(
  filters?: ClubFilters
): Promise<PaginatedResponse<Club>> {
  const queryString = filters ? buildQueryString(filters as Record<string, unknown>) : '';
  return apiGet<PaginatedResponse<Club>>(
    `${CLUBS_BASE}${queryString ? `?${queryString}` : ''}`
  );
}

// Get clubs owned by current user
export async function getMyClubs(): Promise<ApiResponse<Club[]>> {
  return apiGet<ApiResponse<Club[]>>(`${CLUBS_BASE}/my-clubs`);
}

// Search clubs by name or city
export async function searchClubs(
  query: string,
  limit = 10
): Promise<ApiResponse<Club[]>> {
  return apiGet<ApiResponse<Club[]>>(`${CLUBS_BASE}/search?q=${encodeURIComponent(query)}&limit=${limit}`);
}

// Get club by ID
export async function getClubById(id: string): Promise<ApiResponse<Club>> {
  return apiGet<ApiResponse<Club>>(`${CLUBS_BASE}/${id}`);
}

// Create a new club
export async function createClub(data: CreateClubDto): Promise<ApiResponse<Club>> {
  return apiPost<ApiResponse<Club>>(CLUBS_BASE, data);
}

// Update club
export async function updateClub(
  id: string,
  data: UpdateClubDto
): Promise<ApiResponse<Club>> {
  return apiPatch<ApiResponse<Club>>(`${CLUBS_BASE}/${id}`, data);
}

// Admin update club
export async function adminUpdateClub(
  id: string,
  data: AdminUpdateClubDto
): Promise<ApiResponse<Club>> {
  return apiPatch<ApiResponse<Club>>(`${CLUBS_BASE}/${id}/admin`, data);
}

// Delete club
export async function deleteClub(id: string): Promise<ApiResponse<void>> {
  return apiDelete<ApiResponse<void>>(`${CLUBS_BASE}/${id}`);
}

// Verify club (Admin only)
export async function verifyClub(id: string): Promise<ApiResponse<Club>> {
  return apiPatch<ApiResponse<Club>>(`${CLUBS_BASE}/${id}/verify`);
}

// Unverify club (Admin only)
export async function unverifyClub(id: string): Promise<ApiResponse<Club>> {
  return apiPatch<ApiResponse<Club>>(`${CLUBS_BASE}/${id}/unverify`);
}

// Set club premium status (Admin only)
export async function setClubPremium(id: string): Promise<ApiResponse<Club>> {
  return apiPatch<ApiResponse<Club>>(`${CLUBS_BASE}/${id}/premium`);
}

// Get club statistics (Admin only)
export async function getClubStatistics(): Promise<ApiResponse<ClubStatistics>> {
  return apiGet<ApiResponse<ClubStatistics>>(`${CLUBS_BASE}/statistics`);
}

// Upload club logo
export async function uploadLogo(id: string, file: File): Promise<ApiResponse<Club>> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.patch<ApiResponse<Club>>(
    `${CLUBS_BASE}/${id}/logo`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  
  return response.data;
}

export const clubService = {
  getClubs,
  getMyClubs,
  searchClubs,
  getClubById,
  createClub,
  updateClub,
  adminUpdateClub,
  deleteClub,
  verifyClub,
  unverifyClub,
  setClubPremium,
  getClubStatistics,
  uploadLogo,
};

export default clubService;
