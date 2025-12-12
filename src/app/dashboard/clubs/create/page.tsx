'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Textarea, Select, Alert, FileUpload } from '@/components/ui';
import { clubService } from '@/services';

const clubSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  shortName: z.string().min(2, 'Short name must be at least 2 characters').max(10, 'Short name max 10 characters').optional(),
  description: z.string().optional(),
  foundedYear: z.number().min(1800, 'Invalid year').max(new Date().getFullYear(), 'Year cannot be in the future').optional(),
  city: z.string().min(2, 'City is required'),
  country: z.string().min(2, 'Country is required'),
  address: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  colors: z.string().optional(),
});

type ClubFormData = z.infer<typeof clubSchema>;

export default function CreateClubPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClubFormData>({
    resolver: zodResolver(clubSchema),
    defaultValues: {
      country: 'Romania',
    },
  });

  const onSubmit = async (data: ClubFormData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await clubService.createClub(data);
      const club = (response as any)?.data || response;
      
      // TODO: Upload logo functionality to be implemented
      // if (logoFile && club.id) {
      //   const formData = new FormData();
      //   formData.append('logo', logoFile);
      //   await clubService.uploadLogo(club.id, formData);
      // }
      
      router.push(`/dashboard/clubs/${club.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create club');
    } finally {
      setLoading(false);
    }
  };

  const countryOptions = [
    { value: 'Romania', label: 'Romania' },
    { value: 'Bulgaria', label: 'Bulgaria' },
    { value: 'Hungary', label: 'Hungary' },
    { value: 'Serbia', label: 'Serbia' },
    { value: 'Moldova', label: 'Moldova' },
    { value: 'Ukraine', label: 'Ukraine' },
    { value: 'Germany', label: 'Germany' },
    { value: 'France', label: 'France' },
    { value: 'Italy', label: 'Italy' },
    { value: 'Spain', label: 'Spain' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {t('clubs.create')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Create a new club to manage players and register for tournaments
            </p>
          </div>
          <Button variant="outline" onClick={() => router.back()} className="self-start sm:self-auto">
            {t('common.cancel')}
          </Button>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Logo */}
          <Card>
            <CardHeader>
              <CardTitle>Club Logo</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload
                accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
                maxSize={5 * 1024 * 1024}
                onFilesSelected={(files) => setLogoFile(files[0])}
              />
              <p className="text-sm text-gray-500 mt-2">PNG, JPG up to 5MB</p>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t('clubs.info')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('clubs.name')}
                  placeholder="FC Example"
                  error={errors.name?.message}
                  {...register('name')}
                />
                <Input
                  label={t('clubs.shortName')}
                  placeholder="FCE"
                  error={errors.shortName?.message}
                  {...register('shortName')}
                />
              </div>
              <Textarea
                label={t('common.description')}
                placeholder="Tell us about your club..."
                rows={4}
                error={errors.description?.message}
                {...register('description')}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="number"
                  label={t('clubs.foundedYear')}
                  placeholder="1990"
                  error={errors.foundedYear?.message}
                  {...register('foundedYear', { valueAsNumber: true })}
                />
                <Input
                  label={t('clubs.colors')}
                  placeholder="Red and White"
                  error={errors.colors?.message}
                  {...register('colors')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>{t('common.location')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label={t('common.city')}
                  placeholder="Bucharest"
                  error={errors.city?.message}
                  {...register('city')}
                />
                <Select
                  label={t('common.country')}
                  options={countryOptions}
                  error={errors.country?.message}
                  {...register('country')}
                />
              </div>
              <Input
                label={t('common.address')}
                placeholder="Street address"
                error={errors.address?.message}
                {...register('address')}
              />
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>{t('common.contact')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="email"
                  label={t('common.email')}
                  placeholder="club@example.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
                <Input
                  type="tel"
                  label={t('common.phone')}
                  placeholder="+40 xxx xxx xxx"
                  error={errors.phone?.message}
                  {...register('phone')}
                />
              </div>
              <Input
                type="url"
                label={t('common.website')}
                placeholder="https://example.com"
                error={errors.website?.message}
                {...register('website')}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              {t('clubs.create')}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
