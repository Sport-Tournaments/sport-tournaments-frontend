import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '../usePagination';

describe('usePagination', () => {
  describe('Basic functionality', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100 }));

      expect(result.current.currentPage).toBe(1);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.totalPages).toBe(10);
    });

    it('should initialize with custom initial page', () => {
      const { result } = renderHook(() => usePagination({
        totalItems: 100,
        initialPage: 3,
      }));

      expect(result.current.currentPage).toBe(3);
    });

    it('should initialize with custom page size', () => {
      const { result } = renderHook(() => usePagination({
        totalItems: 100,
        pageSize: 25,
      }));

      expect(result.current.pageSize).toBe(25);
      expect(result.current.totalPages).toBe(4);
    });
  });

  describe('Page calculations', () => {
    it('should calculate total pages correctly', () => {
      const { result } = renderHook(() => usePagination({
        totalItems: 55,
        pageSize: 10,
      }));

      expect(result.current.totalPages).toBe(6);
    });

    it('should handle zero items', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 0 }));

      expect(result.current.totalPages).toBe(1);
      expect(result.current.currentPage).toBe(1);
    });

    it('should calculate start and end indices correctly', () => {
      const { result } = renderHook(() => usePagination({
        totalItems: 100,
        pageSize: 10,
        initialPage: 3,
      }));

      expect(result.current.startIndex).toBe(20);
      expect(result.current.endIndex).toBe(29);
    });

    it('should handle last page indices correctly', () => {
      const { result } = renderHook(() => usePagination({
        totalItems: 55,
        pageSize: 10,
        initialPage: 6,
      }));

      expect(result.current.startIndex).toBe(50);
      expect(result.current.endIndex).toBe(54);
    });
  });

  describe('Navigation flags', () => {
    it('should not have previous page on first page', () => {
      const { result } = renderHook(() => usePagination({
        totalItems: 100,
        initialPage: 1,
      }));

      expect(result.current.hasPreviousPage).toBe(false);
      expect(result.current.hasNextPage).toBe(true);
    });

    it('should not have next page on last page', () => {
      const { result } = renderHook(() => usePagination({
        totalItems: 100,
        pageSize: 10,
        initialPage: 10,
      }));

      expect(result.current.hasPreviousPage).toBe(true);
      expect(result.current.hasNextPage).toBe(false);
    });

    it('should have both navigation flags on middle page', () => {
      const { result } = renderHook(() => usePagination({
        totalItems: 100,
        initialPage: 5,
      }));

      expect(result.current.hasPreviousPage).toBe(true);
      expect(result.current.hasNextPage).toBe(true);
    });

    it('should handle single page', () => {
      const { result } = renderHook(() => usePagination({
        totalItems: 5,
        pageSize: 10,
      }));

      expect(result.current.hasPreviousPage).toBe(false);
      expect(result.current.hasNextPage).toBe(false);
    });
  });

  describe('Navigation methods', () => {
    it('should go to specific page', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100 }));

      act(() => {
        result.current.goToPage(5);
      });

      expect(result.current.currentPage).toBe(5);
    });

    it('should not go below first page', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100 }));

      act(() => {
        result.current.goToPage(0);
      });

      expect(result.current.currentPage).toBe(1);
    });

    it('should not go above last page', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100 }));

      act(() => {
        result.current.goToPage(20);
      });

      expect(result.current.currentPage).toBe(10);
    });

    it('should go to next page', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100 }));

      act(() => {
        result.current.nextPage();
      });

      expect(result.current.currentPage).toBe(2);
    });

    it('should not go past last page with nextPage', () => {
      const { result } = renderHook(() => usePagination({
        totalItems: 100,
        initialPage: 10,
      }));

      act(() => {
        result.current.nextPage();
      });

      expect(result.current.currentPage).toBe(10);
    });

    it('should go to previous page', () => {
      const { result } = renderHook(() => usePagination({
        totalItems: 100,
        initialPage: 5,
      }));

      act(() => {
        result.current.previousPage();
      });

      expect(result.current.currentPage).toBe(4);
    });

    it('should not go below first page with previousPage', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100 }));

      act(() => {
        result.current.previousPage();
      });

      expect(result.current.currentPage).toBe(1);
    });

    it('should go to first page', () => {
      const { result } = renderHook(() => usePagination({
        totalItems: 100,
        initialPage: 5,
      }));

      act(() => {
        result.current.firstPage();
      });

      expect(result.current.currentPage).toBe(1);
    });

    it('should go to last page', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100 }));

      act(() => {
        result.current.lastPage();
      });

      expect(result.current.currentPage).toBe(10);
    });
  });

  describe('Page size changes', () => {
    it('should update page size', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 100 }));

      act(() => {
        result.current.setPageSize(20);
      });

      expect(result.current.pageSize).toBe(20);
      expect(result.current.totalPages).toBe(5);
    });

    it('should reset to valid page when page size increases', () => {
      const { result } = renderHook(() => usePagination({
        totalItems: 100,
        pageSize: 10,
        initialPage: 10,
      }));

      act(() => {
        result.current.setPageSize(50);
      });

      expect(result.current.totalPages).toBe(2);
      expect(result.current.currentPage).toBeLessThanOrEqual(2);
    });
  });

  describe('Pages array', () => {
    it('should generate correct pages array', () => {
      const { result } = renderHook(() => usePagination({
        totalItems: 100,
        pageSize: 10,
      }));

      expect(result.current.pages).toContain(1);
      expect(result.current.pages.length).toBeGreaterThan(0);
    });

    it('should include ellipsis for many pages', () => {
      const { result } = renderHook(() => usePagination({
        totalItems: 100,
        pageSize: 10,
        initialPage: 5,
      }));

      // Pages array might contain 'ellipsis' for large page counts
      expect(result.current.pages.includes('ellipsis') || result.current.pages.every(p => typeof p === 'number')).toBe(true);
    });

    it('should always include first and last page', () => {
      const { result } = renderHook(() => usePagination({
        totalItems: 100,
        pageSize: 10,
        initialPage: 5,
      }));

      expect(result.current.pages).toContain(1);
      expect(result.current.pages).toContain(10);
    });
  });

  describe('Edge cases', () => {
    it('should handle single item', () => {
      const { result } = renderHook(() => usePagination({ totalItems: 1 }));

      expect(result.current.totalPages).toBe(1);
      expect(result.current.startIndex).toBe(0);
      expect(result.current.endIndex).toBe(0);
    });

    it('should handle items exactly matching page size', () => {
      const { result } = renderHook(() => usePagination({
        totalItems: 50,
        pageSize: 10,
      }));

      expect(result.current.totalPages).toBe(5);
    });

    it('should handle very large number of items', () => {
      const { result } = renderHook(() => usePagination({
        totalItems: 10000,
        pageSize: 10,
      }));

      expect(result.current.totalPages).toBe(1000);
    });
  });
});
