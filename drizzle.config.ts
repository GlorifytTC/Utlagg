import { defineConfig } from "drizzle-kit";

// Force using the external URL for migrations
const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!url) {
  throw new Error("DIRECT_URL or DATABASE_URL must be set for drizzle-kit");
}

// Log which URL is being used (for debugging)
console.log(`Using database URL: ${url.replace(/:[^:@]*@/, ':****@')}`);

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
  verbose: true,
  strict: true,
});