import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
  ],
  resolve: {
    alias: {
      "@organisms": path.resolve(__dirname, "src/components/common"),
      "@hooks": path.resolve(__dirname, "src/hooks"),
      "@utilities": path.resolve(__dirname, "src/utilities"),
    },
  },
})
