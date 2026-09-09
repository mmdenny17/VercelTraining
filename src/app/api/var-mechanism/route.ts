// ============================================================
// BUILD ITEM B2  -- the A.3 discriminator
// ============================================================
// You answered that a plain server-side env var is textually baked into the
// JS bundle at build time. This route decides that by experiment rather than
// by argument.
//
// Write a GET handler returning JSON with these four fields:
//
//   direct      -> process.env.SPIKE_SERVER_VAR        (static, literal key)
//   computed    -> read the SAME var through a key held in a variable:
//                  const k = 'SPIKE_SERVER_VAR'; then index process.env with k.
//                  A computed key CANNOT be substituted at build time.
//   enumerable  -> true/false: does 'SPIKE_SERVER_VAR' appear in
//                  Object.keys(process.env) at runtime?
//   publicVar   -> process.env.NEXT_PUBLIC_SPIKE_VAR
//
// Same cache requirement as B1.
//
// PREDICT BEFORE YOU RUN IT (predictions go in chat, not in this file).
// Under YOUR model -- values baked in at build time -- what is `computed`?
// What is `enumerable`? Commit to both before you see the output.
//
// YOUR TURN below this line.

export const dynamic = "force-dynamic";

export async function GET() {
  const key = "SPIKE_SERVER_VAR";

  return Response.json({
    direct: process.env.SPIKE_SERVER_VAR,
    computed: process.env[key],
    enumerable: Object.keys(process.env).includes("SPIKE_SERVER_VAR"),
    publicVar: process.env.NEXT_PUBLIC_SPIKE_VAR,
  });
}
