// Scaffolding, not a build item. loading.tsx is Next's file-convention for
// wrapping the whole route's content in a Suspense boundary automatically --
// this fallback shows while the Server Component below fetches. Same
// mechanism as the inline <Suspense fallback> pattern from nav-preview
// (Module 3), just at the route level instead of hand-wired.

export default function Loading() {
  return (
    <main style={{ fontFamily: "monospace", padding: "2rem", lineHeight: 1.8 }}>
      <h1>profile-overview (capstone)</h1>
      <p>loading…</p>
    </main>
  );
}
