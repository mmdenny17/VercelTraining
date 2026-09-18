// Infra, not a build item. A pg Pool, read from DATABASE_URL. Each bundle
// Next compiles gets its own Pool instance (same module-boundary lesson as
// Module 3's cms-source.ts) -- that's fine here, because unlike the file
// fixture, the thing that actually needs to be shared is the external
// Postgres server itself, not this in-process object.

import { Pool } from "pg";

const globalForPg = globalThis as unknown as { pgPool?: Pool };

export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.pgPool = pool;
}
