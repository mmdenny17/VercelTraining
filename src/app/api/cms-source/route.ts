// Fixture, not a build item. This is your "CMS admin" -- POST to it to
// simulate publishing new nav content. It always reads/writes the live
// value directly, uncached, so it's a source of truth for what SHOULD be
// showing once revalidation has actually run.

import { connection } from "next/server";
import { getContent, setContent } from "@/lib/cms-source";

export async function GET() {
  await connection();
  return Response.json(getContent());
}

export async function POST(request: Request) {
  const body = await request.json();
  if (typeof body.label !== "string") {
    return Response.json({ error: "expected { label: string }" }, { status: 400 });
  }
  return Response.json(setContent(body.label));
}
