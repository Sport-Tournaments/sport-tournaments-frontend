import { getTokenFromCookie, setTokenCookie, clearAllTokens } from '@/utils/cookies';
import type { ApiError } from '@/types';

const DEFAULT_API_BASE_URL = 'http://localhost:4001/api';

type QueryParams = Record<string, unknown> | object;

type RequestConfig = {
  params?: QueryParams;
  headers?: Record<string, string>;
  data?: unknown;
  signal?: AbortSignal;
  timeout?: number;
};

type ApiResponseWrapper<T> = {
  data: T;
  status?: number;
  statusText?: string;
  headers?: Headers;
};

type RetryableRequestConfig = RequestConfig & {
  _retry?: boolean;
};

type FetchApiError = Error & {
  response?: {
    status: number;
    statusText: string;
    data?: ApiError | { message?: string; [key: string]: unknown };
    headers: Headers;
  };
  config?: RetryableRequestConfig & {
    url: string;
    method: string;
    headers: Record<string, string>;
  };
};

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
    return normalizeBaseUrl(`${protocol}//${hostname}:4001/api`);
  }
};

const apiBaseUrl = resolveApiBaseUrl();
const defaultTimeout = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000');

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
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
    if (error || !token) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const appendParams = (url: URL, params?: QueryParams) => {
  if (!params) return;

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry !== undefined && entry !== null) {
          url.searchParams.append(key, String(entry));
        }
      });
      return;
    }
    url.searchParams.set(key, String(value));
  });
};

const buildUrl = (path: string, params?: QueryParams) => {
  const isAbsoluteUrl = /^https?:\/\//i.test(path);
  const normalizedPath = isAbsoluteUrl ? path : `${apiBaseUrl}/${path.replace(/^\/+/, '')}`;
  const url = new URL(normalizedPath);
  appendParams(url, params);
  return url.toString();
};

const parseResponseBody = async (response: Response): Promise<unknown> => {
  if (response.status === 204) return undefined;

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json().catch(() => undefined);
  }

  const text = await response.text().catch(() => '');
  return text || undefined;
};

const getErrorMessage = (data: unknown, fallback: string) => {
  if (data && typeof data === 'object') {
    const maybeData = data as {
      message?: string;
      error?: { message?: string };
    };
    return maybeData.error?.message || maybeData.message || fallback;
  }
  return fallback;
};

const createTimeoutSignal = (timeout: number, upstreamSignal?: AbortSignal) => {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), timeout);

  const cleanup = () => globalThis.clearTimeout(timeoutId);

  if (upstreamSignal) {
    if (upstreamSignal.aborted) {
      controller.abort();
    } else {
      upstreamSignal.addEventListener('abort', () => controller.abort(), {
        once: true,
      });
    }
  }

  return { signal: controller.signal, cleanup };
};

const createHttpError = (
  response: Response,
  data: unknown,
  config: FetchApiError['config'],
) => {
  const error = new Error(
    getErrorMessage(data, `Request failed with status ${response.status}`),
  ) as FetchApiError;
  error.response = {
    status: response.status,
    statusText: response.statusText,
    data: data as ApiError | { message?: string; [key: string]: unknown },
    headers: response.headers,
  };
  error.config = config;
  return error;
};

const buildHeaders = (data: unknown, headers?: Record<string, string>) => {
  const requestHeaders: Record<string, string> = { ...(headers ?? {}) };
  const token = getTokenFromCookie('accessToken');
  const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;

  if (token && !requestHeaders.Authorization) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  if (isFormData) {
    // Let fetch set the multipart boundary.
    Object.keys(requestHeaders).forEach((key) => {
      if (key.toLowerCase() === 'content-type') {
        delete requestHeaders[key];
      }
    });
  } else if (
    data !== undefined &&
    !Object.keys(requestHeaders).some((key) => key.toLowerCase() === 'content-type')
  ) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  return requestHeaders;
};

const buildBody = (data: unknown) => {
  if (data === undefined) return undefined;
  if (typeof FormData !== 'undefined' && data instanceof FormData) return data;
  if (typeof Blob !== 'undefined' && data instanceof Blob) return data;
  if (typeof data === 'string') return data;
  return JSON.stringify(data);
};

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getTokenFromCookie('refreshToken');

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const { signal, cleanup } = createTimeoutSignal(5000);
  try {
    const response = await fetch(`${apiBaseUrl}/v1/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      signal,
    });
    const data = await parseResponseBody(response);

    if (!response.ok) {
      throw createHttpError(response, data, {
        url: `${apiBaseUrl}/v1/auth/refresh-token`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const tokenData = data as {
      data?: { accessToken?: string; refreshToken?: string };
    };
    const accessToken = tokenData?.data?.accessToken;
    const newRefreshToken = tokenData?.data?.refreshToken;

    if (!accessToken || !newRefreshToken) {
      throw new Error('Refresh token response is invalid');
    }

    setTokenCookie('accessToken', accessToken);
    setTokenCookie('refreshToken', newRefreshToken);

    return accessToken;
  } finally {
    cleanup();
  }
}

async function request<T>(
  method: string,
  url: string,
  data?: unknown,
  config: RetryableRequestConfig = {},
): Promise<ApiResponseWrapper<T>> {
  const timeout = config.timeout ?? defaultTimeout;
  const headers = buildHeaders(data, config.headers);
  const fullUrl = buildUrl(url, config.params);
  const requestConfig = { ...config, url, method, headers };
  const { signal, cleanup } = createTimeoutSignal(timeout, config.signal);

  try {
    const response = await fetch(fullUrl, {
      method,
      headers,
      body: buildBody(data),
      signal,
    });
    const responseData = await parseResponseBody(response);

    if (!response.ok) {
      const error = createHttpError(response, responseData, requestConfig);
      const hadAuthToken = !!headers.Authorization;
      const persistedAuth = getPersistedAuthState();

      if (response.status === 403) {
        console.error('403 Forbidden Error:', {
          url,
          method,
          headers,
          data: responseData,
        });

        if (hadAuthToken || persistedAuth?.isAuthenticated) {
          clearClientAuthState();
          redirectToLogin();
        }
      }

      if (response.status === 401 && !config._retry) {
        if (!hadAuthToken) {
          if (persistedAuth?.isAuthenticated) {
            clearClientAuthState();
            redirectToLogin();
          }
          throw error;
        }

        if (isRefreshing) {
          const token = await new Promise<string>((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          return request<T>(method, url, data, {
            ...config,
            _retry: true,
            headers: { ...config.headers, Authorization: `Bearer ${token}` },
          });
        }

        config._retry = true;
        isRefreshing = true;

        try {
          const token = await refreshAccessToken();
          processQueue(null, token);
          return request<T>(method, url, data, {
            ...config,
            headers: { ...config.headers, Authorization: `Bearer ${token}` },
          });
        } catch (refreshError) {
          processQueue(refreshError, null);
          clearClientAuthState();
          redirectToLogin();
          throw refreshError;
        } finally {
          isRefreshing = false;
        }
      }

      throw error;
    }

    return {
      data: responseData as T,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      const timeoutError = new Error('Request timed out') as FetchApiError;
      timeoutError.config = requestConfig;
      throw timeoutError;
    }
    throw error;
  } finally {
    cleanup();
  }
}

export const api = {
  get: <T = unknown>(url: string, config?: RequestConfig) =>
    request<T>('GET', url, undefined, config),
  post: <T = unknown>(url: string, data?: unknown, config?: RequestConfig) =>
    request<T>('POST', url, data, config),
  put: <T = unknown>(url: string, data?: unknown, config?: RequestConfig) =>
    request<T>('PUT', url, data, config),
  patch: <T = unknown>(url: string, data?: unknown, config?: RequestConfig) =>
    request<T>('PATCH', url, data, config),
  delete: <T = unknown>(url: string, config?: RequestConfig) =>
    request<T>('DELETE', url, config?.data, config),
};

export async function apiGet<T>(url: string, params?: QueryParams): Promise<T> {
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

export async function apiUpload<T>(
  url: string,
  file: File,
  data?: Record<string, string>,
): Promise<T> {
  const formData = new FormData();
  formData.append('file', file);

  if (data) {
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  const response = await api.post<T>(url, formData);
  return response.data;
}

export default api;
