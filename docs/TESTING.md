# Testing Guide

This guide provides comprehensive testing strategies for the Football Tournament Platform frontend.

## Testing Architecture

Testing Trophy approach (not pyramid):

- ✅ **Static Testing** (TypeScript, ESLint)
- ✅ **Unit Tests** (isolated components)
- ✅ **Integration Tests** (component interactions + API)
- ✅ **E2E Tests** (user workflows)

## Test Coverage Goals

| Test Type   | Coverage | Tools                |
| ----------- | -------- | -------------------- |
| Static      | 100%     | TypeScript, ESLint   |
| Unit        | 80%+     | Vitest               |
| Integration | 70%+     | Vitest + RTL + MSW   |
| E2E         | Critical | Playwright           |

## Quick Start

```bash
# Run all unit & integration tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui

# Run all tests
pnpm test:all
```

## Project Structure

```
src/
├── __tests__/
│   ├── setup.ts              # Global test setup
│   ├── e2e/                   # Playwright E2E tests
│   │   ├── auth.spec.ts
│   │   ├── tournaments.spec.ts
│   │   └── dashboard.spec.ts
│   ├── integration/           # Integration tests with MSW
│   │   └── api.integration.spec.tsx
│   ├── mocks/                 # MSW mock handlers
│   │   ├── handlers.ts
│   │   └── server.ts
│   └── utils/                 # Test utilities
│       └── test-utils.tsx
├── components/
│   └── ui/
│       └── __tests__/         # Component unit tests
│           └── Button.spec.tsx
├── hooks/
│   └── __tests__/             # Hook unit tests
│       └── useAuth.spec.ts
└── services/
    └── __tests__/             # Service unit tests
        └── tournament.service.spec.ts
```

## Configuration Files

| File                   | Purpose                        |
| ---------------------- | ------------------------------ |
| `vitest.config.ts`     | Vitest configuration           |
| `jest.config.js`       | Jest configuration (alt)       |
| `playwright.config.ts` | Playwright E2E configuration   |

## Writing Tests

### Unit Tests (Components)

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '@/components/ui/Button';

describe('Button Component', () => {
  it('should render button with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Click</Button>);
    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Unit Tests (Hooks)

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';

describe('useAuth Hook', () => {
  it('should return initial state', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
```

### Unit Tests (Services)

```typescript
import { describe, it, expect, vi } from 'vitest';
import * as api from '@/services/api';
import { getTournaments } from '@/services/tournament.service';

vi.mock('@/services/api');

describe('Tournament Service', () => {
  it('should fetch tournaments', async () => {
    vi.mocked(api.apiGet).mockResolvedValue({ success: true, data: [] });

    const result = await getTournaments();

    expect(api.apiGet).toHaveBeenCalledWith('/v1/tournaments');
    expect(result.success).toBe(true);
  });
});
```

### Integration Tests (with MSW)

```typescript
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { server } from '../mocks/server';

beforeAll(() => server.listen());
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

describe('Login Integration', () => {
  it('should login with valid credentials', async () => {
    // Test with real HTTP calls mocked by MSW
  });
});
```

### E2E Tests (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('h1')).toContainText(/login/i);
  });

  test('should login successfully', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/dashboard/);
  });
});
```

## MSW Mock Handlers

The mock handlers in `src/__tests__/mocks/handlers.ts` provide:

- **Auth endpoints**: login, register, logout, me
- **Tournament endpoints**: CRUD operations, search, featured
- **Club endpoints**: list, get by ID
- **Registration endpoints**: create registration

## Test Utilities

### Custom Render with Providers

```typescript
import { render } from '@/__tests__/utils/test-utils';

// Wraps component with QueryClientProvider
render(<MyComponent />);
```

## CI/CD Integration

The GitHub Actions workflow (`.github/workflows/test.yml`) runs:

1. **Lint & Type Check** - ESLint and TypeScript validation
2. **Unit Tests** - Vitest with coverage
3. **E2E Tests** - Playwright on Chromium
4. **Build Check** - Production build verification

## Best Practices

1. **Use `userEvent` over `fireEvent`** - More realistic user interactions
2. **Test behavior, not implementation** - Focus on what users see
3. **Use MSW for API mocking** - Intercepts at network level
4. **Keep tests isolated** - Each test should be independent
5. **Use descriptive test names** - Should read like documentation
6. **Run tests before commits** - Use `pnpm test:all`

## Debugging Tests

```bash
# Run specific test file
pnpm test -- src/components/ui/__tests__/Button.spec.tsx

# Run tests matching pattern
pnpm test -- --grep "should render"

# Debug E2E tests
pnpm test:e2e:headed
```

## Coverage Reports

After running `pnpm test:coverage`, view the HTML report:

```bash
# Open coverage report
start coverage/index.html  # Windows
open coverage/index.html   # macOS
```

## Troubleshooting

### "Cannot find module" errors

Ensure `@/` alias is configured in both `vitest.config.ts` and `tsconfig.json`.

### MSW not intercepting requests

Check that the server is started in test setup and handlers match the URL pattern.

### Playwright tests timing out

Increase timeout in `playwright.config.ts` or use `{ timeout: 30000 }` in specific tests.
