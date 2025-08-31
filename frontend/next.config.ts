import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Image optimization settings
  images: {
    domains: [],
    unoptimized: false,
    loader: 'default',
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Webpack configuration
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    
    // Handle images with webpack
    config.module.rules.push({
      test: /\.(png|jpg|jpeg|gif)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/images/[name].[hash][ext]'
      }
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

  // Output configuration for static export if needed
  output: 'standalone',

  // Skip validation during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
