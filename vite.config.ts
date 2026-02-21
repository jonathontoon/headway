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
      '@base': resolve(__dirname, 'src/components/base'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@utilities': resolve(__dirname, 'src/utilities'),
      '@theme': resolve(__dirname, 'src/theme'),
      '@services': resolve(__dirname, 'src/services'),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'codemirror': [
            '@uiw/react-codemirror',
            '@uiw/codemirror-themes',
            '@codemirror/state',
            '@codemirror/view',
            '@codemirror/lang-markdown',
            '@lezer/highlight',
          ],
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
  },
});
