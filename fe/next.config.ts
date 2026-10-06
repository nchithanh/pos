import path from "node:path";
import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";
/** Project Pages: /pos · Custom domain: để trống GITHUB_PAGES_BASE_PATH */
const basePath =
  isGithubPages && process.env.GITHUB_PAGES_BASE_PATH
    ? process.env.GITHUB_PAGES_BASE_PATH
    : "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isGithubPages
    ? {
        output: "export" as const,
        trailingSlash: true,
        basePath: basePath || undefined,
        assetPrefix: basePath || undefined,
      }
    : {}),
  turbopack: {
    root: path.join(__dirname),
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
