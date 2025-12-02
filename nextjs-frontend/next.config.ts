import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "1337",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: process.env.NEXT_PUBLIC_STRAPI_URL || "",
        port: "",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
