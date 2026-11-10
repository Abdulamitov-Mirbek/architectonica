import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: { qualities: [75, 90] },
  async redirects() {
    return [{ source: '/', destination: '/ru', permanent: false }];
  },
};

export default nextConfig;
