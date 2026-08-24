import type { NextConfig } from "next";

const dockerBuild = process.env.DOCKER_BUILD === "1";

const nextConfig: NextConfig = {
  ...(dockerBuild ? { output: "standalone" as const } : {}),
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
