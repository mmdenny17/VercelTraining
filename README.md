# vercel-spike

Vercel/Next.js spike capstone (LCC-3048), Capstone B — Profile Overview
card, rebuilt from PO3's `PersonalDetailsOverview`.

<!-- ============================================================
     DoD #13 -- YOUR TURN below each prompt. Write these in your own
     words; they're the synthesis piece of the capstone, and Gate 5's
     15-minute walkthrough will draw on exactly this content.
     ============================================================ -->

## The server/client boundary decision

<!--
Where does the boundary actually sit in this app (which file, which
component), and why there and nowhere else? What specifically does a
Server Component structurally lose by crossing it? Point at the real
file/comment if it's easier than restating it.
-->
src\app\profile-overview\CelebrationModal.tsx
The boundary sits at this one leaf, and nowhere higher, because it is the only thing on the route that needs a click handler plus state that outlives the render -- the server hands it `distId` as a serialized prop and everything above it stays a Server Component. Crossing it would cost the page three things: direct server data access (`preferences-repository` imports `"server-only"`, so a Client Component reaching it is a build error rather than a `DATABASE_URL` leak), the JS budget (a Client Component ships its entire import graph to the browser, so the fetch, the endpoint URL, and the mocked services behind it would go with it), and streaming (the server flushes Suspense chunks as they resolve, while a client subtree shows nothing until its bundle hydrates).

## Where the repository seam lives, and why there

<!--
Which file is the seam? What did keeping it there buy you when Stage B
swapped the fixture for real Postgres -- what DIDN'T have to change?
-->
src\lib\preferences-repository.ts
no changes to the caller
Stage B changed only the two function bodies and the import, leaving the exported signatures, the Preferences type, PreferencesInputError and its validation rules, and every line of api/preferences/route.ts — 400-vs-500 mapping and revalidateTag included — plus the client hook's POST contract, untouched.

## What changes when the mocks become real

<!--
Baseline/boost are still mocked. If they became real services tomorrow,
what actually changes in this codebase, and what stays exactly as it is?
(Hint: the aggregation endpoint's Slice<T> asymmetry comment is relevant
here.)
-->
the aggregation endpoint's Slice<T> handling doesn't have to change
baselineService/boostService get real bodies (fetch, cache: "no-store", res.ok check, per-service error message, mapping to the same keys, maybe a login), which forces page.tsx's asymmetric baseline/boost types back to Slice<…> so TypeScript demands an error branch at every line that reads them, while the handler's Slice<T>/toSlice/allSettled/degraded envelope stays exactly as it is.

## The portability rule I'd have been most tempted to break

<!--
Of P0-P8, which one, under real deadline pressure, would you have been
most likely to quietly violate -- and why that one specifically? Real
answer, not the safe one.
-->
P5 env access
It's the only rule whose violation is locally correct and invisible: process.env.X inline works in dev and in the build, so nothing stops me and the cost lands on a later deploy in a different environment — which is why I already broke it three times here (hardcoded PO3_BASE_URL, unvalidated DATABASE_URL, ?? "http://localhost:3000").

## Getting started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `npm run build && npm run start` before every push -- the production build catches server/client boundary and prerender errors `next dev` masks.
