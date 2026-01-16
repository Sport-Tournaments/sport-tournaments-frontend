'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, Badge, Loading } from '@/components/ui';
import { registrationService } from '@/services';
import type { Registration, PaymentStatus } from '@/types';
import { formatDateTime } from '@/utils/date';

export default function PaymentsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<Registration[]>([]);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await registrationService.getMyRegistrations();
      const resData = response.data as unknown;
      
      let registrationData: Registration[] = [];
      
      if (Array.isArray(resData)) {
        registrationData = resData;
      } else if (typeof resData === 'object' && resData !== null) {
        const objData = resData as Record<string, unknown>;
        if (objData.data && Array.isArray(objData.data)) {
          registrationData = objData.data as Registration[];
        } else if (objData.items && Array.isArray(objData.items)) {
          registrationData = objData.items as Registration[];
        }
      }
      
      setRegistrations(registrationData);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    const variants: Record<PaymentStatus, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      PENDING: 'warning',
      COMPLETED: 'success',
      FAILED: 'danger',
      REFUNDED: 'info',
    };
    return variants[status] || 'default';
  };

  const formatCurrency = (amount: number, currency = 'EUR') => {
    return new Intl.NumberFormat('en-EU', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {t('nav.payments')}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            {t('payments.subtitle')}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loading size="lg" />
          </div>
        ) : registrations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('payments.noPayments')}
              </h3>
              <p className="text-gray-500 mb-4">
                {t('payments.noPaymentsDesc')}
              </p>
              <Link href="/main/tournaments" className="text-primary hover:underline">
                {t('payments.browseTournaments')}
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {registrations.map((registration) => (
              <Card key={registration.id}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                          {registration.tournament?.name || 'Tournament'}
                        </h3>
                        <Badge variant={getPaymentStatusBadge(registration.paymentStatus)}>
                          {registration.paymentStatus}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500 space-y-1">
                        <p>Club: {registration.club?.name || 'N/A'}</p>
                        <p>Registered: {formatDateTime(registration.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(registration.tournament?.participationFee || 0)}
                      </p>
                      <Link
                        href={`/dashboard/registrations/${registration.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {t('payments.viewDetails')} →
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Payment Summary */}
        {registrations.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('payments.summary')}
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">
                    {registrations.length}
                  </p>
                  <p className="text-sm text-gray-500">{t('payments.total')}</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">
                    {registrations.filter(r => r.paymentStatus === 'PENDING').length}
                  </p>
                  <p className="text-sm text-gray-500">{t('payments.pending')}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {registrations.filter(r => r.paymentStatus === 'COMPLETED').length}
                  </p>
                  <p className="text-sm text-gray-500">{t('payments.completed')}</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">
                    {registrations.filter(r => r.paymentStatus === 'FAILED').length}
                  </p>
                  <p className="text-sm text-gray-500">{t('payments.failed')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
