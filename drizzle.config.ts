import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Keep drizzle's bookkeeping inside our schema too, away from the other app.
  migrations: { schema: "tracker", table: "__drizzle_migrations" },
  schemaFilter: ["tracker"],
  dbCredentials: { url: process.env.POSTGRES_URL_NON_POOLING! },
});
