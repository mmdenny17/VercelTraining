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
// State machine lives in useDismissCelebration (same folder) -- shared
// with CelebrationModal, which drives an identical dismiss action from a
// different piece of UI. Two components, one source of truth for what a
// dismiss actually does.

"use client";

import { useDismissCelebration } from "./useDismissCelebration";
import styles from "./profile-overview.module.css";

export default function DismissCelebrationButton({
  distId,
}: {
  distId: string;
}) {
  const { status, dismiss } = useDismissCelebration(distId);

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
