import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    maxWorkers: 2,
    pool: "threads",
  },
  resolve: {
    alias: {
      "server-only": path.resolve(
        import.meta.dirname,
        "./test/server-only-stub.ts"
      ),
    },
  },
});
