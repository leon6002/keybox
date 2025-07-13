import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 移除静态导出配置以支持动态路由
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
