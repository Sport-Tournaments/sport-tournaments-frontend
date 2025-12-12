'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Textarea, Select, Alert, FileUpload, FilePreview } from '@/components/ui';
import { tournamentService } from '@/services';
import type { AgeCategory, TournamentFormat } from '@/types';

const AGE_CATEGORIES: AgeCategory[] = ['U8', 'U10', 'U12', 'U14', 'U16', 'U18', 'U21', 'SENIOR', 'VETERANS'];
const TOURNAMENT_FORMATS: TournamentFormat[] = ['SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION', 'ROUND_ROBIN', 'GROUPS_PLUS_KNOCKOUT'];

const tournamentSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  location: z.string().min(2, 'Location is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  registrationStartDate: z.string().min(1, 'Registration start date is required'),
  registrationEndDate: z.string().min(1, 'Registration end date is required'),
  maxTeams: z.coerce.number().min(2, 'Minimum 2 teams').max(128, 'Maximum 128 teams'),
  minTeams: z.coerce.number().min(2, 'Minimum 2 teams'),
  registrationFee: z.coerce.number().min(0, 'Fee cannot be negative'),
  format: z.enum(['SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION', 'ROUND_ROBIN', 'GROUPS_PLUS_KNOCKOUT'] as const),
  ageCategory: z.enum(['U8', 'U10', 'U12', 'U14', 'U16', 'U18', 'U21', 'SENIOR', 'VETERANS'] as const),
  rules: z.string().optional(),
  numberOfGroups: z.coerce.number().min(1).max(16).optional(),
  teamsPerGroup: z.coerce.number().min(2).max(8).optional(),
});

type TournamentFormData = z.infer<typeof tournamentSchema>;

export default function CreateTournamentPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<TournamentFormData>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      format: 'GROUPS_PLUS_KNOCKOUT' as const,
      ageCategory: 'SENIOR' as const,
      maxTeams: 16,
      minTeams: 4,
      registrationFee: 0,
      numberOfGroups: 4,
      teamsPerGroup: 4,
    },
  });

  const selectedFormat = watch('format');

  const onSubmit = async (data: TournamentFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const tournamentData = {
        ...data,
        format: data.format as string,
        ageCategory: data.ageCategory as string,
      };
      const response = await tournamentService.createTournament(tournamentData as any);

      // Upload banner if provided (service method not yet implemented)
      // if (bannerFile && response.data?.id) {
      //   try {
      //     await tournamentService.uploadBanner(response.data.id, bannerFile);
      //   } catch (uploadError) {
      //     console.error('Banner upload failed:', uploadError);
      //   }
      // }

      router.push(`/dashboard/tournaments/${response.data?.id}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create tournament';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatOptions = TOURNAMENT_FORMATS.map((format) => ({
    value: format as string,
    label: t(`tournament.format.${format}`),
  }));

  const ageCategoryOptions = AGE_CATEGORIES.map((category) => ({
    value: category as string,
    label: t(`tournament.ageCategory.${category}`),
  }));

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {t('tournament.createNew')}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            {t('tournament.createDesc')}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <Alert variant="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t('tournament.basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label={t('tournament.name')}
                placeholder={t('tournament.namePlaceholder')}
                error={errors.name?.message}
                {...register('name')}
              />

              <Textarea
                label={t('tournament.description')}
                placeholder={t('tournament.descriptionPlaceholder')}
                rows={4}
                error={errors.description?.message}
                {...register('description')}
              />

              <Input
                label={t('tournament.location')}
                placeholder={t('tournament.locationPlaceholder')}
                error={errors.location?.message}
                {...register('location')}
              />

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('tournament.banner')}
                </label>
                {bannerFile ? (
                  <FilePreview
                    file={bannerFile}
                    onRemove={() => setBannerFile(null)}
                  />
                ) : (
                  <FileUpload
                    onFilesSelected={(files) => setBannerFile(files[0])}
                    accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
                    maxSize={5 * 1024 * 1024}
                  />
                )}
              </div>
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
                  label={t('tournament.registrationStartDate')}
                  type="datetime-local"
                  error={errors.registrationStartDate?.message}
                  {...register('registrationStartDate')}
                />
                <Input
                  label={t('tournament.registrationEndDate')}
                  type="datetime-local"
                  error={errors.registrationEndDate?.message}
                  {...register('registrationEndDate')}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('tournament.startDate')}
                  type="datetime-local"
                  error={errors.startDate?.message}
                  {...register('startDate')}
                />
                <Input
                  label={t('tournament.endDate')}
                  type="datetime-local"
                  error={errors.endDate?.message}
                  {...register('endDate')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Format & Settings */}
          <Card>
            <CardHeader>
              <CardTitle>{t('tournament.formatSettings')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  name="format"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label={t('tournament.format')}
                      options={formatOptions}
                      error={errors.format?.message}
                      {...field}
                    />
                  )}
                />
                <Controller
                  name="ageCategory"
                  control={control}
                  render={({ field }) => (
                    <Select
                      label={t('tournament.ageCategory')}
                      options={ageCategoryOptions}
                      error={errors.ageCategory?.message}
                      {...field}
                    />
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label={t('tournament.minTeams')}
                  type="number"
                  min={2}
                  error={errors.minTeams?.message}
                  {...register('minTeams')}
                />
                <Input
                  label={t('tournament.maxTeams')}
                  type="number"
                  min={2}
                  max={128}
                  error={errors.maxTeams?.message}
                  {...register('maxTeams')}
                />
                <Input
                  label={t('tournament.registrationFee')}
                  type="number"
                  min={0}
                  step={0.01}
                  leftIcon={<span className="text-gray-500">€</span>}
                  error={errors.registrationFee?.message}
                  {...register('registrationFee')}
                />
              </div>

              {(selectedFormat === 'GROUPS_PLUS_KNOCKOUT' ||
                selectedFormat === 'ROUND_ROBIN') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={t('tournament.numberOfGroups')}
                    type="number"
                    min={1}
                    max={16}
                    error={errors.numberOfGroups?.message}
                    {...register('numberOfGroups')}
                  />
                  <Input
                    label={t('tournament.teamsPerGroup')}
                    type="number"
                    min={2}
                    max={8}
                    error={errors.teamsPerGroup?.message}
                    {...register('teamsPerGroup')}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rules */}
          <Card>
            <CardHeader>
              <CardTitle>{t('tournament.rules')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                label={t('tournament.rulesOptional')}
                placeholder={t('tournament.rulesPlaceholder')}
                rows={6}
                error={errors.rules?.message}
                {...register('rules')}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
            >
              {t('tournament.createTournament')}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
