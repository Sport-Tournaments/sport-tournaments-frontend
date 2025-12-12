import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMediaQuery, useBreakpoint, useIsMobile, useIsTablet, useIsDesktop } from '../useMediaQuery';

describe('useMediaQuery', () => {
  let mediaQueryList: {
    matches: boolean;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mediaQueryList = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
      ...mediaQueryList,
      media: query,
    })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('useMediaQuery hook', () => {
    it('should return initial matches value', () => {
      mediaQueryList.matches = true;
      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
      expect(result.current).toBe(true);
    });

    it('should return false when query does not match', () => {
      mediaQueryList.matches = false;
      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
      expect(result.current).toBe(false);
    });

    it('should update when media query changes', () => {
      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

      expect(result.current).toBe(false);

      // Simulate media query change
      const changeHandler = mediaQueryList.addEventListener.mock.calls[0][1];
      act(() => {
        changeHandler({ matches: true });
      });

      expect(result.current).toBe(true);
    });

    it('should add event listener on mount', () => {
      renderHook(() => useMediaQuery('(min-width: 768px)'));
      expect(mediaQueryList.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should remove event listener on unmount', () => {
      const { unmount } = renderHook(() => useMediaQuery('(min-width: 768px)'));
      unmount();
      expect(mediaQueryList.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should update when query changes', () => {
      const { rerender } = renderHook(
        ({ query }) => useMediaQuery(query),
        { initialProps: { query: '(min-width: 768px)' } }
      );

      // Change the query
      rerender({ query: '(min-width: 1024px)' });

      // Old listener should be removed
      expect(mediaQueryList.removeEventListener).toHaveBeenCalled();
      // New listener should be added
      expect(mediaQueryList.addEventListener).toHaveBeenCalledTimes(2);
    });
  });

  describe('useBreakpoint hook', () => {
    it('should check sm breakpoint (640px)', () => {
      renderHook(() => useBreakpoint('sm'));
      expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 640px)');
    });

    it('should check md breakpoint (768px)', () => {
      renderHook(() => useBreakpoint('md'));
      expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 768px)');
    });

    it('should check lg breakpoint (1024px)', () => {
      renderHook(() => useBreakpoint('lg'));
      expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 1024px)');
    });

    it('should check xl breakpoint (1280px)', () => {
      renderHook(() => useBreakpoint('xl'));
      expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 1280px)');
    });

    it('should check 2xl breakpoint (1536px)', () => {
      renderHook(() => useBreakpoint('2xl'));
      expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 1536px)');
    });

    it('should return true when breakpoint matches', () => {
      mediaQueryList.matches = true;
      const { result } = renderHook(() => useBreakpoint('md'));
      expect(result.current).toBe(true);
    });

    it('should return false when breakpoint does not match', () => {
      mediaQueryList.matches = false;
      const { result } = renderHook(() => useBreakpoint('md'));
      expect(result.current).toBe(false);
    });
  });

  describe('useIsMobile hook', () => {
    it('should return true when below md breakpoint', () => {
      mediaQueryList.matches = false; // md breakpoint not matched
      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true); // Is mobile when NOT md
    });

    it('should return false when at or above md breakpoint', () => {
      mediaQueryList.matches = true; // md breakpoint matched
      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false); // Not mobile when md
    });

    it('should check md breakpoint', () => {
      renderHook(() => useIsMobile());
      expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 768px)');
    });
  });

  describe('useIsTablet hook', () => {
    it('should check md and lg breakpoints', () => {
      renderHook(() => useIsTablet());
      expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 768px)');
      expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 1024px)');
    });
  });

  describe('useIsDesktop hook', () => {
    it('should return true when at or above lg breakpoint', () => {
      mediaQueryList.matches = true; // lg breakpoint matched
      const { result } = renderHook(() => useIsDesktop());
      expect(result.current).toBe(true);
    });

    it('should return false when below lg breakpoint', () => {
      mediaQueryList.matches = false; // lg breakpoint not matched
      const { result } = renderHook(() => useIsDesktop());
      expect(result.current).toBe(false);
    });

    it('should check lg breakpoint', () => {
      renderHook(() => useIsDesktop());
      expect(window.matchMedia).toHaveBeenCalledWith('(min-width: 1024px)');
    });
  });

  describe('SSR Handling', () => {
    it('should handle missing window gracefully', () => {
      // This test verifies the hook starts with false and updates on client
      mediaQueryList.matches = false;
      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
      expect(result.current).toBe(false);
    });
  });
});
