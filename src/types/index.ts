// API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  limit?: number;
}

export interface QueryParams extends PaginationParams {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Team interface (placeholder until proper backend integration)
export interface Team {
  id: string;
  name: string;
  logo?: string;
  ageCategory: string;
  playerCount?: number;
  clubId: string;
  createdAt: string;
  updatedAt: string;
}

// Export all types
export * from './auth';
export * from './tournament';
export * from './club';
export * from './registration';
export * from './groups';
export * from './notification';
export * from './payment';
export * from './admin';
export * from './location';
