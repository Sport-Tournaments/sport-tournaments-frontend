'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Textarea, Alert, FileUpload, FilePreview, ColorPicker, ColorCombinationPicker, LocationAutocomplete, Modal } from '@/components/ui';
import { clubService } from '@/services';
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
  const [locationQuery, setLocationQuery] = useState('');
  const errorRef = useRef<HTMLDivElement>(null);
  const initialLocationRef = useRef('');
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

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ClubFormData>({
    resolver: zodResolver(clubSchema),
    defaultValues: {
      primaryColor: '#1E40AF',
      secondaryColor: '#FFFFFF',
    },
  });

  const primaryColor = watch('primaryColor');
  const secondaryColor = watch('secondaryColor');
  const locationError = errors.city?.message || errors.country?.message;
  const hasUnsavedLocation = useMemo(() => {
    return locationQuery.trim().length > 0 && locationQuery !== initialLocationRef.current;
  }, [locationQuery]);
  const hasUnsavedLogo = useMemo(() => !!logoFile, [logoFile]);
  const hasUnsavedChanges = isDirty || hasUnsavedLocation || hasUnsavedLogo;

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

  const shouldWarnOnLeave = hasUnsavedChanges && !loading;

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
    setLocationQuery(location.formattedAddress);
    if (location.city) setValue('city', location.city);
    if (location.country) setValue('country', location.country);
    if (location.latitude && location.longitude) {
      setValue('latitude', location.latitude);
      setValue('longitude', location.longitude);
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

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back button at top */}
        <div className="mb-2">
          <button
            onClick={() => {
              if (!shouldWarnOnLeave) {
                router.back();
                return;
              }
              openLeaveModal(() => router.back());
            }}
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pb-24">
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
              <LocationAutocomplete
                label={t('clubs.locationSearch', 'Search Location')}
                placeholder="Search for city or address..."
                value={locationQuery}
                required
                error={locationError}
                onChange={(value) => {
                  setLocationQuery(value);
                  setValue('city', '');
                  setValue('country', '');
                  setValue('latitude', undefined);
                  setValue('longitude', undefined);
                }}
                onSelect={handleLocationSelect}
              />
              <input type="hidden" {...register('city')} />
              <input type="hidden" {...register('country')} />
              <input type="hidden" {...register('latitude')} />
              <input type="hidden" {...register('longitude')} />
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
          <div className="sticky bottom-0 z-10 -mx-4 sm:mx-0 bg-white/95 backdrop-blur border-t border-gray-200 py-4 px-4 sm:px-0">
            <div className="flex justify-end gap-4 max-w-3xl mx-auto">
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
            <Button type="submit" variant="primary" isLoading={loading}>
              {t('clubs.create')}
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
