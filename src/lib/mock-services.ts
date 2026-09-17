// Fixture, not a build item. Stands in for 2-3 real backend services with
// different latencies -- your aggregation endpoint (BUILD ITEM M5.1b) fans
// out to these the same way PowerOf3's usePersonalDetailsOverviewData hook
// fans out to 5 real LTC-backed queries in the browser today.
//
// `distributorService` accepts a `simulateFailure` flag so the "degrade
// gracefully when one service fails" requirement can be exercised on
// demand, without needing a real outage.

function delay<T>(ms: number, value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function baselineService(distId: string) {
  return delay(120, { distId, baseline: 42 });
}

export async function boostService(distId: string) {
  return delay(300, { distId, boost: 7.5 });
}

export async function distributorService(distId: string, simulateFailure = false) {
  if (simulateFailure) {
    await delay(50, null);
    throw new Error("distributor service unavailable");
  }
  return delay(180, { distId, rank: "Silver", enrollDate: "2019-03-01" });
}
