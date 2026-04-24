'use client';

import { useEffect, useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import Select from './Select';
import { groupService } from '@/services';

interface TeamDetail {
  id: string; // registration ID
  ageGroupId?: string;
  club?: { name: string };
  coachName?: string;
}

interface GroupWithDetails {
  id: string;
  groupLetter: string;
  teams: string[]; // registration IDs
  teamDetails: TeamDetail[];
}

interface EditGroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tournamentId: string;
  groups: GroupWithDetails[];
}

// Local mutable group state for reordering
interface LocalGroup {
  id: string;
  groupLetter: string;
  teamDetails: TeamDetail[];
  dirty: boolean;
  saving: boolean;
}

export default function EditGroupsModal({
  isOpen,
  onClose,
  onSuccess,
  tournamentId,
  groups,
}: EditGroupsModalProps) {
  // ── Reorder state ──────────────────────────────────────────────
  const [localGroups, setLocalGroups] = useState<LocalGroup[]>([]);

  // Reset local state whenever the modal opens or groups prop changes
  useEffect(() => {
    setLocalGroups(
      [...groups]
        .sort((a, b) => a.groupLetter.localeCompare(b.groupLetter))
        .map((g) => ({
          id: g.id,
          groupLetter: g.groupLetter,
          teamDetails: [...g.teamDetails],
          dirty: false,
          saving: false,
        }))
    );
    // Reset swap state too
    setSelectedTeam(null);
    setTargetGroupId('');
    setTargetTeamId('');
    setError(null);
  }, [groups, isOpen]);

  const moveTeam = (groupId: string, fromIdx: number, toIdx: number) => {
    setLocalGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const updated = [...g.teamDetails];
        const [moved] = updated.splice(fromIdx, 1);
        updated.splice(toIdx, 0, moved);
        return { ...g, teamDetails: updated, dirty: true };
      })
    );
    // Clear any active swap selection when reordering
    setSelectedTeam(null);
    setTargetGroupId('');
    setTargetTeamId('');
    setError(null);
  };

  const saveOrder = async (groupId: string) => {
    const local = localGroups.find((g) => g.id === groupId);
    if (!local) return;
    setLocalGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, saving: true } : g))
    );
    try {
      await groupService.updateGroup(tournamentId, groupId, {
        teams: local.teamDetails.map((t) => t.id),
      });
      setLocalGroups((prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, dirty: false, saving: false } : g))
      );
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Failed to save order.');
      setLocalGroups((prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, saving: false } : g))
      );
    }
  };

  // ── Cross-group swap state ─────────────────────────────────────
  const [selectedTeam, setSelectedTeam] = useState<{
    registrationId: string;
    groupId: string;
    groupLetter: string;
    name: string;
  } | null>(null);
  const [targetGroupId, setTargetGroupId] = useState('');
  const [targetTeamId, setTargetTeamId] = useState('');
  const [swapping, setSwapping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTeamName = (reg: TeamDetail, idx: number) =>
    reg?.club?.name ?? reg?.coachName ?? `Team ${idx + 1}`;

  const handleTeamClick = (
    registrationId: string,
    groupId: string,
    groupLetter: string,
    name: string
  ) => {
    if (selectedTeam?.registrationId === registrationId) {
      setSelectedTeam(null);
      setTargetGroupId('');
      setTargetTeamId('');
      setError(null);
      return;
    }
    setSelectedTeam({ registrationId, groupId, groupLetter, name });
    setTargetGroupId('');
    setTargetTeamId('');
    setError(null);
  };

  const handleClose = () => {
    setSelectedTeam(null);
    setTargetGroupId('');
    setTargetTeamId('');
    setError(null);
    onClose();
  };

  const handleSwap = async () => {
    if (!selectedTeam || !targetGroupId || !targetTeamId) return;

    // Use the original groups prop for swap (server-side teams arrays)
    const groupA = groups.find((g) => g.id === selectedTeam.groupId);
    const groupB = groups.find((g) => g.id === targetGroupId);

    if (!groupA || !groupB) {
      setError('Could not find one or both groups.');
      return;
    }

    setSwapping(true);
    setError(null);
    try {
      await groupService.swapGroupTeams(
        tournamentId,
        groupA.id,
        groupA.teams,
        selectedTeam.registrationId,
        groupB.id,
        groupB.teams,
        targetTeamId
      );
      setSelectedTeam(null);
      setTargetGroupId('');
      setTargetTeamId('');
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Failed to swap teams.');
    } finally {
      setSwapping(false);
    }
  };

  const targetGroupOptions = selectedTeam
    ? groups
        .filter((g) => g.id !== selectedTeam.groupId)
        .map((g) => ({ value: g.id, label: `Group ${g.groupLetter}` }))
    : [];

  const targetGroup = groups.find((g) => g.id === targetGroupId);
  const targetTeamOptions = targetGroup
    ? targetGroup.teamDetails.map((reg, idx) => ({
        value: reg.id,
        label: getTeamName(reg, idx),
      }))
    : [];

  const canSwap = selectedTeam && targetGroupId && targetTeamId && !swapping;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Groups"
      description="Use ↑↓ to reorder within a group, or click a team to swap it across groups."
      size="lg"
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        {/* Groups grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
          {localGroups.map((group) => (
            <div key={group.id} className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-3 py-2 border-b flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">
                  Group {group.groupLetter}
                </span>
                {group.dirty && (
                  <button
                    type="button"
                    disabled={group.saving}
                    onClick={() => saveOrder(group.id)}
                    className="text-xs font-medium px-2 py-0.5 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
                  >
                    {group.saving ? 'Saving\u2026' : 'Save order'}
                  </button>
                )}
              </div>
              <ul className="divide-y divide-gray-100">
                {group.teamDetails.map((reg, idx) => {
                  const isSelected = selectedTeam?.registrationId === reg.id;
                  return (
                    <li key={reg.id} className={`flex items-center gap-1 pr-1 ${isSelected ? 'bg-blue-50' : ''}`}>
                      {/* Reorder arrows */}
                      <div className="flex flex-col flex-shrink-0 ml-1">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveTeam(group.id, idx, idx - 1)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed touch-manipulation"
                          aria-label="Move up"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          disabled={idx === group.teamDetails.length - 1}
                          onClick={() => moveTeam(group.id, idx, idx + 1)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed touch-manipulation"
                          aria-label="Move down"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                      {/* Team row (click to select for cross-group swap) */}
                      <button
                        type="button"
                        onClick={() =>
                          handleTeamClick(
                            reg.id,
                            group.id,
                            group.groupLetter,
                            getTeamName(reg, idx)
                          )
                        }
                        className={`flex-1 text-left flex items-center gap-2 px-2 py-2 text-sm transition-colors ${
                          isSelected
                            ? 'text-blue-700 font-medium'
                            : 'hover:bg-gray-50 text-gray-800'
                        }`}
                      >
                        <span
                          className={`flex-shrink-0 w-5 h-5 rounded-full text-xs font-semibold flex items-center justify-center ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        {getTeamName(reg, idx)}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Cross-group swap configuration */}
        {selectedTeam && (
          <div className="border rounded-lg p-4 bg-blue-50 space-y-3">
            <p className="text-sm font-medium text-blue-800">
              Move to another group:{' '}
              <span className="font-semibold">{selectedTeam.name}</span>{' '}
              <span className="text-blue-600">(Group {selectedTeam.groupLetter})</span>
            </p>
            <Select
              label="Swap into group"
              options={targetGroupOptions}
              placeholder="Select target group..."
              value={targetGroupId}
              onChange={(e) => {
                setTargetGroupId(e.target.value);
                setTargetTeamId('');
              }}
            />
            {targetGroupId && (
              <Select
                label="Swap with team"
                options={targetTeamOptions}
                placeholder="Select team to swap..."
                value={targetTeamId}
                onChange={(e) => setTargetTeamId(e.target.value)}
              />
            )}
            <div className="flex gap-2 pt-1">
              <Button
                variant="primary"
                size="sm"
                onClick={handleSwap}
                disabled={!canSwap}
              >
                {swapping ? 'Swapping...' : 'Confirm Swap'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedTeam(null);
                  setTargetGroupId('');
                  setTargetTeamId('');
                  setError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
