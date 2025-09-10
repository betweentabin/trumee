// Converted to JS to avoid TS transpilation issues on Vercel
const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization settings
  images: {
    domains: ['localhost', 'trumeee.vercel.app', 'trumee-production.up.railway.app'],
    unoptimized: true, // Vercel compatibility; we use plain <img> too
    loader: 'default',
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [{ key: 'X-Frame-Options', value: 'DENY' }],
      },
    ];
  },

  // Webpack configuration
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    
    // Add path aliases using path.resolve for better reliability
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
      '@/assets': path.resolve(__dirname, 'public'),
      '@/images': path.resolve(__dirname, 'public/images'),
      '@/logo': path.resolve(__dirname, 'public/logo'),
    };
    
    return config;
  },

  // Use Vercel defaults; avoid standalone on Vercel
  // output: 'standalone',

  // Asset prefix for Vercel deployment
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  basePath: '',

  // Skip validation during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // No custom rewrites; serve public assets and app routes directly
  async rewrites() { return []; },
};

module.exports = nextConfig;
