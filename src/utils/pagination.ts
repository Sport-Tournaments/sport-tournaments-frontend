export interface ParsedPage<T> {
  items: T[];
  totalPages: number;
  total?: number;
}

/**
 * Normalizes the paginated response shapes returned by the API into
 * `{ items, totalPages }`. Accepts either the raw body or `body.data`:
 *
 * - `T[]`
 * - `{ items, totalPages }` / `{ data: { items, totalPages } }`
 * - `{ data: T[], meta: { totalPages, total } }` (backend PaginatedResponse,
 *   possibly wrapped as `{ success, data: { data, meta } }`)
 */
export function parsePaginatedResponse<T>(payload: unknown): ParsedPage<T> {
  const node = payload as any;
  if (Array.isArray(node)) return { items: node, totalPages: 1, total: node.length };
  if (!node || typeof node !== 'object') return { items: [], totalPages: 1 };

  if (Array.isArray(node.items)) {
    return {
      items: node.items,
      totalPages: node.totalPages || node.meta?.totalPages || 1,
      total: node.total ?? node.meta?.total,
    };
  }

  if (Array.isArray(node.data)) {
    return {
      items: node.data,
      totalPages: node.meta?.totalPages || node.totalPages || 1,
      total: node.meta?.total ?? node.total,
    };
  }

  if (node.data && typeof node.data === 'object') {
    return parsePaginatedResponse<T>(node.data);
  }

  return { items: [], totalPages: 1 };
}
