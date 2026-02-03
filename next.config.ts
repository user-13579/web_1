import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@payos/node', 'firebase-admin'],
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
    if (isServer) {
      config.externals = config.externals || [];
      // Externalize firebase-admin (and subpaths) and @payos/node so webpack doesn't try to resolve them
      config.externals.push((data: { request?: string }, callback: (err?: Error | null, result?: string) => void) => {
        const request = data.request;
        if (request === '@payos/node' || request?.startsWith('firebase-admin') === true) {
          return callback(null, 'commonjs ' + request);
        }
        callback();
      });
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
