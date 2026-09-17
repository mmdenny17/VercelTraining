// Was a deliberate P3 violation (`runtime = "edge"`), compared against
// /api/boom's standard Node Function. Stripped 2026-09-17: `cacheComponents:
// true` (turned on during Module 3's Next 16 migration) is incompatible with
// a per-route `runtime` segment config, and the switch is all-or-nothing --
// no per-file opt-out exists. The P3 findings this route produced are
// already captured in the log/cheatsheet; this is now a plain Node Function
// and no longer demonstrates edge behavior.
export async function GET() {
  return Response.json({
    ranOn: "node",
    // Node Functions have this. Ask yourself what it says here, and why.
    region: process.env.VERCEL_REGION ?? "(no region)",
    renderedAt: new Date().toISOString(),
  });
}
