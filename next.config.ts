import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '10.198.197.74:3000']
    },
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 768, 1024, 1280, 1536],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://127.0.0.1:8000/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
