// Fixture, not a build item. A toy user-token scheme, HMAC-signed with
// node:crypto so it needs no new dependency and no real credentials --
// this exists only to give Stage D's Route Handler something real to
// verify. It is NOT how Gigya tokens actually work (those are RS256 JWTs
// from a real identity provider); the mechanism this stands in for is
// narrower and deliberate: "the caller presents a token naming a distId,
// and something has to check it's genuine before trusting that distId."
//
// devSignToken exists so you (and curl) can mint a token to test against,
// the same role /api/login plays for PO3 in mock-services.ts.

import { createHmac, timingSafeEqual } from "node:crypto";

// Local-only, not a real secret -- this project never talks to a real
// identity provider. If this were real, this would be an env var pulled
// from a secrets store, never a literal in source.
const TOKEN_SECRET = "vercel-spike-stage-d-toy-secret";

function sign(payload: string): string {
  return createHmac("sha256", TOKEN_SECRET).update(payload).digest("base64url");
}

export function devSignToken(distId: string): string {
  const payload = Buffer.from(JSON.stringify({ distId })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export class InvalidUserTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidUserTokenError";
  }
}

// Returns the distId the token asserts, or throws. Deliberately does NOT
// take a distId to check against -- that comparison is Stage D's actual
// exercise, not this fixture's job.
export function verifyUserToken(token: string): string {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    throw new InvalidUserTokenError("malformed token");
  }

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  // Length check before timingSafeEqual: it throws on mismatched lengths
  // rather than returning false, and a length mismatch is itself not
  // secret information worth timing-protecting.
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new InvalidUserTokenError("signature mismatch");
  }

  const decoded: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
  const distId = (decoded as { distId?: unknown } | null)?.distId;
  if (typeof distId !== "string" || distId === "") {
    throw new InvalidUserTokenError("token has no distId");
  }
  return distId;
}
