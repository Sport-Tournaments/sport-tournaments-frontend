export interface Player {
  id: string;
  firstname: string;
  lastname: string;
  dateOfBirth: string;
  teams?: Team[];
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  name: string;
  ageCategory?: string | null;
  birthyear?: number | null;
  coach?: string | null;
  coachPhone?: string | null;
  clubId: string;
  logo?: string;
  club?: {
    id: string;
    name: string;
    logo?: string;
  };
  players?: Player[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamDto {
  clubId: string;
  name: string;
  ageCategory?: string;
  birthyear?: number;
  coach?: string;
  coachPhone?: string;
  playerIds?: string[];
}

export interface UpdateTeamDto {
  clubId?: string;
  name?: string;
  ageCategory?: string;
  birthyear?: number;
  coach?: string;
  coachPhone?: string;
  playerIds?: string[];
}

export interface CreatePlayerDto {
  firstname: string;
  lastname: string;
  dateOfBirth: string;
  teamIds?: string[];
}

export interface UpdatePlayerDto {
  firstname?: string;
  lastname?: string;
  dateOfBirth?: string;
  teamIds?: string[];
}

export interface PlayerAutocomplete {
  id: string;
  firstname: string;
  lastname: string;
  label: string;
}
