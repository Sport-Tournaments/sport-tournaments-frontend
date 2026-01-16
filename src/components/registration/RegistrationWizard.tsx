'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Modal, Alert, Loading, Input } from '@/components/ui';
import { DocumentUpload } from './DocumentUpload';
import { registrationService, clubService } from '@/services';
import { useAuth } from '@/hooks/useAuth';
import type { Club, Tournament, Registration, RegistrationDocument, DocumentType, ConfirmFitnessDto } from '@/types';
import { cn } from '@/utils/helpers';

interface RegistrationWizardProps {
  tournament: Tournament;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (registration: Registration) => void;
}

type WizardStep = 'club' | 'documents' | 'fitness' | 'review';

const STEPS: WizardStep[] = ['club', 'documents', 'fitness', 'review'];

export function RegistrationWizard({
  tournament,
  isOpen,
  onClose,
  onSuccess,
}: RegistrationWizardProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // State
  const [currentStep, setCurrentStep] = useState<WizardStep>('club');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Club selection step
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [loadingClubs, setLoadingClubs] = useState(false);
  
  // Registration state
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [documents, setDocuments] = useState<RegistrationDocument[]>([]);
  
  // Fitness step
  const [fitnessConfirmed, setFitnessConfirmed] = useState(false);
  const [fitnessNotes, setFitnessNotes] = useState('');
  
  // Additional info
  const [coachName, setCoachName] = useState('');
  const [coachPhone, setCoachPhone] = useState('');
  const [numberOfPlayers, setNumberOfPlayers] = useState<number | undefined>();
  const [emergencyContact, setEmergencyContact] = useState('');

  // Fetch clubs on mount
  useEffect(() => {
    if (isOpen && clubs.length === 0) {
      fetchClubs();
    }
  }, [isOpen]);

  // Auto-fill fields when club is selected
  useEffect(() => {
    if (selectedClub) {
      // Auto-fill contact phone as emergency contact
      if (selectedClub.contactPhone) {
        setEmergencyContact(selectedClub.contactPhone);
      } else if (selectedClub.phone) {
        setEmergencyContact(selectedClub.phone);
      }
      
      // Auto-fill coach name from current user (they are the club owner/organizer)
      if (user) {
        const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        if (userName) {
          setCoachName(userName);
        }
      }
      
      // Auto-fill coach phone from contact phone
      if (selectedClub.contactPhone) {
        setCoachPhone(selectedClub.contactPhone);
      } else if (selectedClub.phone) {
        setCoachPhone(selectedClub.phone);
      }
      
      // Set default number of players (typical youth team size)
      setNumberOfPlayers(18);
    }
  }, [selectedClub, user]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setCurrentStep('club');
        setSelectedClub(null);
        setRegistration(null);
        setDocuments([]);
        setFitnessConfirmed(false);
        setFitnessNotes('');
        setCoachName('');
        setCoachPhone('');
        setNumberOfPlayers(undefined);
        setEmergencyContact('');
        setError(null);
      }, 300);
    }
  }, [isOpen]);

  const fetchClubs = async () => {
    setLoadingClubs(true);
    try {
      const response = await clubService.getMyClubs();
      setClubs(response.data || []);
    } catch (err) {
      console.error('Failed to fetch clubs:', err);
      setError(t('registration.wizard.fetchClubsError', 'Failed to load your clubs'));
    } finally {
      setLoadingClubs(false);
    }
  };

  const currentStepIndex = STEPS.indexOf(currentStep);

  const getStepTitle = (step: WizardStep): string => {
    const titles: Record<WizardStep, string> = {
      club: t('registration.wizard.step1', 'Club Selection'),
      documents: t('registration.wizard.step2', 'Medical Documents'),
      fitness: t('registration.wizard.step3', 'Fitness Confirmation'),
      review: t('registration.wizard.step4', 'Review & Submit'),
    };
    return titles[step];
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'club':
        return !!selectedClub;
      case 'documents':
        // Medical declaration is required
        return documents.some(d => d.documentType === 'MEDICAL_DECLARATION');
      case 'fitness':
        return fitnessConfirmed;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    setError(null);
    
    if (currentStep === 'club' && selectedClub) {
      // Create the registration
      setLoading(true);
      try {
        const response = await registrationService.registerForTournament(tournament.id, {
          clubId: selectedClub.id,
          coachName: coachName || undefined,
          coachPhone: coachPhone || undefined,
          numberOfPlayers: numberOfPlayers || undefined,
          emergencyContact: emergencyContact || undefined,
        });
        
        if (response.data) {
          setRegistration(response.data);
          setCurrentStep('documents');
        }
      } catch (err: any) {
        console.error('Registration failed:', err);
        if (err.response?.status === 409) {
          setError(t('registration.wizard.alreadyRegistered', 'You are already registered for this tournament'));
        } else {
          setError(err.response?.data?.message || t('registration.wizard.registrationFailed', 'Failed to register'));
        }
      } finally {
        setLoading(false);
      }
      return;
    }
    
    if (currentStep === 'documents') {
      setCurrentStep('fitness');
      return;
    }
    
    if (currentStep === 'fitness' && registration) {
      // Save fitness confirmation
      setLoading(true);
      try {
        await registrationService.confirmFitness(registration.id, {
          coachConfirmation: fitnessConfirmed,
          notes: fitnessNotes || undefined,
        });
        setCurrentStep('review');
      } catch (err: any) {
        console.error('Fitness confirmation failed:', err);
        setError(err.response?.data?.message || t('registration.wizard.fitnessFailed', 'Failed to save fitness confirmation'));
      } finally {
        setLoading(false);
      }
      return;
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  };

  const handleComplete = () => {
    if (registration) {
      onSuccess?.(registration);
    }
    onClose();
  };

  const handleDocumentUpload = (document: RegistrationDocument) => {
    setDocuments(prev => [...prev.filter(d => d.documentType !== document.documentType), document]);
  };

  const handleDocumentDelete = (documentId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== documentId));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'club':
        return (
          <div className="space-y-6">
            <p className="text-gray-600 dark:text-gray-400">
              {t('registration.wizard.selectClubDesc', 'Select the club you want to register for this tournament and provide team details.')}
            </p>

            {loadingClubs ? (
              <div className="flex justify-center py-8">
                <Loading size="lg" />
              </div>
            ) : clubs.length === 0 ? (
              <Alert variant="warning">
                {t('registration.wizard.noClubs', 'You are not associated with any clubs. Please join or create a club first.')}
              </Alert>
            ) : (
              <>
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-900 dark:text-white">
                    {t('registration.wizard.yourClub', 'Your Club')} *
                  </label>
                  {clubs.map((club) => (
                    <label
                      key={club.id}
                      className={cn(
                        'flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors',
                        selectedClub?.id === club.id
                          ? 'border-primary bg-primary/5 dark:bg-primary/10'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      )}
                    >
                      <input
                        type="radio"
                        name="club"
                        value={club.id}
                        checked={selectedClub?.id === club.id}
                        onChange={() => setSelectedClub(club)}
                        className="w-4 h-4 text-primary"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{club.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {club.city}, {club.country}
                        </p>
                      </div>
                      {club.logo && (
                        <img src={club.logo} alt={club.name} className="w-12 h-12 rounded-full object-cover" />
                      )}
                    </label>
                  ))}
                </div>

                {selectedClub && (
                  <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {t('registration.wizard.additionalInfo', 'Additional Information (Optional)')}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label={t('registration.wizard.coachName', 'Coach Name')}
                        value={coachName}
                        onChange={(e) => setCoachName(e.target.value)}
                        placeholder={t('registration.wizard.coachNamePlaceholder', 'Enter coach name')}
                      />
                      <Input
                        label={t('registration.wizard.coachPhone', 'Coach Phone')}
                        value={coachPhone}
                        onChange={(e) => setCoachPhone(e.target.value)}
                        placeholder={t('registration.wizard.coachPhonePlaceholder', '+1 234 567 8900')}
                      />
                      <Input
                        type="number"
                        label={t('registration.wizard.numberOfPlayers', 'Number of Players')}
                        value={numberOfPlayers || ''}
                        onChange={(e) => setNumberOfPlayers(e.target.value ? parseInt(e.target.value) : undefined)}
                        placeholder={t('registration.wizard.numberOfPlayersPlaceholder', 'e.g., 18')}
                        min={1}
                        max={50}
                      />
                      <Input
                        label={t('registration.wizard.emergencyContact', 'Emergency Contact')}
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        placeholder={t('registration.wizard.emergencyContactPlaceholder', 'Phone number')}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );

      case 'documents':
        return (
          <div className="space-y-6">
            <p className="text-gray-600 dark:text-gray-400">
              {t('registration.wizard.documentsDesc', 'Upload the required documents. Medical declaration is mandatory for all participants.')}
            </p>

            <Alert variant="info">
              {t('registration.wizard.medicalInfo', 'Medical declarations are typically required to be renewed every 6 months. Make sure your document is current.')}
            </Alert>

            {registration && (
              <div className="space-y-6">
                <DocumentUpload
                  registrationId={registration.id}
                  documentType={'MEDICAL_DECLARATION' as DocumentType}
                  existingDocuments={documents}
                  onUploadSuccess={handleDocumentUpload}
                  onDeleteSuccess={handleDocumentDelete}
                />

                <DocumentUpload
                  registrationId={registration.id}
                  documentType={'PARENTAL_CONSENT' as DocumentType}
                  existingDocuments={documents}
                  onUploadSuccess={handleDocumentUpload}
                  onDeleteSuccess={handleDocumentDelete}
                />

                <DocumentUpload
                  registrationId={registration.id}
                  documentType={'INSURANCE' as DocumentType}
                  existingDocuments={documents}
                  onUploadSuccess={handleDocumentUpload}
                  onDeleteSuccess={handleDocumentDelete}
                />
              </div>
            )}
          </div>
        );

      case 'fitness':
        return (
          <div className="space-y-6">
            <p className="text-gray-600 dark:text-gray-400">
              {t('registration.wizard.fitnessDesc', 'As the coach or team representative, please confirm that all players are fit to participate.')}
            </p>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fitnessConfirmed}
                  onChange={(e) => setFitnessConfirmed(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {t('registration.wizard.fitnessConfirmLabel', 'I confirm that all team members are medically fit to participate')}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {t('registration.wizard.fitnessConfirmDesc', 'By checking this box, you declare that all players have been cleared by a medical professional and are fit to participate in competitive football.')}
                  </p>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                {t('registration.wizard.fitnessNotes', 'Additional Notes (Optional)')}
              </label>
              <textarea
                value={fitnessNotes}
                onChange={(e) => setFitnessNotes(e.target.value)}
                placeholder={t('registration.wizard.fitnessNotesPlaceholder', 'Any additional information about team fitness or medical considerations...')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <Alert variant="success">
              {t('registration.wizard.completeMessage', 'Your registration has been submitted successfully! The tournament organizer will review your application.')}
            </Alert>

            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                {t('registration.wizard.summary', 'Registration Summary')}
              </h4>

              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('registration.wizard.tournament', 'Tournament')}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{tournament.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('registration.wizard.club', 'Club')}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{selectedClub?.name}</span>
                </div>
                {coachName && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">{t('registration.wizard.coach', 'Coach')}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{coachName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('registration.wizard.documents', 'Documents')}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {documents.length} {t('registration.wizard.uploaded', 'uploaded')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('registration.wizard.fitness', 'Fitness')}</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {t('registration.wizard.confirmed', 'Confirmed')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t('registration.wizard.status', 'Status')}</span>
                  <span className="font-medium text-yellow-600 dark:text-yellow-400">
                    {t('registration.wizard.pendingReview', 'Pending Review')}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('registration.wizard.nextSteps', "You will receive a notification once your registration has been reviewed. You can track your registration status in your dashboard.")}
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={currentStep === 'review' ? handleComplete : onClose}
      title={t('registration.wizard.title', 'Tournament Registration')}
      size="lg"
    >
      <div className="min-h-[400px]">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-colors',
                  index < currentStepIndex
                    ? 'bg-primary text-white'
                    : index === currentStepIndex
                    ? 'bg-primary text-white ring-4 ring-primary/20'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                )}>
                  {index < currentStepIndex ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={cn(
                    'w-full h-1 mx-2',
                    index < currentStepIndex ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                  )} style={{ width: '80px' }} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {STEPS.map((step) => (
              <span key={step} className="text-xs text-gray-500 dark:text-gray-400 text-center w-24">
                {getStepTitle(step)}
              </span>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        {/* Step Content */}
        <div className="mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          {currentStep !== 'club' && currentStep !== 'review' ? (
            <Button variant="outline" onClick={handleBack} disabled={loading}>
              {t('common.back', 'Back')}
            </Button>
          ) : (
            <div />
          )}

          {currentStep === 'review' ? (
            <Button variant="primary" onClick={handleComplete}>
              {t('registration.wizard.done', 'Done')}
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={!canProceed() || loading}
              isLoading={loading}
            >
              {currentStep === 'fitness'
                ? t('registration.wizard.submitRegistration', 'Submit Registration')
                : t('common.next', 'Next')}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default RegistrationWizard;
