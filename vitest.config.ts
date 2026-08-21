import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// Vitest configuration for the admin dashboard.
// - jsdom gives us a browser-like DOM (also lets js-cookie use document.cookie).
// - the "@" alias mirrors tsconfig.json ("@/*" -> "./src/*").
export default defineConfig({
  plugins: [react()],
  // Tests don't need Tailwind/PostCSS. An empty inline config stops Vite from
  // loading postcss.config.mjs (which pulls in native binaries).
  css: { postcss: { plugins: [] } },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
