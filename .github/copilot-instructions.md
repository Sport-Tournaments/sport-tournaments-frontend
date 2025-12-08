# Football Tournament Platform - Copilot Instructions

## Project Overview
Next.js 16 frontend for a youth football tournament management platform. Consumes a REST API backend.

## Architecture

### Directory Structure
```
src/
├── app/           # Next.js App Router pages (route groups: auth/, main/, dashboard/)
├── components/    # UI components (ui/) and layouts (layout/)
├── services/      # API service layer - all HTTP calls go through here
├── store/         # Zustand stores (auth.store.ts, ui.store.ts, notification.store.ts)
├── types/         # TypeScript types - mirrors backend DTOs
├── hooks/         # Custom React hooks
├── i18n/          # i18next translations (en.json, ro.json)
└── utils/         # Helpers (cookies.ts, date.ts, helpers.ts)
```

### Key Patterns

**Type Definitions**: Use string literal unions, NOT enums:
```typescript
// ✅ Correct - types/auth.ts
export type UserRole = 'ADMIN' | 'ORGANIZER' | 'PARTICIPANT' | 'USER';

// ❌ Wrong - don't use enum values like UserRole.ADMIN
// Use string literals: role === 'ADMIN'
```

**Service Layer** (`src/services/`): All API calls must go through service files:
```typescript
// Import from barrel: import { tournamentService, clubService } from '@/services';
// Method naming: getTournaments, createTournament, updateTournament, deleteTournament
// Returns: ApiResponse<T> or PaginatedResponse<T>
```

**State Management**: Zustand with persist middleware:
```typescript
import { useAuthStore } from '@/store/auth.store';
const { user, isAuthenticated, login, logout } = useAuthStore();
```

**Components**: Import from barrel exports:
```typescript
import { Button, Input, Card, Modal } from '@/components/ui';
import { MainLayout, DashboardLayout } from '@/components/layout';
```

### Component Props Reference
| Component | Key Props |
|-----------|-----------|
| `Button` | `variant`: primary/secondary/outline/ghost/danger, `isLoading`, `fullWidth` |
| `Alert` | `variant`: success/error/warning/info (NOT `type`) |
| `Badge` | `variant`: success/error/warning/info/neutral/default |
| `Input` | `error`, `helperText` (NOT `hint`) |

### API Integration
- Base axios instance with JWT interceptor: `src/services/api.ts`
- Auto token refresh on 401 errors
- Tokens stored in cookies via `@/utils/cookies`
- Backend URL: `NEXT_PUBLIC_API_URL` (default: http://localhost:3001/api)

### i18n
- Languages: English (en), Romanian (ro)
- Usage: `const { t } = useTranslation(); t('common.save')`
- Translation files: `src/i18n/locales/{en,ro}.json`

## Commands
```bash
pnpm dev          # Start dev server (port 3000)
pnpm build        # Production build
pnpm type-check   # TypeScript validation
pnpm lint         # ESLint
pnpm test         # Jest tests
```

## Common Gotchas
1. **Route groups**: `(auth)`, `(main)`, `(dashboard)` are folder-only, not URL segments
2. **Client components**: Add `'use client'` for hooks, state, or browser APIs
3. **Path aliases**: Use `@/` imports (e.g., `@/components/ui`, `@/services`)
4. **CSS**: Tailwind CSS 4 with `@apply` - VSCode may show false warnings
