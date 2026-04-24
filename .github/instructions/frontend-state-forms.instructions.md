---
description: "Use when working with state management, forms, API data fetching, or validation in the frontend. Covers Zustand store patterns, React Query for server state, React Hook Form with Zod validation, and authentication state."
applyTo: "src/**/*.{ts,tsx}"
---

# Frontend State Management, Forms & Data Fetching

## Zustand Stores (Client State)

Stores live in `src/store/`. Use `persist` middleware for state that should survive page refreshes.

```typescript
// store/example.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ExampleState {
  items: Item[];
  isLoading: boolean;
  error: string | null;
  // Actions
  setItems: (items: Item[]) => void;
  addItem: (item: Item) => Promise<void>;
  clearError: () => void;
}

export const useExampleStore = create<ExampleState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      error: null,

      setItems: (items) => set({ items }),

      addItem: async (item) => {
        set({ isLoading: true, error: null });
        try {
          const created = await itemService.create(item);
          set((state) => ({ items: [...state.items, created], isLoading: false }));
        } catch (err) {
          set({ error: 'Failed to add item', isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'example-storage' }  // localStorage key
  )
);
```

**Existing stores:** `useAuthStore` (auth state + actions), `useUIStore` (modals, sidebars), `useNotificationStore`.

Use Zustand for **client-only** state (auth session, UI state). Use React Query for **server state**.

## React Query (Server State)

```typescript
'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tournamentService } from '@/services/tournament.service';

// Fetching
export function useTournaments(filters?: FilterDto) {
  return useQuery({
    queryKey: ['tournaments', filters],
    queryFn: () => tournamentService.getAll(filters),
    staleTime: 5 * 60 * 1000,  // 5 min
  });
}

// Mutations
export function useCreateTournament() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tournamentService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    },
  });
}
```

`QueryClientProvider` is set up in `src/app/providers.tsx` — no extra setup needed.

## React Hook Form + Zod (Forms)

All forms use `react-hook-form` with `zodResolver` for validation. Zod schemas are the single source of truth for types and validation.

```typescript
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// 1. Define schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// 2. Use in component
export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await authService.login(data);
    } catch (err) {
      setError('root', { message: 'Invalid credentials' });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}

      <input type="password" {...register('password')} />
      {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}

      {errors.root && <p className="text-red-500">{errors.root.message}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Loading...' : 'Login'}
      </button>
    </form>
  );
}
```

## Authentication State

Auth state is managed by `useAuthStore`. Access it from any component:

```typescript
import { useAuthStore } from '@/store/auth.store';

// Read state
const { user, isAuthenticated, isLoading } = useAuthStore();

// Actions
const { login, logout, fetchCurrentUser } = useAuthStore();
```

**Auth flow:** tokens stored in cookies → Axios interceptor attaches Bearer token → on 401, interceptor auto-refreshes → on 403 or failed refresh, `clearAuth()` + redirect to `/auth/login`.

`fetchCurrentUser()` is called on app mount (in `providers.tsx`) to restore session.

## File Uploads

Use `react-dropzone` for file upload components:

```typescript
import { useDropzone } from 'react-dropzone';

const { getRootProps, getInputProps, isDragActive } = useDropzone({
  accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
  maxSize: 5 * 1024 * 1024,  // 5MB
  onDrop: (files) => handleUpload(files),
});
```
