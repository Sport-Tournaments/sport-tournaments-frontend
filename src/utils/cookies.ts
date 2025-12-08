// Cookie utilities for authentication tokens

const isClient = typeof window !== 'undefined';

interface CookieOptions {
  path?: string;
  domain?: string;
  maxAge?: number;
  expires?: Date;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  httpOnly?: boolean;
}

export function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
): void {
  if (!isClient) return;

  const {
    path = '/',
    maxAge = 60 * 60 * 24 * 7, // 7 days
    secure = process.env.NODE_ENV === 'production',
    sameSite = 'lax',
  } = options;

  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  cookie += `; path=${path}`;
  cookie += `; max-age=${maxAge}`;
  cookie += `; samesite=${sameSite}`;
  
  if (secure) {
    cookie += '; secure';
  }

  document.cookie = cookie;
}

export function getCookie(name: string): string | null {
  if (!isClient) return null;

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.split('=').map((c) => c.trim());
    if (cookieName === encodeURIComponent(name)) {
      return decodeURIComponent(cookieValue || '');
    }
  }
  return null;
}

export function removeCookie(name: string, path = '/'): void {
  if (!isClient) return;
  
  document.cookie = `${encodeURIComponent(name)}=; path=${path}; max-age=0`;
}

// Token-specific helpers
export function getTokenFromCookie(tokenName: 'accessToken' | 'refreshToken'): string | null {
  return getCookie(tokenName);
}

export function setTokenCookie(
  tokenName: 'accessToken' | 'refreshToken',
  token: string
): void {
  const maxAge = tokenName === 'accessToken' 
    ? 60 * 15 // 15 minutes for access token
    : 60 * 60 * 24 * 7; // 7 days for refresh token
  
  setCookie(tokenName, token, { maxAge });
}

export function removeTokenCookie(tokenName: 'accessToken' | 'refreshToken'): void {
  removeCookie(tokenName);
}

export function clearAllTokens(): void {
  removeTokenCookie('accessToken');
  removeTokenCookie('refreshToken');
}
