import { defineConfig } from "vitest/config";

export default defineConfig({
  oxc: {
    jsx: { runtime: "automatic" },
  },
  test: {
    maxWorkers: 2,
    pool: "threads",
  },
});
