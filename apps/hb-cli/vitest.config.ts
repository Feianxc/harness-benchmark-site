import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@ohbp/validator-core": path.resolve(
        __dirname,
        "../../packages/validator-core/src/index.ts",
      ),
      "@ohbp/validator-rules": path.resolve(
        __dirname,
        "../../packages/validator-rules/src/index.ts",
      ),
    },
  },
});
