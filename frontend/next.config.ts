import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
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
      '@/assets': path.resolve(__dirname, 'src/assets'),
    };
    
    return config;
  },

  // Skip validation during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
