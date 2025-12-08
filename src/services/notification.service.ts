import { apiGet, apiPost, apiPatch, apiDelete } from './api';
import type { Notification, NotificationFilters, ApiResponse, PaginatedResponse } from '@/types';

const NOTIFICATIONS_BASE = '/v1/notifications';

// Get user notifications
export async function getNotifications(
  filters?: NotificationFilters
): Promise<PaginatedResponse<Notification>> {
  const params = new URLSearchParams();
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.pageSize) params.set('pageSize', String(filters.pageSize));
  
  const queryString = params.toString();
  return apiGet<PaginatedResponse<Notification>>(
    `${NOTIFICATIONS_BASE}${queryString ? `?${queryString}` : ''}`
  );
}

// Get unread notification count
export async function getUnreadCount(): Promise<ApiResponse<number>> {
  return apiGet<ApiResponse<number>>(`${NOTIFICATIONS_BASE}/unread-count`);
}

// Mark notification as read
export async function markAsRead(id: string): Promise<ApiResponse<Notification>> {
  return apiPatch<ApiResponse<Notification>>(`${NOTIFICATIONS_BASE}/${id}/read`);
}

// Mark all notifications as read
export async function markAllAsRead(): Promise<ApiResponse<void>> {
  return apiPost<ApiResponse<void>>(`${NOTIFICATIONS_BASE}/mark-all-read`);
}

// Delete notification
export async function deleteNotification(id: string): Promise<ApiResponse<void>> {
  return apiDelete<ApiResponse<void>>(`${NOTIFICATIONS_BASE}/${id}`);
}

export const notificationService = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};

export default notificationService;
