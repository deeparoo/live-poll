import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Required for custom server (Socket.io)
  // Webpack won't bundle server-only modules
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
      };
    }
    return config;
  },
};

export default nextConfig;
