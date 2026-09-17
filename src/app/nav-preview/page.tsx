// ============================================================
// BUILD ITEM M3.1 -- P6, tag-based revalidation, the read side
// ============================================================
// This page stands in for the arch plan's `lib/cms/navigation.ts`: a
// server-rendered read of CMS-shaped content that should NOT hit the
// source on every request, but DOES need to reflect a publish quickly
// when one happens.
//
// getContent() from "@/lib/cms-source" is your "CMS client call" -- treat
// it like a network fetch to Contentstack, not like reading a local
// variable directly (a real client would be an actual HTTP call).
//
// Your job: wrap that call in Next's `unstable_cache` so the RESULT is
// cached and tagged, not re-read on every render.
//
//   import { unstable_cache } from "next/cache";
//   import { getContent } from "@/lib/cms-source";
//
//   const getCachedContent = unstable_cache(
//     async () => getContent(),
//     ["nav-content"],      // cache key parts
//     { tags: ["nav"] },    // the tag M3.2's revalidate route will target
//   );
//
// Render `label` and `wroteAt` from the cached read, plus your own
// `new Date().toISOString()` printed separately as "page rendered at" --
// you need both timestamps on screen to tell a cache hit from a miss by
// eye, without checking network logs.
//
// PREDICT BEFORE YOU TEST (predictions go in chat, not in this file):
// 1. You load this page once, then POST a new label to /api/cms-source.
//    Reload this page WITHOUT calling revalidate. What shows -- old label
//    or new label? Why?
// 2. Now POST to /api/revalidate (M3.2) with tag "nav", then reload this
//    page again. What shows now?
// 3. Name the discriminator: what's on screen that tells you a cache HIT
//    happened, distinct from a cache MISS that happened to read the same
//    value? (Hint: you rendered two timestamps for a reason.)
//
// YOUR TURN below this line.
import { cacheTag } from "next/cache";
import { getContent } from "@/lib/cms-source";
import { connection } from "next/server";
import { Suspense } from "react";

async function getCachedContent() {
  "use cache";
  cacheTag("nav");
  return getContent();
}

// connection() is an explicit opt-out of caching -- it must live in its own
// Suspense boundary so only THIS piece is excluded from the static shell.
// The label/wroteAt section above stays prerendered; this streams in per request.
async function RenderedAt() {
  await connection();
  const renderedAt = new Date().toISOString();
  return <p>page rendered at: {renderedAt}</p>;
}

export default async function NavPreviewPage() {
  const { label, wroteAt } = await getCachedContent();

  return (
    <main style={{ fontFamily: "monospace", padding: "2rem", lineHeight: 1.8 }}>
      <h1>nav-preview</h1>
      <section>
        <h2>Cached content</h2>
        <p>label: {label}</p>
        <p>wroteAt (cached): {wroteAt}</p>
      </section>
      <section>
        <h2>Render info</h2>
        <Suspense fallback={<p>page rendered at: …</p>}>
          <RenderedAt />
        </Suspense>
      </section>
    </main>
  );
}
