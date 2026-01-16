'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { MainLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Alert } from '@/components/ui';
import { tournamentService } from '@/services';
import { useAuthStore } from '@/store';

interface TournamentInfo {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  ageCategory: string;
  maxTeams: number;
  registeredTeams: number;
}

export default function JoinTournamentPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  
  const [code, setCode] = useState(searchParams.get('code') || '');
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tournament, setTournament] = useState<TournamentInfo | null>(null);

  // Auto-validate if code is in URL
  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode) {
      setCode(urlCode);
      handleValidateCode(urlCode);
    }
  }, [searchParams]);

  const handleValidateCode = async (codeToValidate?: string) => {
    const invitationCode = codeToValidate || code;
    if (!invitationCode.trim()) {
      setError(t('tournament.invitation.enterCode', 'Please enter an invitation code'));
      return;
    }

    setValidating(true);
    setError(null);
    setTournament(null);

    try {
      const response = await tournamentService.validateInvitationCode(invitationCode.trim());
      if (response.success && response.data?.tournament) {
        const t = response.data.tournament;
        setTournament({
          id: t.id,
          name: t.name,
          startDate: t.startDate,
          endDate: t.endDate,
          location: t.location,
          ageCategory: t.ageCategory,
          maxTeams: t.maxTeams,
          registeredTeams: t.registeredTeams || 0,
        });
      } else {
        setError(t('tournament.invitation.invalidCode', 'Invalid or expired invitation code'));
      }
    } catch (err: unknown) {
      console.error('Error validating code:', err);
      const error = err as { response?: { status?: number; data?: { message?: string } } };
      if (error.response?.status === 404) {
        setError(t('tournament.invitation.invalidCode', 'Invalid or expired invitation code'));
      } else if (error.response?.status === 410) {
        setError(t('tournament.invitation.expiredCode', 'This invitation code has expired'));
      } else {
        setError(error.response?.data?.message || t('tournament.invitation.validationError', 'Failed to validate code'));
      }
    } finally {
      setValidating(false);
    }
  };

  const handleJoinTournament = () => {
    if (!tournament) return;

    if (!isAuthenticated) {
      // Redirect to login with return URL
      router.push(`/auth/login?returnUrl=/main/tournaments/${tournament.id}?invite=${code}`);
      return;
    }

    // Go to tournament page with invite code
    router.push(`/main/tournaments/${tournament.id}?invite=${code}`);
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-white py-12">
        <div className="max-w-md mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-center flex items-center justify-center gap-2">
                <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {t('tournament.invitation.title', 'Join Private Tournament')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-gray-600 text-center">
                {t('tournament.invitation.description', 'Enter the invitation code you received to join a private tournament.')}
              </p>

              {error && <Alert variant="error">{error}</Alert>}

              {!tournament ? (
                <div className="space-y-4">
                  <div>
                    <Input
                      type="text"
                      placeholder={t('tournament.invitation.codePlaceholder', 'Enter invitation code')}
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      className="text-center text-lg tracking-wider font-mono"
                      maxLength={12}
                      autoFocus
                    />
                    <p className="mt-2 text-xs text-gray-500 text-center">
                      {t('tournament.invitation.codeHint', 'The code should look like: ABC123XY')}
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => handleValidateCode()}
                    isLoading={validating}
                    disabled={!code.trim()}
                  >
                    {t('tournament.invitation.validate', 'Validate Code')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert variant="success">
                    {t('tournament.invitation.validCode', 'Valid invitation code!')}
                  </Alert>

                  {/* Tournament Info */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {tournament.name}
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">{t('tournament.location')}</p>
                        <p className="font-medium text-gray-900">{tournament.location}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">{t('tournament.ageCategory.label')}</p>
                        <p className="font-medium text-gray-900">{tournament.ageCategory}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">{t('tournament.dates')}</p>
                        <p className="font-medium text-gray-900">
                          {new Date(tournament.startDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">{t('common.teams')}</p>
                        <p className="font-medium text-gray-900">
                          {tournament.registeredTeams} / {tournament.maxTeams}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setTournament(null);
                        setCode('');
                        setError(null);
                      }}
                    >
                      {t('common.back', 'Back')}
                    </Button>
                    <Button
                      variant="primary"
                      className="flex-1"
                      onClick={handleJoinTournament}
                    >
                      {isAuthenticated 
                        ? t('tournament.invitation.viewTournament', 'View Tournament')
                        : t('tournament.invitation.loginToJoin', 'Login to Join')
                      }
                    </Button>
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-500 text-center">
                  {t('tournament.invitation.noCode', "Don't have a code?")}{' '}
                  <Link href="/main/tournaments" className="text-indigo-600 hover:text-indigo-500">
                    {t('tournament.invitation.browsePublic', 'Browse public tournaments')}
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
