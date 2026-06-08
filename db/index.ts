import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

// `next build` collects page data without a database. Only during that build
// phase do we hand back a no-op stub. At RUNTIME a missing DATABASE_URL is a
// real misconfiguration, so we fail loudly with a clear message instead of
// silently returning a broken client (which used to crash later with a cryptic
// "x.orderBy is not a function").
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

let _db: ReturnType<typeof drizzle> | any;

if (isBuildPhase && !connectionString) {
  _db = new Proxy(
    {},
    {
      get() {
        throw new Error(
          "Database accessed during build phase without DATABASE_URL. " +
            "Mark this route/page as dynamic (export const dynamic = 'force-dynamic') " +
            "so it isn't executed at build time.",
        );
      },
    },
  );
} else {
  if (!connectionString) {
    // Runtime with no DB configured — make the cause obvious in the logs.
    throw new Error(
      "DATABASE_URL is not set. Configure it in the runtime environment " +
        "(Railway/Vercel project variables), then redeploy.",
    );
  }

  const globalForDb = globalThis as unknown as {
    client: ReturnType<typeof postgres> | undefined;
  };
  const client =
    globalForDb.client ?? postgres(connectionString, { max: 10, prepare: false });
  if (process.env.NODE_ENV !== "production") globalForDb.client = client;

  
  _db = drizzle(client, { schema });
}

export const db = _db;
export { schema };