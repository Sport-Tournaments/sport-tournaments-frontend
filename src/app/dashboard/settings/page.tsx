'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Textarea, Select, Alert, Tabs, FileUpload, Avatar } from '@/components/ui';
import { userService, authService } from '@/services';
import { useAuthStore } from '@/store/auth.store';
import { User } from '@/types';

const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  bio: z.string().max(500, 'Bio must be under 500 characters').optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    if (user) {
      resetProfile({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: (user as any).bio || '',
        city: (user as any).city || '',
        country: user.country || '',
      });
    }
  }, [user, resetProfile]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await userService.updateUserProfile(data);
      const updatedUser = response.data;
      
      // Note: Avatar upload would need a separate API endpoint
      // if (avatarFile) {
      //   const formData = new FormData();
      //   formData.append('avatar', avatarFile);
      //   await userService.uploadAvatar(formData);
      // }
      
      setUser(updatedUser);
      setSuccess('Profile updated successfully');
      setAvatarFile(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setPasswordLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setSuccess('Password changed successfully');
      resetPassword();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const countryOptions = [
    { value: '', label: 'Select country' },
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

  const tabs = [
    {
      id: 'profile',
      label: t('settings.profile'),
      content: (
        <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
          {/* Avatar */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <Avatar
                  src={avatarFile ? URL.createObjectURL(avatarFile) : user?.profileImageUrl}
                  firstName={user?.firstName}
                  lastName={user?.lastName}
                  size="xl"
                />
                <div>
                  <FileUpload
                    accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
                    maxSize={2 * 1024 * 1024}
                    onFilesSelected={(files) => setAvatarFile(files[0])}
                  >
                    <div className="text-center">
                      <p className="text-sm font-medium">Upload new photo</p>
                      <p className="text-xs text-gray-500">PNG, JPG up to 2MB</p>
                    </div>
                  </FileUpload>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.personalInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t('auth.firstName')}
                  error={profileErrors.firstName?.message}
                  {...registerProfile('firstName')}
                />
                <Input
                  label={t('auth.lastName')}
                  error={profileErrors.lastName?.message}
                  {...registerProfile('lastName')}
                />
              </div>
              <Input
                type="email"
                label={t('common.email')}
                error={profileErrors.email?.message}
                {...registerProfile('email')}
              />
              <Input
                type="tel"
                label={t('common.phone')}
                error={profileErrors.phone?.message}
                {...registerProfile('phone')}
              />
              <Textarea
                label="Bio"
                rows={3}
                placeholder="Tell us about yourself..."
                error={profileErrors.bio?.message}
                {...registerProfile('bio')}
              />
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>{t('common.location')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t('common.city')}
                  error={profileErrors.city?.message}
                  {...registerProfile('city')}
                />
                <Select
                  label={t('common.country')}
                  options={countryOptions}
                  error={profileErrors.country?.message}
                  {...registerProfile('country')}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" isLoading={loading}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      ),
    },
    {
      id: 'security',
      label: t('settings.security'),
      content: (
        <div className="space-y-6">
          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.changePassword')}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                <Input
                  type="password"
                  label={t('settings.currentPassword')}
                  error={passwordErrors.currentPassword?.message}
                  {...registerPassword('currentPassword')}
                />
                <Input
                  type="password"
                  label={t('settings.newPassword')}
                  error={passwordErrors.newPassword?.message}
                  {...registerPassword('newPassword')}
                />
                <Input
                  type="password"
                  label={t('auth.confirmPassword')}
                  error={passwordErrors.confirmPassword?.message}
                  {...registerPassword('confirmPassword')}
                />
                <div className="flex justify-end">
                  <Button type="submit" variant="primary" isLoading={passwordLoading}>
                    {t('settings.updatePassword')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication */}
          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Protect your account with 2FA
                  </p>
                  <p className="text-sm text-gray-500">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Button variant="outline">Enable 2FA</Button>
              </div>
            </CardContent>
          </Card>

          {/* Sessions */}
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Current Session</p>
                      <p className="text-sm text-gray-500">Windows • Chrome</p>
                    </div>
                  </div>
                  <span className="text-sm text-green-600 font-medium">Active now</span>
                </div>
              </div>
              <div className="mt-4">
                <Button variant="danger" size="sm">Sign out all other sessions</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: 'notifications',
      label: t('settings.notifications'),
      content: (
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.notificationPreferences')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">Email Notifications</h4>
              
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">Tournament Updates</p>
                  <p className="text-sm text-gray-500">Get notified about tournaments you're registered for</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 text-primary rounded" />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">Registration Status</p>
                  <p className="text-sm text-gray-500">Updates when your registration is approved or rejected</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 text-primary rounded" />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">Match Reminders</p>
                  <p className="text-sm text-gray-500">Remind me before matches</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 text-primary rounded" />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">Marketing Emails</p>
                  <p className="text-sm text-gray-500">News, announcements, and promotional content</p>
                </div>
                <input type="checkbox" className="w-5 h-5 text-primary rounded" />
              </label>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">Push Notifications</h4>
              
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">Live Match Updates</p>
                  <p className="text-sm text-gray-500">Real-time score updates</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 text-primary rounded" />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">Chat Messages</p>
                  <p className="text-sm text-gray-500">Notify when you receive new messages</p>
                </div>
                <input type="checkbox" defaultChecked className="w-5 h-5 text-primary rounded" />
              </label>
            </div>

            <div className="flex justify-end pt-4">
              <Button variant="primary">{t('common.save')}</Button>
            </div>
          </CardContent>
        </Card>
      ),
    },
    {
      id: 'preferences',
      label: t('settings.preferences'),
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.language')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'ro', label: 'Română' },
                ]}
                defaultValue="en"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('settings.theme')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <button className="p-4 border-2 border-primary rounded-lg bg-white">
                  <div className="w-full h-12 bg-gray-100 rounded mb-2"></div>
                  <span className="text-sm font-medium">Light</span>
                </button>
                <button className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-gray-900">
                  <div className="w-full h-12 bg-gray-800 rounded mb-2"></div>
                  <span className="text-sm font-medium text-white">Dark</span>
                </button>
                <button className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-gradient-to-b from-white to-gray-900">
                  <div className="w-full h-12 bg-gradient-to-r from-gray-100 to-gray-800 rounded mb-2"></div>
                  <span className="text-sm font-medium">System</span>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900 rounded-lg">
                <div>
                  <p className="font-medium text-red-600">{t('settings.deleteAccount')}</p>
                  <p className="text-sm text-gray-500">
                    Once you delete your account, there is no going back
                  </p>
                </div>
                <Button variant="danger">{t('settings.deleteAccount')}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('settings.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your account settings and preferences
          </p>
        </div>

        {error && <Alert variant="error">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Tabs tabs={tabs} defaultTab="profile" variant="pills" />
      </div>
    </DashboardLayout>
  );
}
