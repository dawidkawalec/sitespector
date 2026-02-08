import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  assetPrefix: '/lp-assets',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
