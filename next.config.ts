// Design Ref: §11 — Static export for Cloudflare Pages.
import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Plan SC: static-only output for Cloudflare Pages hosting.
  output: "export",
  // 외부 이미지(GitHub raw)를 그대로 사용 — Next 이미지 최적화 비활성화.
  images: { unoptimized: true },
  // trailing slash 통일 — Cloudflare Pages 정적 라우팅과 호환.
  trailingSlash: true,
  // 상위 디렉토리에 다른 lockfile이 있어도 본 프로젝트를 워크스페이스 루트로 고정.
  outputFileTracingRoot: path.resolve(__dirname),
};

export default nextConfig;
