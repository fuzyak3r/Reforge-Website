/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/auth/steam',
        destination: '/api/auth/login'
      },
      {
        source: '/api/auth/steam/return',
        destination: '/api/auth/steam/return'
      }
    ];
  },
  // Конфигурация для статических файлов
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig;