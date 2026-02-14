export interface Team {
  id: string;
  name: string;
  clubId: string;
  club?: {
    id: string;
    name: string;
    logo?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamDto {
  clubId: string;
  name: string;
}