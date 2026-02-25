import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@components": resolve(__dirname, "src/components"),
      "@constants": resolve(__dirname, "src/constants.ts"),
      "@contexts": resolve(__dirname, "src/contexts"),
      "@hooks": resolve(__dirname, "src/hooks"),
"@types": resolve(__dirname, "src/types.ts"),
      "@providers": resolve(__dirname, "src/providers"),
      "@stores": resolve(__dirname, "src/stores"),
      "@utils": resolve(__dirname, "src/utils"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
  },
  test: {
    environment: "node",
  },
});
