// Mock celebration modal, not a build item and not tied to real PO3
// level-up detection (that would need a "previous rank" comparison this
// simplified data model doesn't carry).
//
// Two ways to close, deliberately different: the "×" is a local-only close
// (setClosedLocally(true), no network call -- "not now"). "Nice, thanks!"
// is the real dismiss (POST /api/preferences via useDismissCelebration,
// same folder) -- "don't show this again," persisted.
//
// ============================================================
// THE BOUNDARY DECISION (DoD #3) -- why this file, and only this file,
// is a Client Component
// ============================================================
// This component needs "use client" because it does two things a Server
// Component structurally cannot do, not two things that are merely easier
// on the client:
//
//   1. It attaches event handlers. onClick is a function that has to exist
//      in the browser at click time. A Server Component's output is an RSC
//      payload -- rendered UI plus placeholders and props -- and a
//      function isn't serializable into it, so there's no way to ship one
//      across the boundary. Whatever the user clicks has to be hydrated,
//      and hydration is what "use client" opts into.
//   2. It holds state that survives across renders in the browser: which
//      close path fired, plus idle -> submitting -> success/error from the
//      shared hook. That sequence only exists after the server is done --
//      the server renders once and is gone, so there's nowhere for it to
//      keep "we're mid-POST" between the click and the response.
//
// The rest of the page does NOT need it, and shouldn't have it, because
// nothing else on the route is interactive -- it fetches and prints. Three
// concrete things the page would lose by crossing the boundary:
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

"use client";

import { useState } from "react";
import { useDismissCelebration } from "./useDismissCelebration";
import styles from "./profile-overview.module.css";

export default function CelebrationModal({ distId }: { distId: string }) {
  const [closedLocally, setClosedLocally] = useState(false);
  const { status, dismiss } = useDismissCelebration(distId);

  // Derived, not a separate effect-driven state: "closed" is true the
  // moment any close path fires, so there's nothing to synchronize after
  // the fact. `error` closes the modal same as `success` -- this is a mock
  // (README/log: DATABASE_URL only exists locally, so the real write
  // genuinely can't land from the deployed site), and surfacing that as a
  // visible error during a demo would be a distraction from what the
  // capstone is actually demonstrating. The write still gets attempted for
  // real (useDismissCelebration doesn't change), it just isn't gated on
  // succeeding to close the modal.
  if (closedLocally || status.phase === "success" || status.phase === "error") {
    return null;
  }

  const submitting = status.phase === "submitting";

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        <p className={styles.modalEmoji}>🎉</p>
        <p className={styles.modalTitle}>Nice work!</p>
        <p className={styles.modalBody}>
          You&apos;re making great progress toward your next level. Keep it
          up, distributor {distId}.
        </p>

        <button onClick={dismiss} disabled={submitting} className={styles.button}>
          {submitting ? "dismissing…" : "Nice, thanks!"}
        </button>

        <button
          onClick={() => setClosedLocally(true)}
          aria-label="Close"
          className={styles.modalClose}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
