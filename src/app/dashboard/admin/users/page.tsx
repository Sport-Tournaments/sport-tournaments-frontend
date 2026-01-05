'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, Button, Badge, Loading, Input, Select, Modal, Alert } from '@/components/ui';
import { useAuthStore } from '@/store';
import { adminService } from '@/services';
import type { User, UserRole } from '@/types';
import { formatDateTime } from '@/utils/date';
import { useInfiniteScroll } from '@/hooks';

const PAGE_SIZE = 10;

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser && currentUser.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [currentUser, router]);

  const fetchUsers = useCallback(async (page: number) => {
    const params: any = { page, pageSize: PAGE_SIZE };
    if (roleFilter !== 'all') params.role = roleFilter;
    if (search) params.search = search;
    
    const response = await adminService.getUsers(params);
    const resData = response.data as any;
    
    // Handle different response structures
    let userData: User[] = [];
    let totalPages = 1;
    
    if (Array.isArray(resData)) {
      userData = resData;
    } else if (resData?.data?.items && Array.isArray(resData.data.items)) {
      userData = resData.data.items;
      totalPages = resData.data.totalPages || 1;
    } else if (resData?.items && Array.isArray(resData.items)) {
      userData = resData.items;
      totalPages = resData.totalPages || 1;
    } else if (resData?.data && Array.isArray(resData.data)) {
      userData = resData.data;
      totalPages = resData.totalPages || 1;
    }
    
    return {
      items: userData,
      hasMore: page < totalPages,
      totalPages,
    };
  }, [roleFilter, search]);

  const {
    items: users,
    isLoading,
    isFetchingMore,
    hasMore,
    error: fetchError,
    sentinelRef,
    retry,
    reset,
  } = useInfiniteScroll<User>({
    fetchData: fetchUsers,
    dependencies: [roleFilter, search],
  });

  const handleSearch = () => {
    reset();
  };

  const handleUpdateUser = async (data: Partial<User>) => {
    if (!selectedUser) return;
    
    try {
      await adminService.updateUser(selectedUser.id, data);
      setSuccess('User updated successfully');
      setShowEditModal(false);
      reset();
    } catch (err: any) {
      setError('Failed to update user');
    }
  };

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    try {
      await adminService.updateUser(userId, { isActive });
      setSuccess(`User ${isActive ? 'activated' : 'deactivated'} successfully`);
      reset();
    } catch (err: any) {
      setError('Failed to update user status');
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const variants: Record<UserRole, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
      ADMIN: 'danger',
      ORGANIZER: 'info',
      PARTICIPANT: 'success',
      USER: 'default',
    };
    return variants[role] || 'default';
  };

  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'ADMIN', label: 'Admin' },
    { value: 'ORGANIZER', label: 'Organizer' },
    { value: 'PARTICIPANT', label: 'Participant' },
    { value: 'USER', label: 'User' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {error && <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>}
        {success && <Alert variant="success" onClose={() => setSuccess(null)}>{success}</Alert>}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              User Management
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Manage all platform users
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="w-full sm:w-48">
                  <Select
                    options={roleOptions}
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  />
                </div>
                <Button variant="primary" onClick={handleSearch}>
                  Search
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading && users.length === 0 ? (
              <div className="flex justify-center py-12">
                <Loading size="lg" />
              </div>
            ) : fetchError ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {t('common.error')}
                </h3>
                <p className="text-gray-500 mb-4">{fetchError.message}</p>
                <Button variant="primary" onClick={retry}>
                  {t('common.retry')}
                </Button>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-primary font-semibold">
                                {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={getRoleBadge(user.role)}>{user.role}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Badge variant={user.isActive ? 'success' : 'danger'}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            {user.isVerified && (
                              <span className="text-green-500" title="Email verified">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDateTime(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowEditModal(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant={user.isActive ? 'danger' : 'success'}
                            size="sm"
                            onClick={() => handleToggleStatus(user.id, !user.isActive)}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Infinite scroll sentinel */}
            {hasMore && (
              <div 
                ref={sentinelRef} 
                className="flex justify-center py-8 border-t border-gray-200 dark:border-gray-700"
              >
                {isFetchingMore && <Loading size="md" />}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit User Modal */}
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit User"
          size="md"
        >
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  defaultValue={selectedUser.firstName}
                  onChange={(e) => setSelectedUser({ ...selectedUser, firstName: e.target.value })}
                />
                <Input
                  label="Last Name"
                  defaultValue={selectedUser.lastName}
                  onChange={(e) => setSelectedUser({ ...selectedUser, lastName: e.target.value })}
                />
              </div>
              <Input
                type="email"
                label="Email"
                defaultValue={selectedUser.email}
                onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
              />
              <Select
                label="Role"
                options={roleOptions.filter(r => r.value !== 'all')}
                value={selectedUser.role}
                onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value as UserRole })}
              />
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleUpdateUser({
                    firstName: selectedUser.firstName,
                    lastName: selectedUser.lastName,
                    email: selectedUser.email,
                    role: selectedUser.role,
                  })}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
