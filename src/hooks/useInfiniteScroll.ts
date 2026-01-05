'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseInfiniteScrollOptions<T> {
  /** Function to fetch data for a given page */
  fetchData: (page: number) => Promise<{
    items: T[];
    hasMore: boolean;
    totalPages?: number;
  }>;
  /** Initial page number (default: 1) */
  initialPage?: number;
  /** Root margin for intersection observer (default: '100px') */
  rootMargin?: string;
  /** Threshold for intersection observer (default: 0.1) */
  threshold?: number;
  /** Whether to enable infinite scroll (default: true) */
  enabled?: boolean;
  /** Dependencies that should trigger a reset */
  dependencies?: unknown[];
}

export interface UseInfiniteScrollReturn<T> {
  /** All loaded items */
  items: T[];
  /** Whether data is being loaded */
  isLoading: boolean;
  /** Whether more data is being fetched */
  isFetchingMore: boolean;
  /** Whether there are more items to load */
  hasMore: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Current page number */
  currentPage: number;
  /** Total pages if available */
  totalPages: number | undefined;
  /** Ref to attach to the sentinel element */
  sentinelRef: (node: HTMLElement | null) => void;
  /** Manually load more items */
  loadMore: () => Promise<void>;
  /** Reset and reload from page 1 */
  reset: () => void;
  /** Retry after an error */
  retry: () => Promise<void>;
}

export function useInfiniteScroll<T>({
  fetchData,
  initialPage = 1,
  rootMargin = '100px',
  threshold = 0.1,
  enabled = true,
  dependencies = [],
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState<number | undefined>(undefined);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelNodeRef = useRef<HTMLElement | null>(null);
  const isLoadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMore || !enabled) return;

    isLoadingRef.current = true;
    setIsFetchingMore(currentPage > initialPage);
    setError(null);

    try {
      const result = await fetchData(currentPage);
      
      setItems((prev) => 
        currentPage === initialPage ? result.items : [...prev, ...result.items]
      );
      setHasMore(result.hasMore);
      setTotalPages(result.totalPages);
      
      if (result.hasMore) {
        setCurrentPage((prev) => prev + 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch data'));
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
      isLoadingRef.current = false;
    }
  }, [currentPage, fetchData, hasMore, initialPage, enabled]);

  const reset = useCallback(() => {
    setItems([]);
    setCurrentPage(initialPage);
    setHasMore(true);
    setError(null);
    setIsLoading(true);
    isLoadingRef.current = false;
  }, [initialPage]);

  const retry = useCallback(async () => {
    setError(null);
    await loadMore();
  }, [loadMore]);

  // Reset when dependencies change
  useEffect(() => {
    reset();
  }, [...dependencies, reset]);

  // Initial load and when reset
  useEffect(() => {
    if (isLoading && !isLoadingRef.current && enabled) {
      loadMore();
    }
  }, [isLoading, enabled, loadMore]);

  // Intersection Observer callback
  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      sentinelNodeRef.current = node;

      if (!node || !enabled) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting && hasMore && !isLoadingRef.current) {
            loadMore();
          }
        },
        { rootMargin, threshold }
      );

      observerRef.current.observe(node);
    },
    [hasMore, loadMore, rootMargin, threshold, enabled]
  );

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    items,
    isLoading,
    isFetchingMore,
    hasMore,
    error,
    currentPage,
    totalPages,
    sentinelRef,
    loadMore,
    reset,
    retry,
  };
}
