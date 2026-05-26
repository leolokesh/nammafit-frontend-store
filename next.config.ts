import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow images from any hostname for the product catalog
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  allowedDevOrigins: ["10.27.40.92:3000", "10.27.40.92"],
};

export default nextConfig;
