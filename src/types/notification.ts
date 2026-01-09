// Notification types - matches backend enum
export type NotificationType =
  | 'REGISTRATION_CONFIRMATION'
  | 'REGISTRATION_APPROVED'
  | 'REGISTRATION_REJECTED'
  | 'TOURNAMENT_PUBLISHED'
  | 'TOURNAMENT_CANCELLED'
  | 'TOURNAMENT_UPDATE'
  | 'GROUP_DRAW'
  | 'PAYMENT_REMINDER'
  | 'PAYMENT_COMPLETED'
  | 'PAYMENT_FAILED'
  | 'NEW_TOURNAMENT_MATCH'
  | 'SYSTEM';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedTournamentId?: string;
  relatedRegistrationId?: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationFilters {
  page?: number;
  pageSize?: number;
}

// Invitation types
export type InvitationType = 'DIRECT' | 'EMAIL' | 'PARTNER' | 'PAST_PARTICIPANT';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

export interface Invitation {
  id: string;
  tournamentId: string;
  tournament?: {
    id: string;
    name: string;
    startDate: string;
    location: string;
  };
  clubId?: string;
  club?: {
    id: string;
    name: string;
    country: string;
    logo?: string;
  };
  email?: string;
  type: InvitationType;
  status: InvitationStatus;
  message?: string;
  token?: string;
  expiresAt?: string;
  respondedAt?: string;
  responseMessage?: string;
  createdAt: string;
}

export interface CreateInvitationDto {
  tournamentId: string;
  clubId?: string;
  email?: string;
  type?: InvitationType;
  message?: string;
  expiresAt?: string;
}

export interface BulkInvitationDto {
  tournamentId: string;
  clubIds?: string[];
  emails?: string[];
  message?: string;
  expiresAt?: string;
  type?: InvitationType;
}

export interface InvitePartnerTeamsDto {
  tournamentId: string;
  message?: string;
}

export interface InvitePastParticipantsDto {
  tournamentId: string;
  fromTournamentId?: string;
  message?: string;
}

export interface RespondToInvitationDto {
  response: 'ACCEPTED' | 'DECLINED';
  responseMessage?: string;
}

export interface InvitationStatistics {
  total: number;
  pending: number;
  accepted: number;
  declined: number;
  expired: number;
}
