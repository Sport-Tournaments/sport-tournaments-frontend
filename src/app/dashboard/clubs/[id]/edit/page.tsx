'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Textarea, Select, Alert, Loading, FileUpload, FilePreview, ColorPicker, ColorCombinationPicker, LocationAutocomplete } from '@/components/ui';
import { clubService } from '@/services';
import { getCurrentLocation } from '@/services/location.service';
import { Club } from '@/types';
import type { LocationSuggestion } from '@/types';

const clubSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  shortName: z.string().min(2, 'Short name must be at least 2 characters').max(10, 'Short name max 10 characters').optional().or(z.literal('')),
  description: z.string().optional(),
  foundedYear: z.number().min(1800, 'Invalid year').max(new Date().getFullYear(), 'Year cannot be in the future').optional().nullable(),
  city: z.string().min(2, 'City is required'),
  country: z.string().min(2, 'Country is required'),
  address: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  website: z.string().optional().or(z.literal('')).transform((val) => {
    if (!val) return '';
    // Auto-prepend https:// if no protocol is specified
    if (!/^https?:\/\//i.test(val)) {
      return `https://${val}`;
    }
    return val;
  }).pipe(z.string().url('Invalid URL format').optional().or(z.literal(''))),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  colors: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
});

type ClubFormData = z.infer<typeof clubSchema>;

export default function EditClubPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ClubFormData>({
    resolver: zodResolver(clubSchema),
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

  useEffect(() => {
    fetchClub();
  }, [params.id]);

  const fetchClub = async () => {
    try {
      const response = await clubService.getClubById(params.id as string);
      // Handle response - could be ApiResponse<Club> or Club directly
      const clubData = 'data' in response ? response.data : response;
      setClub(clubData);
      // Use type assertion for fields that may not be in Club type but exist in API
      const extendedData = clubData as Club & { shortName?: string; colors?: string };
      reset({
        name: clubData.name || '',
        shortName: extendedData.shortName || '',
        description: clubData.description || '',
        foundedYear: clubData.foundedYear || undefined,
        city: clubData.city || '',
        country: clubData.country || 'Romania',
        address: clubData.address || '',
        latitude: clubData.latitude,
        longitude: clubData.longitude,
        website: clubData.website || '',
        email: clubData.email || '',
        phone: clubData.phone || '',
        colors: extendedData.colors || '',
        primaryColor: clubData.primaryColor || '#1E40AF',
        secondaryColor: clubData.secondaryColor || '#FFFFFF',
      });
    } catch {
      setError('Failed to load club');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ClubFormData) => {
    setSaving(true);
    setError(null);
    try {
      // Only send fields that the backend UpdateClubDto accepts
      // Backend accepts: name, country, city, latitude, longitude, description, logo, foundedYear, website, contactEmail, contactPhone
      const updateData: Record<string, unknown> = {
        name: data.name,
        country: data.country,
        city: data.city,
      };

      // Add optional fields only if they have values
      if (data.description) updateData.description = data.description;
      if (data.foundedYear) updateData.foundedYear = data.foundedYear;
      if (data.website) updateData.website = data.website;
      if (data.latitude !== undefined) updateData.latitude = data.latitude;
      if (data.longitude !== undefined) updateData.longitude = data.longitude;
      // Map frontend email/phone to backend contactEmail/contactPhone
      if (data.email) updateData.contactEmail = data.email;
      if (data.phone) updateData.contactPhone = data.phone;
      // Add color fields
      if (data.primaryColor) updateData.primaryColor = data.primaryColor;
      if (data.secondaryColor) updateData.secondaryColor = data.secondaryColor;
      
      await clubService.updateClub(params.id as string, updateData);
      
      // Upload new logo if selected
      if (logoFile) {
        try {
          await clubService.uploadLogo(params.id as string, logoFile);
        } catch (err) {
          console.error('Failed to upload logo:', err);
          // Don't block club update if logo upload fails
        }
      }
      
      setSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/clubs/${params.id}`);
      }, 1500);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update club';
      setError(errorMessage);
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!club) {
    return (
      <DashboardLayout>
        <Alert variant="error">{error || 'Club not found'}</Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {t('clubs.editClub')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              {club.name}
            </p>
          </div>
          <Button variant="outline" onClick={() => router.back()} className="self-start sm:self-auto">
            {t('common.cancel')}
          </Button>
        </div>

        {error && <Alert variant="error">{error}</Alert>}
        {success && <Alert variant="success">{t('common.saveSuccess')}</Alert>}

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
              ) : club.logo ? (
                <div className="flex items-center gap-4">
                  <Image
                    src={club.logo}
                    alt={club.name}
                    width={96}
                    height={96}
                    className="w-24 h-24 object-contain rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {/* trigger file upload */}}
                  >
                    {t('common.replace', 'Replace')}
                  </Button>
                </div>
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
                {...register('foundedYear', { valueAsNumber: true })}
              />
            </CardContent>
          </Card>

          {/* Club Colors */}
          <Card>
            <CardHeader>
              <CardTitle>{t('clubs.colors')}</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
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
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <LocationAutocomplete
                    label={t('clubs.locationSearch', 'Search for location')}
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
            <Button type="submit" variant="primary" isLoading={saving}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
