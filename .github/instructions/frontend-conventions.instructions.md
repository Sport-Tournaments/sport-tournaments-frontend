---
description: "Use when creating or modifying Next.js frontend files: pages, components, layouts, hooks, services, or utility functions. Covers App Router structure, component organization, path aliases, API service layer, and i18n usage."
applyTo: "src/**/*.{ts,tsx}"
---

# Frontend Next.js Conventions

## App Router Structure

This project uses the **Next.js App Router** (`src/app/`). File-based routing with:
- `layout.tsx` — layout wrapper (server component by default)
- `page.tsx` — route entry point
- `providers.tsx` — client-side providers (React Query, i18n, toast)
- `'use client'` directive required for any component using hooks, browser APIs, or event handlers

```
src/app/
├── layout.tsx          ← root layout, wraps with <Providers>
├── page.tsx            ← home page
├── providers.tsx       ← QueryClientProvider, i18n init, Toaster
├── auth/
│   ├── login/page.tsx
│   └── register/page.tsx
└── dashboard/
    └── page.tsx        ← protected route
```

## Component Organization

```
src/components/
├── ui/           ← dumb, reusable: Button, Card, Modal, Input, Badge, Avatar
├── layout/       ← Navigation, Header, Sidebar, Footer
└── <feature>/    ← feature components with business logic
```

**Rules:**
- `ui/` components have no business logic, no store access, no API calls
- Feature components may connect to stores and services
- `'use client'` only where needed — keep server components as default

## Path Aliases

Always use aliases, never relative paths deeper than one level:

```typescript
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth.store';
import { tournamentService } from '@/services/tournament.service';
import { Tournament } from '@/types/tournament';
import { formatDate } from '@/utils/helpers';
```

Configured aliases: `@/components/*`, `@/app/*`, `@/services/*`, `@/utils/*`, `@/hooks/*`, `@/types/*`, `@/styles/*`, `@/store/*`, `@/i18n/*`.

## API Service Layer

All API calls go through `src/services/api.ts` (Axios instance) and dedicated service modules. Never call `axios` directly in components.

```typescript
// services/tournament.service.ts
import { api } from './api';
import { Tournament, CreateTournamentDto } from '@/types/tournament';

export const tournamentService = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<Tournament[]>('/v1/tournaments', { params }).then(r => r.data),

  getById: (id: string) =>
    api.get<Tournament>(`/v1/tournaments/${id}`).then(r => r.data),

  create: (dto: CreateTournamentDto) =>
    api.post<Tournament>('/v1/tournaments', dto).then(r => r.data),

  update: (id: string, dto: Partial<CreateTournamentDto>) =>
    api.patch<Tournament>(`/v1/tournaments/${id}`, dto).then(r => r.data),
};
```

The Axios instance automatically attaches the JWT Bearer token from cookies and handles 401/token refresh.

## i18n (Internationalization)

Supported languages: English (`en`, default) and Romanian (`ro`).

```tsx
'use client';
import { useTranslation } from 'react-i18next';

export function TournamentCard({ tournament }: Props) {
  const { t } = useTranslation();
  return <h2>{t('tournament.title')}</h2>;
}
```

Translation keys live in `src/i18n/locales/en.json` and `ro.json`. Always add translations for both locales when adding new text.

## Styling

**Tailwind CSS 4.0** — utility-first, no custom CSS unless unavoidable. Class-based dark mode (`.dark`), but the app is forced light-mode.

```tsx
// Prefer Tailwind utilities
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
  Submit
</button>
```

Use `classnames` for conditional classes:
```typescript
import cn from 'classnames';
<div className={cn('base-class', { 'active-class': isActive, 'error-class': hasError })} />
```

## TypeScript

Strict mode enabled (`strict: true`). All component props must be explicitly typed:

```typescript
interface TournamentCardProps {
  tournament: Tournament;
  onRegister?: (id: string) => void;
  className?: string;
}

export function TournamentCard({ tournament, onRegister, className }: TournamentCardProps) {}
```

## Custom Hooks

Business logic hooks live in `src/hooks/`. Available hooks: `useAuth`, `useToast`, `useDebounce`, `usePagination`, `useMediaQuery`, `useInfiniteScroll`.

```typescript
// hooks/useTournaments.ts
export function useTournaments(filters?: FilterDto) {
  return useQuery({
    queryKey: ['tournaments', filters],
    queryFn: () => tournamentService.getAll(filters),
  });
}
```
