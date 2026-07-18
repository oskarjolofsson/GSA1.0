import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained production build at .next/standalone (with a minimal
  // server.js) so the Docker runtime image ships without the full node_modules.
  output: "standalone",

  // Allow loading the dev server (including client JS / HMR) from the LAN IP,
  // not just localhost. Without this, Next 16 blocks cross-origin dev
  // resources, so React never hydrates and onClick handlers never attach.
  allowedDevOrigins: ["192.168.68.101"],
};

export default nextConfig;
