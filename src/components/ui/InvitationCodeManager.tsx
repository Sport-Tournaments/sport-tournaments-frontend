'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/utils/helpers';
import Button from './Button';
import { 
  getInvitationCode, 
  regenerateInvitationCode 
} from '@/services/tournament.service';
import { useToast } from '@/hooks';

export interface InvitationCodeManagerProps {
  tournamentId: string;
  tournamentName?: string;
  isPrivate: boolean;
  initialCode?: string;
  initialExpiresAt?: string;
  onCodeChange?: (code: string, expiresAt?: string) => void;
}

export default function InvitationCodeManager({
  tournamentId,
  tournamentName,
  isPrivate,
  initialCode,
  initialExpiresAt,
  onCodeChange,
}: InvitationCodeManagerProps) {
  const [code, setCode] = useState(initialCode || '');
  const [expiresAt, setExpiresAt] = useState(initialExpiresAt);
  const [isLoading, setIsLoading] = useState(false);
  const [showExpirationOptions, setShowExpirationOptions] = useState(false);
  const { showToast } = useToast();

  const fetchCode = useCallback(async () => {
    if (!isPrivate) return;

    setIsLoading(true);
    try {
      const response = await getInvitationCode(tournamentId);
      if (response.success && response.data && response.data.code) {
        setCode(response.data.code);
        setExpiresAt(response.data.expiresAt);
        onCodeChange?.(response.data.code, response.data.expiresAt);
      } else {
        // No code exists yet, generate one
        const regenResponse = await regenerateInvitationCode(tournamentId, 30); // Default 30 days
        if (regenResponse.success && regenResponse.data) {
          setCode(regenResponse.data.code);
          setExpiresAt(regenResponse.data.expiresAt);
          onCodeChange?.(regenResponse.data.code, regenResponse.data.expiresAt);
          showToast('success', 'Invitation code generated');
        }
      }
    } catch (error) {
      console.error('Error fetching invitation code:', error);
      showToast('error', 'Failed to fetch invitation code');
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId, isPrivate, onCodeChange, showToast]);

  const handleRegenerate = useCallback(
    async (expiresInDays?: number) => {
      setIsLoading(true);
      setShowExpirationOptions(false);
      try {
        const response = await regenerateInvitationCode(tournamentId, expiresInDays);
        if (response.success && response.data) {
          setCode(response.data.code);
          setExpiresAt(response.data.expiresAt);
          onCodeChange?.(response.data.code, response.data.expiresAt);
          showToast('success', 'Invitation code regenerated successfully');
        }
      } catch (error) {
        console.error('Error regenerating invitation code:', error);
        showToast('error', 'Failed to regenerate invitation code');
      } finally {
        setIsLoading(false);
      }
    },
    [tournamentId, onCodeChange, showToast]
  );

  const handleCopyCode = useCallback(async () => {
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      showToast('success', 'Invitation code copied to clipboard');
    } catch (error) {
      console.error('Error copying code:', error);
      showToast('error', 'Failed to copy code');
    }
  }, [code, showToast]);

  const handleCopyLink = useCallback(async () => {
    if (!code) return;

    const link = `${window.location.origin}/main/tournaments/join?code=${code}`;
    try {
      await navigator.clipboard.writeText(link);
      showToast('success', 'Invitation link copied to clipboard');
    } catch (error) {
      console.error('Error copying link:', error);
      showToast('error', 'Failed to copy link');
    }
  }, [code, showToast]);

  if (!isPrivate) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This tournament is public. Invitation codes are only available for private tournaments.
        </p>
      </div>
    );
  }

  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          Invitation Code
        </h3>
        {!code && !isLoading && (
          <Button variant="ghost" size="sm" onClick={fetchCode}>
            Load Code
          </Button>
        )}
      </div>

      {code && (
        <>
          {/* Code display */}
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex-1 bg-gray-50 dark:bg-gray-900 rounded-lg px-4 py-3 font-mono text-lg tracking-wider text-center select-all',
                isExpired
                  ? 'text-red-600 dark:text-red-400 line-through'
                  : 'text-gray-900 dark:text-white'
              )}
            >
              {code}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCode}
              disabled={isExpired}
              title="Copy code"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </Button>
          </div>

          {/* Expiration info */}
          {expiresAt && (
            <p
              className={cn(
                'text-sm',
                isExpired
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-500 dark:text-gray-400'
              )}
            >
              {isExpired ? 'Expired' : 'Expires'} on{' '}
              {new Date(expiresAt).toLocaleDateString('en-US', {
                dateStyle: 'medium',
              })}
            </p>
          )}

          {/* Invitation Link Display */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Invitation Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/main/tournaments/join?code=${code}`}
                className={cn(
                  'flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm font-mono',
                  isExpired
                    ? 'text-red-600 dark:text-red-400 line-through'
                    : 'text-gray-700 dark:text-gray-300'
                )}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                disabled={isExpired}
                title="Copy invitation link"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExpirationOptions(!showExpirationOptions)}
                isLoading={isLoading}
              >
                <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Regenerate
              </Button>

              {/* Expiration options dropdown */}
              {showExpirationOptions && (
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                  <div className="p-2 space-y-1">
                    <button
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      onClick={() => handleRegenerate(7)}
                    >
                      Expires in 7 days
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      onClick={() => handleRegenerate(30)}
                    >
                      Expires in 30 days
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      onClick={() => handleRegenerate(90)}
                    >
                      Expires in 90 days
                    </button>
                    <button
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      onClick={() => handleRegenerate(undefined)}
                    >
                      Never expires
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Share section */}
          {tournamentName && (
            <div className="pt-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Share this code with teams you want to invite to &quot;{tournamentName}&quot;
              </p>
            </div>
          )}
        </>
      )}

      {isLoading && !code && (
        <div className="flex items-center justify-center py-4">
          <svg
            className="animate-spin h-5 w-5 text-indigo-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
