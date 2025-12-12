import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as authService from '../auth.service';

// Mock the API functions
vi.mock('../api', () => ({
  apiPost: vi.fn(),
  apiGet: vi.fn(),
}));

// Mock cookies utilities
vi.mock('@/utils/cookies', () => ({
  setTokenCookie: vi.fn(),
  clearAllTokens: vi.fn(),
  getTokenFromCookie: vi.fn(),
}));

import { apiPost, apiGet } from '../api';
import { setTokenCookie, clearAllTokens, getTokenFromCookie } from '@/utils/cookies';

const mockApiPost = vi.mocked(apiPost);
const mockApiGet = vi.mocked(apiGet);
const mockSetTokenCookie = vi.mocked(setTokenCookie);
const mockClearAllTokens = vi.mocked(clearAllTokens);
const mockGetTokenFromCookie = vi.mocked(getTokenFromCookie);

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    const registerData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      country: 'Romania',
    };

    it('should call API with correct endpoint and data', async () => {
      mockApiPost.mockResolvedValue({
        success: true,
        data: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          user: { id: '1', email: 'test@example.com' },
        },
      });

      await authService.register(registerData);

      expect(mockApiPost).toHaveBeenCalledWith('/v1/auth/register', registerData);
    });

    it('should store tokens on successful registration', async () => {
      mockApiPost.mockResolvedValue({
        success: true,
        data: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          user: { id: '1' },
        },
      });

      await authService.register(registerData);

      expect(mockSetTokenCookie).toHaveBeenCalledWith('accessToken', 'access-token');
      expect(mockSetTokenCookie).toHaveBeenCalledWith('refreshToken', 'refresh-token');
    });

    it('should not store tokens on failed registration', async () => {
      mockApiPost.mockResolvedValue({
        success: false,
        message: 'Email already exists',
      });

      await authService.register(registerData);

      expect(mockSetTokenCookie).not.toHaveBeenCalled();
    });

    it('should return API response', async () => {
      const expectedResponse = {
        success: true,
        data: {
          accessToken: 'token',
          refreshToken: 'refresh',
          user: { id: '1' },
        },
      };
      mockApiPost.mockResolvedValue(expectedResponse);

      const result = await authService.register(registerData);

      expect(result).toEqual(expectedResponse);
    });
  });

  describe('login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should call API with correct endpoint and data', async () => {
      mockApiPost.mockResolvedValue({
        success: true,
        data: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          user: { id: '1' },
        },
      });

      await authService.login(loginData);

      expect(mockApiPost).toHaveBeenCalledWith('/v1/auth/login', loginData);
    });

    it('should store tokens on successful login', async () => {
      mockApiPost.mockResolvedValue({
        success: true,
        data: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
          user: { id: '1' },
        },
      });

      await authService.login(loginData);

      expect(mockSetTokenCookie).toHaveBeenCalledWith('accessToken', 'access-token');
      expect(mockSetTokenCookie).toHaveBeenCalledWith('refreshToken', 'refresh-token');
    });

    it('should not store tokens on failed login', async () => {
      mockApiPost.mockResolvedValue({
        success: false,
        message: 'Invalid credentials',
      });

      await authService.login(loginData);

      expect(mockSetTokenCookie).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should call logout endpoint', async () => {
      mockApiPost.mockResolvedValue({ success: true });

      await authService.logout();

      expect(mockApiPost).toHaveBeenCalledWith('/v1/auth/logout');
    });

    it('should clear tokens', async () => {
      mockApiPost.mockResolvedValue({ success: true });

      await authService.logout();

      expect(mockClearAllTokens).toHaveBeenCalled();
    });

    it('should clear tokens even if API call fails', async () => {
      mockApiPost.mockRejectedValue(new Error('Network error'));

      // The logout function should still clear tokens even if API fails
      // Since finally block runs before error propagates, we need to catch the error
      try {
        await authService.logout();
      } catch {
        // Expected to throw
      }

      expect(mockClearAllTokens).toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('should call correct endpoint', async () => {
      mockApiPost.mockResolvedValue({
        success: true,
        data: { id: '1', email: 'test@example.com' },
      });

      await authService.getCurrentUser();

      expect(mockApiPost).toHaveBeenCalledWith('/v1/auth/me');
    });

    it('should return user data', async () => {
      const userData = { id: '1', email: 'test@example.com', firstName: 'John' };
      mockApiPost.mockResolvedValue({ success: true, data: userData });

      const result = await authService.getCurrentUser();

      expect(result.data).toEqual(userData);
    });
  });

  describe('verifyEmail', () => {
    it('should call correct endpoint with token', async () => {
      mockApiPost.mockResolvedValue({ success: true });

      await authService.verifyEmail({ token: 'verification-token' });

      expect(mockApiPost).toHaveBeenCalledWith('/v1/auth/verify-email', {
        token: 'verification-token',
      });
    });
  });

  describe('forgotPassword', () => {
    it('should call correct endpoint with email', async () => {
      mockApiPost.mockResolvedValue({ success: true });

      await authService.forgotPassword({ email: 'test@example.com' });

      expect(mockApiPost).toHaveBeenCalledWith('/v1/auth/forgot-password', {
        email: 'test@example.com',
      });
    });
  });

  describe('resetPassword', () => {
    it('should call correct endpoint with token and new password', async () => {
      mockApiPost.mockResolvedValue({ success: true });

      await authService.resetPassword({
        token: 'reset-token',
        newPassword: 'newPassword123',
      });

      expect(mockApiPost).toHaveBeenCalledWith('/v1/auth/reset-password', {
        token: 'reset-token',
        newPassword: 'newPassword123',
      });
    });
  });

  describe('changePassword', () => {
    it('should call correct endpoint with passwords', async () => {
      mockApiPost.mockResolvedValue({ success: true });

      await authService.changePassword({
        currentPassword: 'oldPassword',
        newPassword: 'newPassword123',
      });

      expect(mockApiPost).toHaveBeenCalledWith('/v1/auth/change-password', {
        currentPassword: 'oldPassword',
        newPassword: 'newPassword123',
      });
    });
  });

  describe('refreshToken', () => {
    it('should call correct endpoint with refresh token', async () => {
      mockApiPost.mockResolvedValue({
        success: true,
        data: { accessToken: 'new-access', refreshToken: 'new-refresh' },
      });

      await authService.refreshToken('old-refresh-token');

      expect(mockApiPost).toHaveBeenCalledWith('/v1/auth/refresh-token', {
        refreshToken: 'old-refresh-token',
      });
    });

    it('should return new token pair', async () => {
      const tokens = { accessToken: 'new-access', refreshToken: 'new-refresh' };
      mockApiPost.mockResolvedValue({ success: true, data: tokens });

      const result = await authService.refreshToken('old-token');

      expect(result.data).toEqual(tokens);
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when access token exists', () => {
      mockGetTokenFromCookie.mockReturnValue('access-token');

      const result = authService.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false when access token does not exist', () => {
      mockGetTokenFromCookie.mockReturnValue(null);

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });

    it('should return false when access token is empty string', () => {
      mockGetTokenFromCookie.mockReturnValue('');

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('getTokens', () => {
    it('should return token pair when both tokens exist', () => {
      mockGetTokenFromCookie
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');

      const result = authService.getTokens();

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
    });

    it('should return null when access token is missing', () => {
      mockGetTokenFromCookie
        .mockReturnValueOnce(null)
        .mockReturnValueOnce('refresh-token');

      const result = authService.getTokens();

      expect(result).toBeNull();
    });

    it('should return null when refresh token is missing', () => {
      mockGetTokenFromCookie
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce(null);

      const result = authService.getTokens();

      expect(result).toBeNull();
    });

    it('should return null when both tokens are missing', () => {
      mockGetTokenFromCookie.mockReturnValue(null);

      const result = authService.getTokens();

      expect(result).toBeNull();
    });
  });
});
