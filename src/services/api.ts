import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getTokenFromCookie, setTokenCookie, clearAllTokens } from '@/utils/cookies';
import type { ApiError } from '@/types';

// Create axios instance
export const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
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
    
    // Add User-Agent for login/refresh endpoints
    if (config.url?.includes('/auth/login') || config.url?.includes('/auth/refresh')) {
      config.headers['user-agent'] = typeof navigator !== 'undefined' 
        ? navigator.userAgent 
        : 'Football-Tournament-Frontend';
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
    
    // Handle 403 Forbidden - log for debugging
    if (error.response?.status === 403) {
      console.error('403 Forbidden Error:', {
        url: originalRequest.url,
        method: originalRequest.method,
        headers: originalRequest.headers,
        data: error.response.data,
      });
    }
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Check if the original request had an auth token
      // If not, this is a public page hitting a protected endpoint - don't redirect
      const hadAuthToken = originalRequest.headers.Authorization;
      
      if (!hadAuthToken) {
        // User was never logged in, just reject the error without redirecting
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
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/auth/refresh-token`,
          { refreshToken },
          {
            timeout: 5000,
            headers: {
              'Content-Type': 'application/json',
              'user-agent': typeof navigator !== 'undefined' 
                ? navigator.userAgent 
                : 'Football-Tournament-Frontend',
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
        clearAllTokens();
        
        if (typeof window !== 'undefined') {
          // Store the current URL for redirect after login
          const currentPath = window.location.pathname;
          if (currentPath !== '/auth/login') {
            sessionStorage.setItem('redirectAfterLogin', currentPath);
          }
          window.location.href = '/auth/login';
        }
        
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
