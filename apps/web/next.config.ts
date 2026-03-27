import type { NextConfig } from "next";
import path from "node:path";

const isGithubPages = process.env.GITHUB_PAGES === "true";

/** GitHub project site: `user.github.io/<repo>/` needs basePath `/<repo>`. Custom domain root is served at `/` — CI sets env `GITHUB_PAGES_BASE_PATH` empty when repo Variable `PAGES_BASE_PATH` is `root`. */
function resolveGithubPagesBasePath(): string {
  if (!isGithubPages) return "";
  const raw = process.env.GITHUB_PAGES_BASE_PATH;
  if (raw === "" || raw === "root") return "";
  if (raw) return raw.startsWith("/") ? raw : `/${raw}`;
  return "/GoldPulse";
}

const pagesBasePath = resolveGithubPagesBasePath();

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
