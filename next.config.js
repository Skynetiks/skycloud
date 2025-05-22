/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  rewrites: async () => [
    {
      source: '/invite/:code',
      destination: '/auth/register?code=:code',
    },
  ],
  redirects: async () => [
    {
      source: '/r/:id',
      destination: '/raw/:id',
      permanent: true,
    },
  ],
  webpack: (config) => {
    config.resolve.fallback = { worker_threads: false };

    return config;
  },
};

module.exports = nextConfig;
