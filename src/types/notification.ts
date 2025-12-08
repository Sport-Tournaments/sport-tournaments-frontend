// Notification types
export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'TOURNAMENT' | 'REGISTRATION' | 'INVITATION';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
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
  response: 'accept' | 'decline';
  responseMessage?: string;
}

export interface InvitationStatistics {
  total: number;
  pending: number;
  accepted: number;
  declined: number;
  expired: number;
}
