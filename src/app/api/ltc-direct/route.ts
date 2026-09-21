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

import type { NextRequest } from "next/server";
import { ltcLookup } from "@/lib/ltc-service";
import { InvalidUserTokenError, verifyUserToken } from "@/lib/user-token";

// PREDICTION (written before running it): ?distId=2 with a token minted
// for distId 1 comes back 403 -- not 401, and certainly not data.
//
//   - 401 means "I don't know who you are, try again with credentials."
//     It invites a retry, and here that would be wrong advice: the token
//     is fine. The signature verified. Nothing about presenting it again
//     changes the outcome.
//   - 403 means "I know exactly who you are, and this isn't yours." No
//     credential fixes it; distributor 1 is never allowed to read
//     distributor 2's LTC record. That's authorization, not authentication.
//   - Returning the data is the bug this whole build item exists to
//     prevent. LTC itself would happily answer: its client-credentials
//     token proves *this app* may call it and says nothing about which
//     distributor is sitting in front of the browser. This handler is the
//     only place that distinction can be enforced.
//
// Three different failures, three different answers: 401 = who?, 403 =
// not yours, 200 = yours.

// Every 401 looks identical from outside on purpose. "malformed token" vs.
// "signature mismatch" vs. "no header at all" is useful in a log and is
// free reconnaissance in a response body -- it tells someone probing the
// endpoint which half of their forgery to fix. One shape, one message.
function unauthorized() {
  return Response.json(
    { error: "a valid user token is required" },
    {
      status: 401,
      // 401 is the one status RFC 9110 requires a challenge on: it tells
      // the caller *how* to authenticate, not merely that they failed.
      // 403 deliberately gets no challenge -- there is nothing to retry with.
      headers: { "WWW-Authenticate": 'Bearer realm="ltc-direct"' },
    },
  );
}

// Pull the credential out of the header without trusting its shape.
// Returns null for anything that isn't exactly `Bearer <one-token>`; the
// caller turns that into the same 401 as a bad signature, because from
// this endpoint's side "you sent no token" and "you sent something that
// isn't a token" are the same event.
function bearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (header === null) {
    return null;
  }
  // The scheme is case-insensitive per spec ("bearer", "BEARER"); the
  // token is not. Split on runs of whitespace so `Bearer  abc` still
  // parses, and require exactly one part after the scheme so `Bearer a b`
  // fails closed instead of quietly verifying `a`.
  const parts = header.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    return null;
  }
  return parts[1];
}

export async function GET(request: NextRequest) {
  // Authenticate before even looking at the query string. An anonymous
  // caller gets 401 whether or not the rest of the request was well-formed
  // -- validating ?distId= first would let an unauthenticated probe tell a
  // missing param from a present one, and would make "did this reach the
  // service?" depend on parse order. Cheap rule: nothing about this
  // request matters until we know who is asking.
  const token = bearerToken(request);
  if (token === null) {
    return unauthorized();
  }

  let tokenDistId: string;
  try {
    tokenDistId = verifyUserToken(token);
  } catch (error) {
    // The fixture throws exactly one error type for every way a token can
    // be bad. Anything else escaping verifyUserToken is our bug, not the
    // caller's, and must not be laundered into a 401 -- rethrow it and let
    // it surface as a real 500.
    if (error instanceof InvalidUserTokenError) {
      return unauthorized();
    }
    throw error;
  }

  // Only now does the request's own content matter. Note what is already
  // true at this line: `tokenDistId` came out of a signature check, so it
  // is the one distId on this request that wasn't simply typed by the caller.
  const distId = request.nextUrl.searchParams.get("distId")?.trim() ?? "";
  if (distId === "") {
    return Response.json({ error: "distId is required" }, { status: 400 });
  }

  // ---- The build item, in one comparison ----
  //
  // Requirement #2. Everything above proved the token is genuine; this
  // proves it is genuine *for the record being asked for*. Delete this
  // line and the endpoint becomes a fully authenticated data leak: any
  // logged-in distributor could read any other distributor's LTC record by
  // editing a query param, and every one of those requests would look
  // perfectly valid in the logs.
  //
  // Plain !== is right here. timingSafeEqual guards secrets; a distId is
  // an identifier the caller already supplied, so there is nothing to leak
  // by comparing it fast.
  if (tokenDistId !== distId) {
    return Response.json(
      { error: "token is not valid for the requested distId" },
      { status: 403 },
    );
  }

  // Requirement #3. Pass the verified id, not the query param. They are
  // equal by the line above, so this changes no behaviour today -- it
  // means the value reaching LTC came from a signature rather than from a
  // URL. If someone later relaxes the check to a prefix or an upline
  // hierarchy match, this line doesn't silently become the hole.
  try {
    const record = await ltcLookup(tokenDistId);
    return Response.json({ distId: tokenDistId, ltc: record });
  } catch (error) {
    // LTC being unreachable is ours to own, not the caller's to fix. The
    // raw reason stays in the log: an upstream client error can carry
    // detail we don't want echoed back to an arbitrary caller. Same rule
    // the preferences route follows for its driver failures.
    console.error("GET /api/ltc-direct: ltcLookup failed", error);
    return Response.json({ error: "failed to reach LTC" }, { status: 500 });
  }
}

// Uncached, and it has to stay that way. Reading request.headers makes the
// handler dynamic (Next 16 Route Handlers are uncached by default, and
// prerendering stops at a request property anyway), which matters here for
// a reason beyond freshness: a response cached on the URL alone would
// serve distributor 1's LTC record to whoever asks for ?distId=1 next,
// token or no token. The auth check would run once and protect nobody. If
// this ever earns `use cache`, the cache key has to include the verified
// identity, not just the query string.
