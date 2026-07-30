import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Unit-test config. The `@/` alias mirrors tsconfig `paths` so tests can import
 * app modules the same way the app does. Only unit tests run here; the Playwright
 * e2e specs under tests/e2e are excluded (run separately).
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
});
