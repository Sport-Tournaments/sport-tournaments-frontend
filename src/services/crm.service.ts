import api from './api';
import type {
  CrmClub,
  CrmDirectoryFilters,
  CrmOrganizer,
  CrmUser,
  Lead,
  LeadActivity,
  LeadFilters,
  LeadImportResult,
  LeadInput,
  LeadStats,
  LeadType,
  ManualLeadActivityType,
  Paged,
} from '@/types/crm';

const BASE = '/v1/admin/leads';

/** Responses come wrapped as `{ success, data }` by the backend interceptor. */
function unwrap<T>(body: unknown): T {
  const node = body as { success?: boolean; data?: T };
  return (node && typeof node === 'object' && 'success' in node ? node.data : body) as T;
}

export const crmService = {
  async getLeads(filters: LeadFilters = {}): Promise<Paged<Lead>> {
    const res = await api.get(BASE, { params: filters });
    return unwrap<Paged<Lead>>(res.data);
  },

  async getLead(id: string): Promise<Lead> {
    return unwrap<Lead>((await api.get(`${BASE}/${id}`)).data);
  },

  async createLead(input: LeadInput): Promise<Lead> {
    return unwrap<Lead>((await api.post(BASE, input)).data);
  },

  async updateLead(id: string, input: LeadInput): Promise<Lead> {
    return unwrap<Lead>((await api.patch(`${BASE}/${id}`, input)).data);
  },

  async deleteLead(id: string): Promise<void> {
    await api.delete(`${BASE}/${id}`);
  },

  async bulkUpdate(
    ids: string[],
    changes: Pick<LeadInput, 'status' | 'priority' | 'assignedToId'>,
  ): Promise<{ updated: number }> {
    return unwrap((await api.patch(`${BASE}/bulk`, { ids, ...changes })).data);
  },

  async getStats(): Promise<LeadStats> {
    return unwrap<LeadStats>((await api.get(`${BASE}/stats`)).data);
  },

  async getTags(): Promise<string[]> {
    return unwrap<string[]>((await api.get(`${BASE}/tags`)).data) ?? [];
  },

  async getAssignees(): Promise<CrmUser[]> {
    return unwrap<CrmUser[]>((await api.get(`${BASE}/assignees`)).data) ?? [];
  },

  async importLeads(types?: LeadType[]): Promise<LeadImportResult> {
    return unwrap((await api.post(`${BASE}/import`, types ? { types } : {})).data);
  },

  /** Get or create the lead for a tournament / club / organizer. */
  async track(type: LeadType, recordId: string): Promise<Lead> {
    return unwrap<Lead>((await api.post(`${BASE}/track/${type}/${recordId}`)).data);
  },

  async exportCsv(filters: LeadFilters = {}): Promise<Blob> {
    const { page: _page, pageSize: _pageSize, ...rest } = filters;
    const res = await api.get(`${BASE}/export`, { params: rest });
    return new Blob([String(res.data ?? '')], { type: 'text/csv;charset=utf-8' });
  },

  // Activity timeline
  async getActivities(leadId: string): Promise<LeadActivity[]> {
    return unwrap<LeadActivity[]>((await api.get(`${BASE}/${leadId}/activities`)).data) ?? [];
  },

  async addActivity(
    leadId: string,
    input: { type: ManualLeadActivityType; content: string; nextFollowUpAt?: string },
  ): Promise<LeadActivity> {
    return unwrap((await api.post(`${BASE}/${leadId}/activities`, input)).data);
  },

  async updateActivity(leadId: string, activityId: string, content: string): Promise<LeadActivity> {
    return unwrap((await api.patch(`${BASE}/${leadId}/activities/${activityId}`, { content })).data);
  },

  async deleteActivity(leadId: string, activityId: string): Promise<void> {
    await api.delete(`${BASE}/${leadId}/activities/${activityId}`);
  },

  // Directories
  async getClubs(filters: CrmDirectoryFilters = {}): Promise<Paged<CrmClub>> {
    return unwrap((await api.get(`${BASE}/clubs`, { params: filters })).data);
  },

  async getOrganizers(filters: CrmDirectoryFilters = {}): Promise<Paged<CrmOrganizer>> {
    return unwrap((await api.get(`${BASE}/organizers`, { params: filters })).data);
  },
};

export default crmService;
