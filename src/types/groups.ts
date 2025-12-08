// Group & Draw types
export interface Group {
  id: string;
  tournamentId: string;
  groupLetter: string;
  groupOrder?: number;
  teams: GroupTeam[];
}

export interface GroupTeam {
  id: string;
  registrationId: string;
  registration?: {
    id: string;
    club: {
      id: string;
      name: string;
      country: string;
      logo?: string;
    };
  };
  position?: number;
  played?: number;
  won?: number;
  drawn?: number;
  lost?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  goalDifference?: number;
  points?: number;
}

export interface ExecuteDrawDto {
  numberOfGroups: number;
  seed?: string;
}

export interface CreateGroupDto {
  groupLetter: string;
  teams?: string[];
  groupOrder?: number;
}

export interface ManualGroupAssignmentDto {
  registrationId: string;
  groupLetter: string;
}

export interface UpdateBracketDto {
  assignments: ManualGroupAssignmentDto[];
}

export interface Bracket {
  groups: Group[];
  knockoutStage?: KnockoutMatch[];
}

export interface KnockoutMatch {
  id: string;
  round: string;
  matchNumber: number;
  homeTeam?: {
    id: string;
    name: string;
    logo?: string;
  };
  awayTeam?: {
    id: string;
    name: string;
    logo?: string;
  };
  homeScore?: number;
  awayScore?: number;
  scheduledAt?: string;
  completedAt?: string;
  nextMatchId?: string;
}
