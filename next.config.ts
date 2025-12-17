import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: false, // Enable TypeScript checking for production
  },
  reactStrictMode: true, // Enable React Strict Mode
  serverExternalPackages: ['@prisma/client'],
  swcMinify: true, // Enable SWC minification
  compress: true, // Enable gzip compression
  poweredByHeader: false, // Remove powered by header
  experimental: {
    optimizeCss: true, // Enable CSS optimization
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'], // Optimize imports
  },
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }
    
    return config;
  },
  // Performance optimizations
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
  },
  // Build optimizations
  buildId: 'build', // Fixed build ID for better caching
  generateBuildId: async () => {
    return 'build'
  },
  // Disable expensive features in production
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
};

export default nextConfig;