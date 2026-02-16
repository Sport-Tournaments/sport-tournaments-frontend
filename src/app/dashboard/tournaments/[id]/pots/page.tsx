'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Alert, Loading, Select } from '@/components/ui';
import { potDrawService, tournamentService, registrationService } from '@/services';
import type { Tournament, Registration, AgeGroup } from '@/types';
import { ArrowLeft, Users, CheckCircle2, AlertCircle, Shuffle } from 'lucide-react';
import Link from 'next/link';

interface PotAssignment {
  registrationId: string;
  clubName: string;
  coachName: string;
}

interface Pot {
  potNumber: number;
  count: number;
  teams: PotAssignment[];
}

const NUMBER_OF_GROUPS_OPTIONS = Array.from({ length: 32 }, (_, i) => {
  const value = i + 1;
  return {
    value: value.toString(),
    label: value === 1 ? '1 Group' : `${value} Groups`,
  };
});

export default function PotManagementPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [allRegistrations, setAllRegistrations] = useState<Registration[]>([]);
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([]);
  const [selectedAgeGroupId, setSelectedAgeGroupId] = useState<string | null>(null);
  const [pots, setPots] = useState<Pot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [numberOfGroups, setNumberOfGroups] = useState(4);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Registrations filtered by selected age group
  const registrations = selectedAgeGroupId
    ? allRegistrations.filter((r) => r.ageGroupId === selectedAgeGroupId)
    : allRegistrations;

  useEffect(() => {
    fetchInitialData();
  }, [tournamentId]);

  // When selected age group changes, fetch pots for that age group
  useEffect(() => {
    if (selectedAgeGroupId) {
      fetchPotAssignments(selectedAgeGroupId);
    }
  }, [selectedAgeGroupId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch tournament details
      const tournamentRes = await tournamentService.getTournamentById(tournamentId);
      const tournamentData = tournamentRes.data;
      setTournament(tournamentData);

      // Extract age groups from tournament
      const groups = tournamentData.ageGroups || [];
      setAgeGroups(groups);

      // Fetch registrations
      const regRes = await registrationService.getTournamentRegistrations(tournamentId);
      const approvedRegs = regRes.data.items.filter((r: Registration) => r.status === 'APPROVED');
      setAllRegistrations(approvedRegs);

      // Auto-select first age group if available
      if (groups.length > 0) {
        setSelectedAgeGroupId(groups[0].id || null);
      }
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError(err.response?.data?.message || 'Failed to load pot management data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPotAssignments = async (ageGroupId?: string) => {
    try {
      const response = await potDrawService.getPotAssignments(tournamentId, ageGroupId);
      // Backend returns PotResponse[]
      const potsData = Array.isArray(response.data) 
        ? response.data 
        : [];
      
      // Always use 4 pots (pot structure is fixed, independent of group count)
      const newPots = Array.from({ length: 4 }, (_, i) => {
        const potNumber = i + 1;
        const existingPot = potsData.find((p: Pot) => p.potNumber === potNumber);
        
        return {
          potNumber,
          count: existingPot?.count || 0,
          teams: existingPot?.teams || [],
        };
      });
      
      setPots(newPots);
    } catch (err: any) {
      console.error('Failed to fetch pot assignments:', err);
      const initialPots = Array.from({ length: 4 }, (_, i) => ({
        potNumber: i + 1,
        count: 0,
        teams: [],
      }));
      setPots(initialPots);
    }
  };

  const handleAssignToPot = async (registrationId: string, potNumber: number) => {
    try {
      await potDrawService.assignTeamToPot(tournamentId, {
        registrationId,
        potNumber,
      });
      await fetchPotAssignments(selectedAgeGroupId || undefined);
    } catch (err: any) {
      console.error('Failed to assign team to pot:', err);
      setError(err.response?.data?.message || 'Failed to assign team to pot');
    }
  };

  const handleExecuteDraw = async () => {
    if (!selectedAgeGroupId) return;

    const selectedGroup = ageGroups.find((g) => g.id === selectedAgeGroupId);
    const groupLabel = selectedGroup?.displayLabel || 'this age group';

    if (!window.confirm(
      `Execute pot-based draw for ${groupLabel} to create ${numberOfGroups} groups? This action cannot be undone.`
    )) {
      return;
    }

    try {
      setExecuting(true);
      setError(null);
      
      await potDrawService.executePotDraw(tournamentId, {
        numberOfGroups,
        ageGroupId: selectedAgeGroupId,
      });

      setShowSuccessModal(true);
    } catch (err: any) {
      console.error('Failed to execute draw:', err);
      setError(err.response?.data?.message || 'Failed to execute pot-based draw');
    } finally {
      setExecuting(false);
    }
  };

  const handleClearPots = async () => {
    const selectedGroup = ageGroups.find((g) => g.id === selectedAgeGroupId);
    const groupLabel = selectedGroup?.displayLabel || 'this age group';

    if (!window.confirm(`Clear all pot assignments for ${groupLabel}? This will remove all team assignments for this age group.`)) {
      return;
    }

    try {
      await potDrawService.clearPotAssignments(tournamentId, selectedAgeGroupId || undefined);
      await fetchPotAssignments(selectedAgeGroupId || undefined);
    } catch (err: any) {
      console.error('Failed to clear pot assignments:', err);
      setError(err.response?.data?.message || 'Failed to clear pot assignments');
    }
  };

  const isTeamInPot = (registrationId: string): number | null => {
    for (const pot of pots) {
      if (pot.teams.some((t) => t.registrationId === registrationId)) {
        return pot.potNumber;
      }
    }
    return null;
  };

  const getTotalAssigned = () => {
    if (!Array.isArray(pots)) return 0;
    return pots.reduce((sum, pot) => sum + pot.count, 0);
  };

  const canExecuteDraw = () => {
    const totalAssigned = getTotalAssigned();
    return (
      totalAssigned === registrations.length &&
      totalAssigned > 0 &&
      selectedAgeGroupId != null
    );
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

  if (!tournament) {
    return (
      <DashboardLayout>
        <Alert variant="error">Tournament not found</Alert>
      </DashboardLayout>
    );
  }

  const selectedGroup = ageGroups.find((g) => g.id === selectedAgeGroupId);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/dashboard/tournaments/${tournamentId}`}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tournament
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Pot Management</h1>
              <p className="text-gray-600 mt-1">{tournament.name}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClearPots}
                disabled={getTotalAssigned() === 0}
              >
                Clear Pots
              </Button>
              <Button
                onClick={handleExecuteDraw}
                disabled={!canExecuteDraw() || executing}
                className="bg-green-600 hover:bg-green-700"
              >
                <Shuffle className="w-4 h-4 mr-2" />
                {executing ? 'Executing...' : 'Execute Draw'}
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Age Group Tabs */}
        {ageGroups.length > 0 && (
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Age Groups">
                {ageGroups.map((ag) => {
                  const isSelected = ag.id === selectedAgeGroupId;
                  const agRegs = allRegistrations.filter((r) => r.ageGroupId === ag.id);
                  return (
                    <button
                      key={ag.id}
                      onClick={() => setSelectedAgeGroupId(ag.id || null)}
                      className={`whitespace-nowrap py-3 px-4 border-b-2 font-medium text-sm transition-colors ${
                        isSelected
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {ag.displayLabel || `Year ${ag.birthYear}`}
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        isSelected ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {agRegs.length}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {ageGroups.length === 0 && (
          <Alert variant="warning" className="mb-6">
            No age groups configured for this tournament. Please configure age groups first.
          </Alert>
        )}

        {/* Draw Configuration */}
        {selectedAgeGroupId && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>
                  Draw Configuration — {selectedGroup?.displayLabel || 'Selected Age Group'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600">Teams in {selectedGroup?.displayLabel || 'Age Group'}</p>
                    <p className="text-2xl font-bold">{registrations.length}</p>
                  </div>
                  <div className="p-4 bg-white border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600">Teams Assigned</p>
                    <p className="text-2xl font-bold">
                      {getTotalAssigned()} / {registrations.length}
                    </p>
                  </div>
                  <div className="p-4 bg-white border border-gray-200 rounded-lg">
                    <label className="text-sm text-gray-600 block mb-2">Number of Groups</label>
                    <Select
                      value={numberOfGroups.toString()}
                      options={NUMBER_OF_GROUPS_OPTIONS}
                      onChange={(e) => setNumberOfGroups(Number(e.target.value))}
                    />
                  </div>
                </div>

                {registrations.length === 0 && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                      <p className="text-sm text-yellow-800">
                        No approved registrations found for this age group. Teams must be registered and assigned to this age group first.
                      </p>
                    </div>
                  </div>
                )}

                {!canExecuteDraw() && getTotalAssigned() > 0 && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-semibold mb-1">Cannot execute draw:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {getTotalAssigned() !== registrations.length && (
                            <li>All teams must be assigned to pots</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {canExecuteDraw() && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
                      <p className="text-sm text-green-800 font-semibold">
                        Ready to execute draw for {selectedGroup?.displayLabel}! Click "Execute Draw" to create {numberOfGroups} balanced groups.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pots Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {pots.map((pot) => (
                <Card key={pot.potNumber}>
                  <CardHeader className={`
                    ${pot.potNumber === 1 ? 'bg-yellow-50' : ''}
                    ${pot.potNumber === 2 ? 'bg-blue-50' : ''}
                    ${pot.potNumber === 3 ? 'bg-green-50' : ''}
                    ${pot.potNumber === 4 ? 'bg-white' : ''}
                  `}>
                    <CardTitle className="flex items-center justify-between">
                      <span>Pot {pot.potNumber}</span>
                      <Badge variant={pot.count > 0 ? 'primary' : 'default'}>
                        {pot.count} teams
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      {pot.potNumber === 1 && 'Strongest Teams'}
                      {pot.potNumber === 2 && 'Second Tier'}
                      {pot.potNumber === 3 && 'Third Tier'}
                      {pot.potNumber === 4 && 'Weakest Teams'}
                    </p>
                  </CardHeader>
                  <CardContent>
                    {pot.teams.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No teams assigned</p>
                    ) : (
                      <ul className="space-y-2">
                        {pot.teams.map((team) => (
                          <li
                            key={team.registrationId}
                            className="text-sm p-2 bg-white border rounded hover:bg-primary/5"
                          >
                            <p className="font-medium">{team.clubName}</p>
                            <p className="text-xs text-gray-600">{team.coachName}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Unassigned Teams */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  {selectedGroup?.displayLabel || 'Age Group'} — Assign Teams to Pots
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {registrations.map((reg) => {
                    const assignedPot = isTeamInPot(reg.id);
                    return (
                      <div
                        key={reg.id}
                        className="flex items-center justify-between p-4 bg-white border rounded-lg hover:bg-primary/5"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{reg.club?.name || 'Unknown Club'}</p>
                          <p className="text-sm text-gray-600">Team: {reg.team?.name || 'Not specified'}</p>
                          <p className="text-sm text-gray-600">{reg.coachName}</p>
                          {assignedPot && (
                            <Badge variant="success" className="mt-1">
                              Assigned to Pot {assignedPot}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {pots.map((pot) => (
                            <Button
                              key={pot.potNumber}
                              size="sm"
                              variant={assignedPot === pot.potNumber ? 'primary' : 'outline'}
                              onClick={() => handleAssignToPot(reg.id, pot.potNumber)}
                            >
                              Pot {pot.potNumber}
                            </Button>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {registrations.length === 0 && (
                    <p className="text-gray-500 italic text-center py-8">
                      No approved registrations found for this age group
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Draw Completed Successfully!
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Groups have been created for {selectedGroup?.displayLabel || 'this age group'}.
              </p>
              <Button
                onClick={() => {
                  setShowSuccessModal(false);
                  router.push(`/dashboard/tournaments/${tournamentId}`);
                }}
                className="w-full"
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
