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
// YOUR TURN below this line.

import { getRaw, setRaw } from "@/lib/preferences-store";

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

export async function getPreferences(distId: string): Promise<Preferences> {
  const key = assertDistId(distId);
  // `await` on a sync fixture is deliberate: it makes this call site
  // identical to the one that will `await pool.query(...)` in Stage B, so
  // swapping the body later changes nothing above it.
  return await Promise.resolve(getRaw(key));
}

export async function savePreferences(
  distId: string,
  prefs: Preferences
): Promise<Preferences> {
  const key = assertDistId(distId);
  const row = assertPreferences(prefs);
  // Returns the persisted row (the fixture's setRaw echoes it back) the
  // way an `INSERT ... ON CONFLICT DO UPDATE ... RETURNING *` would, so
  // callers never have to re-read to learn what was stored.
  return await Promise.resolve(setRaw(key, row));
}
