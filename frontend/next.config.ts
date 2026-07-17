import type { NextConfig } from "next";

// We require it because next-pwa doesn't export typings cleanly in some versions
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.naijanews360.com.ng',
        pathname: '/**',
      },
    ],
  },
};

export default withPWA(nextConfig);
