import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@payos/node'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: '**.firebasestorage.googleapis.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
  },
  // Enable compression
  compress: true,
  // Enable React strict mode for better performance
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Make optional email dependencies external to avoid build errors
    // These are only imported conditionally at runtime
    if (isServer) {
      config.externals = config.externals || [];
      // These are optional dependencies - only used if env vars are set
      // Making them external prevents webpack from trying to bundle them
      config.resolve.fallback = {
        ...config.resolve.fallback,
        nodemailer: false,
        '@sendgrid/mail': false,
      };
    }
    return config;
  },
};

export default nextConfig;
