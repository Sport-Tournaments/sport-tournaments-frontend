'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Alert, Loading, Badge } from '@/components/ui';
import { registrationService } from '@/services';
import type { Registration, RegistrationDocument, FitnessStatus } from '@/types';

interface RegistrationStatusProps {
  tournamentId: string;
  onRegisterClick?: () => void;
}

const STATUS_VARIANTS: Record<string, 'green' | 'yellow' | 'red' | 'gray' | 'blue'> = {
  APPROVED: 'green',
  PENDING: 'yellow',
  REJECTED: 'red',
  CANCELLED: 'gray',
  CONFIRMED: 'blue',
};

const STATUS_LABELS: Record<string, string> = {
  APPROVED: 'Approved',
  PENDING: 'Pending Review',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  CONFIRMED: 'Confirmed',
};

export function RegistrationStatus({ tournamentId, onRegisterClick }: RegistrationStatusProps) {
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(true);
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [documents, setDocuments] = useState<RegistrationDocument[]>([]);
  const [fitnessStatus, setFitnessStatus] = useState<FitnessStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRegistration();
  }, [tournamentId]);

  const fetchRegistration = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await registrationService.getMyRegistration(tournamentId);
      
      if (response.data) {
        setRegistration(response.data);
        
        // Fetch documents and fitness status
        try {
          const [docsRes, fitnessRes] = await Promise.all([
            registrationService.getDocuments(response.data.id),
            registrationService.getFitnessStatus(response.data.id),
          ]);
          setDocuments(docsRes.data || []);
          setFitnessStatus(fitnessRes.data || null);
        } catch (err) {
          // Documents and fitness might not exist yet
          console.warn('Could not fetch additional registration details:', err);
        }
      } else {
        setRegistration(null);
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        // Not registered yet - this is fine
        setRegistration(null);
      } else {
        console.error('Failed to fetch registration:', err);
        setError(t('registration.status.fetchError', 'Failed to load registration status'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-center py-4">
          <Loading size="md" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
        <Alert variant="error">{error}</Alert>
        <Button variant="outline" onClick={fetchRegistration} className="mt-4">
          {t('common.retry', 'Retry')}
        </Button>
      </div>
    );
  }

  if (!registration) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
            />
          </svg>
          <h3 className="mt-3 text-lg font-medium text-gray-900">
            {t('registration.status.notRegistered', 'Not Registered')}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {t('registration.status.notRegisteredDesc', "You haven't registered for this tournament yet.")}
          </p>
          {onRegisterClick && (
            <Button variant="primary" onClick={onRegisterClick} className="mt-4">
              {t('registration.status.registerNow', 'Register Now')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  const status = registration.status || 'PENDING';
  const statusVariant = STATUS_VARIANTS[status] || 'gray';
  const statusLabel = STATUS_LABELS[status] || status;

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {t('registration.status.title', 'Your Registration')}
        </h3>
        <Badge variant={statusVariant} size="lg">
          {t(`registration.status.${status.toLowerCase()}`, statusLabel)}
        </Badge>
      </div>

      <div className="space-y-4">
        {/* Club Info */}
        {registration.club && (
          <div className="flex items-center gap-3">
            {registration.club.logo && (
              <img
                src={registration.club.logo}
                alt={registration.club.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            )}
            <div>
              <p className="font-medium text-gray-900">
                {registration.club.name}
              </p>
              <p className="text-sm text-gray-500">
                {t('registration.status.registeredAs', 'Registered as team representative')}
              </p>
            </div>
          </div>
        )}

        {/* Registration Details */}
        <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-gray-200">
          {registration.coachName && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                {t('registration.status.coach', 'Coach')}
              </p>
              <p className="mt-1 font-medium text-gray-900">
                {registration.coachName}
              </p>
            </div>
          )}
          {registration.numberOfPlayers && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                {t('registration.status.players', 'Players')}
              </p>
              <p className="mt-1 font-medium text-gray-900">
                {registration.numberOfPlayers}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              {t('registration.status.documents', 'Documents')}
            </p>
            <p className="mt-1 font-medium text-gray-900">
              {documents.length} {t('registration.status.uploaded', 'uploaded')}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              {t('registration.status.fitness', 'Fitness')}
            </p>
            <p className={`mt-1 font-medium ${fitnessStatus?.fitnessConfirmed ? 'text-green-600' : 'text-yellow-600'}`}>
              {fitnessStatus?.fitnessConfirmed
                ? t('registration.status.confirmed', 'Confirmed')
                : t('registration.status.pending', 'Pending')}
            </p>
          </div>
        </div>

        {/* Registration Date */}
        <p className="text-sm text-gray-500">
          {t('registration.status.registeredOn', 'Registered on')}{' '}
          {new Date(registration.createdAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>

        {/* Status-specific Messages */}
        {status === 'PENDING' && (
          <Alert variant="info">
            {t('registration.status.pendingMessage', 'Your registration is being reviewed by the tournament organizer. You will be notified once a decision has been made.')}
          </Alert>
        )}

        {status === 'APPROVED' && (
          <Alert variant="success">
            {t('registration.status.approvedMessage', 'Your registration has been approved! Check the tournament schedule for match details.')}
          </Alert>
        )}

        {status === 'REJECTED' && (
          <Alert variant="error">
            {t('registration.status.rejectedMessage', 'Unfortunately, your registration was not accepted. Please contact the tournament organizer for more information.')}
          </Alert>
        )}
      </div>
    </div>
  );
}

export default RegistrationStatus;
