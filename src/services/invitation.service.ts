import { apiGet, apiPost, apiDelete } from './api';
import type { Invitation, CreateInvitationDto, BulkInvitationDto, InvitePartnerTeamsDto, InvitePastParticipantsDto, RespondToInvitationDto, InvitationStatistics, ApiResponse } from '@/types';

const INVITATIONS_BASE = '/v1/invitations';

// Create a single invitation
export async function createInvitation(
  data: CreateInvitationDto
): Promise<ApiResponse<Invitation>> {
  return apiPost<ApiResponse<Invitation>>(INVITATIONS_BASE, data);
}

// Create multiple invitations at once
export async function createBulkInvitations(
  data: BulkInvitationDto
): Promise<ApiResponse<Invitation[]>> {
  return apiPost<ApiResponse<Invitation[]>>(`${INVITATIONS_BASE}/bulk`, data);
}

// Invite all partner teams defined in tournament settings
export async function invitePartnerTeams(
  data: InvitePartnerTeamsDto
): Promise<ApiResponse<Invitation[]>> {
  return apiPost<ApiResponse<Invitation[]>>(`${INVITATIONS_BASE}/partner-teams`, data);
}

// Invite past tournament participants
export async function invitePastParticipants(
  data: InvitePastParticipantsDto
): Promise<ApiResponse<Invitation[]>> {
  return apiPost<ApiResponse<Invitation[]>>(`${INVITATIONS_BASE}/past-participants`, data);
}

// Get all invitations for a tournament
export async function getInvitationsByTournament(
  tournamentId: string,
  filters?: { status?: string; type?: string }
): Promise<ApiResponse<Invitation[]>> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.type) params.set('type', filters.type);
  
  const queryString = params.toString();
  return apiGet<ApiResponse<Invitation[]>>(
    `${INVITATIONS_BASE}/tournament/${tournamentId}${queryString ? `?${queryString}` : ''}`
  );
}

// Get invitation statistics for a tournament
export async function getInvitationStats(
  tournamentId: string
): Promise<ApiResponse<InvitationStatistics>> {
  return apiGet<ApiResponse<InvitationStatistics>>(
    `${INVITATIONS_BASE}/tournament/${tournamentId}/stats`
  );
}

// Get all pending invitations for a club
export async function getInvitationsByClub(clubId: string): Promise<ApiResponse<Invitation[]>> {
  return apiGet<ApiResponse<Invitation[]>>(`${INVITATIONS_BASE}/club/${clubId}`);
}

// Get invitation details by token (public)
export async function getInvitationByToken(token: string): Promise<ApiResponse<Invitation>> {
  return apiGet<ApiResponse<Invitation>>(`${INVITATIONS_BASE}/token/${token}`);
}

// Respond to an invitation (accept or decline)
export async function respondToInvitation(
  id: string,
  data: RespondToInvitationDto
): Promise<ApiResponse<Invitation>> {
  return apiPost<ApiResponse<Invitation>>(`${INVITATIONS_BASE}/${id}/respond`, data);
}

// Respond to an invitation using token (public)
export async function respondToInvitationByToken(
  token: string,
  data: RespondToInvitationDto
): Promise<ApiResponse<Invitation>> {
  return apiPost<ApiResponse<Invitation>>(`${INVITATIONS_BASE}/token/${token}/respond`, data);
}

// Resend an invitation
export async function resendInvitation(id: string): Promise<ApiResponse<Invitation>> {
  return apiPost<ApiResponse<Invitation>>(`${INVITATIONS_BASE}/${id}/resend`);
}

// Cancel/delete an invitation
export async function cancelInvitation(id: string): Promise<ApiResponse<void>> {
  return apiDelete<ApiResponse<void>>(`${INVITATIONS_BASE}/${id}`);
}

export const invitationService = {
  createInvitation,
  createBulkInvitations,
  invitePartnerTeams,
  invitePastParticipants,
  getInvitationsByTournament,
  getInvitationStats,
  getInvitationsByClub,
  getInvitationByToken,
  respondToInvitation,
  respondToInvitationByToken,
  resendInvitation,
  cancelInvitation,
};

export default invitationService;
