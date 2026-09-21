// ============================================================
// THE BOUNDARY DECISION (DoD #3) -- why this file, and only this file,
// is a Client Component
// ============================================================
// This component needs "use client" because it does two things a Server
// Component structurally cannot do, not two things that are merely easier
// on the client:
//
//   1. It attaches an event handler. onClick is a function that has to
//      exist in the browser at click time. A Server Component's output is
//      an RSC payload -- rendered UI plus placeholders and props -- and a
//      function isn't serializable into it, so there's no way to ship one
//      across the boundary. Whatever the user clicks has to be hydrated,
//      and hydration is what "use client" opts into.
//   2. It holds state that survives across renders in the browser.
//      idle -> submitting -> success/error is a sequence of values that
//      only exists after the server is done: the server renders once and
//      is gone, so there's nowhere for it to keep "we're mid-POST"
//      between the click and the response.
//
// The rest of the page does NOT need it, and shouldn't have it, because
// nothing else on the route is interactive -- it fetches and prints.
// Three concrete things the page would lose by crossing the boundary:
//
//   - Direct server data access. page.tsx reaches the profile-overview
//     endpoint (and, behind it, the repository) on the server.
//     preferences-repository imports "server-only" precisely so that
//     pulling it into a Client Component is a build error rather than a
//     leak of DATABASE_URL and query text into the bundle.
//   - The JS budget. A Client Component and everything it imports ship to
//     the browser. Keeping the boundary here means the page's fetching,
//     formatting, and the mocked services never do.
//   - Streaming. loading.tsx wraps the route in Suspense and the server
//     streams the overview in as it resolves; that's a server-rendering
//     property, and the less of the tree that has to hydrate before it's
//     useful, the less of it waits on JS.
//
// So the boundary sits as low in the tree as it can: the server renders
// the page and passes distId -- a plain string, which serializes fine --
// down to this leaf, and only this leaf becomes interactive. That's the
// "Server Components by default, Client Components at the leaves" shape,
// and distId arriving as a prop instead of being looked up here is what
// keeps the leaf this small.
//
// ============================================================
// BUILD ITEM M5.5a -- the client component half of the boundary decision
// ============================================================
// This is the one piece of the capstone that has to be a Client Component,
// and DoD item 3 wants that decision written down, not just made. Above
// this comment, in your own words once you've built it: why does THIS
// component need "use client" (what does it do that a Server Component
// structurally cannot), and why does the rest of the page NOT need it?
//
// Requirements:
//   1. "use client" at the top.
//   2. Props: { distId: string }.
//   3. Local state machine: idle -> submitting -> success | error.
//      (useState is fine -- this is a single click handler, not shared
//      state anything else on the page needs.)
//   4. onClick: POST to /api/preferences (M5.1c) with
//      { distId, celebrationDismissed: true }. Use the response status,
//      not just "did fetch throw", to decide success vs error --
//      M5.1c returns structured JSON on both 200 and its error paths, it
//      doesn't throw.
//   5. Render per state: idle/submitting -> a button (disabled while
//      submitting, label changes), success -> confirmation text, no
//      button, error -> the error message plus a way to retry (clicking
//      again from the error state should work, not require a reload).
//
// YOUR TURN below this line.

"use client";

import { useState } from "react";
import styles from "./profile-overview.module.css";

// A discriminated union rather than a pile of booleans, so the impossible
// states (submitting AND success, error with no message) can't be
// represented at all. The message belongs to the error variant for the
// same reason: there's no way to be in `error` without something to show,
// and no stale message left hanging around once a retry succeeds.
type Status =
  | { phase: "idle" }
  | { phase: "submitting" }
  | { phase: "success" }
  | { phase: "error"; message: string };

// The shape of M5.1c's error responses. Only `error` matters here -- the
// success body (distId/preferences/revalidated/savedAt) is echoed back for
// debugging and nothing on this page renders it.
type ErrorBody = { error?: string };

export default function DismissCelebrationButton({
  distId,
}: {
  distId: string;
}) {
  const [status, setStatus] = useState<Status>({ phase: "idle" });

  async function dismiss() {
    setStatus({ phase: "submitting" });

    try {
      const response = await fetch("/api/preferences", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ distId, celebrationDismissed: true }),
      });

      // Requirement #4, the part that's easy to get wrong: fetch resolves
      // for a 400 or a 500 just as happily as for a 200 -- it only rejects
      // when the request never completed (offline, DNS, CORS). So M5.1c's
      // validation 400 lands in the `try`, not the `catch`, and the status
      // is what decides success vs error.
      const body: ErrorBody | null = await response.json().catch(() => null);

      if (!response.ok) {
        // Prefer the server's own wording -- on a 400 that's the
        // repository's message ("distId is required"), which is more
        // useful than anything invented here. The fallback covers replies
        // with no JSON body at all: a proxy's 502, a crash outside the
        // handler.
        setStatus({
          phase: "error",
          message: body?.error ?? `save failed (HTTP ${response.status})`,
        });
        return;
      }

      setStatus({ phase: "success" });
    } catch (error) {
      // Transport failure only, and worth distinguishing from the branch
      // above: nothing reached the server, so nothing was written and a
      // retry is unambiguously safe.
      setStatus({
        phase: "error",
        message:
          error instanceof Error
            ? `could not reach the server: ${error.message}`
            : "could not reach the server",
      });
    }
  }

  // Terminal state: no button, because the write landed and clicking again
  // would only re-send an identical upsert. Nothing else on the page reads
  // the preference today, so there's no server state to re-sync -- if
  // page.tsx ever renders `celebrationDismissed`, this is where a
  // router.refresh() would go to pull down the updated Server Component
  // tree (M5.1c's revalidateTag already handles the server-side cache).
  if (status.phase === "success") {
    return (
      <p role="status" className={styles.success}>
        Celebration dismissed for {distId}.
      </p>
    );
  }

  const submitting = status.phase === "submitting";

  return (
    <div>
      {/* Three labels, not two: from the error state this button is a
          retry, and saying so is the difference between "it failed" and
          "it failed, here's what to do". It runs the same dismiss() --
          setStatus({ phase: "submitting" }) clears the error first, so the
          retry happens in place with no reload. `disabled` while
          submitting is what keeps a double-click from racing two POSTs. */}
      <button onClick={dismiss} disabled={submitting} className={styles.button}>
        {submitting
          ? "dismissing…"
          : status.phase === "error"
            ? "retry dismiss"
            : "dismiss celebration"}
      </button>

      {status.phase === "error" && (
        <p role="alert" className={styles.errorText}>
          Couldn&apos;t dismiss: {status.message}
        </p>
      )}
    </div>
  );
}
