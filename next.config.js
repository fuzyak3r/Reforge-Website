/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Конфигурация для обслуживания статических файлов
  async rewrites() {
    return [
      {
        source: '/:path*',
        destination: '/:path*',
      },
    ];
  },
  // Включение статического экспорта, если у вас в основном статический сайт
  output: 'export',
  // Отключаем строгую проверку изображений для статических HTML
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig;