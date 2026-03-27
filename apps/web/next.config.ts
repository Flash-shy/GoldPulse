import type { NextConfig } from "next";
import path from "node:path";

const isGithubPages = process.env.GITHUB_PAGES === "true";
const pagesBasePath = process.env.GITHUB_PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  transpilePackages: ["@goldpulse/shared"],
  ...(isGithubPages
    ? {
        output: "export" as const,
        ...(pagesBasePath
          ? { basePath: pagesBasePath, assetPrefix: `${pagesBasePath}/` }
          : {}),
        images: { unoptimized: true },
      }
    : {
        output: "standalone" as const,
        /** Monorepo root (when `next build` runs with cwd = apps/web). */
        outputFileTracingRoot: path.join(process.cwd(), "../.."),
      }),
};

export default nextConfig;
