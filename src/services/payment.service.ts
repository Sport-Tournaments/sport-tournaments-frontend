import { apiGet, apiPost, apiDelete, apiUpload } from './api';
import type { FileRecord, Payment, PaymentIntentResponse, PaymentFilters, ApiResponse, PaginatedResponse } from '@/types';

// Payments
const PAYMENTS_BASE = '/v1/payments';

export async function createPaymentIntent(
  registrationId: string
): Promise<ApiResponse<PaymentIntentResponse>> {
  return apiPost<ApiResponse<PaymentIntentResponse>>(
    `${PAYMENTS_BASE}/create-intent`,
    { registrationId }
  );
}

export async function getPaymentById(id: string): Promise<ApiResponse<Payment>> {
  return apiGet<ApiResponse<Payment>>(`${PAYMENTS_BASE}/${id}`);
}

export async function initiateRefund(id: string): Promise<ApiResponse<Payment>> {
  return apiPost<ApiResponse<Payment>>(`${PAYMENTS_BASE}/${id}/refund`);
}

export async function getPaymentsByTournament(
  tournamentId: string
): Promise<ApiResponse<Payment[]>> {
  return apiGet<ApiResponse<Payment[]>>(`${PAYMENTS_BASE}/tournament/${tournamentId}`);
}

// Files
const FILES_BASE = '/v1/files';

export async function uploadFile(
  file: File,
  options?: { entityType?: string; entityId?: string; isPublic?: boolean }
): Promise<ApiResponse<FileRecord>> {
  return apiUpload<ApiResponse<FileRecord>>(
    `${FILES_BASE}/upload`,
    file,
    options as Record<string, string>
  );
}

export async function getFileById(id: string): Promise<ApiResponse<FileRecord>> {
  return apiGet<ApiResponse<FileRecord>>(`${FILES_BASE}/${id}`);
}

export async function deleteFile(id: string): Promise<ApiResponse<void>> {
  return apiDelete<ApiResponse<void>>(`${FILES_BASE}/${id}`);
}

export async function getFileDownloadUrl(id: string, inline = false): Promise<ApiResponse<{ url: string }>> {
  return apiGet<ApiResponse<{ url: string }>>(`${FILES_BASE}/${id}/download${inline ? '?inline=true' : ''}`);
}

export async function getFilesByEntity(
  entityType: string,
  entityId: string
): Promise<ApiResponse<FileRecord[]>> {
  return apiGet<ApiResponse<FileRecord[]>>(`${FILES_BASE}/entity/${entityType}/${entityId}`);
}

export async function getMyFiles(): Promise<ApiResponse<FileRecord[]>> {
  return apiGet<ApiResponse<FileRecord[]>>(`${FILES_BASE}/my-files`);
}

export const paymentService = {
  createPaymentIntent,
  getPaymentById,
  initiateRefund,
  getPaymentsByTournament,
};

export const fileService = {
  uploadFile,
  getFileById,
  deleteFile,
  getFileDownloadUrl,
  getFilesByEntity,
  getMyFiles,
};

export default { paymentService, fileService };
