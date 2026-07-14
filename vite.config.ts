import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

import { cloudflare } from "@cloudflare/vite-plugin";

const packageJson = JSON.parse(
  readFileSync(
    fileURLToPath(new URL("./package.json", import.meta.url)),
    "utf-8",
  ),
);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false,
      includeAssets: ["favicon.svg", "fonts/**/*"],
      manifest: {
        name: "headway",
        short_name: "headway",
        description: "A terminal-style todo.txt task manager",
        display: "standalone",
        background_color: "#000000",
        theme_color: "#000000",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
        navigateFallback: "/index.html",
        // /api/* must reach the Cloudflare worker (run_worker_first) and
        // /donate is a Cloudflare _redirects rule (public/_redirects) -
        // neither is an SPA route, so both must skip the cached shell.
        navigateFallbackDenylist: [/^\/api\//, /^\/donate$/],
        // Single same-origin sw.js covered by script-src 'self'; no
        // runtime caching, so /api/* and api.github.com pass through
        // untouched and sync commands fail cleanly offline.
        inlineWorkboxRuntime: true,
        cleanupOutdatedCaches: true,
      },
    }),
    cloudflare(),
  ],
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    strictPort: true,
  },
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
});
