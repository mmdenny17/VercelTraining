// ============================================================
// BUILD ITEM M5.5b -- the four states, and the server half of the boundary
// ============================================================
// DoD items 1-4, 10: a real page with all four data states rendered, and a
// written-down server/client boundary decision. loading.tsx and error.tsx
// (scaffolded, same folder) already handle the loading and error states at
// the route level -- your job here is empty and ready, plus wiring the
// error state's actual trigger.
//
// Requirements:
//   1. Read `distId` from the page's `searchParams` prop (default "407591"
//      if absent -- that's the real PO3 dev1 test distributor this session
//      already verified). This makes the data source switchable via the
//      URL, which is what DoD #10 ("proven in the UI") means in practice --
//      no UI needs its own toggle when the URL already is the toggle.
//   2. Fetch "/api/profile-overview?distId=" + distId, same pattern the
//      current Overview() sub-component already uses (NEXT_PUBLIC_SITE_URL
//      fallback, cache: "no-store", its own Suspense-safe async component).
//   3. ERROR STATE: if the response is a 400 (missing/empty distId -- can't
//      happen via the default, but can via ?distId=), throw an Error. Not
//      a redirect, not a rendered message -- an actual throw, so error.tsx
//      (scaffolded) catches it the way Next's error boundaries are meant
//      to be used.
//   4. READY STATE: baseline and boost always render their values directly
//      -- the mocks never fail, so there's no empty case for them to prove.
//   5. EMPTY STATE: distributor specifically. If
//      data.distributor.error !== null, render something like
//      "No information to show" instead of rank/enrollDate -- same shape
//      PO3's baseline widget uses for a distributor with nothing to show,
//      per your own answer in chat.
//   6. Render <DismissCelebrationButton distId={distId} /> (M5.5a, same
//      folder) somewhere on the page -- this is the server/client boundary
//      DoD #3 wants written down. Add a short comment above the import or
//      the JSX explaining the decision in your own words.
//
// YOUR TURN below this line.

export default function ProfileOverviewPage() {
  return null;
}
