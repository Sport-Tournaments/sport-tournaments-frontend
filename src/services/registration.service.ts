import { apiGet, apiPost, apiPatch, apiDelete } from './api';
import { buildQueryString } from '@/utils/helpers';
import type {
  Registration,
  CreateRegistrationDto,
  UpdateRegistrationDto,
  AdminUpdateRegistrationDto,
  ApproveRegistrationDto,
  RejectRegistrationDto,
  BulkReviewDto,
  BulkReviewResult,
  RegistrationFilters,
  RegistrationStatistics,
  ApiResponse,
  PaginatedResponse,
  RegistrationDocument,
  UploadDocumentDto,
  ConfirmFitnessDto,
  FitnessStatus,
  RegistrationWithDetails,
} from '@/types';

// Register a team for a tournament
export async function registerForTournament(
  tournamentId: string,
  data: CreateRegistrationDto
): Promise<ApiResponse<Registration>> {
  return apiPost<ApiResponse<Registration>>(
    `/v1/tournaments/${tournamentId}/register`,
    data
  );
}

// Get all registrations for a tournament
export async function getTournamentRegistrations(
  tournamentId: string,
  filters?: RegistrationFilters
): Promise<PaginatedResponse<Registration>> {
  const queryString = filters ? buildQueryString(filters as Record<string, unknown>) : '';
  const response = await apiGet<{ success: boolean; data: { data: Registration[]; meta: { total: number; page: number; limit: number; totalPages: number } } }>(
    `/v1/tournaments/${tournamentId}/registrations${queryString ? `?${queryString}` : ''}`
  );
  
  // API response is: { success: true, data: { data: [...], meta: {...} } }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiResponse = response as any;
  const innerData = apiResponse?.data || apiResponse;
  const items = innerData?.data || [];
  const meta = innerData?.meta || {};
  
  return {
    success: true,
    data: {
      items: items,
      total: meta.total || 0,
      page: meta.page || 1,
      pageSize: meta.limit || 20,
      totalPages: meta.totalPages || 1,
      hasMore: (meta.page || 1) < (meta.totalPages || 1),
    },
  };
}

// Get registration statistics for a tournament
export async function getRegistrationStatistics(
  tournamentId: string
): Promise<ApiResponse<RegistrationStatistics>> {
  return apiGet<ApiResponse<RegistrationStatistics>>(
    `/v1/tournaments/${tournamentId}/registrations/status`
  );
}

// Get all registrations for current user's clubs
export async function getMyRegistrations(filters?: RegistrationFilters): Promise<ApiResponse<Registration[]>> {
  const queryString = filters ? buildQueryString(filters as Record<string, unknown>) : '';
  return apiGet<ApiResponse<Registration[]>>(`/v1/registrations/my-registrations${queryString ? `?${queryString}` : ''}`);
}

// Get registration by ID
export async function getRegistrationById(id: string): Promise<ApiResponse<Registration>> {
  return apiGet<ApiResponse<Registration>>(`/v1/registrations/${id}`);
}

// Update registration
export async function updateRegistration(
  id: string,
  data: UpdateRegistrationDto
): Promise<ApiResponse<Registration>> {
  return apiPatch<ApiResponse<Registration>>(`/v1/registrations/${id}`, data);
}

// Admin update registration
export async function adminUpdateRegistration(
  id: string,
  data: AdminUpdateRegistrationDto
): Promise<ApiResponse<Registration>> {
  return apiPatch<ApiResponse<Registration>>(`/v1/registrations/${id}/admin`, data);
}

// Delete registration
export async function deleteRegistration(id: string): Promise<ApiResponse<void>> {
  return apiDelete<ApiResponse<void>>(`/v1/registrations/${id}`);
}

// Approve registration
export async function approveRegistration(
  id: string,
  data?: ApproveRegistrationDto
): Promise<ApiResponse<Registration>> {
  return apiPost<ApiResponse<Registration>>(`/v1/registrations/${id}/approve`, data || {});
}

// Reject registration
export async function rejectRegistration(
  id: string,
  data: RejectRegistrationDto
): Promise<ApiResponse<Registration>> {
  return apiPost<ApiResponse<Registration>>(`/v1/registrations/${id}/reject`, data);
}

// Get pending registrations for review
export async function getPendingRegistrations(
  tournamentId: string
): Promise<ApiResponse<Registration[]>> {
  return apiGet<ApiResponse<Registration[]>>(
    `/v1/tournaments/${tournamentId}/registrations/pending`
  );
}

// Bulk approve registrations
export async function bulkApproveRegistrations(
  tournamentId: string,
  data: BulkReviewDto
): Promise<ApiResponse<BulkReviewResult>> {
  return apiPost<ApiResponse<BulkReviewResult>>(
    `/v1/tournaments/${tournamentId}/registrations/bulk-approve`,
    data
  );
}

// Bulk reject registrations
export async function bulkRejectRegistrations(
  tournamentId: string,
  data: BulkReviewDto & { rejectionReason: string }
): Promise<ApiResponse<BulkReviewResult>> {
  return apiPost<ApiResponse<BulkReviewResult>>(
    `/v1/tournaments/${tournamentId}/registrations/bulk-reject`,
    data
  );
}

// Withdraw registration
export async function withdrawRegistration(id: string): Promise<ApiResponse<Registration>> {
  return apiPost<ApiResponse<Registration>>(`/v1/registrations/${id}/withdraw`);
}

// Get my registration for a tournament
export async function getMyRegistration(tournamentId: string): Promise<ApiResponse<RegistrationWithDetails>> {
  return apiGet<ApiResponse<RegistrationWithDetails>>(`/v1/tournaments/${tournamentId}/my-registration`);
}

// Document Upload Methods
export async function uploadDocument(
  registrationId: string,
  documentType: string,
  file: File,
  notes?: string
): Promise<ApiResponse<RegistrationDocument>> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentType', documentType);
  if (notes) {
    formData.append('notes', notes);
  }
  
  // Use fetch directly for multipart/form-data
  // Import the cookie helper to get the token
  const { getTokenFromCookie } = await import('@/utils/cookies');
  const token = getTokenFromCookie('accessToken');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010/api';
  
  const response = await fetch(`${apiUrl}/v1/registrations/${registrationId}/documents`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to upload document');
  }
  
  return response.json();
}

export async function getDocuments(registrationId: string): Promise<ApiResponse<RegistrationDocument[]>> {
  return apiGet<ApiResponse<RegistrationDocument[]>>(`/v1/registrations/${registrationId}/documents`);
}

export async function deleteDocument(registrationId: string, documentId: string): Promise<ApiResponse<void>> {
  return apiDelete<ApiResponse<void>>(`/v1/registrations/${registrationId}/documents/${documentId}`);
}

// Fitness Confirmation Methods
export async function confirmFitness(
  registrationId: string,
  data: ConfirmFitnessDto
): Promise<ApiResponse<Registration>> {
  return apiPost<ApiResponse<Registration>>(`/v1/registrations/${registrationId}/confirm-fitness`, data);
}

export async function getFitnessStatus(registrationId: string): Promise<ApiResponse<FitnessStatus>> {
  return apiGet<ApiResponse<FitnessStatus>>(`/v1/registrations/${registrationId}/fitness`);
}

export const registrationService = {
  registerForTournament,
  getTournamentRegistrations,
  getRegistrationStatistics,
  getMyRegistrations,
  getMyRegistration,
  getRegistrationById,
  updateRegistration,
  adminUpdateRegistration,
  deleteRegistration,
  approveRegistration,
  rejectRegistration,
  getPendingRegistrations,
  bulkApproveRegistrations,
  bulkRejectRegistrations,
  withdrawRegistration,
  // Document methods
  uploadDocument,
  getDocuments,
  deleteDocument,
  // Fitness methods
  confirmFitness,
  getFitnessStatus,
};

export default registrationService;
