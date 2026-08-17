import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["sharp"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "yce-us.s3-accelerate.amazonaws.com" },
      { protocol: "https", hostname: "plugins-media.makeupar.com" },
      { protocol: "https", hostname: "bcw-media.s3.ap-northeast-1.amazonaws.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
