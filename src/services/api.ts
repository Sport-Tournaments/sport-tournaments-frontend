import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getTokenFromCookie, setTokenCookie, clearAllTokens } from '@/utils/cookies';
import type { ApiError } from '@/types';

const DEFAULT_API_BASE_URL = 'http://localhost:3001/api';

const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, '');

const resolveApiBaseUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  const rawUrl = envUrl || DEFAULT_API_BASE_URL;

  if (typeof window === 'undefined') {
    return normalizeBaseUrl(rawUrl);
  }

  try {
    const parsed = new URL(rawUrl);
    const currentHost = window.location.hostname;

    if (
      ['localhost', '127.0.0.1'].includes(parsed.hostname) &&
      currentHost &&
      !['localhost', '127.0.0.1'].includes(currentHost)
    ) {
      parsed.hostname = currentHost;
      return normalizeBaseUrl(parsed.toString());
    }

    return normalizeBaseUrl(parsed.toString());
  } catch {
    const { protocol, hostname } = window.location;
    return normalizeBaseUrl(`${protocol}//${hostname}:3001/api`);
  }
};

const apiBaseUrl = resolveApiBaseUrl();

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000'),
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent multiple token refresh requests
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

const getPersistedAuthState = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('auth-storage');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { isAuthenticated?: boolean } };
    return parsed.state ?? null;
  } catch {
    return null;
  }
};

const clearClientAuthState = () => {
  clearAllTokens();
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem('auth-storage');
    } catch {
      // ignore storage errors
    }
  }
};

const redirectToLogin = () => {
  if (typeof window === 'undefined') return;
  const currentPath = window.location.pathname;
  if (currentPath !== '/auth/login') {
    window.sessionStorage.setItem('redirectAfterLogin', currentPath);
  }
  window.location.href = '/auth/login';
};

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor: Add JWT token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getTokenFromCookie('accessToken');
    
    // Only add token if available (all endpoints are public by default)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Handle 403 Forbidden - auto logout
    if (error.response?.status === 403) {
      console.error('403 Forbidden Error:', {
        url: originalRequest.url,
        method: originalRequest.method,
        headers: originalRequest.headers,
        data: error.response.data,
      });

      const hadAuthToken = originalRequest.headers.Authorization;
      const persistedAuth = getPersistedAuthState();
      if (hadAuthToken || persistedAuth?.isAuthenticated) {
        clearClientAuthState();
        redirectToLogin();
      }
    }
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Check if the original request had an auth token
      // If not, this is a public page hitting a protected endpoint - don't redirect
      const hadAuthToken = originalRequest.headers.Authorization;
      
      if (!hadAuthToken) {
        // If auth state says logged in but token is missing, auto logout
        const persistedAuth = getPersistedAuthState();
        if (persistedAuth?.isAuthenticated) {
          clearClientAuthState();
          redirectToLogin();
        }
        return Promise.reject(error);
      }
      
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getTokenFromCookie('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call refresh token endpoint
        const response = await axios.post(
          `${apiBaseUrl}/v1/auth/refresh-token`,
          { refreshToken },
          {
            timeout: 5000,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        // Save new tokens
        setTokenCookie('accessToken', accessToken);
        setTokenCookie('refreshToken', newRefreshToken);
        
        // Update the original request header
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        // Process queued requests
        processQueue(null, accessToken);
        
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Clear tokens and redirect to login
        clearClientAuthState();
        redirectToLogin();
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other errors
    return Promise.reject(error);
  }
);

// API helper functions
export async function apiGet<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const response = await api.get<T>(url, { params });
  return response.data;
}

export async function apiPost<T>(url: string, data?: unknown): Promise<T> {
  const response = await api.post<T>(url, data);
  return response.data;
}

export async function apiPut<T>(url: string, data?: unknown): Promise<T> {
  const response = await api.put<T>(url, data);
  return response.data;
}

export async function apiPatch<T>(url: string, data?: unknown): Promise<T> {
  const response = await api.patch<T>(url, data);
  return response.data;
}

export async function apiDelete<T>(url: string): Promise<T> {
  const response = await api.delete<T>(url);
  return response.data;
}

// File upload helper
export async function apiUpload<T>(
  url: string,
  file: File,
  data?: Record<string, string>
): Promise<T> {
  const formData = new FormData();
  formData.append('file', file);
  
  if (data) {
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  const response = await api.post<T>(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
}

export default api;
