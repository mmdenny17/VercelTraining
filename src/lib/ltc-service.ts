// Fixture, not a build item. Stands in for a direct leader-tools-core-api
// (LTC) call. No real client, no real credentials -- LTC has no public
// non-prod host this project could reach anyway (that's the actual reason
// Stage D is gated on LCC-3045 for the real dashboard). The only thing
// worth simulating here is the shape of the call and the fact that it
// authenticates the CALLER (client-credentials), not the end user -- which
// is exactly why Stage D's Route Handler has its own job to do.

function delay<T>(ms: number, value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function ltcLookup(distId: string) {
  return delay(150, {
    distId,
    // Deliberately different fields than mock-services.ts's distributorService
    // -- LTC is the source of truth PO3/RT themselves call, not a duplicate
    // of what they already return.
    activeStatus: "A",
    volumeCode: "PV",
  });
}
