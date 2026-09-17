// Scaffolding, not a build item. Wires the page route to the aggregation
// endpoint (BUILD ITEM M5.1b) so there's somewhere to see the capstone
// data once it exists. Returns the endpoint's 501 until M5.1b lands.

import { Suspense } from "react";

async function getOverview(distId: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/profile-overview?distId=${distId}`, {
    cache: "no-store",
  });
  return res.json();
}

// The `fetch(..., { cache: "no-store" })` above is an explicit opt-out of
// caching, same class as connection() in env-check/nav-preview -- it must
// live in its own Suspense boundary under cacheComponents, or the whole
// page fails to prerender instead of just this piece streaming in.
async function Overview() {
  const data = await getOverview("test-dist-1");
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}

export default function ProfileOverviewPage() {
  return (
    <main style={{ fontFamily: "monospace", padding: "2rem", lineHeight: 1.8 }}>
      <h1>profile-overview (capstone)</h1>
      <Suspense fallback={<p>loading…</p>}>
        <Overview />
      </Suspense>
    </main>
  );
}
