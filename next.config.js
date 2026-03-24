/** @type {import('next').NextConfig} */
const nextConfig = {
  // 移除 output: 'export'，启用 SSR 模式以支持 API 路由
  distDir: '.next',
  // 注意：trailingSlash 会影响 API 路由，Vercel 部署时建议关闭
  // 页面级 trailing slash 可以通过 rewrite 规则处理
  trailingSlash: false,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
