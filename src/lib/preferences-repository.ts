// ============================================================
// BUILD ITEM M5.1a -- Stage A, the repository seam
// ============================================================
// Stage A part 1: a repository seam, async and fallible, SQL-shaped even
// though it's fixture-backed -- so swapping the fixture for a real
// Postgres query later (Stage B) requires no change to callers.
//
// Write:
//   getPreferences(distId: string): Promise<{ celebrationDismissed: boolean }>
//   savePreferences(distId: string, prefs: { celebrationDismissed: boolean }): Promise<{ celebrationDismissed: boolean }>
//
// Requirements:
//   1. Both async (even though the fixture underneath is sync file I/O --
//      a real SQL driver call would be async, and callers must not be able
//      to tell the difference).
//   2. Wrap getRaw/setRaw from "@/lib/preferences-store" -- don't
//      reimplement storage here, that's the fixture's job.
//   3. Fallible: if distId is empty/missing, reject/throw rather than
//      silently returning a default. A real SQL query would fail on a
//      malformed key too.
//
// ============================================================
// STAGE B -- the swap, done
// ============================================================
// The bodies below now query Postgres (db/001_preferences.sql) through the
// pool in "@/lib/db". What changed and what didn't is the whole lesson:
//
//   changed:   the two function bodies and the import. Nothing imports
//              preferences-store any more; the fixture stays on disk as
//              the "what Stage A looked like" reference.
//   unchanged: the exported signatures, the Preferences type, the
//              validation rules and PreferencesInputError -- so M5.1c's
//              Route Handler, including its 400-vs-500 mapping, compiles
//              and behaves identically against a real database.
//
// Requirement #2 was Stage A's, and Stage B is the thing it existed to
// make cheap. #1 and #3 still hold, and are load-bearing now rather than
// theatre: the awaits are real I/O, and a bad distId is rejected here
// before it can reach the driver.
//
// Before this runs: apply db/001_preferences.sql and set DATABASE_URL.

// Credentials and query text live in this module now, so make importing it
// from a Client Component a build error rather than a leak. Next resolves
// "server-only" internally -- no package install needed.
import "server-only";

import { pool } from "@/lib/db";

export type Preferences = { celebrationDismissed: boolean };

// Thrown when a caller hands us a key or a row shape a real SQL query
// would have rejected. Named so callers (M5.1c) can map it to a 400
// instead of letting it surface as a 500.
export class PreferencesInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PreferencesInputError";
  }
}

// The row as Postgres spells it. snake_case stops at this seam -- nothing
// above it should have to know column names. That's the other half of what
// a repository buys, besides swappable storage.
type PreferencesRow = { celebration_dismissed: boolean };

// A real `WHERE dist_id = $1` needs a non-empty key. Validating here --
// at the seam -- rather than in each Route Handler means the rule survives
// the Stage B swap to Postgres.
function assertDistId(distId: string): string {
  if (typeof distId !== "string" || distId.trim() === "") {
    throw new PreferencesInputError("distId is required");
  }
  return distId.trim();
}

// Same reasoning for the row: an INSERT with a non-boolean into a boolean
// column fails at the driver, not silently. Coerce nothing.
function assertPreferences(prefs: Preferences): Preferences {
  if (
    prefs === null ||
    typeof prefs !== "object" ||
    typeof prefs.celebrationDismissed !== "boolean"
  ) {
    throw new PreferencesInputError("celebrationDismissed must be a boolean");
  }
  return { celebrationDismissed: prefs.celebrationDismissed };
}

function toPreferences(row: PreferencesRow): Preferences {
  return { celebrationDismissed: row.celebration_dismissed };
}

export async function getPreferences(distId: string): Promise<Preferences> {
  const key = assertDistId(distId);

  // `$1`, never string interpolation: node-postgres sends the value as a
  // bound parameter, so a distId of `'; drop table preferences; --` is a
  // key that matches nothing, not SQL.
  const { rows } = await pool.query<PreferencesRow>(
    "SELECT celebration_dismissed FROM preferences WHERE dist_id = $1",
    [key]
  );

  // No row is not an error: a distributor who has never dismissed the
  // banner just doesn't have one yet. Defaulting here reproduces exactly
  // what getRaw returned, so the swap stays invisible to callers -- and it
  // keeps the read path from writing, which would make a GET non-idempotent.
  const row = rows[0];
  return row ? toPreferences(row) : { celebrationDismissed: false };
}

export async function savePreferences(
  distId: string,
  prefs: Preferences
): Promise<Preferences> {
  const key = assertDistId(distId);
  const row = assertPreferences(prefs);

  // Upsert, because the caller is saying "this is the state now" and
  // shouldn't have to know whether a row exists. RETURNING hands back what
  // actually landed -- the shape Stage A promised -- so callers never
  // re-read to learn what was stored, and a column DEFAULT or trigger that
  // rewrote the value would surface here instead of being assumed away.
  const { rows } = await pool.query<PreferencesRow>(
    `INSERT INTO preferences (dist_id, celebration_dismissed)
     VALUES ($1, $2)
     ON CONFLICT (dist_id)
     DO UPDATE SET celebration_dismissed = EXCLUDED.celebration_dismissed
     RETURNING celebration_dismissed`,
    [key, row.celebrationDismissed]
  );

  // An upsert that returns no row means the write didn't land (a rule
  // skipped the conflict path, the table is missing). That's our fault,
  // not the caller's, so it stays a plain Error -> 500 in M5.1c.
  const saved = rows[0];
  if (!saved) {
    throw new Error(`failed to persist preferences for distId ${key}`);
  }
  return toPreferences(saved);
}
