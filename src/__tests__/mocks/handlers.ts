import { http, HttpResponse } from 'msw';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Mock users
const mockUsers = {
  organizer: {
    id: 'user-1',
    email: 'organizer@example.com',
    firstName: 'John',
    lastName: 'Organizer',
    role: 'ORGANIZER',
    isVerified: true,
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
  },
  participant: {
    id: 'user-2',
    email: 'participant@example.com',
    firstName: 'Jane',
    lastName: 'Participant',
    role: 'PARTICIPANT',
    isVerified: true,
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
  },
  admin: {
    id: 'user-3',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
    isVerified: true,
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
  },
};

// Mock tournaments
const mockTournaments = [
  {
    id: 'tournament-1',
    name: 'U12 Summer Cup 2025',
    description: 'Annual youth tournament in Brașov',
    ageCategory: 'U12',
    level: 'I',
    status: 'PUBLISHED',
    startDate: '2025-06-15T09:00:00Z',
    endDate: '2025-06-17T18:00:00Z',
    location: 'Brașov, Romania',
    latitude: 45.6427,
    longitude: 25.5887,
    maxTeams: 16,
    currentTeams: 12,
    currency: 'EUR',
    participationFee: 200,
    organizerId: 'user-1',
    isPremium: false,
    isFeatured: true,
    isPublished: true,
    isPrivate: false,
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
  },
  {
    id: 'tournament-2',
    name: 'U14 Champions League',
    description: 'Elite tournament for U14 teams',
    ageCategory: 'U14',
    level: 'I',
    status: 'REGISTRATION_OPEN',
    startDate: '2025-07-20T09:00:00Z',
    endDate: '2025-07-22T18:00:00Z',
    location: 'Cluj-Napoca, Romania',
    latitude: 46.7712,
    longitude: 23.6236,
    maxTeams: 24,
    currentTeams: 18,
    currency: 'EUR',
    participationFee: 300,
    organizerId: 'user-1',
    isPremium: true,
    isFeatured: true,
    isPublished: true,
    isPrivate: false,
    createdAt: '2025-02-01T10:00:00Z',
    updatedAt: '2025-02-01T10:00:00Z',
  },
];

// Mock clubs
const mockClubs = [
  {
    id: 'club-1',
    name: 'FC Youth Academy',
    country: 'Romania',
    city: 'Brașov',
    logo: 'https://example.com/logo1.png',
    ownerId: 'user-2',
    createdAt: '2025-01-10T10:00:00Z',
    updatedAt: '2025-01-10T10:00:00Z',
  },
  {
    id: 'club-2',
    name: 'Junior Stars FC',
    country: 'Romania',
    city: 'București',
    logo: 'https://example.com/logo2.png',
    ownerId: 'user-2',
    createdAt: '2025-01-12T10:00:00Z',
    updatedAt: '2025-01-12T10:00:00Z',
  },
];

export const handlers = [
  // Auth handlers
  http.post(`${API_URL}/v1/auth/login`, async ({ request }) => {
    const { email, password } = (await request.json()) as {
      email: string;
      password: string;
    };

    // Check for valid credentials
    if (email === 'organizer@example.com' && password === 'Password123!') {
      return HttpResponse.json({
        success: true,
        data: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          user: mockUsers.organizer,
        },
      });
    }

    if (email === 'participant@example.com' && password === 'Password123!') {
      return HttpResponse.json({
        success: true,
        data: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          user: mockUsers.participant,
        },
      });
    }

    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        },
      },
      { status: 401 }
    );
  }),

  http.post(`${API_URL}/v1/auth/register`, async ({ request }) => {
    const data = (await request.json()) as {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      country: string;
    };

    return HttpResponse.json({
      success: true,
      data: {
        id: 'new-user-id',
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'PARTICIPANT',
        isVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  }),

  http.post(`${API_URL}/v1/auth/logout`, () => {
    return HttpResponse.json({ success: true });
  }),

  http.get(`${API_URL}/v1/auth/me`, ({ request }) => {
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.includes('mock-access-token')) {
      return HttpResponse.json({
        success: true,
        data: mockUsers.organizer,
      });
    }
    return HttpResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
      { status: 401 }
    );
  }),

  // Tournament handlers
  http.get(`${API_URL}/v1/tournaments`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const ageCategory = url.searchParams.getAll('ageCategory');

    let filtered = [...mockTournaments];

    if (ageCategory.length > 0) {
      filtered = filtered.filter((t) => ageCategory.includes(t.ageCategory));
    }

    return HttpResponse.json({
      success: true,
      data: {
        items: filtered.slice((page - 1) * pageSize, page * pageSize),
        total: filtered.length,
        page,
        pageSize,
        totalPages: Math.ceil(filtered.length / pageSize),
        hasMore: page * pageSize < filtered.length,
      },
    });
  }),

  http.get(`${API_URL}/v1/tournaments/featured`, () => {
    return HttpResponse.json({
      success: true,
      data: mockTournaments.filter((t) => t.isFeatured),
    });
  }),

  http.get(`${API_URL}/v1/tournaments/upcoming`, () => {
    return HttpResponse.json({
      success: true,
      data: mockTournaments,
    });
  }),

  http.get(`${API_URL}/v1/tournaments/:id`, ({ params }) => {
    const tournament = mockTournaments.find((t) => t.id === params.id);
    if (tournament) {
      return HttpResponse.json({ success: true, data: tournament });
    }
    return HttpResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Tournament not found' } },
      { status: 404 }
    );
  }),

  http.post(`${API_URL}/v1/tournaments`, async ({ request }) => {
    const data = (await request.json()) as Record<string, unknown>;
    const newTournament = {
      id: `tournament-${Date.now()}`,
      ...data,
      status: 'DRAFT',
      currentTeams: 0,
      isPremium: false,
      isFeatured: false,
      isPublished: false,
      isPrivate: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json({ success: true, data: newTournament }, { status: 201 });
  }),

  http.patch(`${API_URL}/v1/tournaments/:id`, async ({ params, request }) => {
    const tournament = mockTournaments.find((t) => t.id === params.id);
    if (!tournament) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Tournament not found' } },
        { status: 404 }
      );
    }

    const data = (await request.json()) as Record<string, unknown>;
    const updated = { ...tournament, ...data, updatedAt: new Date().toISOString() };
    return HttpResponse.json({ success: true, data: updated });
  }),

  http.delete(`${API_URL}/v1/tournaments/:id`, ({ params }) => {
    const tournament = mockTournaments.find((t) => t.id === params.id);
    if (!tournament) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Tournament not found' } },
        { status: 404 }
      );
    }
    return HttpResponse.json({ success: true, data: null });
  }),

  // Club handlers
  http.get(`${API_URL}/v1/clubs`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        items: mockClubs,
        total: mockClubs.length,
        page: 1,
        pageSize: 10,
        totalPages: 1,
        hasMore: false,
      },
    });
  }),

  http.get(`${API_URL}/v1/clubs/:id`, ({ params }) => {
    const club = mockClubs.find((c) => c.id === params.id);
    if (club) {
      return HttpResponse.json({ success: true, data: club });
    }
    return HttpResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Club not found' } },
      { status: 404 }
    );
  }),

  // Registration handlers
  http.post(`${API_URL}/v1/registrations`, async ({ request }) => {
    const data = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      data: {
        id: `reg-${Date.now()}`,
        ...data,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  }),
];

export { mockUsers, mockTournaments, mockClubs };
