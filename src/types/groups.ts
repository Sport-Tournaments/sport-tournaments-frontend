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

// Match interface aligned with backend bracket-generator
export interface BracketMatch {
  id: string;
  round: number;
  matchNumber: number;
  team1Id?: string;
  team2Id?: string;
  team1Name?: string;
  team2Name?: string;
  team1Score?: number;
  team2Score?: number;
  winnerId?: string;
  loserId?: string;
  manualWinnerId?: string;
  isManualOverride?: boolean;
  scheduledAt?: string;
  locationId?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  nextMatchId?: string;
  loserNextMatchId?: string;
}

export interface PlayoffRound {
  roundNumber: number;
  roundName: string;
  matches: BracketMatch[];
}

export interface MatchesResponse {
  matches: BracketMatch[];
  bracketType?: string;
  playoffRounds?: PlayoffRound[];
  teams: { id: string; name: string; clubName?: string }[];
}

export interface UpdateMatchAdvancementDto {
  advancingTeamId: string;
}

export interface UpdateMatchScoreDto {
  team1Score?: number;
  team2Score?: number;
  advancingTeamId?: string;
  status?: string;
}
