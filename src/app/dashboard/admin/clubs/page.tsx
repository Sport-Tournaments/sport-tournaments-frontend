'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, Button, Badge, Loading, Input, Pagination, Alert } from '@/components/ui';
import { useAuthStore } from '@/store';
import { adminService, clubService } from '@/services';
import type { Club } from '@/types';

export default function AdminClubsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    fetchClubs();
  }, [user, router, currentPage]);

  const fetchClubs = async () => {
    setLoading(true);
    try {
      const params: any = { page: currentPage, pageSize: 10 };
      if (search) params.search = search;
      
      const response = await clubService.getClubs(params);
      const resData = response.data as any;
      
      // Handle different response structures
      let clubData: Club[] = [];
      let pages = 1;
      
      if (Array.isArray(resData)) {
        clubData = resData;
      } else if (resData?.data?.items && Array.isArray(resData.data.items)) {
        clubData = resData.data.items;
        pages = resData.data.totalPages || 1;
      } else if (resData?.items && Array.isArray(resData.items)) {
        clubData = resData.items;
        pages = resData.totalPages || 1;
      } else if (resData?.data && Array.isArray(resData.data)) {
        clubData = resData.data;
        pages = resData.totalPages || 1;
      }
      
      setClubs(clubData);
      setTotalPages(pages);
    } catch (err: any) {
      setError('Failed to load clubs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchClubs();
  };

  const handleVerify = async (clubId: string) => {
    try {
      await clubService.verifyClub(clubId);
      setSuccess('Club verified successfully');
      fetchClubs();
    } catch (err: any) {
      setError('Failed to verify club');
    }
  };

  const handleDelete = async (clubId: string) => {
    if (!confirm('Are you sure you want to delete this club? This action cannot be undone.')) return;
    
    try {
      await clubService.deleteClub(clubId);
      setSuccess('Club deleted successfully');
      fetchClubs();
    } catch (err: any) {
      setError('Failed to delete club');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {error && <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>}
        {success && <Alert variant="success" onClose={() => setSuccess(null)}>{success}</Alert>}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Club Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Manage and verify clubs
            </p>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search clubs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button variant="primary" onClick={handleSearch}>
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Clubs List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loading size="lg" />
          </div>
        ) : clubs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">No clubs found</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {clubs.map((club) => (
                <Card key={club.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start gap-3 sm:gap-4">
                      {club.logo ? (
                        <img src={club.logo} alt={club.name} className="w-16 h-16 rounded-lg object-cover" />
                      ) : (
                        <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                          <span className="text-2xl font-bold text-primary">{club.name.charAt(0)}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Link
                            href={`/clubs/${club.id}`}
                            className="font-semibold text-gray-900 dark:text-white hover:text-primary truncate"
                          >
                            {club.name}
                          </Link>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {club.city}, {club.country}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {club.isVerified ? (
                            <Badge variant="success">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="warning">Unverified</Badge>
                          )}
                          {club.isPremium && (
                            <Badge variant="info">Premium</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {club.owner && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500">Owner</p>
                        <p className="text-sm font-medium">
                          {club.owner.firstName} {club.owner.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{club.owner.email}</p>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Link href={`/clubs/${club.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">View</Button>
                      </Link>
                      {!club.isVerified && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleVerify(club.id)}
                        >
                          Verify
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(club.id)}
                      >
                        Delete
                      </Button>
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
