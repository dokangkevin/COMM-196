import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // A non-secret local fallback lets format/generate run before .env exists.
    url: process.env.DATABASE_URL ?? "postgresql://clubhub:clubhub@localhost:5432/clubhub?schema=public",
  },
});
