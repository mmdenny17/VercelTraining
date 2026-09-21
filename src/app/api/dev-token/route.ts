// Fixture, not a build item. Mints a toy user token for a distId so you
// (and curl) have something real to test Stage D's own check against --
// the same role /api/login plays for PO3 in mock-services.ts. A real app
// would never have this route; it exists only because there's no real
// identity provider in this spike.

import { devSignToken } from "@/lib/user-token";

export async function GET(request: Request) {
  const distId = new URL(request.url).searchParams.get("distId")?.trim() ?? "";
  if (distId === "") {
    return Response.json({ error: "distId is required" }, { status: 400 });
  }
  return Response.json({ distId, token: devSignToken(distId) });
}
