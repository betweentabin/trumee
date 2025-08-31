import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Webpack configuration
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    
    // Add path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': __dirname,
      '@/app': __dirname + '/app',
      '@/components': __dirname + '/components',
      '@/lib': __dirname + '/lib',
      '@/utils': __dirname + '/utils',
    };
    
    return config;
  },

  // Redirects configuration removed - using client-side routing instead

  // Skip validation during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
