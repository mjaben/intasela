import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.156:3002', '192.168.1.156'],
  experimental: {
    serverActions: {
      allowedOrigins: ['192.168.1.156:3002', '192.168.1.156']
    }
  },
  devIndicators: {
    position: 'bottom-right',
  }
};

export default nextConfig;
