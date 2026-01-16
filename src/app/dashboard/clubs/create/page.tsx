'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Textarea, Select, Alert, FileUpload, FilePreview, ColorPicker, ColorCombinationPicker, LocationAutocomplete } from '@/components/ui';
import { clubService } from '@/services';
import { getCurrentLocation } from '@/services/location.service';
import type { LocationSuggestion } from '@/types';

const clubSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  shortName: z.string().optional().or(z.literal(''))
    .transform(val => !val || val === '' ? undefined : val)
    .refine(val => !val || val.length >= 2, { message: 'Short name must be at least 2 characters' })
    .refine(val => !val || val.length <= 10, { message: 'Short name max 10 characters' }),
  description: z.string().optional(),
  foundedYear: z.union([
    z.string().optional().or(z.literal('')),
    z.number(),
    z.null(),
    z.undefined(),
  ])
    .transform(val => {
      if (val === null || val === undefined || val === '') return undefined;
      const num = typeof val === 'string' ? parseInt(val, 10) : val;
      if (isNaN(num)) return undefined;
      return num;
    })
    .refine(val => val === undefined || (val >= 1800 && val <= new Date().getFullYear()), {
      message: 'Invalid year'
    }),
  city: z.string().min(2, 'City is required'),
  country: z.string().min(2, 'Country is required'),
  address: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  website: z.string().optional().or(z.literal('')).transform((val) => {
    if (!val || val === '') return undefined;
    // Auto-prepend https:// if no protocol is specified
    if (!/^https?:\/\//.test(val)) {
      return `https://${val}`;
    }
    return val;
  }).refine(val => !val || /^https?:\/\/.+\..+/.test(val), { message: 'Invalid URL format' }),
  contactEmail: z.string().optional().or(z.literal('')).transform(val => !val || val === '' ? undefined : val)
    .refine(val => !val || /^[^@]+@[^@]+\.[^@]+$/.test(val), { message: 'Invalid email' }),
  contactPhone: z.string().optional().or(z.literal('')).transform(val => !val || val === '' ? undefined : val),
  colors: z.string().optional(),
  primaryColor: z.string().optional().or(z.literal('')).transform(val => !val || val === '' ? undefined : val)
    .refine(val => !val || /^#[0-9A-Fa-f]{6}$/i.test(val), { message: 'Invalid color format' }),
  secondaryColor: z.string().optional().or(z.literal('')).transform(val => !val || val === '' ? undefined : val)
    .refine(val => !val || /^#[0-9A-Fa-f]{6}$/i.test(val), { message: 'Invalid color format' }),
});

type ClubFormData = z.infer<typeof clubSchema>;

export default function CreateClubPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

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

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ClubFormData>({
    resolver: zodResolver(clubSchema),
    defaultValues: {
      country: 'Romania',
      primaryColor: '#1E40AF',
      secondaryColor: '#FFFFFF',
    },
  });

  const primaryColor = watch('primaryColor');
  const secondaryColor = watch('secondaryColor');

  // Handle location selection from autocomplete
  const handleLocationSelect = (location: LocationSuggestion) => {
    setValue('address', location.formattedAddress);
    if (location.city) setValue('city', location.city);
    if (location.country) setValue('country', location.country);
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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get location';
      setError(message);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const onSubmit = async (data: ClubFormData) => {
    setLoading(true);
    setError(null);
    try {
      // Filter out fields not in CreateClubDto (shortName, address, colors)
      const clubData = {
        name: data.name,
        city: data.city,
        country: data.country,
        latitude: data.latitude,
        longitude: data.longitude,
        description: data.description,
        foundedYear: data.foundedYear,
        website: data.website,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
      };

      const response = await clubService.createClub(clubData);
      const club = (response as any)?.data || response;
      
      // Upload logo if selected
      if (logoFile && club.id) {
        try {
          await clubService.uploadLogo(club.id, logoFile);
        } catch (err) {
          console.error('Failed to upload logo:', err);
          // Don't block club creation if logo upload fails
        }
      }
      
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
        {/* Back button at top */}
        <div className="mb-2">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors rounded-md hover:bg-gray-100"
          >
            <svg
              className="w-4 h-4"
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
            {t('common.back', 'Back')}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {t('clubs.create')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Create a new club to manage players and register for tournaments
            </p>
          </div>
        </div>

        {error && (
          <div ref={errorRef} tabIndex={-1} className="outline-none">
            <Alert variant="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Logo */}
          <Card>
            <CardHeader>
              <CardTitle>Club Logo</CardTitle>
            </CardHeader>
            <CardContent>
              {logoFile ? (
                <FilePreview
                  file={logoFile}
                  onRemove={() => setLogoFile(null)}
                />
              ) : (
                <FileUpload
                  accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
                  maxSize={5 * 1024 * 1024}
                  onFilesSelected={(files) => setLogoFile(files[0])}
                />
              )}
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
              <Input
                type="number"
                label={t('clubs.foundedYear')}
                placeholder="1990"
                error={errors.foundedYear?.message}
                {...register('foundedYear')}
              />
            </CardContent>
          </Card>

          {/* Club Colors */}
          <Card>
            <CardHeader>
              <CardTitle>{t('clubs.colors')}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {t('clubs.colorPicker.chooseFromPopular')}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <ColorCombinationPicker
                value={{ primary: primaryColor || '#1E40AF', secondary: secondaryColor || '#FFFFFF' }}
                onChange={(colors) => {
                  setValue('primaryColor', colors.primary);
                  setValue('secondaryColor', colors.secondary);
                }}
              />

              {/* Custom Color Pickers */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  {t('clubs.colorPicker.custom')}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ColorPicker
                    label={t('clubs.colorPicker.primary')}
                    value={primaryColor || '#1E40AF'}
                    onChange={(e) => setValue('primaryColor', e.target.value)}
                    error={errors.primaryColor?.message}
                  />
                  <ColorPicker
                    label={t('clubs.colorPicker.secondary')}
                    value={secondaryColor || '#FFFFFF'}
                    onChange={(e) => setValue('secondaryColor', e.target.value)}
                    error={errors.secondaryColor?.message}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>{t('common.location')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <LocationAutocomplete
                    label={t('clubs.locationSearch', 'Search Location')}
                    placeholder="Search for city or address..."
                    onSelect={handleLocationSelect}
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
                  error={errors.contactEmail?.message}
                  {...register('contactEmail')}
                />
                <Input
                  type="tel"
                  label={t('common.phone')}
                  placeholder="+40 xxx xxx xxx"
                  error={errors.contactPhone?.message}
                  {...register('contactPhone')}
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
