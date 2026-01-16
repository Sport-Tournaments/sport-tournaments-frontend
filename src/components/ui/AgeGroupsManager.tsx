'use client';

import { useState, useCallback, type ChangeEvent, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import Button from './Button';
import Input from './Input';
import Select from './Select';
import { cn } from '@/utils/helpers';

// Game systems for football based on player count (field players + goalkeeper)
const GAME_SYSTEMS = [
  { value: '5+1', label: '5+1 (6-a-side)' },
  { value: '6+1', label: '6+1 (7-a-side)' },
  { value: '7+1', label: '7+1 (8-a-side)' },
  { value: '8+1', label: '8+1 (9-a-side)' },
  { value: '9+1', label: '9+1 (10-a-side)' },
  { value: '10+1', label: '10+1 (11-a-side)' },
];

// Generate birth years from 2005 to current year
const currentYear = new Date().getFullYear();
const BIRTH_YEARS = Array.from({ length: currentYear - 2005 + 1 }, (_, i) => {
  const year = currentYear - i;
  return { value: year.toString(), label: year.toString() };
});

export interface AgeGroupFormData {
  id?: string;
  birthYear: number;
  displayLabel?: string;
  gameSystem?: string;
  teamCount?: number;
  minTeams?: number;
  maxTeams?: number;
  guaranteedMatches?: number;
  startDate?: string;
  endDate?: string;
  participationFee?: number;
  groupsCount?: number;
  teamsPerGroup?: number;
  numberOfMatches?: number;
}

interface AgeGroupsManagerProps {
  ageGroups: AgeGroupFormData[];
  onChange: (ageGroups: AgeGroupFormData[]) => void;
  tournamentStartDate?: string;
  tournamentEndDate?: string;
  tournamentParticipationFee?: number;
  disabled?: boolean;
  className?: string;
}

const defaultAgeGroup: Omit<AgeGroupFormData, 'birthYear'> = {
  gameSystem: '7+1',
  teamCount: 16,
  minTeams: 4,
  teamsPerGroup: 4,
  groupsCount: 4,
  numberOfMatches: 3,
};

export function AgeGroupsManager({
  ageGroups,
  onChange,
  tournamentStartDate,
  tournamentEndDate,
  tournamentParticipationFee,
  disabled = false,
  className,
}: AgeGroupsManagerProps) {
  const { t } = useTranslation();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleAddAgeGroup = useCallback(() => {
    // Find the next birth year not already used
    const usedYears = new Set(ageGroups.map((ag) => ag.birthYear));
    const nextYear = BIRTH_YEARS.find((y) => !usedYears.has(parseInt(y.value)));
    
    const newAgeGroup: AgeGroupFormData = {
      ...defaultAgeGroup,
      birthYear: nextYear ? parseInt(nextYear.value) : currentYear - 10,
      startDate: tournamentStartDate,
      endDate: tournamentEndDate,
      participationFee: tournamentParticipationFee,
    };
    
    const newAgeGroups = [...ageGroups, newAgeGroup];
    onChange(newAgeGroups);
    setExpandedIndex(newAgeGroups.length - 1);
  }, [ageGroups, onChange, tournamentStartDate, tournamentEndDate, tournamentParticipationFee]);

  const handleRemoveAgeGroup = useCallback((index: number) => {
    const newAgeGroups = ageGroups.filter((_, i) => i !== index);
    onChange(newAgeGroups);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
  }, [ageGroups, onChange, expandedIndex]);

  const handleUpdateAgeGroup = useCallback((index: number, updates: Partial<AgeGroupFormData>) => {
    const newAgeGroups = ageGroups.map((ag, i) => {
      if (i !== index) return ag;
      
      const updated = { ...ag, ...updates };
      
      // Auto-calculate groupsCount when teamCount or teamsPerGroup changes
      if (('teamCount' in updates || 'teamsPerGroup' in updates) && updated.teamCount && updated.teamsPerGroup) {
        updated.groupsCount = Math.ceil(updated.teamCount / updated.teamsPerGroup);
      }
      
      return updated;
    });
    onChange(newAgeGroups);
  }, [ageGroups, onChange]);

  const getDisplayLabel = (ag: AgeGroupFormData) => {
    if (ag.displayLabel) return ag.displayLabel;
    // Calculate U-category based on birth year
    const age = currentYear - ag.birthYear;
    return `U${age}`;
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
                      handleRemoveAgeGroup(index);
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
                      helperText={t('tournaments.ageGroups.displayLabelHelp', 'Custom label (e.g., "U12 Elite")')}
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

                    {/* Min Teams */}
                    <Input
                      type="number"
                      label={t('tournaments.ageGroups.minTeams', 'Min Teams')}
                      value={ageGroup.minTeams || ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleUpdateAgeGroup(index, { minTeams: e.target.value ? parseInt(e.target.value) : undefined })}
                      min={2}
                      step={1}
                      disabled={disabled}
                      helperText={t('tournaments.ageGroups.minTeamsHelp', 'Minimum to run this category')}
                    />

                    {/* Max Teams */}
                    <Input
                      type="number"
                      label={t('tournaments.ageGroups.maxTeams', 'Max Teams')}
                      value={ageGroup.maxTeams || ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleUpdateAgeGroup(index, { maxTeams: e.target.value ? parseInt(e.target.value) : undefined })}
                      min={2}
                      max={128}
                      step={1}
                      disabled={disabled}
                      helperText={t('tournaments.ageGroups.maxTeamsHelp', 'Maximum teams allowed')}
                    />

                    {/* Guaranteed Matches */}
                    <Input
                      type="number"
                      label={t('tournaments.ageGroups.guaranteedMatches', 'Guaranteed Matches')}
                      value={ageGroup.guaranteedMatches || ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleUpdateAgeGroup(index, { guaranteedMatches: e.target.value ? parseInt(e.target.value) : undefined })}
                      min={1}
                      max={20}
                      step={1}
                      disabled={disabled}
                      helperText={t('tournaments.ageGroups.guaranteedMatchesHelp', 'Minimum matches each team will play')}
                    />

                    {/* Participation Fee */}
                    <Input
                      type="number"
                      label={t('tournaments.ageGroups.participationFee', 'Participation Fee')}
                      value={ageGroup.participationFee ?? ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleUpdateAgeGroup(index, { participationFee: e.target.value ? parseFloat(e.target.value) : undefined })}
                      min={0}
                      step={0.01}
                      disabled={disabled}
                      helperText={t('tournaments.ageGroups.participationFeeHelp', 'Leave empty to use tournament default')}
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
                    <Input
                      type="number"
                      label={t('tournaments.ageGroups.groupsCount', 'Number of Groups')}
                      value={ageGroup.groupsCount || ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleUpdateAgeGroup(index, { groupsCount: e.target.value ? parseInt(e.target.value) : undefined })}
                      min={1}
                      max={16}
                      step={1}
                      disabled={disabled}
                      helperText={t('tournaments.ageGroups.groupsCountHelp', 'Auto-calculated: Total teams ÷ Teams per group')}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AgeGroupsManager;
