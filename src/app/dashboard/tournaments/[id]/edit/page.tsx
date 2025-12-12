'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Textarea, Select, Alert, Loading } from '@/components/ui';
import { tournamentService } from '@/services';
import { Tournament } from '@/types';
import { formatDateForInput } from '@/utils/date';

// Define value arrays for runtime use
const AGE_CATEGORIES = ['U8', 'U10', 'U12', 'U14', 'U16', 'U18', 'U21', 'SENIOR', 'VETERANS'] as const;
const TOURNAMENT_LEVELS = ['I', 'II', 'III'] as const;
const TOURNAMENT_FORMATS = ['SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION', 'ROUND_ROBIN', 'GROUPS_PLUS_KNOCKOUT', 'LEAGUE'] as const;
const TOURNAMENT_STATUSES = ['DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED'] as const;

const tournamentSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  registrationDeadline: z.string().min(1, 'Registration deadline is required'),
  location: z.string().min(3, 'Location is required'),
  venue: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  country: z.string().min(2, 'Country is required'),
  maxTeams: z.number().min(4, 'Minimum 4 teams').max(64, 'Maximum 64 teams'),
  minTeams: z.number().min(2, 'Minimum 2 teams'),
  ageCategory: z.enum(AGE_CATEGORIES),
  level: z.enum(TOURNAMENT_LEVELS),
  format: z.enum(TOURNAMENT_FORMATS),
  entryFee: z.number().min(0, 'Entry fee cannot be negative'),
  prizeMoney: z.number().min(0, 'Prize money cannot be negative').optional(),
  rules: z.string().optional(),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  status: z.enum(TOURNAMENT_STATUSES),
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TournamentFormData>({
    resolver: zodResolver(tournamentSchema),
  });

  useEffect(() => {
    fetchTournament();
  }, [params.id]);

  const fetchTournament = async () => {
    try {
      const response = await tournamentService.getTournamentById(params.id as string);
      const data = response.data;
      setTournament(data);
      reset({
        name: data.name,
        description: data.description,
        startDate: formatDateForInput(data.startDate),
        endDate: formatDateForInput(data.endDate),
        registrationDeadline: formatDateForInput(data.registrationDeadline || ''),
        location: data.location,
        venue: (data as any).venue || '',
        city: (data as any).city || '',
        country: data.country || '',
        maxTeams: data.maxTeams,
        minTeams: (data as any).minTeams || 2,
        ageCategory: data.ageCategory,
        level: data.level,
        format: (data.format || 'ROUND_ROBIN') as 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION' | 'ROUND_ROBIN' | 'GROUPS_PLUS_KNOCKOUT' | 'LEAGUE',
        entryFee: data.entryFee || 0,
        prizeMoney: data.prizeMoney || 0,
        rules: data.rules || '',
        contactEmail: data.contactEmail || '',
        contactPhone: data.contactPhone || '',
        status: data.status,
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
      await tournamentService.updateTournament(params.id as string, data);
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

  const ageCategoryOptions = AGE_CATEGORIES.map(cat => ({
    value: cat,
    label: t(`tournament.ageCategory.${cat}`),
  }));

  const levelOptions = TOURNAMENT_LEVELS.map(level => ({
    value: level,
    label: t(`tournament.level.${level}`),
  }));

  const formatOptions = TOURNAMENT_FORMATS.map(format => ({
    value: format,
    label: format.replace(/_/g, ' '),
  }));

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {t('tournament.edit')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              {tournament.name}
            </p>
          </div>
          <Button variant="outline" onClick={() => router.back()} className="self-start sm:self-auto">
            {t('common.cancel')}
          </Button>
        </div>

        {error && <Alert variant="error">{error}</Alert>}
        {success && <Alert variant="success">{t('common.saveSuccess')}</Alert>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label={t('tournament.ageCategory.label')}
                  options={ageCategoryOptions}
                  error={errors.ageCategory?.message}
                  {...register('ageCategory')}
                />
                <Select
                  label={t('tournament.level.label')}
                  options={levelOptions}
                  error={errors.level?.message}
                  {...register('level')}
                />
                <Select
                  label={t('tournament.format.label')}
                  options={formatOptions}
                  error={errors.format?.message}
                  {...register('format')}
                />
              </div>
              <Select
                label={t('common.status')}
                options={statusOptions}
                error={errors.status?.message}
                {...register('status')}
              />
            </CardContent>
          </Card>

          {/* Dates */}
          <Card>
            <CardHeader>
              <CardTitle>{t('tournament.dates')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <Input
                  type="date"
                  label={t('tournament.registrationDeadline')}
                  error={errors.registrationDeadline?.message}
                  {...register('registrationDeadline')}
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
              <Input
                label={t('tournament.location')}
                error={errors.location?.message}
                {...register('location')}
              />
              <Input
                label={t('tournament.venue')}
                error={errors.venue?.message}
                {...register('venue')}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('common.city')}
                  error={errors.city?.message}
                  {...register('city')}
                />
                <Input
                  label={t('common.country')}
                  error={errors.country?.message}
                  {...register('country')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Teams */}
          <Card>
            <CardHeader>
              <CardTitle>{t('common.teams')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="number"
                  label={t('tournament.minTeams')}
                  error={errors.minTeams?.message}
                  {...register('minTeams', { valueAsNumber: true })}
                />
                <Input
                  type="number"
                  label={t('tournament.maxTeams')}
                  error={errors.maxTeams?.message}
                  {...register('maxTeams', { valueAsNumber: true })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="number"
                  label={t('tournament.entryFee')}
                  error={errors.entryFee?.message}
                  {...register('entryFee', { valueAsNumber: true })}
                />
                <Input
                  type="number"
                  label={t('tournament.prizeMoney')}
                  error={errors.prizeMoney?.message}
                  {...register('prizeMoney', { valueAsNumber: true })}
                />
              </div>
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
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" isLoading={saving}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
