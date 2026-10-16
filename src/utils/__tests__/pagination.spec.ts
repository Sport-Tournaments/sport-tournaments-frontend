import { describe, expect, it } from 'vitest';
import { parsePaginatedResponse } from '../pagination';

describe('parsePaginatedResponse', () => {
  it('reads backend { success, data: { data, meta } } including totalPages', () => {
    const body = { success: true, data: { data: [{ id: 1 }], meta: { total: 25, page: 1, limit: 10, totalPages: 3 } } };
    expect(parsePaginatedResponse(body)).toEqual({ items: [{ id: 1 }], totalPages: 3, total: 25 });
  });

  it('reads { data: { items, totalPages } }', () => {
    expect(parsePaginatedResponse({ data: { items: [1, 2], totalPages: 2, total: 4 } })).toEqual({
      items: [1, 2],
      totalPages: 2,
      total: 4,
    });
  });

  it('handles plain arrays and garbage', () => {
    expect(parsePaginatedResponse([1])).toEqual({ items: [1], totalPages: 1, total: 1 });
    expect(parsePaginatedResponse(null)).toEqual({ items: [], totalPages: 1 });
  });
});
