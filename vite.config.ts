import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@components': resolve(__dirname, 'src/components'),
      '@context': resolve(__dirname, 'src/context'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@utilities': resolve(__dirname, 'src/utilities'),
      '@actions': resolve(__dirname, 'src/actions'),
      '@reducers': resolve(__dirname, 'src/reducers'),
      '@services': resolve(__dirname, 'src/services'),
      '@models': resolve(__dirname, 'src/models'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
  },
  test: {
    environment: 'node',
  },
});
