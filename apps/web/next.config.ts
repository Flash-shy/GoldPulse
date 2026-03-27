import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  /** Monorepo root (when `next build` runs with cwd = apps/web). */
  outputFileTracingRoot: path.join(process.cwd(), "../.."),
  transpilePackages: ["@goldpulse/shared"],
};

export default nextConfig;
