import { describe, it, expect, vi, afterEach } from 'vitest';
import { apiGet } from '../api';

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
});
