import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // Disable strict mode to prevent double renders in development
  poweredByHeader: false, // Remove X-Powered-By header
  
  // Optimize page loading
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ['error', 'warn'],
    } : false,
  },
};

export default nextConfig;
