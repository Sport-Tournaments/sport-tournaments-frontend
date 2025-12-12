'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, Button, Badge, Loading, Pagination, Tabs } from '@/components/ui';
import { registrationService } from '@/services';
import type { Registration, RegistrationStatus } from '@/types';
import { formatDateTime } from '@/utils/date';

export default function RegistrationsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<RegistrationStatus | 'all'>('all');

  useEffect(() => {
    fetchRegistrations();
  }, [currentPage, statusFilter]);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const params: any = { page: currentPage, pageSize: 10 };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const response = await registrationService.getMyRegistrations(params);
      const resData = response.data as any;
      
      // Handle different response structures
      let registrationData: Registration[] = [];
      let pages = 1;
      
      if (Array.isArray(resData)) {
        registrationData = resData;
      } else if (resData?.data?.items && Array.isArray(resData.data.items)) {
        registrationData = resData.data.items;
        pages = resData.data.totalPages || resData.data.meta?.totalPages || 1;
      } else if (resData?.items && Array.isArray(resData.items)) {
        registrationData = resData.items;
        pages = resData.totalPages || resData.meta?.totalPages || 1;
      } else if (resData?.data && Array.isArray(resData.data)) {
        registrationData = resData.data;
        pages = resData.totalPages || resData.meta?.totalPages || 1;
      }
      
      setRegistrations(registrationData);
      setTotalPages(pages);
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
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

  const handleWithdraw = async (registrationId: string) => {
    if (!confirm('Are you sure you want to withdraw this registration?')) return;
    
    try {
      await registrationService.withdrawRegistration(registrationId);
      fetchRegistrations();
    } catch (error) {
      console.error('Failed to withdraw:', error);
    }
  };

  const statusCounts = {
    all: registrations.length,
    pending: registrations.filter(r => r.status === 'PENDING').length,
    approved: registrations.filter(r => r.status === 'APPROVED').length,
    rejected: registrations.filter(r => r.status === 'REJECTED').length,
  };

  const tabs = [
    { id: 'all', label: `All (${statusCounts.all})` },
    { id: 'pending', label: `Pending (${statusCounts.pending})` },
    { id: 'approved', label: `Approved (${statusCounts.approved})` },
    { id: 'rejected', label: `Rejected (${statusCounts.rejected})` },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {t('registration.myRegistrations')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              View and manage your tournament registrations
            </p>
          </div>
          <Link href="/main/tournaments" className="self-start sm:self-auto">
            <Button variant="primary">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse Tournaments
            </Button>
          </Link>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id as any);
                setCurrentPage(1);
              }}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loading size="lg" />
          </div>
        ) : registrations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('registration.noRegistrations')}
              </h3>
              <p className="text-gray-500 mb-4">
                {statusFilter === 'all' 
                  ? 'You haven\'t registered for any tournaments yet'
                  : `No ${statusFilter} registrations found`
                }
              </p>
              <Link href="/main/tournaments">
                <Button variant="primary">Find Tournaments</Button>
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
                            className="font-semibold text-lg text-gray-900 dark:text-white hover:text-primary\"
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
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
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

            {totalPages > 1 && (
              <div className="flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
