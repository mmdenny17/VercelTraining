// Mock celebration modal, not a build item and not tied to real PO3
// level-up detection (that would need a "previous rank" comparison this
// simplified data model doesn't carry). Pops up on mount to demo the same
// dismiss action DismissCelebrationButton already exercises -- both drive
// useDismissCelebration (same folder), so there is one source of truth for
// what "dismiss" actually does, not two drifting copies.
//
// Two ways to close, deliberately different: the "×" is a local-only close
// (setOpen(false), no network call -- "not now"). "Nice, thanks!" is the
// real dismiss (POST /api/preferences via the shared hook) -- "don't show
// this again," persisted.

"use client";

import { useState } from "react";
import { useDismissCelebration } from "./useDismissCelebration";
import styles from "./profile-overview.module.css";

export default function CelebrationModal({ distId }: { distId: string }) {
  const [closedLocally, setClosedLocally] = useState(false);
  const { status, dismiss } = useDismissCelebration(distId);

  // Derived, not a separate effect-driven state: "closed" is true the
  // moment either close path fires, so there's nothing to synchronize
  // after the fact -- no reason to make the user close a modal that just
  // told the server "don't show this again."
  if (closedLocally || status.phase === "success") {
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

        {status.phase === "error" && (
          <p role="alert" className={styles.errorText}>
            Couldn&apos;t dismiss: {status.message}
          </p>
        )}

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
