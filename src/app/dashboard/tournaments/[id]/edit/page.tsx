'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Textarea, Select, Alert, Loading, FileUpload, FilePreview, InvitationCodeManager, AgeGroupsManager, LocationAutocomplete, Modal } from '@/components/ui';
import type { AgeGroupFormData } from '@/components/ui';
import { tournamentService, fileService } from '@/services';
import { getCurrentLocation } from '@/services/location.service';
import { Tournament } from '@/types';
import type { LocationSuggestion } from '@/types';
import { formatDateForInput } from '@/utils/date';

// Define value arrays for runtime use
const TOURNAMENT_STATUSES = ['PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED'] as const;

const tournamentSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  registrationStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  registrationEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  registrationDeadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  location: z.string().min(3, 'Location is required'),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  rules: z.string().optional(),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  status: z.enum(TOURNAMENT_STATUSES),
  isPrivate: z.boolean().optional(),
});

type TournamentFormData = z.infer<typeof tournamentSchema>;

export default function EditTournamentPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const initialAgeGroupsRef = useRef<string>('');
  const initialHasRegulationsRef = useRef(false);
  const pendingNavigationRef = useRef<null | (() => void)>(null);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);

  // Auto-scroll to error message when error is set
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      // Focus on the error message for accessibility
      errorRef.current.focus();
    }
  }, [error]);
  const [regulationsFile, setRegulationsFile] = useState<File | null>(null);
  const [hasExistingRegulations, setHasExistingRegulations] = useState(false);
  const [ageGroups, setAgeGroups] = useState<AgeGroupFormData[]>([]);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<TournamentFormData>({
    resolver: zodResolver(tournamentSchema),
  });

  const isPrivate = watch('isPrivate');
  const watchedLocation = watch('location');
  const hasUnsavedAgeGroups = useMemo(() => {
    if (!initialAgeGroupsRef.current) return false;
    return initialAgeGroupsRef.current !== JSON.stringify(ageGroups);
  }, [ageGroups]);
  const hasUnsavedRegulations = useMemo(() => {
    if (regulationsFile) return true;
    return hasExistingRegulations !== initialHasRegulationsRef.current;
  }, [regulationsFile, hasExistingRegulations]);
  const hasUnsavedChanges = isDirty || hasUnsavedAgeGroups || hasUnsavedRegulations;

  const getLeaveMessage = useCallback(
    () => t('common.unsavedChangesPrompt', 'You have unsaved changes. Are you sure you want to leave this page?'),
    [t]
  );

  const openLeaveModal = useCallback((action: () => void) => {
    pendingNavigationRef.current = action;
    setLeaveModalOpen(true);
  }, []);

  const closeLeaveModal = useCallback(() => {
    setLeaveModalOpen(false);
    pendingNavigationRef.current = null;
  }, []);

  const confirmLeave = useCallback(() => {
    setLeaveModalOpen(false);
    const action = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    action?.();
  }, []);

  const shouldWarnOnLeave = hasUnsavedChanges && !saving && !success;

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!shouldWarnOnLeave) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [shouldWarnOnLeave]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!shouldWarnOnLeave) return;
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#')) return;
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      event.preventDefault();
      event.stopPropagation();

      openLeaveModal(() => {
        if (href.startsWith('http')) {
          window.location.href = href;
          return;
        }
        router.push(href);
      });
    };

    document.addEventListener('click', handleDocumentClick, true);
    return () => document.removeEventListener('click', handleDocumentClick, true);
  }, [shouldWarnOnLeave, getLeaveMessage]);

  // Handle location selection from autocomplete
  const handleLocationSelect = (location: LocationSuggestion) => {
    setValue('location', location.formattedAddress);
    if (location.latitude && location.longitude) {
      setValue('latitude', location.latitude);
      setValue('longitude', location.longitude);
    }
  };

  // Handle getting current device location
  const handleGetDeviceLocation = async () => {
    setIsGettingLocation(true);
    try {
      const location = await getCurrentLocation();
      setValue('latitude', location.latitude);
      setValue('longitude', location.longitude);
      // Update the location field to show coordinates (user can override with autocomplete)
      setValue('location', `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get location';
      setError(message);
    } finally {
      setIsGettingLocation(false);
    }
  };

  useEffect(() => {
    fetchTournament();
  }, [params.id]);

  const fetchTournament = async () => {
    try {
      const response = await tournamentService.getTournamentById(params.id as string);
      const data = response.data;
      setTournament(data);
      setHasExistingRegulations(!!data.regulationsDocument);
      // Load existing age groups if available
      const mappedAgeGroups = data.ageGroups && data.ageGroups.length > 0
        ? data.ageGroups.map(ag => ({
          id: ag.id,
          birthYear: ag.birthYear,
          displayLabel: ag.displayLabel,
          ageCategory: (ag as any).ageCategory,
          level: (ag as any).level,
          format: (ag as any).format,
          gameSystem: ag.gameSystem,
          teamCount: ag.teamCount,
          startDate: ag.startDate,
          endDate: ag.endDate,
          locationId: ag.locationId,
          locationAddress: ag.locationAddress,
          groupsCount: ag.groupsCount,
          teamsPerGroup: ag.teamsPerGroup,
        }))
        : [];
      setAgeGroups(mappedAgeGroups);
      initialAgeGroupsRef.current = JSON.stringify(mappedAgeGroups);
      initialHasRegulationsRef.current = !!data.regulationsDocument;
      reset({
        name: data.name,
        description: data.description,
        startDate: formatDateForInput(data.startDate),
        endDate: formatDateForInput(data.endDate),
        registrationStartDate: formatDateForInput((data as any).registrationStartDate || ''),
        registrationEndDate: formatDateForInput((data as any).registrationEndDate || ''),
        registrationDeadline: formatDateForInput(data.registrationDeadline || ''),
        location: data.location,
        latitude: data.latitude,
        longitude: data.longitude,
        rules: data.rules || '',
        contactEmail: data.contactEmail || '',
        contactPhone: data.contactPhone || '',
        status: data.status === 'DRAFT' ? 'PUBLISHED' : data.status,
        isPrivate: (data as any).isPrivate || false,
      });
    } catch (err: any) {
      setError('Failed to load tournament');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: TournamentFormData) => {
    setSaving(true);
    setError(null);
    try {
      // Transform form data to match backend UpdateTournamentDto
      // Backend doesn't accept: venue, city, minTeams, format, entryFee, prizeMoney, rules, status
      const updateData = {
        name: data.name,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        registrationStartDate: data.registrationStartDate,
        registrationEndDate: data.registrationEndDate,
        registrationDeadline: data.registrationEndDate || data.registrationDeadline, // Backward compatibility
        location: data.location,
        latitude: data.latitude,
        longitude: data.longitude,
        // Include isPrivate field
        isPrivate: data.isPrivate,
        // Only include contactEmail if it's a valid email (not empty string)
        ...(data.contactEmail && data.contactEmail.trim() !== '' && { contactEmail: data.contactEmail }),
        ...(data.contactPhone && { contactPhone: data.contactPhone }),
      };
      
      // First update the tournament data
      await tournamentService.updateTournament(params.id as string, updateData as any);
      
      // Update age groups if any changes
      if (ageGroups.length > 0 || (tournament?.ageGroups && tournament.ageGroups.length > 0)) {
        try {
          // Strip out fields that are not allowed in UpdateAgeGroupDto
          const sanitizedAgeGroups = ageGroups.map(ag => {
            const { minTeams, maxTeams, numberOfMatches, guaranteedMatches, participationFee, ...allowed } = ag as any;
            return allowed;
          });
          await tournamentService.updateTournamentAgeGroups(params.id as string, sanitizedAgeGroups);
        } catch (ageGroupErr) {
          console.error('Failed to update age groups:', ageGroupErr);
          // Don't fail the whole update, just warn
        }
      }
      
      // Upload new regulations file if one was selected
      if (regulationsFile) {
        try {
          const uploadResponse = await fileService.uploadFile(regulationsFile, {
            entityType: 'tournament',
            entityId: params.id as string,
            isPublic: true,
          });
          
          // Update tournament with the file ID (used for download URL)
          if (uploadResponse.data?.id) {
            await tournamentService.updateTournament(params.id as string, {
              regulationsDocument: uploadResponse.data.id,
            });
          }
        } catch (uploadErr) {
          console.error('Failed to upload regulations file:', uploadErr);
          // Don't fail the whole update, just warn
        }
      }
      
      setSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/tournaments/${params.id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update tournament');
    } finally {
      setSaving(false);
    }
  };

  const statusOptions = TOURNAMENT_STATUSES.map(status => ({
    value: status,
    label: t(`tournament.status.${status}`),
  }));

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!tournament) {
    return (
      <DashboardLayout>
        <Alert variant="error">{error || 'Tournament not found'}</Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => {
            if (!shouldWarnOnLeave) {
              router.back();
              return;
            }
            openLeaveModal(() => router.back());
          }}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="text-sm font-medium">{t('common.back')}</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {t('tournament.edit')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {tournament.name}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
                if (!shouldWarnOnLeave) {
                  router.back();
                  return;
                }
                openLeaveModal(() => router.back());
            }}
            className="self-start sm:self-auto"
          >
            {t('common.cancel')}
          </Button>
        </div>

        {error && (
          <div ref={errorRef} tabIndex={-1} className="outline-none">
            <Alert variant="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </div>
        )}
        {success && <Alert variant="success">{t('common.saveSuccess')}</Alert>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-24">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('tournament.basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label={t('tournament.name')}
                error={errors.name?.message}
                {...register('name')}
              />
              <Textarea
                label={t('tournament.description')}
                rows={4}
                error={errors.description?.message}
                {...register('description')}
              />
              <Select
                label={t('common.status')}
                options={statusOptions}
                error={errors.status?.message}
                {...register('status')}
              />
              
              {/* Private Tournament Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isPrivate"
                  {...register('isPrivate')}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isPrivate" className="text-sm font-medium text-gray-700">
                  {t('tournament.isPrivate', 'Private Tournament')}
                </label>
              </div>
              {isPrivate && (
                <p className="text-sm text-gray-500 mt-1">
                  {t('tournament.isPrivateHelp', 'Private tournaments require an invitation code to register.')}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle>{t('tournament.dates')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="date"
                  label={t('tournament.startDate')}
                  error={errors.startDate?.message}
                  {...register('startDate')}
                />
                <Input
                  type="date"
                  label={t('tournament.endDate')}
                  error={errors.endDate?.message}
                  {...register('endDate')}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="date"
                  label={t('tournament.registrationStartDate', 'Registration Start')}
                  error={errors.registrationStartDate?.message}
                  {...register('registrationStartDate')}
                />
                <Input
                  type="date"
                  label={t('tournament.registrationEndDate', 'Registration End')}
                  error={errors.registrationEndDate?.message}
                  {...register('registrationEndDate')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>{t('tournament.location')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <LocationAutocomplete
                        label={t('tournament.location')}
                    placeholder="Search for city or venue..."
                        value={watchedLocation || ''}
                        onChange={(value) => setValue('location', value, { shouldValidate: true })}
                    onSelect={handleLocationSelect}
                        error={errors.location?.message}
                        required
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGetDeviceLocation}
                    isLoading={isGettingLocation}
                    className="whitespace-nowrap"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {t('common.useMyLocation', 'Use My Location')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Age Categories */}
          <Card>
            <CardHeader>
              <CardTitle>{t('tournaments.ageGroups.title', 'Age Categories')}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {t('tournaments.ageGroups.description', 'Define specific settings for each age category. Each category can have its own dates, fees, and game format.')}
              </p>
            </CardHeader>
            <CardContent>
              <AgeGroupsManager
                ageGroups={ageGroups}
                onChange={setAgeGroups}
                tournamentStartDate={watch('startDate')}
                tournamentEndDate={watch('endDate')}
                tournamentLocation={watch('location')}
                disabled={saving}
              />
            </CardContent>
          </Card>

          {/* Contact & Rules */}
          <Card>
            <CardHeader>
              <CardTitle>{t('common.contact')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="email"
                  label={t('common.email')}
                  error={errors.contactEmail?.message}
                  {...register('contactEmail')}
                />
                <Input
                  type="tel"
                  label={t('common.phone')}
                  error={errors.contactPhone?.message}
                  {...register('contactPhone')}
                />
              </div>
              <Textarea
                label={t('tournament.rules')}
                rows={4}
                error={errors.rules?.message}
                {...register('rules')}
              />
              
              {/* Regulations File Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('tournament.regulationsFile', 'Regulations File (PDF)')}
                </label>
                {regulationsFile ? (
                  <FilePreview
                    file={regulationsFile}
                    onRemove={() => setRegulationsFile(null)}
                  />
                ) : hasExistingRegulations ? (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM6 20V4h5v7h7v9H6z"/>
                          </svg>
                        </div>
                        <span className="text-sm text-gray-600">
                          {t('tournament.existingRegulations', 'Existing regulations document')}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setHasExistingRegulations(false)}
                      >
                        {t('common.replace', 'Replace')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <FileUpload
                    onFilesSelected={(files) => setRegulationsFile(files[0])}
                    accept={{ 'application/pdf': ['.pdf'] }}
                    maxSize={10 * 1024 * 1024}
                  />
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {t('tournament.regulationsHelp', 'Upload tournament regulations as PDF (max 10MB)')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Invitation Code Manager (only for private tournaments) */}
          {isPrivate && tournament && (
            <InvitationCodeManager
              tournamentId={tournament.id}
              tournamentName={tournament.name}
              isPrivate={isPrivate}
              initialCode={(tournament as any).invitationCode}
              initialExpiresAt={(tournament as any).invitationCodeExpiresAt}
            />
          )}

          {/* Actions */}
          <div className="sticky bottom-0 z-10 -mx-4 sm:mx-0 bg-white/95 backdrop-blur border-t border-gray-200 py-4 px-4 sm:px-0">
            <div className="flex justify-end gap-4 max-w-4xl mx-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (!shouldWarnOnLeave) {
                    router.back();
                    return;
                  }
                  openLeaveModal(() => router.back());
                }}
              >
              {t('common.cancel')}
              </Button>
              <Button type="submit" variant="primary" isLoading={saving}>
              {t('common.save')}
              </Button>
            </div>
          </div>
        </form>
      </div>
      <Modal
        isOpen={leaveModalOpen}
        onClose={closeLeaveModal}
        title={t('common.unsavedChangesTitle', 'Unsaved changes')}
        description={getLeaveMessage()}
        size="sm"
        footer={(
          <>
            <Button type="button" variant="danger" onClick={confirmLeave}>
              {t('common.leave', 'Leave')}
            </Button>
            <Button type="button" variant="outline" onClick={closeLeaveModal}>
              {t('common.stay', 'Stay')}
            </Button>
          </>
        )}
      >
        <div className="text-sm text-gray-600">
          {t('common.unsavedChangesDetail', 'Changes you made may not be saved.')}
        </div>
      </Modal>
    </DashboardLayout>
  );
}
