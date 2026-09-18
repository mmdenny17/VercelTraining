// Mixed fixture/real. `baselineService` and `boostService` are still mocks
// standing in for backend services with different latencies -- your
// aggregation endpoint (BUILD ITEM M5.1b) fans out to these the same way
// PowerOf3's usePersonalDetailsOverviewData hook fans out to 5 real
// LTC-backed queries in the browser today.
//
// `distributorService` is no longer a mock: it logs in to PO3 dev1 and
// reads the real distributor record for a PV period. It still maps the
// response down to the shape the mock always returned
// ({ distId, rank, enrollDate }) so the aggregation endpoint's Slice<T>
// handling didn't have to change -- the seam is the point.
//
// It also still accepts a `simulateFailure` flag, which throws before any
// network call. That keeps the "degrade gracefully when one service
// fails" demo on demand, instead of depending on dev1 actually being down.

const PO3_BASE_URL = "https://dev1-po3.doterra.com";

function delay<T>(ms: number, value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function baselineService(distId: string) {
  return delay(120, { distId, baseline: 42 });
}

export async function boostService(distId: string) {
  return delay(300, { distId, boost: 7.5 });
}

// The slice of the real distributor payload we actually consume. Typed
// loosely on purpose -- this is an unvalidated response body, so nothing
// here is guaranteed to be present at runtime.
type DistributorResponse = {
  rank?: string | null;
  enrollmentDate?: string | null;
};

// What callers get back. Same keys the mock returned, so the aggregation
// endpoint and anything downstream of it is unchanged.
export type DistributorSummary = {
  distId: string;
  rank: string | null;
  enrollDate: string | null;
};

// PO3 dev1's login takes the distributor id and a market/language, and
// hands back a bearer token. Separate call, so it gets its own error
// message -- "couldn't log in" and "couldn't read the distributor" are
// different failures and the degraded-services list should say which.
async function login(distId: string): Promise<string> {
  const res = await fetch(`${PO3_BASE_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      distID: Number(distId),
      market: "US",
      language: "en",
    }),
    // Explicit opt-out. fetch caching is opt-in in this Next version, so
    // this is already the default -- but a cached auth token shared across
    // requests is the kind of thing you want ruled out in the source, not
    // inferred from a default that might change.
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`distributor login failed (${res.status})`);
  }

  const body: unknown = await res.json();
  const accessToken = (body as { accessToken?: unknown } | null)?.accessToken;

  if (typeof accessToken !== "string" || accessToken === "") {
    throw new Error("distributor login returned no accessToken");
  }

  return accessToken;
}

export async function distributorService(
  distId: string,
  pvPeriod: string,
  simulateFailure = false,
): Promise<DistributorSummary> {
  if (simulateFailure) {
    // Before the network, deliberately: the point of this flag is to
    // exercise the degraded path without a real outage.
    await delay(50, null);
    throw new Error("distributor service unavailable");
  }

  const accessToken = await login(distId);

  const res = await fetch(
    `${PO3_BASE_URL}/api/distributor/${encodeURIComponent(distId)}/pv-period/${encodeURIComponent(pvPeriod)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    throw new Error(`distributor lookup failed (${res.status})`);
  }

  const body = (await res.json()) as DistributorResponse | null;

  // The mapping that keeps the seam: PO3 calls it `enrollmentDate`, this
  // function's contract calls it `enrollDate`, and the rename stops here.
  return {
    distId,
    rank: body?.rank ?? null,
    enrollDate: body?.enrollmentDate ?? null,
  };
}
