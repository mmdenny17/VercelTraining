// ============================================================
// BUILD ITEM M5.4 -- Stage D (trimmed), the user-token check
// ============================================================
// Stage D is normally "LTC-direct," gated on LCC-3045 (DevOps network
// decision -- and LTC has no public non-prod host this project could
// reach anyway). This trimmed version mocks the LTC call itself
// ("@/lib/ltc-service") and focuses entirely on the one thing Stage D is
// actually about: LTC authenticates the CALLER (client-credentials --
// this app's own identity), not the end user. PO3 and RT already do a
// user-token check on every request; an endpoint that calls LTC directly
// has no such check for free and has to add its own, or any authenticated
// user could read any other user's data just by changing a query param.
//
// GET /api/ltc-direct?distId=<id>
// Header: Authorization: Bearer <token from /api/dev-token?distId=<id>>
//
// Requirements:
//   1. No Authorization header, or a malformed/invalid-signature token
//      (see "@/lib/user-token"'s InvalidUserTokenError) -> 401. The
//      request never reaches ltcLookup.
//   2. A VALID token, but for a DIFFERENT distId than the one being
//      requested -> 403. This is the actual exercise: prove you're
//      checking WHO the token is for, not just THAT it's valid.
//   3. Token distId matches requested distId -> call ltcLookup(distId),
//      return its result.
//
// PREDICT BEFORE YOU TEST:
//   Get a token for distId "1" from /api/dev-token?distId=1, then call
//   this route with ?distId=2 using that token. Valid signature, wrong
//   person. What should come back, and why is that different from both
//   the no-token case and the matching case?
//
// YOUR TURN below this line.

export async function GET(request: Request) {
  return Response.json({ error: "not implemented (BUILD ITEM M5.4)" }, { status: 501 });
}
