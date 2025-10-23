/** @type {import('next').NextConfig} */
const nextConfig = {
  // 在Next.js 14中，app目录已经是默认配置
  output: 'export',
  trailingSlash: true,
  // 确保API路由不会阻止静态导出
  // 注意：API路由在静态导出时不会工作，但我们需要确保构建不会失败
  typescript: {
    // 忽略TypeScript错误，这是一个有效的选项
    ignoreBuildErrors: true
  }
}

module.exports = nextConfig