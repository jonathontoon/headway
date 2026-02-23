import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@common': resolve(__dirname, 'src/components/common'),
      '@context': resolve(__dirname, 'src/context'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@utilities': resolve(__dirname, 'src/utilities'),
      '@commands': resolve(__dirname, 'src/commands'),
      '@services': resolve(__dirname, 'src/services'),
      '@models': resolve(__dirname, 'src/models'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
  },
});
