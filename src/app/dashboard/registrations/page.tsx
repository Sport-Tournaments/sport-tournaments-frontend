'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, Button, Badge, Loading, Modal } from '@/components/ui';
import { registrationService } from '@/services';
import type { Registration, RegistrationStatus } from '@/types';
import { formatDateTime } from '@/utils/date';
import { useInfiniteScroll } from '@/hooks';

const PAGE_SIZE = 10;

export default function RegistrationsPage() {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | 'all'>('all');
  
  // Withdraw modal state
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawingRegistrationId, setWithdrawingRegistrationId] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchRegistrations = useCallback(async (page: number) => {
    const response = await registrationService.getMyRegistrations({});
    const resData = response.data as any;
    
    // Handle different response structures
    let registrationData: Registration[] = [];
    
    if (Array.isArray(resData)) {
      registrationData = resData;
    } else if (resData?.data?.items && Array.isArray(resData.data.items)) {
      registrationData = resData.data.items;
    } else if (resData?.items && Array.isArray(resData.items)) {
      registrationData = resData.items;
    } else if (resData?.data && Array.isArray(resData.data)) {
      registrationData = resData.data;
    }
    
    console.log('[MyRegistrations] Raw data count:', registrationData.length, 'Filter:', statusFilter);
    
    // Apply client-side filter since backend doesn't support it
    if (statusFilter !== 'all') {
      registrationData = registrationData.filter(reg => reg.status === statusFilter);
      console.log('[MyRegistrations] After filter count:', registrationData.length);
    }
    
    // Client-side pagination
    const startIndex = (page - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    const paginatedData = registrationData.slice(startIndex, endIndex);
    const totalPages = Math.ceil(registrationData.length / PAGE_SIZE) || 1;
    
    console.log('[MyRegistrations] Returning page:', page, 'items:', paginatedData.length, 'hasMore:', page < totalPages);
    
    return {
      items: paginatedData,
      hasMore: page < totalPages,
      totalPages,
    };
  }, [statusFilter]);

  const {
    items: registrations,
    isLoading,
    isFetchingMore,
    hasMore,
    error,
    sentinelRef,
    retry,
    reset,
  } = useInfiniteScroll<Registration>({
    fetchData: fetchRegistrations,
    dependencies: [statusFilter],
  });

  const getStatusBadge = (status: RegistrationStatus) => {
    const variants: Record<RegistrationStatus, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      'PENDING': 'warning',
      'APPROVED': 'success',
      'REJECTED': 'danger',
      'WITHDRAWN': 'default',
    };
    return variants[status] || 'default';
  };

  const handleWithdraw = (registrationId: string) => {
    setWithdrawingRegistrationId(registrationId);
    setWithdrawModalOpen(true);
  };

  const confirmWithdraw = async () => {
    if (!withdrawingRegistrationId) return;
    
    setWithdrawing(true);
    try {
      await registrationService.withdrawRegistration(withdrawingRegistrationId);
      setWithdrawModalOpen(false);
      setWithdrawingRegistrationId(null);
      reset();
    } catch (error) {
      console.error('Failed to withdraw:', error);
    } finally {
      setWithdrawing(false);
    }
  };

  const tabs = [
    { id: 'all', label: t('common.all') },
    { id: 'PENDING', label: t('registration.status.PENDING') },
    { id: 'APPROVED', label: t('registration.status.APPROVED') },
    { id: 'REJECTED', label: t('registration.status.REJECTED') },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {t('registration.myRegistrations')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {t('dashboard.manageRegistrations')}
            </p>
          </div>
          <Link href="/main/tournaments" className="self-start sm:self-auto">
            <Button variant="primary">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {t('registrations.browseTournaments')}
            </Button>
          </Link>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading && registrations.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loading size="lg" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('common.error')}
              </h3>
              <p className="text-gray-500 mb-4">{error.message}</p>
              <Button variant="primary" onClick={retry}>
                {t('common.retry')}
              </Button>
            </CardContent>
          </Card>
        ) : registrations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('registration.noRegistrations')}
              </h3>
              <p className="text-gray-500 mb-4">
                {statusFilter === 'all' 
                  ? t('registrations.noRegistrationsDesc')
                  : t('registrations.noRegistrationsFiltered', { status: statusFilter })
                }
              </p>
              <Link href="/main/tournaments">
                <Button variant="primary">{t('registrations.findTournaments')}</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {registrations.map((registration) => (
                <Card key={registration.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Link
                            href={`/main/tournaments/${registration.tournamentId}`}
                            className="font-semibold text-lg text-gray-900 hover:text-primary"
                          >
                            {registration.tournament?.name || 'Tournament'}
                          </Link>
                          <Badge variant={getStatusBadge(registration.status)}>
                            {t(`registration.status.${registration.status}`)}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {registration.club?.name || registration.coachName || 'Team'}
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Registered: {formatDateTime(registration.createdAt)}
                          </span>
                          {registration.paymentStatus && (
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              Payment: {registration.paymentStatus}
                            </span>
                          )}
                        </div>
                        {registration.notes && (
                          <p className="mt-2 text-sm text-gray-600">
                            {registration.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/dashboard/registrations/${registration.id}`}>
                          <Button variant="outline" size="sm">
                            {t('common.view')}
                          </Button>
                        </Link>
                        {registration.status === 'PENDING' && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleWithdraw(registration.id)}
                          >
                            Withdraw
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            {hasMore && (
              <div 
                ref={sentinelRef} 
                className="flex justify-center py-8"
              >
                {isFetchingMore && <Loading size="md" />}
              </div>
            )}
          </>
        )}
      </div>

      {/* Withdraw Confirmation Modal */}
      <Modal
        isOpen={withdrawModalOpen}
        onClose={() => {
          setWithdrawModalOpen(false);
          setWithdrawingRegistrationId(null);
        }}
        title={t('registration.withdrawTitle', 'Withdraw Registration')}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            {t('registration.withdrawConfirm', 'Are you sure you want to withdraw this registration? This action cannot be undone.')}
          </p>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setWithdrawModalOpen(false);
                setWithdrawingRegistrationId(null);
              }}
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
