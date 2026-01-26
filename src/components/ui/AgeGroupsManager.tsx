'use client';

import { useState, useCallback, type ChangeEvent, type MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import Button from './Button';
import Input from './Input';
import Select from './Select';
import LocationAutocomplete from './LocationAutocomplete';
import Modal from './Modal';
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
  startDate?: string;
  endDate?: string;
  locationId?: string;
  locationAddress?: string;
  groupsCount?: number;
  teamsPerGroup?: number;
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
  gameSystem: '7+1',
  teamCount: 16,
  teamsPerGroup: 4,
  groupsCount: 4,
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
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);

  const handleAddAgeGroup = useCallback(() => {
    // Find the next birth year not already used
    const usedYears = new Set(ageGroups.map((ag) => ag.birthYear));
    const nextYear = BIRTH_YEARS.find((y) => !usedYears.has(parseInt(y.value)));
    
    const newAgeGroup: AgeGroupFormData = {
      ...defaultAgeGroup,
      birthYear: nextYear ? parseInt(nextYear.value) : currentYear - 10,
      startDate: tournamentStartDate,
      endDate: tournamentEndDate,
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

  const getLocationDifferentLabel = () =>
    tournamentLocation
      ? t(
          'tournaments.ageGroups.locationDifferentLabel',
          'This games takes place on a different location than {{location}}',
          { location: tournamentLocation }
        )
      : t(
          'tournaments.ageGroups.locationDifferentLabelFallback',
          'This games takes place on a different location than the tournament address'
        );

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

                    {/* Teams Per Group - moved here per issue #73 */}
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

                    {/* Number of Groups - moved here per issue #73 */}
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
                          searchContext={tournamentLocation}
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
