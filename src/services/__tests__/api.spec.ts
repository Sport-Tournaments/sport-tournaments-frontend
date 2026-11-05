import { describe, it, expect, vi, afterEach } from 'vitest';
import { apiGet, apiPost, getGaClientId } from '../api';

describe('fetch API client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('preserves the /api base path when service paths start with /v1', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await apiGet('/v1/tournaments');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4001/api/v1/tournaments',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  describe('GA client id header', () => {
    const okResponse = () =>
      new Response(JSON.stringify({ success: true, data: {} }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    afterEach(() => {
      document.cookie = '_ga=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    });

    it('reads the client id from the _ga cookie', () => {
      document.cookie = '_ga=GA1.1.123456789.1700000000; path=/';
      expect(getGaClientId()).toBe('123456789.1700000000');
    });

    it('sends it on requests with a body, but not on anonymous GETs', async () => {
      document.cookie = '_ga=GA1.1.111.222; path=/';
      const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(okResponse()));
      vi.stubGlobal('fetch', fetchMock);

      await apiPost('/v1/auth/register', { email: 'a@b.c' });
      await apiGet('/v1/tournaments');

      expect(fetchMock.mock.calls[0][1].headers['X-GA-Client-Id']).toBe('111.222');
      expect(fetchMock.mock.calls[1][1].headers['X-GA-Client-Id']).toBeUndefined();
    });
  });
});
