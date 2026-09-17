// Scaffolding, not a build item. Wires the page route to the aggregation
// endpoint (BUILD ITEM M5.1b) so there's somewhere to see the capstone
// data once it exists. Returns the endpoint's 501 until M5.1b lands.

async function getOverview(distId: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/profile-overview?distId=${distId}`, {
    cache: "no-store",
  });
  return res.json();
}

export default async function ProfileOverviewPage() {
  const data = await getOverview("test-dist-1");

  return (
    <main style={{ fontFamily: "monospace", padding: "2rem", lineHeight: 1.8 }}>
      <h1>profile-overview (capstone)</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </main>
  );
}
