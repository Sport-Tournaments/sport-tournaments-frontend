import { clsx, type ClassValue } from 'clsx';

// Combine class names with clsx
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

// Format currency
export function formatCurrency(
  amount: number,
  currency = 'EUR',
  locale = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Format number with thousands separator
export function formatNumber(
  value: number,
  locale = 'en-US'
): string {
  return new Intl.NumberFormat(locale).format(value);
}

// Format percentage
export function formatPercentage(
  value: number,
  decimals = 1
): string {
  return `${value.toFixed(decimals)}%`;
}

// Truncate text
export function truncate(
  text: string,
  maxLength: number,
  ellipsis = '...'
): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - ellipsis.length) + ellipsis;
}

// Capitalize first letter
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

// Title case
export function titleCase(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => capitalize(word))
    .join(' ');
}

// Slugify text
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Get initials from name
export function getInitials(
  firstName?: string,
  lastName?: string
): string {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return `${first}${last}` || '?';
}

// Get full name
export function getFullName(
  firstName?: string,
  lastName?: string
): string {
  return [firstName, lastName].filter(Boolean).join(' ') || 'Unknown';
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone number
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/[\s-()]/g, ''));
}

// Validate URL
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Generate random string
export function generateRandomString(length = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Debounce function
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

// Throttle function
export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

// Deep clone object
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Check if object is empty
export function isEmpty(obj: Record<string, unknown>): boolean {
  return Object.keys(obj).length === 0;
}

// Remove undefined and null values from object
export function cleanObject<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const cleaned: Partial<T> = {};
  for (const key in obj) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      cleaned[key] = obj[key];
    }
  }
  return cleaned;
}

// Build query string from object
export function buildQueryString(params: Record<string, unknown>): string {
  const cleaned = cleanObject(params);
  const searchParams = new URLSearchParams();
  
  for (const [key, value] of Object.entries(cleaned)) {
    if (Array.isArray(value)) {
      value.forEach((v) => searchParams.append(key, String(v)));
    } else {
      searchParams.append(key, String(value));
    }
  }
  
  return searchParams.toString();
}

// Parse query string to object
export function parseQueryString(queryString: string): Record<string, string> {
  const params = new URLSearchParams(queryString);
  const result: Record<string, string> = {};
  
  params.forEach((value, key) => {
    result[key] = value;
  });
  
  return result;
}

// Copy to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// Download file
export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// File size formatter
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// Extract error message from API error response
export function getApiErrorMessage(error: unknown, fallbackMessage = 'An error occurred'): string {
  // Handle Axios errors with response data
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { error?: { message?: string; details?: Record<string, string[]> } } } };
    const errorData = axiosError.response?.data?.error;
    
    if (errorData) {
      // If there are validation details, extract the first error message
      if (errorData.details && typeof errorData.details === 'object') {
        const details = errorData.details;
        // Get the first validation error message from details
        for (const key of Object.keys(details)) {
          const messages = details[key];
          if (Array.isArray(messages) && messages.length > 0) {
            return messages[0];
          }
          if (typeof messages === 'string') {
            return messages;
          }
        }
      }
      
      // Return the main error message
      if (errorData.message) {
        return errorData.message;
      }
    }
  }
  
  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message;
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }
  
  return fallbackMessage;
}
