'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Alert, Loading, Select, Modal } from '@/components/ui';
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
  const [stoppingRegistration, setStoppingRegistration] = useState(false);
  const [numberOfGroups, setNumberOfGroups] = useState(4);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showExecuteDrawModal, setShowExecuteDrawModal] = useState(false);
  const [showClearPotsModal, setShowClearPotsModal] = useState(false);

  // Registrations filtered by selected age group
  const registrations = selectedAgeGroupId
    ? allRegistrations.filter((r) => r.ageGroupId === selectedAgeGroupId)
    : allRegistrations;

  // Derive pot structure dynamically — supports non-divisible team counts
  const numFullPots = registrations.length > 0 && numberOfGroups > 0
    ? Math.floor(registrations.length / numberOfGroups)
    : 0;
  const remainder = registrations.length > 0 && numberOfGroups > 0
    ? registrations.length % numberOfGroups
    : 0;
  const totalPots = numFullPots + (remainder > 0 ? 1 : 0); // includes remainder pot if needed
  const teamsPerPot = numberOfGroups; // each full pot has exactly numberOfGroups teams
  // For backward compat, keep numPots as total pot count
  const numPots = totalPots;

  useEffect(() => {
    fetchInitialData();
  }, [tournamentId]);

  // When selected age group changes, fetch pots for that age group
  // Re-fetch pots when age group or number of groups changes
  useEffect(() => {
    if (selectedAgeGroupId) {
      fetchPotAssignments(selectedAgeGroupId);
    }
  }, [selectedAgeGroupId, numPots]);

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
      // Backend returns PotResponse[] (dynamic pot count)
      const potsData = Array.isArray(response.data) 
        ? response.data 
        : [];
      
      // Use dynamic pot count based on returned data + expected count
      // Show whichever is larger: returned pots or expected pots
      const maxPot = Math.max(
        numPots,
        potsData.reduce((max: number, p: Pot) => Math.max(max, p.potNumber), 0)
      );
      const newPots = Array.from({ length: Math.max(maxPot, 1) }, (_, i) => {
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
      const fallbackCount = Math.max(numPots, 1);
      const initialPots = Array.from({ length: fallbackCount }, (_, i) => ({
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

  const handleExecuteDraw = () => {
    if (!selectedAgeGroupId) return;
    setShowExecuteDrawModal(true);
  };

  const confirmExecuteDraw = async () => {
    if (!selectedAgeGroupId) return;
    setShowExecuteDrawModal(false);

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

  const handleStopRegistration = async () => {
    if (!tournament) return;
    setStoppingRegistration(true);
    try {
      await tournamentService.updateTournament(tournament.id, { isRegistrationClosed: true } as any);
      setTournament((prev) => prev ? { ...prev, isRegistrationClosed: true } : prev);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to stop registration');
    } finally {
      setStoppingRegistration(false);
    }
  };

  const handleClearPots = () => {
    setShowClearPotsModal(true);
  };

  const confirmClearPots = async () => {
    setShowClearPotsModal(false);

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
    const isDrawAlreadyDone = selectedGroup?.drawCompleted === true;
    return (
      !isDrawAlreadyDone &&
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

        {/* Registration must be closed before managing pots */}
        {tournament && !tournament.isRegistrationClosed && (
          <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-amber-800">Registration is still open</p>
                <p className="text-sm text-amber-700 mt-0.5">
                  You must stop registration before managing pots and executing the draw.
                </p>
              </div>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={handleStopRegistration}
              isLoading={stoppingRegistration}
              className="shrink-0"
            >
              Stop Registration
            </Button>
          </div>
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
                          ? 'border-[#1e3a5f] text-[#1e3a5f]'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {ag.displayLabel || `Year ${ag.birthYear}`}
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        isSelected ? 'bg-[#dbeafe] text-[#1e3a5f]' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {agRegs.length}
                      </span>
                      {ag.drawCompleted && (
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          ✓ Draw Done
                        </span>
                      )}
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
            {/* Draw already completed banner */}
            {selectedGroup?.drawCompleted && (
              <div className="mb-6 rounded-xl border border-green-300 bg-green-50 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">Draw already completed for {selectedGroup?.displayLabel}</p>
                    <p className="text-sm text-green-700 mt-0.5">
                      The pot draw has been executed. Groups have been created. You can now generate the bracket.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/dashboard/tournaments/${tournamentId}?tab=groups&ageGroupId=${selectedAgeGroupId}`)}
                  className="shrink-0 border-green-400 text-green-700 hover:bg-green-100"
                >
                  View Groups →
                </Button>
              </div>
            )}

            {/* Format-gating banner */}
            {selectedGroup?.format === 'ROUND_ROBIN' && (
              <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-semibold text-amber-800">Pot draw not applicable for Round Robin</h3>
                    <p className="mt-1 text-sm text-amber-700">
                      This age group uses the <strong>Round Robin</strong> format where all teams play each other — no group seeding draw is required. The bracket is generated automatically.
                    </p>
                    <Link
                      href={`/dashboard/tournaments/${tournamentId}?tab=matches&ageGroupId=${selectedAgeGroupId}`}
                      className="mt-2 inline-flex items-center text-sm font-medium text-amber-800 hover:text-amber-900 underline"
                    >
                      Go to Bracket Generation →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Seeding-only formats (SE / DE / LEAGUE) */}
            {(selectedGroup?.format === 'SINGLE_ELIMINATION' ||
              selectedGroup?.format === 'DOUBLE_ELIMINATION' ||
              selectedGroup?.format === 'LEAGUE') && (
              <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-semibold text-blue-800">
                      Seeding Draw — {selectedGroup.format === 'LEAGUE' ? 'League' : selectedGroup.format === 'SINGLE_ELIMINATION' ? 'Single Elimination' : 'Double Elimination'}
                    </h3>
                    <p className="mt-1 text-sm text-blue-700">
                      Assign teams to pots to control seeding order. For this format, pots are used for seeding purposes only — the bracket will be generated based on seed positions.
                    </p>
                  </div>
                </div>
              </div>
            )}
            {/* Only show pot management for formats that use it */}
            {selectedGroup?.format !== 'ROUND_ROBIN' && (
            <><Card className="mb-6">
              <CardHeader>
                <CardTitle>
                  Draw Configuration — {selectedGroup?.displayLabel || 'Selected Age Group'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <div className="p-4 bg-white border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600">Pot Structure</p>
                    {numFullPots > 0 ? (
                      <div>
                        <p className="text-2xl font-bold text-[#1e3a5f]">
                          {numFullPots} pots &times; {teamsPerPot} teams
                        </p>
                        {remainder > 0 && (
                          <p className="text-xs text-amber-600 font-medium mt-1">
                            + 1 remainder pot ({remainder} {remainder === 1 ? 'team' : 'teams'})
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 mt-1">No teams</p>
                    )}
                  </div>
                </div>

                {/* Remainder info (non-divisible team count) */}
                {remainder > 0 && registrations.length > 0 && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-amber-600 mr-2 mt-0.5" />
                      <div className="text-sm text-amber-800">
                        <p>
                          <span className="font-semibold">Uneven distribution:</span> {registrations.length} teams ÷ {numberOfGroups} groups
                          = {numFullPots} teams/group + {remainder} extra {remainder === 1 ? 'team' : 'teams'}.
                        </p>
                        <p className="mt-1">
                          Assign {numFullPots} full pots ({teamsPerPot} teams each), then assign the remaining {remainder} {remainder === 1 ? 'team' : 'teams'} to
                          <span className="font-semibold"> Pot {numFullPots + 1} (Remainder)</span>.
                          During the draw, {remainder} randomly chosen {remainder === 1 ? 'group' : 'groups'} will receive an extra team.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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
                          {selectedGroup?.drawCompleted && (
                            <li>Draw has already been completed for this age group</li>
                          )}
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
                        Ready to execute draw for {selectedGroup?.displayLabel}! Click &ldquo;Execute Draw&rdquo; to create {numberOfGroups} groups
                        {remainder > 0
                          ? ` (${numberOfGroups - remainder} groups with ${numFullPots} teams, ${remainder} groups with ${numFullPots + 1} teams).`
                          : ` with ${numFullPots} teams each.`}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pots Grid */}
            <div className={`grid grid-cols-1 md:grid-cols-2 ${pots.length <= 4 ? 'lg:grid-cols-4' : pots.length <= 6 ? 'lg:grid-cols-3 xl:grid-cols-6' : 'lg:grid-cols-4 xl:grid-cols-4'} gap-4 mb-6`}>
              {pots.map((pot) => {
                const isRemainderPot = remainder > 0 && pot.potNumber === numFullPots + 1;
                const expectedCount = isRemainderPot ? remainder : teamsPerPot;
                const bgColors = ['bg-yellow-50', 'bg-blue-50', 'bg-green-50', 'bg-purple-50', 'bg-pink-50', 'bg-orange-50', 'bg-teal-50', 'bg-indigo-50'];
                const bgColor = isRemainderPot ? 'bg-amber-50' : (bgColors[(pot.potNumber - 1) % bgColors.length] || 'bg-white');
                const isFull = expectedCount > 0 && pot.count === expectedCount;
                const isOverfull = expectedCount > 0 && pot.count > expectedCount;
                return (
                  <Card key={pot.potNumber} className={isRemainderPot ? 'border-amber-300 border-dashed border-2' : ''}>
                    <CardHeader className={bgColor}>
                      <CardTitle className="flex items-center justify-between">
                        <span>{isRemainderPot ? `Pot ${pot.potNumber} (Remainder)` : `Pot ${pot.potNumber}`}</span>
                        <Badge variant={isFull ? 'success' : isOverfull ? 'error' : pot.count > 0 ? 'primary' : 'default'}>
                          {pot.count}/{expectedCount} teams
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        {isRemainderPot ? 'Extra teams' : pot.potNumber === 1 ? 'Strongest Teams' : `Tier ${pot.potNumber}`}
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
                );
              })}
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
                Groups have been created for{' '}
                <span className="font-semibold">{selectedGroup?.displayLabel || 'this age group'}</span>.
                You can now manage groups and generate the bracket.
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => {
                    setShowSuccessModal(false);
                    router.push(
                      `/dashboard/tournaments/${tournamentId}?tab=groups&ageGroupId=${selectedAgeGroupId}`,
                    );
                  }}
                  className="w-full bg-[#1e3a5f] hover:bg-[#16304f]"
                >
                  View Groups &amp; Generate Bracket →
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full"
                >
                  Stay on Pots Page
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Execute Draw Confirmation Modal */}
      <Modal
        isOpen={showExecuteDrawModal}
        onClose={() => setShowExecuteDrawModal(false)}
        title="Execute Draw"
        size="sm"
        icon={<Shuffle className="w-5 h-5" />}
        iconColor="info"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowExecuteDrawModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmExecuteDraw}
              disabled={executing}
              className="bg-green-600 hover:bg-green-700"
            >
              {executing ? 'Executing...' : 'Execute Draw'}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">
          Execute pot-based draw for{' '}
          <span className="font-semibold">{selectedGroup?.displayLabel || 'this age group'}</span>{' '}
          to create{' '}
          <span className="font-semibold">{numberOfGroups} {numberOfGroups === 1 ? 'group' : 'groups'}</span>?
        </p>
        <p className="text-sm text-red-600 mt-2 font-medium">This action cannot be undone.</p>
      </Modal>

      {/* Clear Pots Confirmation Modal */}
      <Modal
        isOpen={showClearPotsModal}
        onClose={() => setShowClearPotsModal(false)}
        title="Clear All Pots"
        size="sm"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        }
        iconColor="warning"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowClearPotsModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmClearPots}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Clear Pots
            </Button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">
          Remove all pot assignments for{' '}
          <span className="font-semibold">{selectedGroup?.displayLabel || 'this age group'}</span>?
        </p>
        <p className="text-sm text-red-600 mt-2 font-medium">All team assignments will be lost.</p>
      </Modal>
    </DashboardLayout>
  );
}
