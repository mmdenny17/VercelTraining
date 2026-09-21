// Client-side hook backing CelebrationModal's real dismiss action. Not a
// build item. The state machine matters more than it looks: fetch resolves
// (doesn't reject) on a 4xx from M5.1c, so success/error is decided by
// response.ok, not by try/catch alone -- only a genuine transport failure
// (offline, DNS) lands in the catch block, and the two cases get distinct
// error messages because "the server said no" and "nothing reached the
// server" are different problems with different fixes.

"use client";

import { useState } from "react";

type Status =
  | { phase: "idle" }
  | { phase: "submitting" }
  | { phase: "success" }
  | { phase: "error"; message: string };

type ErrorBody = { error?: string };

export function useDismissCelebration(distId: string) {
  const [status, setStatus] = useState<Status>({ phase: "idle" });

  async function dismiss() {
    setStatus({ phase: "submitting" });

    try {
      const response = await fetch("/api/preferences", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ distId, celebrationDismissed: true }),
      });

      const body: ErrorBody | null = await response.json().catch(() => null);

      if (!response.ok) {
        setStatus({
          phase: "error",
          message: body?.error ?? `save failed (HTTP ${response.status})`,
        });
        return;
      }

      setStatus({ phase: "success" });
    } catch (error) {
      setStatus({
        phase: "error",
        message:
          error instanceof Error
            ? `could not reach the server: ${error.message}`
            : "could not reach the server",
      });
    }
  }

  return { status, dismiss };
}
