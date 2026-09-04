export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);

  // /api/boom?ok=1 succeeds, /api/boom throws. Same handler, so the two show up
  // side by side in the logs with the same route name.
  if (url.searchParams.get("ok")) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return Response.json({
      status: "ok",
      region: process.env.VERCEL_REGION ?? "(not on vercel)",
      renderedAt: new Date().toISOString(),
    });
  }

  throw new Error("deliberate failure from /api/boom");
}
