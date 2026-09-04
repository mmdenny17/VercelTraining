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
    ];
  },
};

export default nextConfig;
