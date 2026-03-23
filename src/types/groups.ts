// Group & Draw types
export interface GroupTeamDetail {
  teamName: string;
  logo?: string;
  club?: { id: string; name: string; country: string; logo?: string };
}

export interface Group {
  id: string;
  tournamentId: string;
  ageGroupId?: string;
  groupLetter: string;
  groupOrder?: number;
  teams: string[];
  teamDetails?: Record<string, GroupTeamDetail>;
  /** Manual tiebreak order: teamIds ordered by rank (set by organizer) */
  tieBreakOrder?: string[] | null;
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
  // Two-legged tie fields (leg 1 = at team1 home, leg 2 = at team2 home)
  leg1Team1Score?: number | null;
  leg1Team2Score?: number | null;
  leg2Team1Score?: number | null;
  leg2Team2Score?: number | null;
  winnerId?: string;
  loserId?: string;
  manualWinnerId?: string;
  isManualOverride?: boolean;
  scheduledAt?: string;
  courtNumber?: number;
  fieldName?: string;
  locationId?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  nextMatchId?: string;
  loserNextMatchId?: string;
  groupLetter?: string; // set for group-phase matches in GROUPS_PLUS_KNOCKOUT / GROUPS_ONLY
}

export interface PlayoffRound {
  roundNumber: number;
  roundName: string;
  bracket?: 'winners' | 'losers' | 'grand_final' | 'third_place';
  matches: BracketMatch[];
}

export interface MatchesResponse {
  matches: BracketMatch[];
  bracketType?: string;
  playoffRounds?: PlayoffRound[];
  teams: { id: string; name: string; clubName?: string }[];
  advancingTeamsPerGroup?: number;
}

export interface UpdateMatchAdvancementDto {
  advancingTeamId: string;
}

export interface UpdateMatchScoreDto {
  team1Score?: number;
  team2Score?: number;
  leg1Team1Score?: number | null;
  leg1Team2Score?: number | null;
  leg2Team1Score?: number | null;
  leg2Team2Score?: number | null;
  advancingTeamId?: string;
  status?: string;
}
