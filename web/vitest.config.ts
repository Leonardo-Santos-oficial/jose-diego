import path from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/lib': path.resolve(__dirname, 'src/lib'),
      '@/modules': path.resolve(__dirname, 'src/modules'),
      '@/types': path.resolve(__dirname, 'src/types'),
      '@/app': path.resolve(__dirname, 'app'),
      '@/tests': path.resolve(__dirname, 'tests'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: [
      'app/**/*.{test,spec}.{ts,tsx}',
      'src/**/*.{test,spec}.{ts,tsx}',
      'tests/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: ['node_modules/**/*', 'tests/e2e/**/*', '.next/**/*'],
  },
});
