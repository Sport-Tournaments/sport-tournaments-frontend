import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as clubService from '../club.service';

// Mock the API functions
vi.mock('../api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiDelete: vi.fn(),
}));

// Mock helpers
vi.mock('@/utils/helpers', () => ({
  buildQueryString: vi.fn((obj) => Object.entries(obj).map(([k, v]) => `${k}=${v}`).join('&')),
}));

import { apiGet, apiPost, apiPatch, apiDelete } from '../api';

const mockApiGet = vi.mocked(apiGet);
const mockApiPost = vi.mocked(apiPost);
const mockApiPatch = vi.mocked(apiPatch);
const mockApiDelete = vi.mocked(apiDelete);

describe('Club Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getClubs', () => {
    it('should call API without filters', async () => {
      mockApiGet.mockResolvedValue({
        success: true,
        data: { items: [], total: 0 },
      });

      await clubService.getClubs();

      expect(mockApiGet).toHaveBeenCalledWith('/v1/clubs');
    });

    it('should call API with filters', async () => {
      mockApiGet.mockResolvedValue({
        success: true,
        data: { items: [], total: 0 },
      });

      await clubService.getClubs({ page: 1, pageSize: 10, search: 'test' });

      expect(mockApiGet).toHaveBeenCalledWith(expect.stringContaining('/v1/clubs?'));
    });

    it('should return paginated response', async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [{ id: '1', name: 'Club 1' }],
          total: 1,
          page: 1,
          pageSize: 10,
        },
      };
      mockApiGet.mockResolvedValue(mockResponse);

      const result = await clubService.getClubs();

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getMyClubs', () => {
    it('should call correct endpoint', async () => {
      mockApiGet.mockResolvedValue({
        success: true,
        data: [],
      });

      await clubService.getMyClubs();

      expect(mockApiGet).toHaveBeenCalledWith('/v1/clubs/my-clubs');
    });

    it('should return array of clubs', async () => {
      const clubs = [{ id: '1', name: 'My Club' }];
      mockApiGet.mockResolvedValue({ success: true, data: clubs });

      const result = await clubService.getMyClubs();

      expect(result.data).toEqual(clubs);
    });
  });

  describe('searchClubs', () => {
    it('should call API with search query', async () => {
      mockApiGet.mockResolvedValue({
        success: true,
        data: [],
      });

      await clubService.searchClubs('barcelona');

      expect(mockApiGet).toHaveBeenCalledWith('/v1/clubs/search?q=barcelona&limit=10');
    });

    it('should call API with custom limit', async () => {
      mockApiGet.mockResolvedValue({
        success: true,
        data: [],
      });

      await clubService.searchClubs('madrid', 5);

      expect(mockApiGet).toHaveBeenCalledWith('/v1/clubs/search?q=madrid&limit=5');
    });

    it('should encode special characters in query', async () => {
      mockApiGet.mockResolvedValue({
        success: true,
        data: [],
      });

      await clubService.searchClubs('club & team');

      expect(mockApiGet).toHaveBeenCalledWith(expect.stringContaining(encodeURIComponent('club & team')));
    });
  });

  describe('getClubById', () => {
    it('should call API with club ID', async () => {
      mockApiGet.mockResolvedValue({
        success: true,
        data: { id: '123', name: 'Test Club' },
      });

      await clubService.getClubById('123');

      expect(mockApiGet).toHaveBeenCalledWith('/v1/clubs/123');
    });

    it('should return club data', async () => {
      const club = { id: '123', name: 'Test Club', country: 'Spain' };
      mockApiGet.mockResolvedValue({ success: true, data: club });

      const result = await clubService.getClubById('123');

      expect(result.data).toEqual(club);
    });
  });

  describe('createClub', () => {
    const createData = {
      name: 'New Club',
      country: 'Spain',
      city: 'Barcelona',
      description: 'A great club',
    };

    it('should call API with club data', async () => {
      mockApiPost.mockResolvedValue({
        success: true,
        data: { id: '1', ...createData },
      });

      await clubService.createClub(createData);

      expect(mockApiPost).toHaveBeenCalledWith('/v1/clubs', createData);
    });

    it('should return created club', async () => {
      const createdClub = { id: '1', ...createData };
      mockApiPost.mockResolvedValue({ success: true, data: createdClub });

      const result = await clubService.createClub(createData);

      expect(result.data).toEqual(createdClub);
    });
  });

  describe('updateClub', () => {
    it('should call API with club ID and update data', async () => {
      const updateData = { name: 'Updated Club Name' };
      mockApiPatch.mockResolvedValue({
        success: true,
        data: { id: '123', name: 'Updated Club Name' },
      });

      await clubService.updateClub('123', updateData);

      expect(mockApiPatch).toHaveBeenCalledWith('/v1/clubs/123', updateData);
    });

    it('should return updated club', async () => {
      const updatedClub = { id: '123', name: 'Updated Club Name' };
      mockApiPatch.mockResolvedValue({ success: true, data: updatedClub });

      const result = await clubService.updateClub('123', { name: 'Updated Club Name' });

      expect(result.data).toEqual(updatedClub);
    });
  });

  describe('adminUpdateClub', () => {
    it('should call admin endpoint', async () => {
      const updateData = { isVerified: true };
      mockApiPatch.mockResolvedValue({
        success: true,
        data: { id: '123', isVerified: true },
      });

      await clubService.adminUpdateClub('123', updateData);

      expect(mockApiPatch).toHaveBeenCalledWith('/v1/clubs/123/admin', updateData);
    });
  });

  describe('deleteClub', () => {
    it('should call API with club ID', async () => {
      mockApiDelete.mockResolvedValue({ success: true });

      await clubService.deleteClub('123');

      expect(mockApiDelete).toHaveBeenCalledWith('/v1/clubs/123');
    });
  });

  describe('verifyClub', () => {
    it('should call verify endpoint', async () => {
      mockApiPatch.mockResolvedValue({
        success: true,
        data: { id: '123', verified: true },
      });

      await clubService.verifyClub('123');

      expect(mockApiPatch).toHaveBeenCalledWith('/v1/clubs/123/verify');
    });

    it('should return verified club', async () => {
      const verifiedClub = { id: '123', verified: true };
      mockApiPatch.mockResolvedValue({ success: true, data: verifiedClub });

      const result = await clubService.verifyClub('123');

      expect(result.data).toEqual(verifiedClub);
    });
  });

  describe('unverifyClub', () => {
    it('should call unverify endpoint', async () => {
      mockApiPatch.mockResolvedValue({
        success: true,
        data: { id: '123', verified: false },
      });

      await clubService.unverifyClub('123');

      expect(mockApiPatch).toHaveBeenCalledWith('/v1/clubs/123/unverify');
    });
  });

  describe('setClubPremium', () => {
    it('should call premium endpoint', async () => {
      mockApiPatch.mockResolvedValue({
        success: true,
        data: { id: '123', isPremium: true },
      });

      await clubService.setClubPremium('123');

      expect(mockApiPatch).toHaveBeenCalledWith('/v1/clubs/123/premium');
    });
  });

  describe('getClubStatistics', () => {
    it('should call statistics endpoint', async () => {
      mockApiGet.mockResolvedValue({
        success: true,
        data: { totalClubs: 100, verifiedClubs: 50 },
      });

      await clubService.getClubStatistics();

      expect(mockApiGet).toHaveBeenCalledWith('/v1/clubs/statistics');
    });

    it('should return statistics data', async () => {
      const stats = { totalClubs: 100, verifiedClubs: 50, premiumClubs: 10 };
      mockApiGet.mockResolvedValue({ success: true, data: stats });

      const result = await clubService.getClubStatistics();

      expect(result.data).toEqual(stats);
    });
  });

  describe('clubService object', () => {
    it('should export all methods', async () => {
      // Dynamic import to get around mocking issues
      const clubModule = await import('../club.service');
      const service = clubModule.clubService;
      
      expect(service.getClubs).toBeDefined();
      expect(service.getMyClubs).toBeDefined();
      expect(service.searchClubs).toBeDefined();
      expect(service.getClubById).toBeDefined();
      expect(service.createClub).toBeDefined();
      expect(service.updateClub).toBeDefined();
      expect(service.adminUpdateClub).toBeDefined();
      expect(service.deleteClub).toBeDefined();
      expect(service.verifyClub).toBeDefined();
      expect(service.unverifyClub).toBeDefined();
      expect(service.setClubPremium).toBeDefined();
      expect(service.getClubStatistics).toBeDefined();
    });
  });
});
