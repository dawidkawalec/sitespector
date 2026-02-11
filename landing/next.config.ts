import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  assetPrefix: '/lp-assets',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
