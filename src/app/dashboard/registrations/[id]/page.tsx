'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Alert, Loading, Modal } from '@/components/ui';
import { registrationService, tournamentService } from '@/services';
import type { Registration, Tournament, RegistrationStatus, PaymentStatus } from '@/types';
import { formatDateTime, formatDate } from '@/utils/date';
import { formatCurrency } from '@/utils/helpers';

export default function RegistrationDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Withdraw modal state
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      const regResponse = await registrationService.getRegistrationById(params.id as string);
      const regData = (regResponse as any)?.data || regResponse;
      setRegistration(regData);
      
      if (regData.tournamentId) {
        const tournamentResponse = await tournamentService.getTournamentById(regData.tournamentId);
        const tournamentData = (tournamentResponse as any)?.data || tournamentResponse;
        setTournament(tournamentData);
      }
    } catch (err: any) {
      setError('Failed to load registration');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: RegistrationStatus) => {
    const variants: Record<RegistrationStatus, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'PENDING': 'warning',
      'APPROVED': 'success',
      'REJECTED': 'danger',
      'WITHDRAWN': 'default',
    };
    return variants[status] || 'default';
  };

  const getPaymentStatusBadge = (status?: PaymentStatus) => {
    if (!status) return 'default';
    const variants: Record<PaymentStatus, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'PENDING': 'warning',
      'COMPLETED': 'success',
      'FAILED': 'danger',
      'REFUNDED': 'default',
    };
    return variants[status] || 'default';
  };

  const handleWithdraw = () => {
    if (!registration) return;
    setWithdrawModalOpen(true);
  };

  const confirmWithdraw = async () => {
    if (!registration) return;
    
    setWithdrawing(true);
    try {
      await registrationService.withdrawRegistration(registration.id);
      setWithdrawModalOpen(false);
      fetchData();
    } catch (err: any) {
      setError('Failed to withdraw registration');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loading size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!registration) {
    return (
      <DashboardLayout>
        <Alert variant="error">{error || 'Registration not found'}</Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {error && <Alert variant="error">{error}</Alert>}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <button
              onClick={() => router.back()}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1 mb-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Registration Details
            </h1>
          </div>
          {registration.status === 'PENDING' && (
            <Button variant="danger" onClick={handleWithdraw} className="self-start sm:self-auto">
              Withdraw Registration
            </Button>
          )}
        </div>

        {/* Status Banner */}
        <Card className={`border-l-4 ${
          registration.status === 'APPROVED' ? 'border-l-green-500' :
          registration.status === 'PENDING' ? 'border-l-yellow-500' :
          registration.status === 'REJECTED' ? 'border-l-red-500' :
          'border-l-gray-500'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {registration.status === 'APPROVED' && (
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                {registration.status === 'PENDING' && (
                  <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                {registration.status === 'REJECTED' && (
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {t(`registration.status.${registration.status}`)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {registration.status === 'PENDING' && 'Your registration is being reviewed'}
                    {registration.status === 'APPROVED' && 'Your registration has been approved'}
                    {registration.status === 'REJECTED' && (registration as any).rejectionReason}
                  </p>
                </div>
              </div>
              <Badge variant={getStatusBadge(registration.status)}>
                {t(`registration.status.${registration.status}`)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Tournament Info */}
        {tournament && (
          <Card>
            <CardHeader>
              <CardTitle>Tournament</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                {tournament.bannerImage ? (
                  <img src={tournament.bannerImage} alt={tournament.name} className="w-16 h-16 rounded-lg object-cover" />
                ) : (
                  <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                )}
                <div className="flex-1">
                  <Link
                    href={`/main/tournaments/${tournament.id}`}
                    className="font-semibold text-lg text-gray-900 dark:text-white hover:text-primary"
                  >
                    {tournament.name}
                  </Link>
                  <p className="text-gray-500 mt-1">
                    {tournament.location}{tournament.country ? `, ${tournament.country}` : ''}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                  </p>
                </div>
                <Link href={`/main/tournaments/${tournament.id}`}>
                  <Button variant="outline" size="sm">{t('common.view')}</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Registration Details */}
        <Card>
          <CardHeader>
            <CardTitle>Registration Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Coach Name</p>
                <p className="font-medium">{registration.coachName || '-'}</p>
              </div>
              {registration.club && (
                <div>
                  <p className="text-sm text-gray-500">Club</p>
                  <Link 
                    href={`/main/clubs/${registration.club.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {registration.club.name}
                  </Link>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Emergency Contact</p>
                <p className="font-medium">{registration.emergencyContact || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Coach Phone</p>
                <p className="font-medium">{registration.coachPhone || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Registration Date</p>
                <p className="font-medium">{formatDateTime(registration.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Number of Players</p>
                <p className="font-medium">{registration.numberOfPlayers || '-'}</p>
              </div>
            </div>
            {registration.notes && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Notes</p>
                <p className="text-gray-700 dark:text-gray-300">{registration.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Info */}
        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="text-sm text-gray-500">Entry Fee</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(tournament?.entryFee || 0)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Payment Status</p>
                <Badge variant={getPaymentStatusBadge(registration.paymentStatus as PaymentStatus | undefined)}>
                  {registration.paymentStatus || 'Pending'}
                </Badge>
              </div>
            </div>
            {registration.status === 'APPROVED' && registration.paymentStatus !== 'COMPLETED' && (
              <div className="mt-4">
                <Button variant="primary" className="w-full">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Pay Now
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Players */}
        {(registration as any).players && (registration as any).players.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Registered Players ({(registration as any).players.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Position
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {(registration as any).players.map((player: any, index: number) => (
                      <tr key={player.id || index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                            {player.jerseyNumber || index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                          {player.firstName} {player.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="info">{player.position || 'N/A'}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Withdraw Confirmation Modal */}
      <Modal
        isOpen={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        title={t('registration.withdrawTitle', 'Withdraw Registration')}
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            {t('registration.withdrawConfirm', 'Are you sure you want to withdraw this registration? This action cannot be undone.')}
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setWithdrawModalOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="danger"
              onClick={confirmWithdraw}
              isLoading={withdrawing}
            >
              {t('registration.withdraw', 'Withdraw')}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
