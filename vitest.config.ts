import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tailwind_plus/',
        'src/__tests__/',
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/types/**',
        '**/*.d.ts',
        '**/index.ts',
      ],
      thresholds: {
        lines: 25,
        functions: 40,
        branches: 70,
        statements: 25,
      },
    },
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', '.next', 'src/__tests__/e2e/**'],
    testTimeout: 10000,
    hookTimeout: 10000,
    deps: {
      optimizer: {
        web: {
          include: ['react', 'react-dom'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
});
