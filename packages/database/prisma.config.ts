import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
    url: process.env.DATABASE_URL ?? "",
  },
});
