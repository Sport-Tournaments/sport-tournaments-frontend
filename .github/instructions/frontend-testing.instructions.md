---
description: "Use when writing, running, or debugging frontend tests. Covers Vitest unit/integration tests with React Testing Library, MSW for API mocking, Playwright e2e tests, and coverage configuration."
applyTo: "src/**/*.{test,spec}.{ts,tsx}"
---

# Frontend Testing Patterns

## Test Runners

| Type | Tool | Location |
|---|---|---|
| Unit / Integration | **Vitest** + React Testing Library | `src/**/*.{test,spec}.{ts,tsx}` |
| E2E | **Playwright** | `src/__tests__/e2e/**` |

Run unit tests: `pnpm test` / `pnpm vitest`  
Run e2e: `pnpm playwright test`

## Vitest Unit/Integration Test Pattern

```typescript
// src/__tests__/integration/TournamentCard.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TournamentCard } from '@/components/TournamentCard';

describe('TournamentCard', () => {
  const mockTournament = {
    id: '1',
    name: 'Spring Open 2024',
    status: 'OPEN',
  };

  it('renders tournament name', () => {
    render(<TournamentCard tournament={mockTournament} />);
    expect(screen.getByText('Spring Open 2024')).toBeInTheDocument();
  });

  it('calls onRegister with tournament id when button clicked', async () => {
    const onRegister = vi.fn();
    render(<TournamentCard tournament={mockTournament} onRegister={onRegister} />);

    fireEvent.click(screen.getByRole('button', { name: /register/i }));
    await waitFor(() => expect(onRegister).toHaveBeenCalledWith('1'));
  });
});
```

## Test Setup

Global setup is in `src/__tests__/setup.ts`. It imports `@testing-library/jest-dom` matchers. Tests run in `jsdom` environment with `globals: true` (no need to import `describe`, `it`, `expect`).

Wrap components that need providers (React Query, i18n) with a custom render utility:

```typescript
// src/__tests__/utils/render.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

export function renderWithProviders(ui: React.ReactElement) {
  const client = createTestQueryClient();
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>
  );
}
```

## MSW (API Mocking)

Mock API calls with MSW handlers in `src/__tests__/mocks/`:

```typescript
// src/__tests__/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/v1/tournaments', () =>
    HttpResponse.json({ success: true, data: [mockTournament] })
  ),

  http.post('/api/v1/auth/login', async ({ request }) => {
    const body = await request.json() as { email: string };
    if (body.email === 'test@example.com') {
      return HttpResponse.json({ success: true, data: { accessToken: 'mock-token' } });
    }
    return HttpResponse.json({ success: false }, { status: 401 });
  }),
];
```

Start MSW server in setup file:
```typescript
// src/__tests__/setup.ts
import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers';

const server = setupServer(...handlers);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Zustand Store Testing

Reset store state between tests:

```typescript
import { useAuthStore } from '@/store/auth.store';

beforeEach(() => {
  useAuthStore.setState({ user: null, isAuthenticated: false });
});
```

## Playwright E2E Tests

```typescript
// src/__tests__/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test('user can login successfully', async ({ page }) => {
  await page.goto('/auth/login');

  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'Password1!');
  await page.click('[type="submit"]');

  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

Config in `playwright.config.ts` — base URL defaults to `http://localhost:3000`.

## Coverage Thresholds

Configured in `vitest.config.ts`:
- Lines: 25%
- Functions: 40%
- Branches: 70%
- Statements: 25%

Excluded: `node_modules`, `dist`, `.next`, `e2e/**`.
