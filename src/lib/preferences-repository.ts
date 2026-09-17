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

export async function getPreferences(
  distId: string
): Promise<{ celebrationDismissed: boolean }> {
  throw new Error("TODO (BUILD ITEM M5.1a): implement getPreferences");
}

export async function savePreferences(
  distId: string,
  prefs: { celebrationDismissed: boolean }
): Promise<{ celebrationDismissed: boolean }> {
  throw new Error("TODO (BUILD ITEM M5.1a): implement savePreferences");
}
