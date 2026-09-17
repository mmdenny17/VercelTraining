// ============================================================
// BUILD ITEM M3.2 -- P6, tag-based revalidation, the invalidate side
// ============================================================
// This is the real thing you already named correctly in chat: "it calls
// the webhook route, which calls revalidateTag." Now write it.
//
// POST handler, expects JSON body: { tag: string }
//   - call revalidateTag(tag) from "next/cache"
//   - return JSON confirming what tag was revalidated and when
//
// Treat this exactly like the real §3.1 route: "a POST /api/revalidate
// route handler that receives publish webhooks and calls revalidateTag."
// A real Contentstack webhook would POST here on every publish; you're
// standing in for that webhook with a manual curl/fetch call.
//
// No auth on this stub (a real one would check a shared secret from the
// CMS webhook config -- out of scope for this exercise, but worth noting
// out loud: right now anyone who can reach this route can invalidate your
// cache. Is that a P3-style "quiet" risk or a loud one? You don't need to
// fix it, just name which it is when we talk through this.)
//
// YOUR TURN below this line.

import { revalidateTag } from "next/cache";

export async function POST(request: Request) {
  const body = await request.json();
  if (typeof body.tag !== "string") {
    return Response.json({ error: "expected { tag: string }" }, { status: 400 });
  }

  // This build's revalidateTag requires a second arg -- a cacheLife profile
  // (or { expire }) governing how long stale content serves while fresh
  // content loads. "max" is the recommended stale-while-revalidate choice.
  revalidateTag(body.tag, "max");

  return Response.json({ revalidated: body.tag, at: new Date().toISOString() });
}
