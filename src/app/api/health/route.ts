// ============================================================
// BUILD ITEM B1  (Module 2 opener, and the G0.6 re-ask)
// ============================================================
// Write a GET handler that responds with JSON:
//
//   { ok: true, region: <the Vercel region this invocation ran in>, at: <ISO 8601 timestamp> }
//
// Requirements:
//   1. GET only.
//   2. `region` comes from the environment Vercel provides. Find the variable
//      name yourself -- do not guess silently; if unsure, write your best
//      guess and leave a `// GUESS:` comment next to it.
//   3. `at` must be the time of THE REQUEST, not the time of the build.
//      A request one second after the previous one must return a different
//      `at`. Making that true is the actual exercise -- there is more than
//      one correct way, and I will ask which one you picked and why.
//
// Constraint: no prose. Code, even if you are unsure of an API name.
//
// YOUR TURN below this line.

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    ok: true,
    region: process.env.VERCEL_REGION ?? "(no region)",
    at: new Date().toISOString(),
  });
}
