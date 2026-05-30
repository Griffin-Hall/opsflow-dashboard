import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  devIndicators: false,
  ...(isGithubPages
    ? {
        assetPrefix: `${basePath}/`,
        basePath,
        images: {
          unoptimized: true,
        },
        output: "export" as const,
        trailingSlash: true,
      }
    : {}),
  serverExternalPackages: ["read-excel-file", "unzipper"],
};

export default nextConfig;
