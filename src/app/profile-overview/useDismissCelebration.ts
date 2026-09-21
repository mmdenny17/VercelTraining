// Shared client-side hook, extracted from DismissCelebrationButton so the
// new CelebrationModal drives the exact same POST /api/preferences logic
// instead of a second, drifting copy of it. Not a build item -- the state
// machine and its reasoning (fetch resolves on 4xx, only rejects on a real
// transport failure; distinguishing the two error messages) were already
// written and verified in DismissCelebrationButton.

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
