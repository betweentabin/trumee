import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Webpack configuration
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },

  // Redirects configuration
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ]
  },

  // Environment variables validation
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
  },

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', 'react-icons'],
  },

  // Trailing slash configuration
  trailingSlash: false,

  // Skip validation during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
