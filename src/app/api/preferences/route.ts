// ============================================================
// BUILD ITEM M5.1c -- Stage A, the write path
// ============================================================
// Stage A part 3: a write path that mutates and revalidates. This is
// "dismiss/acknowledge the celebration banner" -- the write you picked
// once none of Capstone B's 5 real queries turned out to be writes.
//
// POST /api/preferences, body: { distId: string, celebrationDismissed: boolean }
//
// Requirements:
//   1. Call savePreferences from "@/lib/preferences-repository".
//   2. Decide: Route Handler (like this stub) or Server Action? You chose
//      Route Handler by writing it here -- be ready to say why a Server
//      Action would also have worked, and what would change if you had
//      picked one.
//   3. Revalidate whatever your profile-overview read path ends up caching
//      (M5.1b doesn't cache anything yet -- decide together whether it
//      should, and if so, revalidate that here).
//
// YOUR TURN below this line.

import { revalidateTag } from "next/cache";
import {
  PreferencesInputError,
  savePreferences,
} from "@/lib/preferences-repository";

// Route Handler vs. Server Action (requirement #2):
//
// Both would have worked -- savePreferences doesn't care who calls it,
// which is the whole point of the M5.1a seam. What differs is the caller
// and the invalidation primitive:
//
//   - A Route Handler is a public HTTP endpoint. Anything that can reach
//     the origin can POST here (the same "quiet risk" M3.2's revalidate
//     route has), so auth/CSRF is on me. In exchange it's callable from
//     anywhere -- curl, a native app, PO3's existing React Query
//     `useMutation` -- which matters here because the real PowerOf3 code
//     this is standing in for is a client-side hook, not a form.
//   - A Server Action is an RPC Next.js generates for me: no URL to
//     defend by hand, and it can be wired straight to a <form action> so
//     the dismiss works without JS. But it's only callable from this app's
//     own React tree, so PO3's hook couldn't call it as-is.
//
// The concrete thing that changes: a Server Action can call `updateTag`,
// which expires the entry immediately so the very next read is fresh --
// read-your-own-writes, exactly what "I dismissed the banner, it should be
// gone" wants. `updateTag` throws outside a Server Action, so from a Route
// Handler the equivalent is `revalidateTag(tag, { expire: 0 })` (below).

// The tag this route invalidates. Per-distributor, not global: dismissing
// my banner must not expire everyone else's cached overview. Lives here
// for now because there's exactly one caller; it moves next to the read
// path (or into the repository) the moment a second caller needs it.
function preferencesTag(distId: string) {
  return `preferences:${distId}`;
}

// What to revalidate (requirement #3):
//
// M5.1b deliberately caches nothing -- it reads request.nextUrl, so it's
// dynamic, and it doesn't read preferences at all. So today this call has
// nothing to invalidate; it's a no-op against a tag no cache entry claims,
// which costs nothing and keeps the write path honest about its contract.
//
// It stops being a no-op the moment either of these lands:
//   - the preference row gets a cached reader (`'use cache'` +
//     cacheTag(preferencesTag(distId)) around getPreferences), or
//   - profile-overview merges preferences into its payload and caches it,
//     at which point its own tag gets added to the list below.
//
// The banner is per-distributor, user-specific, and changes on click --
// which is an argument that the overview endpoint shouldn't cache it at
// all, and that the right shape is a cached overview (slow, shared,
// service-backed) plus an uncached preferences read. Worth settling
// before Stage B swaps the fixture for Postgres.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "expected a JSON body: { distId, celebrationDismissed }" },
      { status: 400 }
    );
  }

  const record = (body ?? {}) as {
    distId?: unknown;
    celebrationDismissed?: unknown;
  };
  // Normalize only what the transport owns (JSON gave us `unknown`);
  // deliberately don't re-validate here. A non-string distId becomes ""
  // and a non-boolean flag passes through untouched, so the seam rejects
  // both -- one validation rule, in one place, that survives Stage B.
  const distId = typeof record.distId === "string" ? record.distId.trim() : "";

  try {
    const preferences = await savePreferences(distId, {
      celebrationDismissed: record.celebrationDismissed as boolean,
    });

    // `{ expire: 0 }`, not "max": "max" serves stale content for up to a
    // year while it refreshes in the background, which is right for a CMS
    // publish (M3.2) and wrong here -- the user just clicked dismiss and
    // would watch the banner come back. This is the Route Handler's stand-in
    // for a Server Action's `updateTag`, which isn't callable from here.
    const revalidated = [preferencesTag(distId)];
    for (const tag of revalidated) {
      revalidateTag(tag, { expire: 0 });
    }

    return Response.json({
      distId,
      preferences,
      revalidated,
      savedAt: new Date().toISOString(),
    });
  } catch (error) {
    // The seam's own rejection is a caller error, not an outage -- 400, with
    // the message the repository chose. Anything else is genuinely ours
    // (a dead driver in Stage B), so it stays a 500 and gets logged.
    if (error instanceof PreferencesInputError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    console.error("POST /api/preferences failed", error);
    return Response.json({ error: "failed to save preferences" }, { status: 500 });
  }
}
