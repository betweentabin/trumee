/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'trumeee.vercel.app', 'trumee-production.up.railway.app'],
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },
  // Ensure static files are served correctly
  async rewrites() {
    return [
      {
        source: '/logo/:path*',
        destination: '/logo/:path*',
      },
      {
        source: '/images/:path*', 
        destination: '/images/:path*',
      },
    ];
  },
};

export default nextConfig;