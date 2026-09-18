// ============================================================
// BUILD ITEM M5.1b -- Stage A, the aggregation endpoint
// ============================================================
// Stage A part 2: fan out to the mocked services in "@/lib/mock-services"
// (see PowerOf3's usePersonalDetailsOverviewData.ts for the shape this is
// standing in for -- that hook does this exact fan-out, in the browser;
// yours does it here, server-side, in one endpoint you own).
//
// GET /api/profile-overview?distId=<id>[&simulateFailure=1]
//
// Requirements:
//   1. Call baselineService, boostService, and distributorService
//      concurrently (not one after another -- be ready to say why in
//      chat before you write the code).
//   2. Merge results into one object.
//   3. Degrade gracefully: if distributorService rejects, the response
//      should still include baseline + boost, plus something that tells
//      the caller distributor data is missing (not a 500 for the whole
//      request).
//   4. Pass ?simulateFailure=1 through to distributorService so #3 can be
//      tested on demand.
//
// YOUR TURN below this line.

import type { NextRequest } from "next/server";
import {
  baselineService,
  boostService,
  distributorService,
} from "@/lib/mock-services";

// Why concurrent and not sequential: the three services don't depend on
// each other, and their latencies are 120/300/180ms. Awaited one after
// another that's ~600ms of wall clock the caller pays for nothing;
// started together it's ~300ms -- the slowest one, not the sum. This is
// the same win the PowerOf3 hook gets for free from React Query firing 5
// independent queries at once, except here we have to ask for it
// explicitly: `await` on consecutive lines is sequential by definition.
//
// Why allSettled and not all: `Promise.all` rejects as soon as any one
// input rejects, which would turn a single dead downstream into a 500 for
// the whole request -- exactly what requirement #3 forbids. allSettled
// waits for every outcome and hands back per-service verdicts, so a
// failure stays scoped to its own slice of the payload.

// Each service's slice of the response. `data` is null exactly when
// `error` is set, so a caller can branch on either one.
type Slice<T> = { data: T; error: null } | { data: null; error: string };

function toSlice<T>(result: PromiseSettledResult<T>): Slice<T> {
  if (result.status === "fulfilled") {
    return { data: result.value, error: null };
  }
  // Don't hand the caller whatever the downstream threw -- Error instances
  // contribute their message, anything else gets a fixed string. A real
  // service would log the raw reason here and return only this form.
  const reason: unknown = result.reason;
  return {
    data: null,
    error: reason instanceof Error ? reason.message : "service unavailable",
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const distId = searchParams.get("distId")?.trim() ?? "";
  // "1", "true", or a bare "?simulateFailure" all mean on; absent means off.
  const flag = searchParams.get("simulateFailure");
  const simulateFailure = flag !== null && flag !== "0" && flag !== "false";

  // A missing distId is the caller's bug, not a downstream outage, so it
  // gets a 400 up front instead of three fan-out calls with an empty key.
  // Same rule the repository seam (M5.1a) enforces, for the same reason.
  if (distId === "") {
    return Response.json({ error: "distId is required" }, { status: 400 });
  }

  const [baseline, boost, distributor] = await Promise.allSettled([
    baselineService(distId),
    boostService(distId),
    distributorService(distId, simulateFailure),
  ]);

  const slices = {
    baseline: toSlice(baseline),
    boost: toSlice(boost),
    distributor: toSlice(distributor),
  };

  // The "something that tells the caller distributor data is missing" from
  // requirement #3. A flag plus the names means a consumer can render the
  // partial view and a targeted "couldn't load rank" notice without having
  // to inspect every slice. Degradation is handled uniformly across all
  // three rather than special-casing distributor: allSettled gives us that
  // for free, and a caller that can cope with a missing rank can cope with
  // a missing boost.
  const degradedServices = (
    Object.keys(slices) as Array<keyof typeof slices>
  ).filter((name) => slices[name].error !== null);

  // 200, not 500: every service that could answer did, and the envelope
  // says plainly which ones didn't. A 5xx would tell the caller (or a
  // retry layer, or Vercel's error rate) the whole request failed, which
  // is false -- the caller got two thirds of what it asked for.
  return Response.json({
    distId,
    ...slices,
    degraded: degradedServices.length > 0,
    degradedServices,
    fetchedAt: new Date().toISOString(),
  });
}

// Deliberately uncached: reading request.nextUrl makes this handler
// dynamic anyway, and Route Handlers are uncached by default in Next 16.
// That's the right default for now -- M5.1c (the write path) is meant to
// revalidate "whatever this read path caches", and there is nothing to
// revalidate until we decide this data earns a `use cache` + cacheTag.
