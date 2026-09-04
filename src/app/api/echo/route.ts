export const dynamic = "force-dynamic";

function describe(request: Request) {
  return Response.json({
    method: request.method,
    // The whole point: is this header here or not?
    origin: request.headers.get("origin") ?? "(no origin header sent)",
    host: request.headers.get("host"),
    referer: request.headers.get("referer") ?? "(none)",
  });
}

export async function GET(request: Request) {
  return describe(request);
}

export async function POST(request: Request) {
  return describe(request);
}
