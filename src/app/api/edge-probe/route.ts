// Deliberately violates P3. This exists only so its log entry can be compared
// against /api/boom, which runs as a standard Node Function.
export const runtime = "edge";

export async function GET() {
  return Response.json({
    ranOn: "edge",
    // Node Functions have this. Ask yourself what it says here, and why.
    region: process.env.VERCEL_REGION ?? "(no region)",
    renderedAt: new Date().toISOString(),
  });
}
