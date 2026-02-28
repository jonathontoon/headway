import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/agentation": {
        target: "http://localhost:4747",
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/agentation/, ""),
      },
    },
  },
  resolve: {
    alias: {
      "@components": resolve(__dirname, "src/components"),
      "@contexts": resolve(__dirname, "src/contexts"),
      "@hooks": resolve(__dirname, "src/hooks"),
      "@reducers": resolve(__dirname, "src/reducers"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
  },
  test: {
    environment: "node",
    setupFiles: ["./src/setupTests.ts"],
  },
});
