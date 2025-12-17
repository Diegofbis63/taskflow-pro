import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  serverExternalPackages: ['@prisma/client'],
  allowedDevOrigins: [
    'preview-chat-74523966-f9ac-4b91-b9ad-e92fe4d3bc25.space.z.ai'
  ],
};

export default nextConfig;
