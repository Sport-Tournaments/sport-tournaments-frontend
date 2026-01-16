'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/utils/helpers';
import Button from './Button';
import Badge from './Badge';
import Modal from './Modal';
import Textarea from './Textarea';
import {
  approveRegistration,
  rejectRegistration,
  bulkApproveRegistrations,
  bulkRejectRegistrations,
} from '@/services/registration.service';
import type { Registration } from '@/types';
import { useToast } from '@/hooks';

export interface RegistrationReviewProps {
  registration: Registration;
  tournamentId: string;
  onUpdate?: (registration: Registration) => void;
}

export function RegistrationReviewCard({
  registration,
  tournamentId,
  onUpdate,
}: RegistrationReviewProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const { showToast } = useToast();

  const handleApprove = useCallback(async () => {
    setIsApproving(true);
    try {
      const response = await approveRegistration(registration.id, { reviewNotes });
      if (response.success) {
        showToast('success', 'Registration approved');
        onUpdate?.(response.data);
      }
    } catch (error) {
      console.error('Error approving registration:', error);
      showToast('error', 'Failed to approve registration');
    } finally {
      setIsApproving(false);
    }
  }, [registration.id, reviewNotes, showToast, onUpdate]);

  const handleReject = useCallback(async () => {
    if (!rejectionReason.trim()) {
      showToast('warning', 'Please provide a rejection reason');
      return;
    }

    setIsRejecting(true);
    try {
      const response = await rejectRegistration(registration.id, {
        rejectionReason,
        reviewNotes,
      });
      if (response.success) {
        showToast('success', 'Registration rejected');
        setShowRejectModal(false);
        onUpdate?.(response.data);
      }
    } catch (error) {
      console.error('Error rejecting registration:', error);
      showToast('error', 'Failed to reject registration');
    } finally {
      setIsRejecting(false);
    }
  }, [registration.id, rejectionReason, reviewNotes, showToast, onUpdate]);

  const statusColors: Record<string, 'gray' | 'green' | 'yellow' | 'red'> = {
    PENDING: 'yellow',
    APPROVED: 'green',
    REJECTED: 'red',
    WITHDRAWN: 'gray',
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-gray-900 truncate">
                {registration.club?.name || 'Unknown Club'}
              </h4>
              <Badge variant={statusColors[registration.status] || 'gray'}>
                {registration.status}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">
              {registration.club?.city}, {registration.club?.country}
            </p>
            {registration.coachName && (
              <p className="text-sm text-gray-500 mt-1">
                Coach: {registration.coachName}
              </p>
            )}
            {registration.notes && (
              <p className="text-sm text-gray-600 mt-2 italic">
                &quot;{registration.notes}&quot;
              </p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Registered {new Date(registration.createdAt).toLocaleDateString()}
            </p>
          </div>

          {registration.status === 'PENDING' && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="primary"
                size="sm"
                onClick={handleApprove}
                isLoading={isApproving}
              >
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRejectModal(true)}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Reject
              </Button>
            </div>
          )}

          {registration.status !== 'PENDING' && registration.reviewedAt && (
            <div className="text-right text-sm text-gray-500">
              <p>Reviewed {new Date(registration.reviewedAt).toLocaleDateString()}</p>
              {registration.reviewer && (
                <p>
                  by {registration.reviewer.firstName} {registration.reviewer.lastName}
                </p>
              )}
            </div>
          )}
        </div>

        {registration.rejectionReason && (
          <div className="mt-3 p-3 bg-red-50 rounded-md">
            <p className="text-sm text-red-700">
              <strong>Rejection reason:</strong> {registration.rejectionReason}
            </p>
          </div>
        )}

        {registration.reviewNotes && registration.status !== 'PENDING' && (
          <div className="mt-3 p-3 bg-white border border-gray-200 rounded-md">
            <p className="text-sm text-gray-600">
              <strong>Review notes:</strong> {registration.reviewNotes}
            </p>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Reject Registration"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Please provide a reason for rejecting this registration. This will be visible to
            the team.
          </p>
          <Textarea
            label="Rejection Reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="e.g., Missing required documents, age category mismatch..."
            required
            rows={3}
          />
          <Textarea
            label="Internal Notes (optional)"
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            placeholder="Notes for internal reference..."
            rows={2}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleReject}
              isLoading={isRejecting}
              className="bg-red-600 hover:bg-red-700"
            >
              Reject Registration
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export interface BulkRegistrationReviewProps {
  registrations: Registration[];
  tournamentId: string;
  onUpdate?: () => void;
}

export function BulkRegistrationReview({
  registrations,
  tournamentId,
  onUpdate,
}: BulkRegistrationReviewProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
  const [bulkRejectionReason, setBulkRejectionReason] = useState('');
  const [bulkReviewNotes, setBulkReviewNotes] = useState('');
  const { showToast } = useToast();

  const pendingRegistrations = registrations.filter((r) => r.status === 'PENDING');

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === pendingRegistrations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingRegistrations.map((r) => r.id)));
    }
  }, [selectedIds.size, pendingRegistrations]);

  const handleBulkApprove = useCallback(async () => {
    if (selectedIds.size === 0) return;

    setIsProcessing(true);
    try {
      const response = await bulkApproveRegistrations(tournamentId, {
        registrationIds: Array.from(selectedIds),
        reviewNotes: bulkReviewNotes || undefined,
      });
      if (response.success) {
        showToast(
          'success',
          `Successfully approved ${response.data.successful.length} registrations`
        );
        setSelectedIds(new Set());
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error bulk approving:', error);
      showToast('error', 'Failed to approve registrations');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedIds, tournamentId, bulkReviewNotes, showToast, onUpdate]);

  const handleBulkReject = useCallback(async () => {
    if (selectedIds.size === 0 || !bulkRejectionReason.trim()) {
      showToast('warning', 'Please provide a rejection reason');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await bulkRejectRegistrations(tournamentId, {
        registrationIds: Array.from(selectedIds),
        reviewNotes: bulkReviewNotes || undefined,
        rejectionReason: bulkRejectionReason,
      });
      if (response.success) {
        showToast(
          'success',
          `Successfully rejected ${response.data.successful.length} registrations`
        );
        setSelectedIds(new Set());
        setShowBulkRejectModal(false);
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error bulk rejecting:', error);
      showToast('error', 'Failed to reject registrations');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedIds, tournamentId, bulkRejectionReason, bulkReviewNotes, showToast, onUpdate]);

  if (pendingRegistrations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No pending registrations to review
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Bulk actions bar */}
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedIds.size === pendingRegistrations.length}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-600">
              {selectedIds.size} of {pendingRegistrations.length} selected
            </span>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleBulkApprove}
                isLoading={isProcessing}
              >
                Approve Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkRejectModal(true)}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                Reject Selected
              </Button>
            </div>
          )}
        </div>

        {/* Registration list */}
        <div className="space-y-3">
          {pendingRegistrations.map((registration) => (
            <div
              key={registration.id}
              className={cn(
                'flex items-center gap-4 p-4 bg-white rounded-lg border transition-colors',
                selectedIds.has(registration.id)
                  ? 'border-indigo-500 bg-indigo-50/50'
                  : 'border-gray-200'
              )}
            >
              <input
                type="checkbox"
                checked={selectedIds.has(registration.id)}
                onChange={() => toggleSelect(registration.id)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">
                  {registration.club?.name || 'Unknown Club'}
                </h4>
                <p className="text-sm text-gray-500">
                  {registration.club?.city}, {registration.club?.country}
                </p>
              </div>
              <p className="text-xs text-gray-400">
                {new Date(registration.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Bulk Reject Modal */}
      <Modal
        isOpen={showBulkRejectModal}
        onClose={() => setShowBulkRejectModal(false)}
        title={`Reject ${selectedIds.size} Registrations`}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Please provide a reason for rejecting these registrations. This will be visible to
            all selected teams.
          </p>
          <Textarea
            label="Rejection Reason"
            value={bulkRejectionReason}
            onChange={(e) => setBulkRejectionReason(e.target.value)}
            placeholder="e.g., Registration deadline passed..."
            required
            rows={3}
          />
          <Textarea
            label="Internal Notes (optional)"
            value={bulkReviewNotes}
            onChange={(e) => setBulkReviewNotes(e.target.value)}
            placeholder="Notes for internal reference..."
            rows={2}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setShowBulkRejectModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleBulkReject}
              isLoading={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              Reject All Selected
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
