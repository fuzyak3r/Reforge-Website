/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/auth/steam',
        destination: '/api/auth/login'
      },
    ];
  },
  // Настройка сервисных воркеров
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Игнорируем модули сервера в клиентском коде
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
}

module.exports = nextConfig;