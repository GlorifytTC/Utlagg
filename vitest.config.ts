import { fileURLToPath } from "node:url";

/**
 * Minimal Vitest config. Resolves the `@/*` path alias (mirrors tsconfig.json)
 * so the unit tests under tests/unit can import app modules. Kept dependency-free
 * (no `vitest/config` import) so it loads regardless of how vitest is invoked.
 */
export default {
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
};
