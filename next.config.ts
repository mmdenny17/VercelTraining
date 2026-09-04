import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

      // YOUR TURN. Forward everything under /backend/* to the host in
      // BACKEND_BASE_URL, preserving the rest of the path:
      //   /backend/users/octocat  ->  <BACKEND_BASE_URL>/users/octocat
      // Set BACKEND_BASE_URL to https://api.github.com so it's testable.
      // Path capture goes on BOTH sides.
    ];
  },
};

export default nextConfig;
