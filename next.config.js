/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep server-only packages out of the client bundle.
  experimental: {
    serverComponentsExternalPackages: ['@neondatabase/serverless'],
  },
};

module.exports = nextConfig;
