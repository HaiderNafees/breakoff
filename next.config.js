/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  experimental: {
    workerThreads: false,
  },
  eslint: {
    dirs: [],
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
