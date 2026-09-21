// Scaffolding, not a build item. error.tsx must be a Client Component --
// Next requires this because it needs to attach a browser-side error
// boundary and offer a `reset()` that re-renders on the client. Same
// mechanism as nextjs-dashboard's Ch.12 error.tsx (Module 2), just against
// this route's own error: a missing ?distId= (BUILD ITEM M5.5 in page.tsx
// throws for exactly this case).

"use client";

import styles from "./profile-overview.module.css";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <p className={styles.errorCard}>Something went wrong: {error.message}</p>
        <button onClick={reset} className={styles.button}>
          Try again
        </button>
      </div>
    </div>
  );
}
