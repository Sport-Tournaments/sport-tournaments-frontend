'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, Button, Input, Select, Loading, Pagination, Badge } from '@/components/ui';
import { crmService } from '@/services';
import type { CrmClub, CrmDirectoryFilters, CrmOrganizer, Lead } from '@/types/crm';
import { LeadStatusBadge } from './LeadBadges';
import { formatDate, userName } from './crmMeta';

const PAGE_SIZE = 25;

interface CrmDirectoryProps {
  kind: 'clubs' | 'organizers';
  refreshKey: number;
  onError: (message: string) => void;
}

type Row = CrmClub | CrmOrganizer;

/** All clubs / tournament organizers on the platform, with their CRM state. */
export default function CrmDirectory({ kind, refreshKey, onError }: CrmDirectoryProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<CrmDirectoryFilters>({ page: 1 });
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters, pageSize: PAGE_SIZE };
      const res = kind === 'clubs' ? await crmService.getClubs(params) : await crmService.getOrganizers(params);
      setRows(res.data ?? []);
      setTotal(res.meta?.total ?? 0);
      setTotalPages(res.meta?.totalPages || 1);
    } catch (err: any) {
      onError(err?.message || `Failed to load ${kind}`);
    } finally {
      setLoading(false);
    }
  }, [filters, kind, onError]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const track = async (id: string) => {
    setTracking(id);
    try {
      const lead = await crmService.track(kind === 'clubs' ? 'CLUB' : 'ORGANIZER', id);
      router.push(`/dashboard/admin/crm/${lead.id}`);
    } catch (err: any) {
      onError(err?.message || 'Failed to create lead');
      setTracking(null);
    }
  };

  const update = (patch: Partial<CrmDirectoryFilters>) => setFilters((f) => ({ ...f, ...patch, page: 1 }));
  const applySearch = () => update({ search: search || undefined, country: country || undefined });

  const leadCell = (row: Row, lead: Lead | null) =>
    lead ? (
      <div className="space-y-1">
        <Link href={`/dashboard/admin/crm/${lead.id}`} className="inline-flex items-center gap-2 hover:underline">
          <LeadStatusBadge status={lead.status} />
        </Link>
        <div className="text-xs text-gray-500">
          {lead.assignedTo ? userName(lead.assignedTo) : 'Unassigned'}
        </div>
      </div>
    ) : (
      <Button variant="outline" size="sm" isLoading={tracking === row.id} onClick={() => track(row.id)}>
        Track as lead
      </Button>
    );

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder={kind === 'clubs' ? 'Search club, city, email…' : 'Search name, organisation, email…'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
              containerClassName="flex-1"
            />
            <Input
              placeholder={kind === 'clubs' ? 'Country' : 'Tournament country'}
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
              containerClassName="sm:w-48"
            />
            <Select
              aria-label="Tracking"
              options={[
                { value: '', label: 'All' },
                { value: 'untracked', label: 'Not in CRM yet' },
                { value: 'tracked', label: 'In CRM' },
              ]}
              value={filters.tracking ?? ''}
              onChange={(e) => update({ tracking: (e.target.value || undefined) as CrmDirectoryFilters['tracking'] })}
              containerClassName="sm:w-44"
            />
            <Button variant="primary" onClick={applySearch}>
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loading size="lg" />
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No {kind} found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {kind === 'clubs' ? (
                    <tr>
                      <th className="px-4 py-3">Club</th>
                      <th className="px-4 py-3">Owner</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">CRM</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-4 py-3">Organizer</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">Activity</th>
                      <th className="px-4 py-3">Joined</th>
                      <th className="px-4 py-3">CRM</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {kind === 'clubs'
                    ? (rows as CrmClub[]).map((club) => (
                        <tr key={club.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Link href={`/main/clubs/${club.id}`} className="font-medium text-gray-900 hover:underline">
                                {club.name}
                              </Link>
                              {club.isVerified && <Badge variant="success" size="sm">Verified</Badge>}
                            </div>
                            <div className="text-xs text-gray-500">
                              {[club.city, club.country].filter(Boolean).join(', ')}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {club.organizer ? (
                              <>
                                <div>{userName(club.organizer)}</div>
                                <a href={`mailto:${club.organizer.email}`} className="text-xs text-blue-600 hover:underline">
                                  {club.organizer.email}
                                </a>
                              </>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            <div>{club.contactEmail || '—'}</div>
                            <div className="text-xs text-gray-500">{club.contactPhone || club.organizer?.phone || ''}</div>
                          </td>
                          <td className="px-4 py-3">{leadCell(club, club.lead)}</td>
                        </tr>
                      ))
                    : (rows as CrmOrganizer[]).map((org) => (
                        <tr key={org.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{org.organizationName || userName(org)}</div>
                            {org.organizationName && <div className="text-xs text-gray-500">{userName(org)}</div>}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            <a href={`mailto:${org.email}`} className="text-blue-600 hover:underline">
                              {org.email}
                            </a>
                            <div className="text-xs text-gray-500">{org.phone || ''}</div>
                          </td>
                          <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                            {org.tournamentCount} tournament{org.tournamentCount === 1 ? '' : 's'} · {org.clubCount} club
                            {org.clubCount === 1 ? '' : 's'}
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(org.createdAt)}</td>
                          <td className="px-4 py-3">{leadCell(org, org.lead)}</td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {total} {kind}
        </p>
        {totalPages > 1 && (
          <Pagination
            currentPage={filters.page ?? 1}
            totalPages={totalPages}
            onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
          />
        )}
      </div>
    </div>
  );
}
