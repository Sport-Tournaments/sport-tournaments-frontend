// File types
export type EntityType = 'tournament' | 'club' | 'user';

export interface FileRecord {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  entityType?: EntityType;
  entityId?: string;
  isPublic: boolean;
  url?: string;
  uploadedById: string;
  createdAt: string;
}

export interface UploadFileDto {
  file: File;
  entityType?: EntityType;
  entityId?: string;
  isPublic?: boolean;
}

// Admin types
export interface UpdateUserRoleDto {
  role: 'ADMIN' | 'ORGANIZER' | 'PARTICIPANT' | 'USER';
}

export interface UpdateUserStatusDto {
  isActive?: boolean;
  isVerified?: boolean;
}

export interface AdminActionDto {
  reason?: string;
}

export interface PlatformStatistics {
  users: {
    total: number;
    active: number;
    verified: number;
    byRole: Record<string, number>;
    newThisMonth: number;
  };
  tournaments: {
    total: number;
    active: number;
    completed: number;
    upcoming: number;
    byStatus: Record<string, number>;
  };
  clubs: {
    total: number;
    verified: number;
    premium: number;
  };
  registrations: {
    total: number;
    pending: number;
    approved: number;
  };
  payments: {
    totalRevenue: number;
    thisMonth: number;
    pendingAmount: number;
  };
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}
