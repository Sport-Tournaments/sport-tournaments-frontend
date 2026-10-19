// CRM (admin/leads) types — mirror the backend leads module.
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'NEGOTIATION' | 'WON' | 'LOST';
export type LeadType = 'TOURNAMENT' | 'CLUB' | 'ORGANIZER';
export type LeadPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type LeadActivityType = 'NOTE' | 'CALL' | 'EMAIL' | 'MEETING' | 'STATUS_CHANGE' | 'ASSIGNMENT';
export type ManualLeadActivityType = Extract<LeadActivityType, 'NOTE' | 'CALL' | 'EMAIL' | 'MEETING'>;
export type FollowUpFilter = 'overdue' | 'today' | 'week' | 'none';

export interface CrmUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone?: string | null;
}

export interface Lead {
  id: string;
  type: LeadType;
  name: string;
  tournamentId: string | null;
  clubId: string | null;
  organizerId: string | null;
  startDate: string | null;
  location: string | null;
  country: string | null;
  website: string | null;
  sourceUrl: string | null;
  organiser: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  status: LeadStatus;
  priority: LeadPriority;
  notes: string | null;
  tags: string[];
  nextFollowUpAt: string | null;
  lastContactedAt: string | null;
  lostReason: string | null;
  assignedToId: string | null;
  assignedTo: CrmUser | null;
  source: string | null;
  createdAt: string;
  updatedAt: string;
  tournament?: { id: string; name: string; startDate?: string; status?: string; location?: string } | null;
  club?: { id: string; name: string; city?: string; country?: string; logo?: string; isVerified?: boolean } | null;
  organizer?: (CrmUser & { organizationName?: string | null; city?: string | null }) | null;
}

export interface LeadActivity {
  id: string;
  leadId: string;
  type: LeadActivityType;
  content: string | null;
  metadata: { from?: string | null; to?: string | null } | null;
  authorId: string | null;
  author: CrmUser | null;
  createdAt: string;
}

export interface LeadStats {
  total: number;
  byStatus: Record<LeadStatus, number>;
  byType: Record<LeadType, number>;
  overdueFollowUps: number;
  dueToday: number;
  unassigned: number;
  assignedToMe: number;
}

export interface LeadFilters {
  page?: number;
  pageSize?: number;
  status?: LeadStatus;
  type?: LeadType;
  priority?: LeadPriority;
  search?: string;
  /** User id, or 'me'. */
  assignedToId?: string;
  unassigned?: boolean;
  source?: string;
  tag?: string;
  country?: string;
  followUp?: FollowUpFilter;
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'startDate' | 'nextFollowUpAt' | 'lastContactedAt' | 'priority';
  sortOrder?: 'ASC' | 'DESC';
}

export type LeadInput = Partial<
  Pick<
    Lead,
    | 'name'
    | 'type'
    | 'startDate'
    | 'location'
    | 'country'
    | 'website'
    | 'sourceUrl'
    | 'organiser'
    | 'contactName'
    | 'contactEmail'
    | 'contactPhone'
    | 'status'
    | 'priority'
    | 'notes'
    | 'tags'
    | 'nextFollowUpAt'
    | 'lostReason'
    | 'assignedToId'
  >
>;

export interface CrmDirectoryFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  country?: string;
  tracking?: 'tracked' | 'untracked';
}

export interface CrmClub {
  id: string;
  name: string;
  city: string;
  country: string;
  logo?: string | null;
  website?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  isVerified: boolean;
  organizer?: CrmUser | null;
  lead: Lead | null;
}

export interface CrmOrganizer extends CrmUser {
  city?: string | null;
  organizationName?: string | null;
  isActive: boolean;
  createdAt: string;
  tournamentCount: number;
  clubCount: number;
  lead: Lead | null;
}

export interface Paged<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface LeadImportResult {
  created: number;
  skipped: number;
  byType: Partial<Record<LeadType, { created: number; skipped: number }>>;
}
