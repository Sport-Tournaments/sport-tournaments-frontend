import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as api from '@/services/api';
import {
  getTournaments,
  searchTournaments,
  getFeaturedTournaments,
  getUpcomingTournaments,
  getMyTournaments,
  getTournamentById,
  createTournament,
  updateTournament,
  deleteTournament,
  publishTournament,
} from '@/services/tournament.service';
import type { Tournament, CreateTournamentDto, UpdateTournamentDto } from '@/types';

vi.mock('@/services/api');

describe('Tournament Service', () => {
  const mockTournament: Tournament = {
    id: '1',
    name: 'U12 Summer Cup 2025',
    description: 'Annual youth tournament',
    ageCategory: 'U12',
    level: 'I',
    status: 'PUBLISHED',
    startDate: '2025-06-15T09:00:00Z',
    endDate: '2025-06-17T18:00:00Z',
    location: 'Brașov, Romania',
    maxTeams: 16,
    currentTeams: 12,
    currency: 'EUR',
    participationFee: 200,
    organizerId: 'org-1',
    isPremium: false,
    isFeatured: false,
    isPublished: true,
    isPrivate: false,
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
  };

  const mockPaginatedResponse = {
    success: true,
    data: {
      items: [mockTournament],
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
      hasMore: false,
    },
  };

  const mockApiResponse = {
    success: true,
    data: mockTournament,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTournaments', () => {
    it('should fetch tournaments without filters', async () => {
      vi.mocked(api.apiGet).mockResolvedValue(mockPaginatedResponse);

      const result = await getTournaments();

      expect(api.apiGet).toHaveBeenCalledWith('/v1/tournaments');
      expect(result).toEqual(mockPaginatedResponse);
    });

    it('should fetch tournaments with filters', async () => {
      vi.mocked(api.apiGet).mockResolvedValue(mockPaginatedResponse);

      const filters = {
        page: 1,
        pageSize: 20,
        ageCategory: 'U12' as const,
        level: 'I' as const,
        country: 'Romania',
      };

      await getTournaments(filters);

      expect(api.apiGet).toHaveBeenCalledWith(
        expect.stringContaining('/v1/tournaments?')
      );
    });

    it('should handle API errors', async () => {
      const error = new Error('Network error');
      vi.mocked(api.apiGet).mockRejectedValue(error);

      await expect(getTournaments()).rejects.toThrow('Network error');
    });
  });

  describe('searchTournaments', () => {
    it('should search tournaments with filters', async () => {
      vi.mocked(api.apiGet).mockResolvedValue(mockPaginatedResponse);

      const filters = {
        search: 'summer',
        ageCategory: 'U12' as const,
      };

      const result = await searchTournaments(filters);

      expect(api.apiGet).toHaveBeenCalledWith(
        expect.stringContaining('/v1/tournaments/search')
      );
      expect(result).toEqual(mockPaginatedResponse);
    });
  });

  describe('getFeaturedTournaments', () => {
    it('should fetch featured tournaments with default limit', async () => {
      const response = { success: true, data: [mockTournament] };
      vi.mocked(api.apiGet).mockResolvedValue(response);

      const result = await getFeaturedTournaments();

      expect(api.apiGet).toHaveBeenCalledWith('/v1/tournaments/featured?limit=6');
      expect(result).toEqual(response);
    });

    it('should fetch featured tournaments with custom limit', async () => {
      const response = { success: true, data: [mockTournament] };
      vi.mocked(api.apiGet).mockResolvedValue(response);

      await getFeaturedTournaments(10);

      expect(api.apiGet).toHaveBeenCalledWith('/v1/tournaments/featured?limit=10');
    });
  });

  describe('getUpcomingTournaments', () => {
    it('should fetch upcoming tournaments', async () => {
      const response = { success: true, data: [mockTournament] };
      vi.mocked(api.apiGet).mockResolvedValue(response);

      const result = await getUpcomingTournaments();

      expect(api.apiGet).toHaveBeenCalledWith('/v1/tournaments/upcoming?limit=6');
      expect(result).toEqual(response);
    });
  });

  describe('getMyTournaments', () => {
    it('should fetch user tournaments', async () => {
      const response = { success: true, data: [mockTournament] };
      vi.mocked(api.apiGet).mockResolvedValue(response);

      const result = await getMyTournaments();

      expect(api.apiGet).toHaveBeenCalledWith('/v1/tournaments/my-tournaments');
      expect(result).toEqual(response);
    });
  });

  describe('getTournamentById', () => {
    it('should fetch tournament by ID', async () => {
      vi.mocked(api.apiGet).mockResolvedValue(mockApiResponse);

      const result = await getTournamentById('1');

      expect(api.apiGet).toHaveBeenCalledWith('/v1/tournaments/1');
      expect(result).toEqual(mockApiResponse);
    });

    it('should handle not found error', async () => {
      const error = new Error('Tournament not found');
      vi.mocked(api.apiGet).mockRejectedValue(error);

      await expect(getTournamentById('999')).rejects.toThrow('Tournament not found');
    });
  });

  describe('createTournament', () => {
    it('should create a new tournament', async () => {
      vi.mocked(api.apiPost).mockResolvedValue(mockApiResponse);

      const createData: CreateTournamentDto = {
        name: 'New Tournament',
        description: 'Test tournament',
        ageCategory: 'U12',
        level: 'I',
        startDate: '2025-06-15T09:00:00Z',
        endDate: '2025-06-17T18:00:00Z',
        location: 'Brașov',
        maxTeams: 16,
        currency: 'EUR',
        participationFee: 200,
      };

      const result = await createTournament(createData);

      expect(api.apiPost).toHaveBeenCalledWith('/v1/tournaments', createData);
      expect(result).toEqual(mockApiResponse);
    });

    it('should handle validation errors', async () => {
      const error = new Error('Validation failed');
      vi.mocked(api.apiPost).mockRejectedValue(error);

      await expect(
        createTournament({ name: '' } as CreateTournamentDto)
      ).rejects.toThrow('Validation failed');
    });
  });

  describe('updateTournament', () => {
    it('should update an existing tournament', async () => {
      vi.mocked(api.apiPatch).mockResolvedValue(mockApiResponse);

      const updateData: UpdateTournamentDto = {
        name: 'Updated Tournament Name',
        maxTeams: 24,
      };

      const result = await updateTournament('1', updateData);

      expect(api.apiPatch).toHaveBeenCalledWith('/v1/tournaments/1', updateData);
      expect(result).toEqual(mockApiResponse);
    });
  });

  describe('deleteTournament', () => {
    it('should delete a tournament', async () => {
      const response = { success: true, data: undefined };
      vi.mocked(api.apiDelete).mockResolvedValue(response);

      const result = await deleteTournament('1');

      expect(api.apiDelete).toHaveBeenCalledWith('/v1/tournaments/1');
      expect(result.success).toBe(true);
    });
  });

  describe('publishTournament', () => {
    it('should publish a tournament', async () => {
      const publishedTournament = { ...mockTournament, status: 'PUBLISHED' };
      vi.mocked(api.apiPost).mockResolvedValue({
        success: true,
        data: publishedTournament,
      });

      const result = await publishTournament('1');

      expect(api.apiPost).toHaveBeenCalledWith('/v1/tournaments/1/publish');
      expect(result.data.status).toBe('PUBLISHED');
    });
  });
});
