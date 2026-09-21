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

import { Suspense } from "react";
import styles from "./profile-overview.module.css";

// The boundary, from this side (the long version lives in the component's
// own file). Everything in page.tsx stays a Server Component: it fetches,
// it formats, it prints, and none of that needs to exist in the browser.
// The one thing on this route that does -- a click handler, plus the
// idle/submitting/success/error state that has to outlive it -- is
// quarantined in this single leaf. The server hands it `distId`, a plain
// string, and that is the whole reason the leaf can stay this small: the
// id crosses the RSC boundary as a serialized prop, so the client never
// has to go look it up for itself, and the fetching, the endpoint URL,
// and the mocked services behind it never ship to the browser at all.
import CelebrationModal from "./CelebrationModal";

// The real PO3 dev1 distributor this session verified end to end. Applies
// only when ?distId= is absent entirely -- see normalizeDistId.
const DEFAULT_DIST_ID = "407591";

// Mirrors the aggregation endpoint's response (M5.1b). Declared here
// rather than imported from the route handler, because a handler's return
// type isn't an exported contract -- this page is a consumer of an HTTP
// endpoint, and writing down the shape it consumes is the honest version
// of that relationship.
type Slice<T> = { data: T; error: null } | { data: null; error: string };

type DistributorSummary = {
  distId: string;
  // `string | number`, and the union is not defensive padding -- it's what
  // dev1 actually sends. mock-services' DistributorSummary declares
  // `rank: string | null`, but PO3 returns `"rank": 7`, and nothing
  // between here and there validates the body: distributorService does
  // `body?.rank ?? null` on an unvalidated `as`-cast response, so the
  // number passes straight through a type that says it can't. Declaring
  // the truth here is the cheap half of the fix; the expensive half is a
  // parse at the seam in mock-services, which is that file's problem.
  rank: string | number | null;
  enrollDate: string | null;
};

type OverviewResponse = {
  distId: string;
  // The asymmetry below is deliberate. The endpoint wraps all three
  // services in the same Slice<T>, but baselineService and boostService
  // are still in-process mocks that resolve a literal after a setTimeout
  // -- they have no failure mode to have. Typing their slices without the
  // error variant is what lets requirement #4 render them directly
  // instead of inventing an empty state that can't be reached. The day
  // either one becomes a real network call, this goes back to Slice<...>
  // and TypeScript points at every line that has to grow a branch. That
  // tripwire is the reason the two types are allowed to differ.
  baseline: { data: { distId: string; baseline: number }; error: null };
  boost: { data: { distId: string; boost: number }; error: null };
  distributor: Slice<DistributorSummary>;
  degraded: boolean;
  degradedServices: string[];
  fetchedAt: string;
};

// `?distId=1&distId=2` is legal in a URL, so the prop's type is
// `string | string[] | undefined` and this has to say which one wins.
// The case that matters is the middle one: `?distId=` present-but-empty
// is NOT missing, so it deliberately does not get the default -- it goes
// to the endpoint as "" and comes back a 400, which is exactly the error
// state requirement #3 wants a way to trigger from the URL bar.
function normalizeDistId(raw: string | string[] | undefined): string {
  if (raw === undefined) return DEFAULT_DIST_ID;
  return Array.isArray(raw) ? (raw[0] ?? DEFAULT_DIST_ID) : raw;
}

// Same normalize-then-forward shape as normalizeDistId, for the other
// switch the endpoint already understands: ?simulateFailure=1 makes
// distributorService throw, which is how the empty state (#5) gets proven
// from the URL bar instead of by editing a mock. The rule below is the
// handler's own rule restated -- present, and not "0" or "false", means on
// -- because the page has to decide whether to send the param at all, so
// "absent" and "off" have to collapse to the same request. A bare
// `?simulateFailure` is present-but-empty and counts as on, matching the
// handler; that's the opposite of distId's present-but-empty case, and
// deliberately so: an empty id is a broken request, an empty flag is a
// flag.
function normalizeSimulateFailure(raw: string | string[] | undefined): boolean {
  const flag = Array.isArray(raw) ? raw[0] : raw;
  return flag !== undefined && flag !== "0" && flag !== "false";
}

async function getOverview(
  distId: string,
  simulateFailure: boolean,
): Promise<OverviewResponse> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  // Appended only when on. `simulateFailure=0` would work too -- the
  // handler reads it as off -- but omitting it keeps the normal-path
  // request byte-identical to what it was before this flag existed.
  const query = new URLSearchParams({ distId });
  if (simulateFailure) query.set("simulateFailure", "1");
  const res = await fetch(`${base}/api/profile-overview?${query}`, {
    cache: "no-store",
  });

  // Requirement #3, the error state's trigger. The endpoint answers a
  // missing distId with a 400 and a JSON body, so this resolves normally
  // -- fetch only rejects when the request never completed. Throwing is
  // what promotes "the server said no" into something error.tsx can
  // catch. Rendering the 400 body instead would leave the route sitting
  // in a fake ready state with an error-shaped payload inside it.
  if (res.status === 400) {
    const body: { error?: string } | null = await res.json().catch(() => null);
    throw new Error(body?.error ?? "distId is required");
  }

  // Anything else non-2xx is the endpoint being broken rather than the
  // caller being wrong, but it lands in the same boundary for the same
  // reason: there is no partial page worth rendering without this payload.
  if (!res.ok) {
    throw new Error(`profile-overview lookup failed (HTTP ${res.status})`);
  }

  return res.json() as Promise<OverviewResponse>;
}

// The async half. Everything that has to wait -- resolving searchParams,
// then the fan-out behind the endpoint -- happens in here, below a
// Suspense boundary, so the shell above it is still prerenderable under
// cacheComponents. Same rule the old Overview() was following:
// `cache: "no-store"` is an explicit opt-out of caching and has to sit
// inside a boundary, or the whole page fails to prerender instead of just
// this piece streaming in.
async function Overview({
  searchParams,
}: Pick<PageProps<"/profile-overview">, "searchParams">) {
  const params = await searchParams;
  const distId = normalizeDistId(params.distId);
  const data = await getOverview(
    distId,
    normalizeSimulateFailure(params.simulateFailure),
  );

  // Decorative only: the real PersonalDetailsOverview computes a percent
  // toward the next level from target volumes the simplified capstone
  // data model doesn't have. These bounds (baseline /100, boost /10) exist
  // only to make the bars read as bars, not as a real progression metric --
  // labeled here so nobody mistakes the fill width for the real thing.
  const baselinePercent = Math.min(100, data.baseline.data.baseline);
  const boostPercent = Math.min(100, (data.boost.data.boost / 10) * 100);
  const initials = data.distId.slice(0, 2);

  return (
    <>
      <div className={styles.identity}>
        <div className={styles.avatar}>{initials}</div>
        <div className={styles.identityMeta}>
          <p className={styles.name}>Distributor {data.distId}</p>
          <p className={styles.metaLine}>
            Rank:{" "}
            <strong>
              {data.distributor.error !== null
                ? "—"
                : (data.distributor.data.rank ?? "—")}
            </strong>
          </p>
        </div>
      </div>

      {/* READY STATE (#4). No conditional, because there is nothing these
          two can do except succeed -- see the OverviewResponse comment. */}
      <p className={styles.sectionTitle}>Current Compensation</p>
      <div className={styles.progressRow}>
        <div className={styles.progressLabel}>
          <span>Baseline</span>
          <span>{data.baseline.data.baseline}</span>
        </div>
        <div className={styles.progressTrack}>
          <div
            className={`${styles.progressFill} ${styles.progressFillBaseline}`}
            style={{ width: `${baselinePercent}%` }}
          />
        </div>
      </div>
      <div className={styles.progressRow}>
        <div className={styles.progressLabel}>
          <span>Boost</span>
          <span>{data.boost.data.boost}</span>
        </div>
        <div className={styles.progressTrack}>
          <div
            className={`${styles.progressFill} ${styles.progressFillBoost}`}
            style={{ width: `${boostPercent}%` }}
          />
        </div>
      </div>

      {/* EMPTY STATE (#5). The distributor slice is the one that can come
          back empty, because it's the one backed by a real service (PO3
          dev1). The endpoint degrades instead of 500ing, which means "no
          distributor data" arrives as a *successful* response with `error`
          set -- so it's this page's job to say so rather than render
          blanks. The message is worth showing because the two ways it
          fails ("couldn't log in" vs "couldn't read the distributor") are
          different problems with different fixes. */}
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Distributor record</p>
        {data.distributor.error !== null ? (
          <p className={styles.empty}>
            No information to show ({data.distributor.error})
          </p>
        ) : (
          <p className={styles.metaLine}>
            {/* rank/enrollDate are independently nullable even on a slice
                that succeeded -- a real distributor with no rank yet.
                That's a present-but-blank field, not the empty state
                above, so it keeps its label and gets a dash. */}
            Enrolled: <strong>{data.distributor.data.enrollDate ?? "—"}</strong>
          </p>
        )}
      </div>

      <p className={styles.lastUpdated}>Last updated: {data.fetchedAt}</p>
    </>
  );
}

// Its own boundary so the modal can pop in as soon as distId resolves,
// without waiting on the aggregation fetch -- the fan-out behind
// /api/profile-overview costs ~300ms plus a PO3 login on top of that. A
// shared boundary with Overview would make the modal sit behind data it
// never reads.
async function CelebrationSlot({
  searchParams,
}: Pick<PageProps<"/profile-overview">, "searchParams">) {
  const distId = normalizeDistId((await searchParams).distId);
  return <CelebrationModal distId={distId} />;
}

// Not async, and it never awaits searchParams itself. searchParams is a
// request-time API: reading it here would opt the entire page into
// dynamic rendering. Passing the promise down and awaiting it inside the
// boundaries below keeps the <h1> and both fallbacks in the static shell,
// with only the two resolved pieces streaming in at request time.
export default function ProfileOverviewPage({
  searchParams,
}: PageProps<"/profile-overview">) {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* LOADING STATE sits in two places on purpose: loading.tsx covers
            the whole route on a direct visit, before this shell exists;
            this inner fallback covers the data once the shell itself is
            static. */}
        <Suspense fallback={<p className={styles.metaLine}>loading…</p>}>
          <Overview searchParams={searchParams} />
        </Suspense>

      </div>

      <Suspense fallback={null}>
        <CelebrationSlot searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
