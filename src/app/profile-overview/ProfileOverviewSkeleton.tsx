// Presentation only, not a build item. Mirrors the real card's layout
// (identity row, two progress rows, a record line) so swapping this for
// the resolved Overview causes no layout shift -- same idea as PO3's real
// PersonalDetailsOverviewSkeleton, rebuilt from scratch rather than
// ported (no @doterra-it package here, per the guardrails).

import styles from "./profile-overview.module.css";

export default function ProfileOverviewSkeleton() {
  return (
    <div aria-hidden="true">
      <div className={styles.identity}>
        <div className={`${styles.skeletonBlock} ${styles.skeletonAvatar}`} />
        <div className={styles.identityMeta}>
          <div
            className={`${styles.skeletonBlock} ${styles.skeletonLine}`}
            style={{ width: 140 }}
          />
          <div
            className={`${styles.skeletonBlock} ${styles.skeletonLine}`}
            style={{ width: 80, height: 11, marginTop: 6 }}
          />
        </div>
      </div>

      <div
        className={`${styles.skeletonBlock} ${styles.skeletonLine}`}
        style={{ width: 150, marginBottom: 14 }}
      />
      <div className={styles.progressRow}>
        <div
          className={`${styles.skeletonBlock} ${styles.skeletonLine}`}
          style={{ width: 60, height: 11, marginBottom: 8 }}
        />
        <div className={`${styles.skeletonBlock} ${styles.skeletonTrack}`} />
      </div>
      <div className={styles.progressRow}>
        <div
          className={`${styles.skeletonBlock} ${styles.skeletonLine}`}
          style={{ width: 60, height: 11, marginBottom: 8 }}
        />
        <div className={`${styles.skeletonBlock} ${styles.skeletonTrack}`} />
      </div>

      <div className={styles.section}>
        <div
          className={`${styles.skeletonBlock} ${styles.skeletonLine}`}
          style={{ width: 120, marginBottom: 10 }}
        />
        <div
          className={`${styles.skeletonBlock} ${styles.skeletonLine}`}
          style={{ width: 180, height: 12 }}
        />
      </div>
    </div>
  );
}
