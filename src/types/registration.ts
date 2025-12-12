// Registration types
export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';

// Import PaymentStatus from payment.ts to avoid duplicate exports
import type { PaymentStatus } from './payment';

export interface Registration {
  id: string;
  tournamentId: string;
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
  club?: {
    id: string;
    name: string;
    country: string;
    city: string;
    logo?: string;
  };
  numberOfPlayers?: number;
  coachName?: string;
  coachPhone?: string;
  emergencyContact?: string;
  notes?: string;
  status: RegistrationStatus;
  paymentStatus: PaymentStatus;
  groupAssignment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRegistrationDto {
  clubId: string;
  numberOfPlayers?: number;
  coachName?: string;
  coachPhone?: string;
  emergencyContact?: string;
  notes?: string;
}

export interface UpdateRegistrationDto {
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
  byStatus: Record<RegistrationStatus, number>;
  byPaymentStatus: Record<PaymentStatus, number>;
}
