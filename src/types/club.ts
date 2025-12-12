// Club types
export interface Club {
  id: string;
  name: string;
  country: string;
  city: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  logo?: string;
  foundedYear?: number;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  verified?: boolean;
  isVerified: boolean;
  isPremium: boolean;
  memberCount?: number;
  teamCount?: number;
  ownerId: string;
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateClubDto {
  name: string;
  country: string;
  city: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  logo?: string;
  foundedYear?: number;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export type UpdateClubDto = Partial<CreateClubDto>;

export interface AdminUpdateClubDto extends UpdateClubDto {
  isVerified?: boolean;
  isPremium?: boolean;
}

export interface ClubFilters {
  page?: number;
  pageSize?: number;
  limit?: number;
  country?: string;
  city?: string;
  isVerified?: boolean;
  isPremium?: boolean;
  search?: string;
}

export interface ClubStatistics {
  total: number;
  verified: number;
  premium: number;
  byCountry: Record<string, number>;
}
