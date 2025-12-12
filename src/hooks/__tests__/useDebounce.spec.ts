import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDebounce, useDebouncedCallback } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('useDebounce hook', () => {
    it('should return initial value immediately', () => {
      const { result } = renderHook(() => useDebounce('initial', 500));
      expect(result.current).toBe('initial');
    });

    it('should debounce value changes', async () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      );

      expect(result.current).toBe('initial');

      rerender({ value: 'updated', delay: 500 });

      // Value should not have changed yet
      expect(result.current).toBe('initial');

      // Fast forward time
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(result.current).toBe('updated');
    });

    it('should use default delay of 500ms', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });

      // Advance time less than 500ms
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(result.current).toBe('initial');

      // Advance remaining time
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(result.current).toBe('updated');
    });

    it('should reset timer on rapid value changes', async () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      );

      // First update
      rerender({ value: 'update1' });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(result.current).toBe('initial');

      // Second update resets timer
      rerender({ value: 'update2' });
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(result.current).toBe('initial');

      // Complete the delay
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(result.current).toBe('update2');
    });

    it('should work with different types', async () => {
      // Number
      const { result: numberResult, rerender: rerenderNumber } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: 0 } }
      );

      rerenderNumber({ value: 42 });
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(numberResult.current).toBe(42);

      // Object
      const { result: objectResult, rerender: rerenderObject } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: { name: 'John' } } }
      );

      rerenderObject({ value: { name: 'Jane' } });
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(objectResult.current).toEqual({ name: 'Jane' });
    });

    it('should handle delay changes', async () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 500 } }
      );

      rerender({ value: 'updated', delay: 200 });

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(result.current).toBe('updated');
    });

    it('should cleanup timer on unmount', async () => {
      const { unmount, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });

      // Unmount before timer completes
      unmount();

      // This should not cause any errors
      act(() => {
        vi.advanceTimersByTime(500);
      });
    });
  });

  describe('useDebouncedCallback hook', () => {
    it('should debounce callback execution', async () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useDebouncedCallback(callback, 500));

      // Call multiple times rapidly
      act(() => {
        result.current('arg1');
      });
      
      act(() => {
        result.current('arg2');
      });
      
      act(() => {
        result.current('arg3');
      });

      // Callback should not have been called yet
      expect(callback).not.toHaveBeenCalled();

      // Advance time and flush
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      // Callback should have been called once with the last arguments
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('arg3');
    });

    it('should use default delay of 500ms', async () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useDebouncedCallback(callback));

      act(() => {
        result.current();
      });

      // Advance less than 500ms
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(callback).not.toHaveBeenCalled();

      // Complete the delay
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to callback', async () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useDebouncedCallback(callback, 100));

      act(() => {
        result.current('arg1', 'arg2', 123);
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(callback).toHaveBeenCalledWith('arg1', 'arg2', 123);
    });

    it('should reset timer on subsequent calls', async () => {
      const callback = vi.fn();
      const { result } = renderHook(() => useDebouncedCallback(callback, 500));

      act(() => {
        result.current('first');
      });

      // Advance time partially
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Call again - should reset timer
      act(() => {
        result.current('second');
      });

      // Advance time partially again
      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(callback).not.toHaveBeenCalled();

      // Complete delay
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('second');
    });

    it('should cleanup timer on unmount', async () => {
      const callback = vi.fn();
      const { result, unmount } = renderHook(() => useDebouncedCallback(callback, 500));

      act(() => {
        result.current();
      });

      // Unmount before timer completes
      unmount();

      // Advance time - callback should not be called
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });
});
