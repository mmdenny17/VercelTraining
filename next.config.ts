import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for 'use cache' / cacheTag / cacheLife (M3.1) -- unstable_cache
  // is deprecated in this Next version. This is a project-wide switch to
  // the new Cache Components model, not a per-file opt-in: check the other
  // routes still behave after this lands.
  cacheComponents: true,

  async redirects() {
    return [
      { source: "/old-page", destination: "/env-check", permanent: false },
    ];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "x-spike-header", value: "set-in-next-config" }],
      },
    ];
  },

  // External rewrite. The browser asks OUR origin for /proxy/zen; the routing
  // layer then makes its own request to github.com and returns the body.
  async rewrites() {
    return [
      { source: "/proxy/zen", destination: "https://api.github.com/zen" },
      { source: "/backend/:path*", destination: `${process.env.BACKEND_BASE_URL}/:path*`,
},

      // ============================================================
      // BUILD ITEM M3.3 -- does anything in THIS app check the token?
      // ============================================================
      // You've now been told directly: no middleware exists here, and the
      // rewrite is a routing-layer relay that forwards headers unmodified,
      // Authorization included. Don't take that as given -- prove it.
      //
      // Add one more rewrite entry: source "/proxy/headers", destination
      // "https://httpbin.org/headers". httpbin's /headers endpoint echoes
      // back, as JSON, every header the request arrived with.
      //
      // Then test it (curl or the browser, your call):
      //   curl -H "Authorization: Bearer fake-token-123" https://<your-deploy>/proxy/headers
      //
      // PREDICT BEFORE YOU RUN IT:
      // 1. Does the Authorization header show up in httpbin's response at
      //    all? If your "middleware" model from chat were true, what would
      //    you expect instead (stripped? replaced? a 401 before it even
      //    reaches httpbin)?
      // 2. This rewrite target is a public internet host, same as
      //    /proxy/zen. Real PO3/RT in EKS are NOT public. What does that
      //    imply is different about this test vs. what actually happens
      //    when the real dashboard's rewrite fires -- what would have to
      //    exist for that request to even leave Vercel's network at all?
      //    (§13.3 has the answer; you've read it before.)
      //
      // YOUR TURN below this line.
      { source: "/proxy/headers", destination: "https://httpbin.org/headers" },
    ];
  },
};

export default nextConfig;
