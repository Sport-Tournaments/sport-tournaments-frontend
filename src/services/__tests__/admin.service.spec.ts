import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminService } from '../admin.service';
import api from '../api';

// Mock the api module
vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('adminService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPlatformStatistics', () => {
    it('should fetch platform statistics from correct endpoint', async () => {
      const mockStats = {
        totalUsers: 100,
        totalTournaments: 50,
        totalClubs: 75,
        totalRegistrations: 200,
      };
      vi.mocked(api.get).mockResolvedValue({ data: mockStats });

      const result = await adminService.getPlatformStatistics();

      expect(api.get).toHaveBeenCalledWith('/v1/admin/statistics');
      expect(result).toEqual(mockStats);
    });
  });

  describe('getUsers', () => {
    it('should fetch users with params', async () => {
      const mockUsers = {
        items: [
          { id: '1', email: 'test@test.com', role: 'ADMIN' },
        ],
        total: 1,
        page: 1,
        limit: 10,
      };
      vi.mocked(api.get).mockResolvedValue({ data: mockUsers });

      const params = { page: 1, limit: 10, role: 'ADMIN' };
      const result = await adminService.getUsers(params);

      expect(api.get).toHaveBeenCalledWith('/v1/admin/users', { params });
      expect(result).toEqual(mockUsers);
    });

    it('should work without params', async () => {
      const mockUsers = { items: [], total: 0 };
      vi.mocked(api.get).mockResolvedValue({ data: mockUsers });

      const result = await adminService.getUsers();

      expect(api.get).toHaveBeenCalledWith('/v1/admin/users', { params: undefined });
      expect(result).toEqual(mockUsers);
    });
  });

  describe('getUser', () => {
    it('should fetch a single user by id', async () => {
      const mockUser = { id: '123', email: 'user@test.com', role: 'ORGANIZER' };
      vi.mocked(api.get).mockResolvedValue({ data: mockUser });

      const result = await adminService.getUser('123');

      expect(api.get).toHaveBeenCalledWith('/v1/admin/users/123');
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateUserRole', () => {
    it('should update user role with PUT request', async () => {
      const mockUpdatedUser = { id: '123', role: 'ADMIN' };
      vi.mocked(api.put).mockResolvedValue({ data: mockUpdatedUser });

      const result = await adminService.updateUserRole('123', 'ADMIN');

      expect(api.put).toHaveBeenCalledWith('/v1/admin/users/123/role', { role: 'ADMIN' });
      expect(result).toEqual(mockUpdatedUser);
    });
  });

  describe('updateUserStatus', () => {
    it('should update user status with PUT request', async () => {
      const mockUpdatedUser = { id: '123', isActive: true, isVerified: true };
      vi.mocked(api.put).mockResolvedValue({ data: mockUpdatedUser });

      const result = await adminService.updateUserStatus('123', { isActive: true, isVerified: true });

      expect(api.put).toHaveBeenCalledWith('/v1/admin/users/123/status', { isActive: true, isVerified: true });
      expect(result).toEqual(mockUpdatedUser);
    });
  });

  describe('getTournaments', () => {
    it('should fetch tournaments with params', async () => {
      const mockTournaments = {
        items: [{ id: '1', name: 'Test Tournament' }],
        total: 1,
      };
      vi.mocked(api.get).mockResolvedValue({ data: mockTournaments });

      const params = { page: 1, limit: 10, status: 'PUBLISHED' };
      const result = await adminService.getTournaments(params);

      expect(api.get).toHaveBeenCalledWith('/v1/admin/tournaments', { params });
      expect(result).toEqual(mockTournaments);
    });
  });

  describe('forceCancelTournament', () => {
    it('should cancel tournament with reason', async () => {
      const mockTournament = { id: 'tournament-123', status: 'CANCELLED' };
      vi.mocked(api.post).mockResolvedValue({ data: mockTournament });

      const result = await adminService.forceCancelTournament('tournament-123', 'Weather conditions');

      expect(api.post).toHaveBeenCalledWith('/v1/admin/tournaments/tournament-123/cancel', { reason: 'Weather conditions' });
      expect(result).toEqual(mockTournament);
    });
  });

  describe('featureTournament', () => {
    it('should feature a tournament', async () => {
      const mockTournament = { id: '123', isFeatured: true };
      vi.mocked(api.put).mockResolvedValue({ data: mockTournament });

      const result = await adminService.featureTournament('123', true);

      expect(api.put).toHaveBeenCalledWith('/v1/admin/tournaments/123/feature', { featured: true });
      expect(result).toEqual(mockTournament);
    });

    it('should unfeature a tournament', async () => {
      const mockTournament = { id: '123', isFeatured: false };
      vi.mocked(api.put).mockResolvedValue({ data: mockTournament });

      const result = await adminService.featureTournament('123', false);

      expect(api.put).toHaveBeenCalledWith('/v1/admin/tournaments/123/feature', { featured: false });
      expect(result).toEqual(mockTournament);
    });
  });

  describe('getPayments', () => {
    it('should fetch payments with params', async () => {
      const mockPayments = {
        items: [{ id: '1', amount: 100, status: 'COMPLETED' }],
        total: 1,
      };
      vi.mocked(api.get).mockResolvedValue({ data: mockPayments });

      const params = { page: 1, limit: 10 };
      const result = await adminService.getPayments(params);

      expect(api.get).toHaveBeenCalledWith('/v1/admin/payments', { params });
      expect(result).toEqual(mockPayments);
    });
  });

  describe('deleteUser', () => {
    it('should delete user with reason', async () => {
      vi.mocked(api.delete).mockResolvedValue({ data: undefined });

      await adminService.deleteUser('user-123', 'Spam account');

      expect(api.delete).toHaveBeenCalledWith('/v1/admin/users/user-123', { data: { reason: 'Spam account' } });
    });
  });
});
