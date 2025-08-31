import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Ensure static assets are served correctly
  trailingSlash: false,
  
  // Explicitly set the public directory
  assetPrefix: '',
  
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
