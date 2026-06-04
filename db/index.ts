import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Only connect if DATABASE_URL exists (skip during build)
const connectionString = process.env.DATABASE_URL;

// During build (or when no DB), create a dummy client
let _db: any;
if (!connectionString || process.env.NEXT_PHASE === 'phase-production-build') {
  // Dummy client for build time
  _db = {
    select: () => ({ from: () => ({ where: () => [], orderBy: () => [], limit: () => [] }) }),
    insert: () => ({ values: () => ({ returning: () => [] }) }),
    update: () => ({ set: () => ({ where: () => {} }) }),
    delete: () => ({ where: () => {} }),
  } as any;
} else {
  const globalForDb = globalThis as unknown as {
    client: ReturnType<typeof postgres> | undefined;
  };

  const client = globalForDb.client ?? postgres(connectionString, {
    max: 10,
    prepare: false,
  });

  if (process.env.NODE_ENV !== "production") globalForDb.client = client;

  _db = drizzle(client, { schema });
}

export const db = _db;
export { schema };