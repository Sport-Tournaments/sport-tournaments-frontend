'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '@/components/layout';
import { Button, Input, Select, Alert } from '@/components/ui';
import { useAuthStore } from '@/store';
import type { UserRole } from '@/types';

const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  country: z.string().min(2, 'Country is required'),
  role: z.enum(['PARTICIPANT', 'ORGANIZER'] as const) as z.ZodType<UserRole>,
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { register: registerUser } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'PARTICIPANT' as UserRole,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        country: data.country,
        role: data.role as 'ORGANIZER' | 'PARTICIPANT',
      });
      
      if (success) {
        // Check if user is auto-verified (email verification disabled)
        const { user } = useAuthStore.getState();
        if (user?.isVerified) {
          // User is already verified, redirect to login
          router.push('/auth/login?registered=true');
        } else {
          // User needs to verify email
          router.push('/auth/verify-email');
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    { value: 'PARTICIPANT', label: t('auth.roleParticipant') },
    { value: 'ORGANIZER', label: t('auth.roleOrganizer') },
  ];

  return (
    <AuthLayout
      title={t('auth.createAccount')}
      subtitle={t('auth.registerSubtitle')}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && (
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label={t('auth.firstName')}
            placeholder="John"
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <Input
            label={t('auth.lastName')}
            placeholder="Doe"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>

        <Input
          label={t('auth.email')}
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label={t('auth.phone')}
          type="tel"
          placeholder="+40 123 456 789"
          error={errors.phone?.message}
          {...register('phone')}
        />

        <Input
          label={t('auth.country')}
          placeholder="Romania"
          error={errors.country?.message}
          {...register('country')}
        />

        <Select
          label={t('auth.accountType')}
          options={roleOptions}
          error={errors.role?.message}
          {...register('role')}
        />

        <Input
          label={t('auth.password')}
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label={t('auth.confirmPassword')}
          type="password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
            {...register('acceptTerms')}
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t('auth.acceptTerms')}{' '}
            <Link href="/terms" className="text-primary hover:underline">
              {t('footer.terms')}
            </Link>{' '}
            {t('common.and')}{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              {t('footer.privacy')}
            </Link>
          </span>
        </label>
        {errors.acceptTerms && (
          <p className="text-sm text-red-500">{errors.acceptTerms.message}</p>
        )}

        <Button
          type="submit"
          variant="primary"
          fullWidth
          isLoading={isLoading}
        >
          {t('auth.register')}
        </Button>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link href="/auth/login" className="text-primary hover:underline font-medium">
            {t('auth.login')}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
