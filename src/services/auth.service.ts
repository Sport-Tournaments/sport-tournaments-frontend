import { apiPost, apiGet } from './api';
import { setTokenCookie, clearAllTokens, getTokenFromCookie } from '@/utils/cookies';
import type {
  User,
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  VerifyEmailDto,
  ApiResponse,
  TokenPair,
} from '@/types';

const AUTH_BASE = '/v1/auth';

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// Register a new user
export async function register(data: RegisterDto): Promise<ApiResponse<AuthResponse>> {
  const response = await apiPost<ApiResponse<AuthResponse>>(`${AUTH_BASE}/register`, data);
  
  if (response.success && response.data) {
    setTokenCookie('accessToken', response.data.accessToken);
    setTokenCookie('refreshToken', response.data.refreshToken);
  }
  
  return response;
}

// Login with email and password
export async function login(data: LoginDto): Promise<ApiResponse<AuthResponse>> {
  const response = await apiPost<ApiResponse<AuthResponse>>(`${AUTH_BASE}/login`, data);
  
  if (response.success && response.data) {
    setTokenCookie('accessToken', response.data.accessToken);
    setTokenCookie('refreshToken', response.data.refreshToken);
  }
  
  return response;
}

// Logout and invalidate refresh token
export async function logout(): Promise<void> {
  try {
    const refreshToken = getTokenFromCookie('refreshToken');
    await apiPost(`${AUTH_BASE}/logout`, { refreshToken });
  } catch (error) {
    // Ignore logout errors - we'll clear tokens anyway
    console.warn('Logout API call failed, clearing local tokens:', error);
  } finally {
    clearAllTokens();
  }
}

// Get current user info from token
export async function getCurrentUser(): Promise<ApiResponse<User>> {
  return apiPost<ApiResponse<User>>(`${AUTH_BASE}/me`);
}

// Verify email address
export async function verifyEmail(data: VerifyEmailDto): Promise<ApiResponse<void>> {
  return apiPost<ApiResponse<void>>(`${AUTH_BASE}/verify-email`, data);
}

// Request password reset
export async function forgotPassword(data: ForgotPasswordDto): Promise<ApiResponse<void>> {
  return apiPost<ApiResponse<void>>(`${AUTH_BASE}/forgot-password`, data);
}

// Reset password with token
export async function resetPassword(data: ResetPasswordDto): Promise<ApiResponse<void>> {
  return apiPost<ApiResponse<void>>(`${AUTH_BASE}/reset-password`, data);
}

// Change password (authenticated user)
export async function changePassword(data: ChangePasswordDto): Promise<ApiResponse<void>> {
  return apiPost<ApiResponse<void>>(`${AUTH_BASE}/change-password`, data);
}

// Refresh access token
export async function refreshToken(token: string): Promise<ApiResponse<TokenPair>> {
  return apiPost<ApiResponse<TokenPair>>(`${AUTH_BASE}/refresh-token`, { refreshToken: token });
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  const token = getTokenFromCookie('accessToken');
  return !!token;
}

// Get stored tokens
export function getTokens(): TokenPair | null {
  const accessToken = getTokenFromCookie('accessToken');
  const refreshToken = getTokenFromCookie('refreshToken');
  
  if (!accessToken || !refreshToken) return null;
  
  return { accessToken, refreshToken };
}

export const authService = {
  register,
  login,
  logout,
  getCurrentUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  refreshToken,
  isAuthenticated,
  getTokens,
};

export default authService;
