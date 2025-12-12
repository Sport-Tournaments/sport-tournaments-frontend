// Tournament types
export type TournamentStatus = 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
export type AgeCategory = 'U8' | 'U10' | 'U12' | 'U14' | 'U16' | 'U18' | 'U21' | 'SENIOR' | 'VETERANS';
export type TournamentFormat = 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION' | 'ROUND_ROBIN' | 'GROUPS_PLUS_KNOCKOUT' | 'LEAGUE';
export type TournamentLevel = 'I' | 'II' | 'III';
export type Currency = 'EUR' | 'RON' | 'USD' | 'GBP';
export type BracketType = 'GROUPS_ONLY' | 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION' | 'ROUND_ROBIN' | 'GROUPS_PLUS_KNOCKOUT';
export type RegulationsType = 'UPLOADED' | 'GENERATED';

export interface VisibilitySettings {
  partnerTeams?: string[];
  pastParticipants?: string[];
  manualEmailList?: string[];
  isPublicListing?: boolean;
}

export interface AgeGroup {
  id?: string;
  birthYear: number;
  displayLabel?: string;
  gameSystem?: string;
  teamCount?: number;
  startDate?: string;
  endDate?: string;
  locationId?: string;
  participationFee?: number;
  groupsCount?: number;
  teamsPerGroup?: number;
}

export interface TournamentLocation {
  id?: string;
  venueName: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  country?: string;
  fieldCount?: number;
  capacity?: number;
  fieldType?: string;
  fieldDimensions?: string;
  facilities?: Record<string, boolean>;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  displayOrder?: number;
  isPrimary?: boolean;
}

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  location: string;
  latitude?: number;
  longitude?: number;
  ageCategory: AgeCategory;
  level: TournamentLevel;
  gameSystem?: string;
  numberOfMatches?: number;
  maxTeams: number;
  currentTeams?: number;
  regulationsDocument?: string;
  currency: Currency;
  participationFee?: number;
  tags?: string[];
  registrationDeadline?: string;
  registrationStartDate?: string;
  registrationEndDate?: string;
  registrationFee?: number;
  registeredTeams?: number;
  bannerImage?: string;
  rules?: string;
  format?: string;
  entryFee?: number;
  prizeMoney?: number;
  contactEmail?: string;
  contactPhone?: string;
  country?: string;
  status: TournamentStatus;
  isPrivate: boolean;
  visibilitySettings?: VisibilitySettings;
  bracketType?: BracketType;
  groupCount?: number;
  teamsPerGroup?: number;
  thirdPlaceMatch?: boolean;
  regulationsType?: RegulationsType;
  regulationsData?: Record<string, unknown>;
  brochureUrl?: string;
  socialMediaAssets?: Record<string, string>;
  urlSlug?: string;
  isPremium: boolean;
  isFeatured: boolean;
  isPublished: boolean;
  ageGroups?: AgeGroup[];
  locations?: TournamentLocation[];
  organizerId: string;
  organizer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateTournamentDto {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  location: string;
  latitude?: number;
  longitude?: number;
  ageCategory: AgeCategory;
  level?: TournamentLevel;
  gameSystem?: string;
  numberOfMatches?: number;
  maxTeams: number;
  regulationsDocument?: string;
  currency?: Currency;
  participationFee?: number;
  tags?: string[];
  registrationDeadline?: string;
  contactEmail?: string;
  contactPhone?: string;
  country?: string;
  isPrivate?: boolean;
  visibilitySettings?: VisibilitySettings;
  bracketType?: BracketType;
  groupCount?: number;
  teamsPerGroup?: number;
  thirdPlaceMatch?: boolean;
  regulationsType?: RegulationsType;
  regulationsData?: Record<string, unknown>;
  brochureUrl?: string;
  socialMediaAssets?: Record<string, string>;
  urlSlug?: string;
  ageGroups?: Omit<AgeGroup, 'id'>[];
  locations?: Omit<TournamentLocation, 'id'>[];
}

export type UpdateTournamentDto = Partial<Omit<CreateTournamentDto, 'ageGroups' | 'locations'>>;

export interface AdminUpdateTournamentDto extends UpdateTournamentDto {
  status?: TournamentStatus;
  isPremium?: boolean;
  isFeatured?: boolean;
  isPublished?: boolean;
}

export interface TournamentFilters {
  page?: number;
  pageSize?: number;
  limit?: number;
  status?: TournamentStatus;
  ageCategory?: AgeCategory;
  level?: TournamentLevel;
  country?: string;
  startDateFrom?: string;
  startDateTo?: string;
  gameSystem?: string;
  numberOfMatchesMin?: number;
  numberOfMatchesMax?: number;
  userLatitude?: number;
  userLongitude?: number;
  maxDistance?: number;
  isPremium?: boolean;
  isFeatured?: boolean;
  hasAvailableSpots?: boolean;
  isPrivate?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface TournamentStatistics {
  total: number;
  byStatus: Record<TournamentStatus, number>;
  byAgeCategory: Record<AgeCategory, number>;
  byCountry: Record<string, number>;
  upcoming: number;
  ongoing: number;
  completed: number;
}
