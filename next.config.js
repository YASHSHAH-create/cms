/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true
  },
  serverExternalPackages: ['bcryptjs', 'mongoose', 'mongodb'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('bcryptjs');
    }
    return config;
  }
};

module.exports = nextConfig;
