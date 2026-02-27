'use client';

import { useState, useCallback, type ChangeEvent, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import Button from './Button';
import Input from './Input';
import Select from './Select';
import LocationAutocomplete from './LocationAutocomplete';
import Modal from './Modal';
import { cn } from '@/utils/helpers';
import type { AgeCategory, TournamentFormat, TournamentLevel } from '@/types';

// Game systems for football based on player count (field players + goalkeeper)
const GAME_SYSTEMS = [
  { value: '5+1', label: '5+1 (6-a-side)' },
  { value: '6+1', label: '6+1 (7-a-side)' },
  { value: '7+1', label: '7+1 (8-a-side)' },
  { value: '8+1', label: '8+1 (9-a-side)' },
  { value: '9+1', label: '9+1 (10-a-side)' },
  { value: '10+1', label: '10+1 (11-a-side)' },
];

const AGE_CATEGORY_OPTIONS = [
  'U5',
  'U6',
  'U7',
  'U8',
  'U9',
  'U10',
  'U11',
  'U12',
  'U13',
  'U14',
  'U15',
  'U16',
  'U17',
  'U18',
  'U19',
  'U20',
  'U21',
  'U22',
  'U23',
  'SENIOR',
  'VETERANS',
] as const;
const TOURNAMENT_LEVELS = ['I', 'II', 'III'] as const;
const TOURNAMENT_FORMATS = ['SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION', 'ROUND_ROBIN', 'GROUPS_PLUS_KNOCKOUT', 'LEAGUE'] as const;
const GROUPS_COUNT_OPTIONS = Array.from({ length: 16 }, (_, i) => {
  const value = i + 1;
  return {
    value: value.toString(),
    label: value === 1 ? '1 Group' : `${value} Groups`,
  };
});

const MATCH_PERIOD_TYPE_OPTIONS = [
  { value: 'ONE_HALF', label: '1 half' },
  { value: 'TWO_HALVES', label: '2 halves' },
];

// Generate birth years from current year down to U23
const currentYear = new Date().getFullYear();
const MIN_BIRTH_YEAR = currentYear - 23;
const BIRTH_YEARS = Array.from({ length: currentYear - MIN_BIRTH_YEAR + 1 }, (_, i) => {
  const year = currentYear - i;
  return { value: year.toString(), label: year.toString() };
});

// Helper functions for format-based conditional rendering
const ELIMINATION_FORMATS: TournamentFormat[] = ['SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION'];
const GROUP_FORMATS: TournamentFormat[] = ['ROUND_ROBIN', 'GROUPS_PLUS_KNOCKOUT', 'LEAGUE'];

const isEliminationFormat = (format?: TournamentFormat): boolean =>
  !!format && ELIMINATION_FORMATS.includes(format);
const isGroupFormat = (format?: TournamentFormat): boolean =>
  !format || GROUP_FORMATS.includes(format);
const isDoubleElimination = (format?: TournamentFormat): boolean =>
  format === 'DOUBLE_ELIMINATION';
// Formats that require explicit group config (number of groups, teams per group)
const isGroupedFormat = (format?: TournamentFormat): boolean =>
  format === 'GROUPS_PLUS_KNOCKOUT';
// Formats that use round-robin scheduling within groups (show match config)
const isRoundRobinBased = (format?: TournamentFormat): boolean =>
  format === 'ROUND_ROBIN' || format === 'LEAGUE' || format === 'GROUPS_PLUS_KNOCKOUT';
const isLeagueFormat = (format?: TournamentFormat): boolean =>
  format === 'LEAGUE';

export interface AgeGroupFormData {
  id?: string;
  birthYear: number;
  displayLabel?: string;
  ageCategory?: AgeCategory;
  level?: TournamentLevel;
  format?: TournamentFormat;
  gameSystem?: string;
  teamCount?: number;
  participationFee?: number;
  startDate?: string;
  endDate?: string;
  registrationStartDate?: string;
  registrationEndDate?: string;
  locationId?: string;
  locationAddress?: string;
  groupsCount?: number;
  fieldsCount?: number;
  teamsPerGroup?: number;
  matchPeriodType?: 'ONE_HALF' | 'TWO_HALVES';
  halfDurationMinutes?: number;
  guaranteedMatches?: number;
  advancementOverride?: number;
  leagueLegs?: number;
  qualifyingTeamsPerGroup?: number;
  notes?: string;
}

interface AgeGroupsManagerProps {
  ageGroups: AgeGroupFormData[];
  onChange: (ageGroups: AgeGroupFormData[]) => void;
  tournamentStartDate?: string;
  tournamentEndDate?: string;
  tournamentLocation?: string;
  disabled?: boolean;
  className?: string;
}

const defaultAgeGroup: Omit<AgeGroupFormData, 'birthYear'> = {
  ageCategory: undefined,
  format: 'GROUPS_PLUS_KNOCKOUT',
  gameSystem: '7+1',
  teamCount: 16,
  teamsPerGroup: 4,
  groupsCount: 1,
  matchPeriodType: 'TWO_HALVES',
  halfDurationMinutes: 15,
};

export function AgeGroupsManager({
  ageGroups,
  onChange,
  tournamentStartDate,
  tournamentEndDate,
  tournamentLocation,
  disabled = false,
  className,
}: AgeGroupsManagerProps) {
  const { t } = useTranslation();
  const ageCategoryOptions = AGE_CATEGORY_OPTIONS.map((cat) => ({
    value: cat,
    label: t(`tournament.ageCategory.${cat}`),
  }));
  const levelOptions = [
    { value: '', label: t('common.none') },
    ...TOURNAMENT_LEVELS.map((level) => ({
      value: level,
      label: t(`tournament.level.${level}`),
    })),
  ];
  const formatOptions = TOURNAMENT_FORMATS.map((format) => ({
    value: format,
    label: t(`tournament.format.${format}`, format.replace(/_/g, ' ')),
  }));
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);

  const getAutoDisplayLabel = (birthYear: number) => {
    const age = currentYear - birthYear;
    return `U${age}`;
  };

  const getAutoAgeCategory = (birthYear: number): AgeCategory | undefined => {
    const age = currentYear - birthYear;
    const category = `U${age}` as AgeCategory;
    return AGE_CATEGORY_OPTIONS.includes(category) ? category : undefined;
  };

  const handleAddAgeGroup = useCallback(() => {
    // Find the next birth year not already used
    const usedYears = new Set(ageGroups.map((ag) => ag.birthYear));
    const nextYear = BIRTH_YEARS.find((y) => !usedYears.has(parseInt(y.value)));

    const birthYear = nextYear ? parseInt(nextYear.value) : currentYear - 10;
    const newAgeGroup: AgeGroupFormData = {
      ...defaultAgeGroup,
      birthYear,
      displayLabel: getAutoDisplayLabel(birthYear),
      ageCategory: getAutoAgeCategory(birthYear),
      ...(tournamentStartDate ? { startDate: tournamentStartDate } : {}),
      ...(tournamentEndDate ? { endDate: tournamentEndDate } : {}),
    };
    
    const newAgeGroups = [...ageGroups, newAgeGroup];
    onChange(newAgeGroups);
    setExpandedIndex(newAgeGroups.length - 1);
  }, [ageGroups, onChange, tournamentStartDate, tournamentEndDate]);

  const handleRemoveAgeGroup = useCallback((index: number) => {
    const newAgeGroups = ageGroups.filter((_, i) => i !== index);
    onChange(newAgeGroups);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
    setDeleteConfirmIndex(null);
  }, [ageGroups, onChange, expandedIndex]);

  const handleRemoveClick = useCallback((index: number) => {
    setDeleteConfirmIndex(index);
  }, []);

  const handleCancelDelete = useCallback(() => {
    setDeleteConfirmIndex(null);
  }, []);

  const handleUpdateAgeGroup = useCallback((index: number, updates: Partial<AgeGroupFormData>) => {
    const newAgeGroups = ageGroups.map((ag, i) => {
      if (i !== index) return ag;

      const updated = { ...ag, ...updates };

      if (updates.birthYear && updates.birthYear !== ag.birthYear) {
        updated.displayLabel = getAutoDisplayLabel(updates.birthYear);
        updated.ageCategory = getAutoAgeCategory(updates.birthYear);
      }
      
      // Auto-calculate groupsCount when teamCount or teamsPerGroup changes
      // Handle format transition state management
      if ('format' in updates) {
        const newFormat = updates.format;
        if (isEliminationFormat(newFormat)) {
          // Clear group-specific fields when switching to elimination format
          updated.groupsCount = undefined;
          updated.teamsPerGroup = undefined;
          updated.leagueLegs = undefined;
          updated.qualifyingTeamsPerGroup = undefined;
          // Set default guaranteed matches for double elimination
          if (isDoubleElimination(newFormat)) {
            updated.guaranteedMatches = updated.guaranteedMatches ?? 2;
          } else {
            // Single elimination: clear double-elimination fields
            updated.guaranteedMatches = undefined;
            updated.advancementOverride = undefined;
          }
        } else if (isLeagueFormat(newFormat)) {
          // League: uses round-robin scheduling, no fixed groups
          updated.groupsCount = undefined;
          updated.teamsPerGroup = undefined;
          updated.qualifyingTeamsPerGroup = undefined;
          updated.guaranteedMatches = undefined;
          updated.advancementOverride = undefined;
          updated.leagueLegs = updated.leagueLegs ?? 2;
        } else if (newFormat === 'ROUND_ROBIN') {
          // Round robin: all teams play each other, no groups needed
          updated.groupsCount = undefined;
          updated.teamsPerGroup = undefined;
          updated.qualifyingTeamsPerGroup = undefined;
          updated.leagueLegs = undefined;
          updated.guaranteedMatches = undefined;
          updated.advancementOverride = undefined;
        } else if (isGroupFormat(newFormat)) {
          // Groups+KO: restore group defaults
          updated.teamsPerGroup = updated.teamsPerGroup ?? 4;
          updated.groupsCount = updated.teamCount && updated.teamsPerGroup
            ? Math.ceil(updated.teamCount / updated.teamsPerGroup)
            : 1;
          updated.leagueLegs = undefined;
          // Clear elimination-specific fields
          updated.guaranteedMatches = undefined;
          updated.advancementOverride = undefined;
        }
      }

      // Auto-calculate groupsCount when teamCount or teamsPerGroup changes (only for group formats)
      if (('teamCount' in updates || 'teamsPerGroup' in updates) && updated.teamCount && updated.teamsPerGroup && isGroupFormat(updated.format)) {
        updated.groupsCount = Math.ceil(updated.teamCount / updated.teamsPerGroup);
      }
      
      return updated;
    });
    onChange(newAgeGroups);
  }, [ageGroups, onChange]);

  const getDisplayLabel = (ag: AgeGroupFormData) => {
    if (ag.displayLabel) return ag.displayLabel;
    return getAutoDisplayLabel(ag.birthYear);
  };

  const getLocationDifferentLabel = () => {
    const locationStr =
      typeof tournamentLocation === 'string' &&
      tournamentLocation !== '[object Object]' &&
      tournamentLocation.trim() !== ''
        ? tournamentLocation
        : null;
    return locationStr
      ? t(
          'tournaments.ageGroups.locationDifferentLabel',
          'This games takes place on a different location than {{location}}',
          { location: locationStr }
        )
      : t(
          'tournaments.ageGroups.locationDifferentLabelFallback',
          'This games takes place on a different location than the tournament address'
        );
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">
          {t('tournaments.ageGroups.title', 'Age Categories')}
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddAgeGroup}
          disabled={disabled}
        >
          + {t('tournaments.ageGroups.add', 'Add Category')}
        </Button>
      </div>

      {ageGroups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
          <p className="text-sm text-gray-500">
            {t('tournaments.ageGroups.empty', 'No age categories defined. Click "Add Category" to create one.')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {ageGroups.map((ageGroup, index) => (
            <div
              key={ageGroup.id || `new-${index}`}
              className="rounded-lg border border-gray-200 bg-white"
            >
              {/* Header - always visible */}
              <div
                className="flex items-center justify-between p-3 cursor-pointer"
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-900">
                    {getDisplayLabel(ageGroup)}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({ageGroup.birthYear})
                  </span>
                  {ageGroup.gameSystem && (
                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                      {ageGroup.gameSystem}
                    </span>
                  )}
                  {ageGroup.format && (
                    <span className={cn(
                      'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium',
                      isEliminationFormat(ageGroup.format)
                        ? 'bg-orange-50 text-orange-700'
                        : 'bg-green-50 text-green-700'
                    )}>
                      {t(`tournament.format.${ageGroup.format}`, ageGroup.format.replace(/_/g, ' '))}
                    </span>
                  )}
                  {ageGroup.teamCount && (
                    <span className="text-xs text-gray-500">
                      {ageGroup.teamCount} {t('tournaments.teams', 'teams')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={(e: MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation();
                      handleRemoveClick(index);
                    }}
                    disabled={disabled}
                    className="text-red-600 hover:text-red-700"
                  >
                    {t('common.remove', 'Remove')}
                  </Button>
                  <svg
                    className={cn(
                      'h-5 w-5 text-gray-400 transition-transform',
                      expandedIndex === index && 'rotate-180'
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expandable content */}
              {expandedIndex === index && (
                <div className="border-t border-gray-200 p-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Birth Year */}
                    <Select
                      label={t('tournaments.ageGroups.birthYear', 'Birth Year')}
                      options={BIRTH_YEARS}
                      value={ageGroup.birthYear.toString()}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => handleUpdateAgeGroup(index, { birthYear: parseInt(e.target.value) })}
                      disabled={disabled}
                      required
                    />

                    {/* Display Label */}
                    <Input
                      label={t('tournaments.ageGroups.displayLabel', 'Display Label')}
                      placeholder={getDisplayLabel(ageGroup)}
                      value={ageGroup.displayLabel || ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleUpdateAgeGroup(index, { displayLabel: e.target.value || undefined })}
                      disabled={disabled}
                      helperText={t(
                        'tournaments.ageGroups.displayLabelHelp',
                        'Auto-filled from birth year and fully editable (e.g., "U12 Elite")'
                      )}
                    />

                    {/* Age Category */}
                    <Select
                      label={t('tournament.ageCategory.label')}
                      options={ageCategoryOptions}
                      value={ageGroup.ageCategory || ''}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => handleUpdateAgeGroup(index, { ageCategory: (e.target.value || undefined) as AgeCategory | undefined })}
                      disabled={disabled}
                    />

                    {/* Tournament Level */}
                    <Select
                      label={t('tournament.level.label')}
                      options={levelOptions}
                      value={ageGroup.level ?? ''}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => handleUpdateAgeGroup(index, { level: (e.target.value || undefined) as TournamentLevel | undefined })}
                      disabled={disabled}
                    />

                    {/* Tournament Format */}
                    <Select
                      label={t('tournament.format.label')}
                      options={formatOptions}
                      value={ageGroup.format || 'GROUPS_PLUS_KNOCKOUT'}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => handleUpdateAgeGroup(index, { format: (e.target.value || undefined) as TournamentFormat | undefined })}
                      disabled={disabled}
                    />

                    {/* Game System */}
                    <Select
                      label={t('tournaments.ageGroups.gameSystem', 'Game System')}
                      options={GAME_SYSTEMS}
                      value={ageGroup.gameSystem || '7+1'}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => handleUpdateAgeGroup(index, { gameSystem: e.target.value })}
                      disabled={disabled}
                    />

                    {/* Team Count */}
                    <Input
                      type="number"
                      label={t('tournaments.ageGroups.teamCount', 'Target Teams')}
                      value={ageGroup.teamCount || ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleUpdateAgeGroup(index, { teamCount: e.target.value ? parseInt(e.target.value) : undefined })}
                      min={2}
                      step={1}
                      disabled={disabled}
                      helperText={t('tournaments.ageGroups.teamCountHelp', 'Expected number of teams')}
                    />

                    {/* Group Configuration - only shown for GROUPS_PLUS_KNOCKOUT */}
                    {isGroupedFormat(ageGroup.format) && (
                      <>
                        {/* Teams Per Group */}
                        <Input
                          type="number"
                          label={t('tournaments.ageGroups.teamsPerGroup', 'Teams Per Group')}
                          value={ageGroup.teamsPerGroup || ''}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => handleUpdateAgeGroup(index, { teamsPerGroup: e.target.value ? parseInt(e.target.value) : undefined })}
                          min={2}
                          max={8}
                          step={1}
                          disabled={disabled}
                          helperText={t('tournaments.ageGroups.teamsPerGroupHelp', 'Usually 4 teams per group')}
                        />

                        {/* Number of Groups */}
                        <Select
                          label={t('tournaments.ageGroups.groupsCount', 'Number of Groups')}
                          options={GROUPS_COUNT_OPTIONS}
                          value={(ageGroup.groupsCount ?? 1).toString()}
                          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                            handleUpdateAgeGroup(index, {
                              groupsCount: e.target.value ? parseInt(e.target.value) : undefined,
                            })
                          }
                          disabled={disabled}
                          helperText={t('tournaments.ageGroups.groupsCountHelp', 'Auto-calculated: Total teams ÷ Teams per group')}
                        />

                        {/* Qualifying Teams Per Group - how many advance to KO stage */}
                        <Input
                          type="number"
                          label={t('tournaments.ageGroups.qualifyingTeamsPerGroup', 'Qualifying Teams per Group')}
                          value={ageGroup.qualifyingTeamsPerGroup ?? ''}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handleUpdateAgeGroup(index, {
                              qualifyingTeamsPerGroup: e.target.value ? parseInt(e.target.value) : undefined,
                            })
                          }
                          min={1}
                          max={8}
                          step={1}
                          disabled={disabled}
                          helperText={t('tournaments.ageGroups.qualifyingTeamsPerGroupHelp', 'Teams advancing from each group to knockout stage (usually 1 or 2)')}
                        />
                      </>
                    )}

                    {/* League Legs - only for LEAGUE format */}
                    {isLeagueFormat(ageGroup.format) && (
                      <Input
                        type="number"
                        label={t('tournaments.ageGroups.leagueLegs', 'League Legs')}
                        value={ageGroup.leagueLegs ?? 2}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          handleUpdateAgeGroup(index, {
                            leagueLegs: e.target.value ? parseInt(e.target.value) : undefined,
                          })
                        }
                        min={1}
                        max={4}
                        step={1}
                        disabled={disabled}
                        helperText={t('tournaments.ageGroups.leagueLegsHelp', '1 = single round-robin, 2 = home & away (double round-robin)')}
                      />
                    )}

                    {/* Match format / field config - shown for round-robin based formats */}
                    {isRoundRobinBased(ageGroup.format) && (
                      <>
                        {/* Number of Fields */}
                        <Input
                          type="number"
                          label={t('tournaments.ageGroups.fieldsCount', 'Number of Fields')}
                          value={ageGroup.fieldsCount ?? ''}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handleUpdateAgeGroup(index, {
                              fieldsCount: e.target.value ? parseInt(e.target.value) : undefined,
                            })
                          }
                          min={1}
                          max={50}
                          step={1}
                          disabled={disabled}
                          helperText={t('tournaments.ageGroups.fieldsCountHelp', 'Number of playing fields available (games running simultaneously)')}
                        />

                        <Select
                          label={t('tournaments.ageGroups.matchHalves', 'Match format')}
                          options={MATCH_PERIOD_TYPE_OPTIONS}
                          value={ageGroup.matchPeriodType || 'TWO_HALVES'}
                          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                            handleUpdateAgeGroup(index, {
                              matchPeriodType: (e.target.value || 'TWO_HALVES') as 'ONE_HALF' | 'TWO_HALVES',
                            })
                          }
                          disabled={disabled}
                        />

                        <Input
                          type="number"
                          label={t('tournaments.ageGroups.halfDuration', 'Duration per half (minutes)')}
                          value={ageGroup.halfDurationMinutes ?? ''}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handleUpdateAgeGroup(index, {
                              halfDurationMinutes: e.target.value ? parseInt(e.target.value) : undefined,
                            })
                          }
                          min={5}
                          max={60}
                          step={1}
                          disabled={disabled}
                          helperText={t('tournaments.ageGroups.halfDurationHelp', 'For 2 halves, this is each half duration (common: 15). For 1 half, use 20-25.')}
                        />
                      </>
                    )}

                    {/* Double Elimination Configuration */}
                    {isDoubleElimination(ageGroup.format) && (
                      <>
                        <Input
                          type="number"
                          label={t('tournaments.ageGroups.guaranteedMatches', 'Guaranteed Matches')}
                          value={ageGroup.guaranteedMatches ?? ''}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => handleUpdateAgeGroup(index, { guaranteedMatches: e.target.value ? parseInt(e.target.value) : undefined })}
                          min={1}
                          max={10}
                          step={1}
                          disabled={disabled}
                          helperText={t('tournaments.ageGroups.guaranteedMatchesHelp', 'Minimum matches each team plays via the losers bracket')}
                        />

                        <Input
                          type="number"
                          label={t('tournaments.ageGroups.advancementOverride', 'Advancement Override')}
                          value={ageGroup.advancementOverride ?? ''}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => handleUpdateAgeGroup(index, { advancementOverride: e.target.value ? parseInt(e.target.value) : undefined })}
                          min={1}
                          step={1}
                          disabled={disabled}
                          helperText={t('tournaments.ageGroups.advancementOverrideHelp', 'Custom number of teams advancing from losers bracket (leave empty for default)')}
                        />
                      </>
                    )}

                    {/* Elimination Format Info Banner */}
                    {isEliminationFormat(ageGroup.format) && (
                      <div className="col-span-1 sm:col-span-2 lg:col-span-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <div className="flex items-start gap-2">
                          <svg className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-blue-800">
                              {ageGroup.format === 'SINGLE_ELIMINATION'
                                ? t('tournaments.ageGroups.singleEliminationInfo', 'Single Elimination: Direct knockout – no group stage. Teams are eliminated after one loss.')
                                : t('tournaments.ageGroups.doubleEliminationInfo', 'Double Elimination: Teams get a second chance through the losers bracket before being eliminated.')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Participation Fee */}
                    <Input
                      type="number"
                      label={t('tournaments.ageGroups.participationFee', 'Participation Fee')}
                      value={ageGroup.participationFee ?? ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleUpdateAgeGroup(index, { participationFee: e.target.value ? parseFloat(e.target.value) : undefined })}
                      min={0}
                      step={1}
                      disabled={disabled}
                      helperText={t('tournaments.ageGroups.participationFeeHelp', 'Leave empty to use tournament default')}
                    />

                    {/* Registration Start Date */}
                    <Input
                      type="date"
                      label={t('tournaments.ageGroups.registrationStartDate', 'Registration Opens')}
                      value={ageGroup.registrationStartDate || ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleUpdateAgeGroup(index, { registrationStartDate: e.target.value || undefined })}
                      disabled={disabled}
                      helperText={t('tournaments.ageGroups.registrationStartDateHelp', 'Leave empty to use tournament default')}
                    />

                    {/* Registration End Date */}
                    <Input
                      type="date"
                      label={t('tournaments.ageGroups.registrationEndDate', 'Registration Closes')}
                      value={ageGroup.registrationEndDate || ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleUpdateAgeGroup(index, { registrationEndDate: e.target.value || undefined })}
                      disabled={disabled}
                      helperText={t('tournaments.ageGroups.registrationEndDateHelp', 'Leave empty to use tournament default')}
                    />

                    {/* Start Date */}
                    <Input
                      type="date"
                      label={t('tournaments.ageGroups.startDate', 'Start Date')}
                      value={ageGroup.startDate || ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleUpdateAgeGroup(index, { startDate: e.target.value || undefined })}
                      disabled={disabled}
                      helperText={t('tournaments.ageGroups.startDateHelp', 'Leave empty to use tournament dates')}
                    />

                    {/* End Date */}
                    <Input
                      type="date"
                      label={t('tournaments.ageGroups.endDate', 'End Date')}
                      value={ageGroup.endDate || ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleUpdateAgeGroup(index, { endDate: e.target.value || undefined })}
                      disabled={disabled}
                    />

                    {/* Notes */}
                    <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('tournaments.ageGroups.notes', 'Notes')}
                        <span className="ml-1 text-xs font-normal text-gray-400">{t('common.optional', '(optional)')}</span>
                      </label>
                      <textarea
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                        rows={3}
                        placeholder={t('tournaments.ageGroups.notesPlaceholder', 'e.g. Special rules, equipment requirements, or remarks for this category...')}
                        value={ageGroup.notes || ''}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                          handleUpdateAgeGroup(index, { notes: e.target.value || undefined })
                        }
                        disabled={disabled}
                        maxLength={2000}
                      />
                      {ageGroup.notes && (
                        <p className="mt-1 text-xs text-gray-400">{ageGroup.notes.length}/2000</p>
                      )}
                    </div>

                    {/* Location Override */}
                    <div className="space-y-3">
                      <label className="flex items-start gap-3 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          checked={ageGroup.locationAddress !== undefined && ageGroup.locationAddress !== null}
                          onChange={(e) =>
                            handleUpdateAgeGroup(index, {
                              locationAddress: e.target.checked ? ageGroup.locationAddress ?? '' : undefined,
                              locationId: undefined,
                            })
                          }
                          disabled={disabled}
                        />
                        <span>{getLocationDifferentLabel()}</span>
                      </label>

                      {(ageGroup.locationAddress !== undefined && ageGroup.locationAddress !== null) && (
                        <LocationAutocomplete
                          label={t('tournaments.ageGroups.locationAddress', 'Game Location Address')}
                          placeholder={t('tournaments.ageGroups.locationAddressPlaceholder', 'Search for address...')}
                          value={ageGroup.locationAddress || ''}
                          onChange={(value) =>
                            handleUpdateAgeGroup(index, {
                              locationAddress: value ?? '',
                              locationId: undefined,
                            })
                          }
                          onSelect={(location) =>
                            handleUpdateAgeGroup(index, {
                              locationAddress: location.formattedAddress,
                              locationId: undefined,
                            })
                          }
                          helperText={t('tournaments.ageGroups.locationAddressHelp', 'Override the default tournament location for this category')}
                          displayMode="address"
                          limit={15}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Dialog for Remove Category */}
      <Modal
        isOpen={deleteConfirmIndex !== null}
        onClose={handleCancelDelete}
        title={t('tournaments.ageGroups.removeConfirmTitle', 'Remove Age Category?')}
        description={t('tournaments.ageGroups.removeConfirmDescription', 'Are you sure you want to remove this category? This action cannot be undone.')}
        size="sm"
        icon={
          <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        }
        iconColor="warning"
        footer={
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelDelete}
              className="flex-1 sm:flex-none"
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => deleteConfirmIndex !== null && handleRemoveAgeGroup(deleteConfirmIndex)}
              className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              {t('common.remove', 'Remove')}
            </Button>
          </div>
        }
      >
        {deleteConfirmIndex !== null && ageGroups[deleteConfirmIndex] && (
          <p className="text-sm text-gray-600">
            {t('tournaments.ageGroups.removeConfirmCategory', 'Category')}: <strong>{getDisplayLabel(ageGroups[deleteConfirmIndex])}</strong> ({ageGroups[deleteConfirmIndex].birthYear})
          </p>
        )}
      </Modal>
    </div>
  );
}

export default AgeGroupsManager;
