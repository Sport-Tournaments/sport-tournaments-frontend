// Registration types
export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';

// Import PaymentStatus from payment.ts to avoid duplicate exports
import type { PaymentStatus } from './payment';

export interface Registration {
  id: string;
  tournamentId: string;
  ageGroupId?: string;
  ageGroup?: {
    id: string;
    birthYear: number;
    displayLabel?: string;
    ageCategory?: string;
    level?: string;
    format?: string;
    gameSystem?: string;
    teamCount?: number;
    maxTeams?: number;
    currentTeams?: number;
  };
  tournament?: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    location: string;
    status: string;
    participationFee?: number;
  };
  clubId: string;
  teamId?: string;
  club?: {
    id: string;
    name: string;
    country: string;
    city: string;
    logo?: string;
  };
  team?: {
    id: string;
    name: string;
  };
  numberOfPlayers?: number;
  coachName?: string;
  coachPhone?: string;
  emergencyContact?: string;
  notes?: string;
  status: RegistrationStatus;
  paymentStatus: PaymentStatus;
  groupAssignment?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  rejectionReason?: string;
  reviewer?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateRegistrationDto {
  clubId: string;
  teamId: string;
  ageGroupId?: string;
  numberOfPlayers?: number;
  coachName?: string;
  coachPhone?: string;
  emergencyContact?: string;
  notes?: string;
}

export interface UpdateRegistrationDto {
  ageGroupId?: string;
  numberOfPlayers?: number;
  coachName?: string;
  coachPhone?: string;
  emergencyContact?: string;
  notes?: string;
}

export interface AdminUpdateRegistrationDto extends UpdateRegistrationDto {
  status?: RegistrationStatus;
  groupAssignment?: string;
  paymentStatus?: PaymentStatus;
}

export interface RegistrationFilters {
  page?: number;
  pageSize?: number;
  status?: RegistrationStatus;
  paymentStatus?: PaymentStatus;
  search?: string;
}

export interface RegistrationStatistics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  withdrawn: number;
  paidCount: number;
  unpaidCount: number;
}

export interface AgeGroupRegistrationStatistics {
  ageGroupId: string;
  ageGroupLabel: string;
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  withdrawn: number;
  maxTeams: number;
}

export interface RegistrationStatisticsByAgeGroup {
  overall: RegistrationStatistics;
  byAgeGroup: AgeGroupRegistrationStatistics[];
}

export interface ApproveRegistrationDto {
  reviewNotes?: string;
}

export interface RejectRegistrationDto {
  rejectionReason: string;
  reviewNotes?: string;
}

export interface BulkReviewDto {
  registrationIds: string[];
  reviewNotes?: string;
}

export interface BulkReviewResult {
  successful: string[];
  failed: Array<{
    id: string;
    error: string;
  }>;
}

// Document types for registration
export enum DocumentType {
  MEDICAL_DECLARATION = 'MEDICAL_DECLARATION',
  PARENTAL_CONSENT = 'PARENTAL_CONSENT',
  INSURANCE = 'INSURANCE',
  ID_DOCUMENT = 'ID_DOCUMENT',
  OTHER = 'OTHER',
}

export interface RegistrationDocument {
  id: string;
  registrationId: string;
  documentType: DocumentType;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
  notes?: string;
  fileKey?: string;
}

export interface UploadDocumentDto {
  documentType: DocumentType;
  notes?: string;
}

// Fitness confirmation types
export interface ConfirmFitnessDto {
  coachConfirmation: boolean;
  notes?: string;
}

export interface FitnessStatus {
  fitnessConfirmed: boolean;
  confirmedById?: string;
  confirmedAt?: string;
  notes?: string;
}

// Extended registration with documents and fitness status
export interface RegistrationWithDetails extends Registration {
  documents?: RegistrationDocument[];
  fitnessStatus?: FitnessStatus;
}
