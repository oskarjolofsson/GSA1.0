import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow loading the dev server (including client JS / HMR) from the LAN IP,
  // not just localhost. Without this, Next 16 blocks cross-origin dev
  // resources, so React never hydrates and onClick handlers never attach.
  allowedDevOrigins: ["192.168.68.101"],
};

export default nextConfig;
