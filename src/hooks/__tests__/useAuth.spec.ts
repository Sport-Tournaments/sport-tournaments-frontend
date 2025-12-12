import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';

// Mock the store
const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockLogout = vi.fn();
const mockFetchUser = vi.fn();
const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
}));

vi.mock('@/store', () => ({
  useAuthStore: vi.fn(() => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: mockLogin,
    register: mockRegister,
    logout: mockLogout,
    fetchUser: mockFetchUser,
  })),
}));

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return initial unauthenticated state', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('should return all required functions', () => {
      const { result } = renderHook(() => useAuth());

      expect(typeof result.current.login).toBe('function');
      expect(typeof result.current.register).toBe('function');
      expect(typeof result.current.logout).toBe('function');
      expect(typeof result.current.hasRole).toBe('function');
      expect(typeof result.current.hasAnyRole).toBe('function');
      expect(typeof result.current.fetchUser).toBe('function');
    });
  });

  describe('Login', () => {
    it('should call store login with credentials', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  describe('Register', () => {
    it('should call store register with user data', async () => {
      const { result } = renderHook(() => useAuth());
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        country: 'Romania',
        phone: '+40123456789',
        role: 'PARTICIPANT' as const,
      };

      await act(async () => {
        await result.current.register(userData);
      });

      expect(mockRegister).toHaveBeenCalledWith(userData);
    });
  });

  describe('Logout', () => {
    it('should call store logout and redirect to login', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.logout();
      });

      expect(mockLogout).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/auth/login');
    });
  });

  describe('hasRole', () => {
    it('should return false when user is null', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.hasRole('ADMIN')).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('should return false when user is null', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.hasAnyRole(['ADMIN', 'ORGANIZER'])).toBe(false);
    });
  });
});

describe('useAuth Hook with Authenticated User', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'ORGANIZER' as const,
    isVerified: true,
    createdAt: '2025-01-15T10:00:00Z',
    updatedAt: '2025-01-15T10:00:00Z',
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Mock authenticated state
    const { useAuthStore } = await import('@/store');
    vi.mocked(useAuthStore).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      login: mockLogin,
      register: mockRegister,
      logout: mockLogout,
      fetchUser: mockFetchUser,
    } as ReturnType<typeof useAuthStore>);
  });

  it('should return authenticated user', async () => {
    const { useAuthStore } = await import('@/store');
    vi.mocked(useAuthStore).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      login: mockLogin,
      register: mockRegister,
      logout: mockLogout,
      fetchUser: mockFetchUser,
    } as ReturnType<typeof useAuthStore>);

    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should correctly check single role', async () => {
    const { useAuthStore } = await import('@/store');
    vi.mocked(useAuthStore).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      login: mockLogin,
      register: mockRegister,
      logout: mockLogout,
      fetchUser: mockFetchUser,
    } as ReturnType<typeof useAuthStore>);

    const { result } = renderHook(() => useAuth());

    expect(result.current.hasRole('ORGANIZER')).toBe(true);
    expect(result.current.hasRole('ADMIN')).toBe(false);
  });

  it('should correctly check multiple roles', async () => {
    const { useAuthStore } = await import('@/store');
    vi.mocked(useAuthStore).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      login: mockLogin,
      register: mockRegister,
      logout: mockLogout,
      fetchUser: mockFetchUser,
    } as ReturnType<typeof useAuthStore>);

    const { result } = renderHook(() => useAuth());

    expect(result.current.hasRole(['ORGANIZER', 'ADMIN'])).toBe(true);
    expect(result.current.hasRole(['ADMIN', 'PARTICIPANT'])).toBe(false);
  });

  it('should correctly check hasAnyRole', async () => {
    const { useAuthStore } = await import('@/store');
    vi.mocked(useAuthStore).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      login: mockLogin,
      register: mockRegister,
      logout: mockLogout,
      fetchUser: mockFetchUser,
    } as ReturnType<typeof useAuthStore>);

    const { result } = renderHook(() => useAuth());

    expect(result.current.hasAnyRole(['ORGANIZER', 'ADMIN'])).toBe(true);
    expect(result.current.hasAnyRole(['ADMIN', 'PARTICIPANT'])).toBe(false);
  });
});
