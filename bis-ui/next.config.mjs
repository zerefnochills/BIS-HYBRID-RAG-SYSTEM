import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const apiBaseUrl = process.env.BIS_API_BASE_URL || 'http://localhost:8000';
const root = fileURLToPath(new URL('.', import.meta.url));

const nextConfig = {
  turbopack: {
    root,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiBaseUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
