/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Отключаем строгий режим маршрутизации,
  // чтобы статические файлы обрабатывались корректно
  trailingSlash: false,
  // Настраиваем обработку статических файлов
  async rewrites() {
    return [
      // Сначала проверяем API маршруты
      {
        source: '/api/:path*',
        destination: '/api/:path*'
      },
      // Затем все остальные пути обрабатываем как статические файлы
      {
        source: '/:path*',
        destination: '/:path*'
      }
    ];
  }
}

module.exports = nextConfig;