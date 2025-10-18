/** @type {import('next').NextConfig} */
const nextConfig = {
  // 在Next.js 14中，app目录已经是默认配置
  trailingSlash: true,
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : undefined,
  images: {
    domains: [],
    unoptimized: true
  }
}

module.exports = nextConfig