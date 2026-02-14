# Copilot instructions for sport-tournaments-frontend

## Architecture & data flow
- Next.js App Router under src/app with shared UI in src/components.
- API is the source of truth; Swagger JSON from backend dev server: http://localhost:3001/api/swagger-json.
- Always use src/services/api.ts helpers (apiGet/apiPost/apiPatch/...) instead of raw fetch/axios.
- API base URL defaults to http://localhost:3001/api; in browser it can swap localhost for the current host (src/services/api.ts).

## Auth & API conventions
- Axios client attaches JWT from cookies and auto-refreshes via /v1/auth/refresh-token (src/services/api.ts).
- Tokens are stored in cookies (src/utils/cookies.ts); refresh flow updates cookies and retries original request.
- Auth state is centralized in Zustand (src/store/auth.store.ts); use it for login/logout/current-user flows.
- API base URL: NEXT_PUBLIC_API_URL or default http://localhost:3001/api; append /v1/ for endpoints.
- 401/403 responses trigger auto-logout and redirect to /auth/login; redirectAfterLogin stored in sessionStorage (src/services/api.ts).
- Auth storage uses localStorage key auth-storage with a safe in-memory fallback for restricted browsers (src/store/auth.store.ts).

## Developer workflows
- pnpm dev (Next.js dev server)
- pnpm test (Vitest)
- pnpm test:e2e (Playwright)

## Conventions & examples
- Keep client auth flows in the store + services; avoid manual token handling in components.
- Prefer typed services in src/services/* and shared types in src/types/.
- Cookie maxAge is derived from JWT exp with a 60-day fallback; avoid hardcoding token lifetimes in UI (src/utils/cookies.ts).
