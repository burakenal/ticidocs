import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
