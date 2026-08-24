import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const appDir = path.dirname(fileURLToPath(import.meta.url));
const dockerBuild = process.env.DOCKER_BUILD === "1";

const nextConfig: NextConfig = {
  // Standalone is enabled in Docker (Linux). On Windows, symlink creation for
  // standalone tracing often fails without Developer Mode / elevated privileges.
  ...(dockerBuild
    ? {
        output: "standalone" as const,
        outputFileTracingRoot: path.join(appDir, "../.."),
      }
    : {}),
  // next-mdx-remote must be transpiled on Next 15.2+ or RSC pages 500 in `next dev`
  // https://github.com/vercel/next.js/issues/77216
  transpilePackages: [
    "next-mdx-remote",
    "@ticidocs/core",
    "@ticidocs/config",
    "@ticidocs/mdx",
    "@ticidocs/openapi",
    "@ticidocs/search",
    "@ticidocs/ui",
    "@ticidocs/theme",
  ],
};

export default nextConfig;
