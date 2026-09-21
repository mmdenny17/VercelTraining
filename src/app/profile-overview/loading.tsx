// Scaffolding, not a build item. loading.tsx is Next's file-convention for
// wrapping the whole route's content in a Suspense boundary automatically --
// this fallback shows while the Server Component below fetches. Same
// mechanism as the inline <Suspense fallback> pattern from nav-preview
// (Module 3), just at the route level instead of hand-wired.

import styles from "./profile-overview.module.css";
import ProfileOverviewSkeleton from "./ProfileOverviewSkeleton";

export default function Loading() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <ProfileOverviewSkeleton />
      </div>
    </div>
  );
}
