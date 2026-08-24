import fs from "node:fs/promises";
import path from "node:path";
import type { ScaffoldOptions, ScaffoldResult, TemplateName } from "./types.js";

const PACKAGE_VERSION = "0.1.0";

export async function scaffold(
  options: ScaffoldOptions,
): Promise<ScaffoldResult> {
  const { packageRoot, targetDir, projectName, template, github, linkWorkspace } =
    options;

  await assertEmptyTarget(targetDir);

  const sharedDir = path.join(packageRoot, "templates", "shared");
  const overlayDir = path.join(packageRoot, "templates", template);

  await copyDir(sharedDir, targetDir);
  await copyDir(overlayDir, targetDir);

  const pkg = buildPackageJson(projectName, template, linkWorkspace);
  await fs.writeFile(
    path.join(targetDir, "package.json"),
    `${JSON.stringify(pkg, null, 2)}\n`,
    "utf8",
  );

  await writeDocsConfig(targetDir, projectName, template, github);
  await writeReadme(targetDir, projectName, template, linkWorkspace);

  return { projectName, template, targetDir };
}

async function assertEmptyTarget(targetDir: string): Promise<void> {
  try {
    const entries = await fs.readdir(targetDir);
    if (entries.length > 0) {
      throw new Error(`Target directory is not empty: ${targetDir}`);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      await fs.mkdir(targetDir, { recursive: true });
      return;
    }
    throw error;
  }
}

async function copyDir(from: string, to: string): Promise<void> {
  await fs.mkdir(to, { recursive: true });
  const entries = await fs.readdir(from, { withFileTypes: true });
  for (const entry of entries) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) {
      await copyDir(src, dest);
    } else {
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.copyFile(src, dest);
    }
  }
}

function dep(linkWorkspace: boolean): string {
  return linkWorkspace ? "workspace:*" : PACKAGE_VERSION;
}

function buildPackageJson(
  projectName: string,
  template: TemplateName,
  linkWorkspace: boolean,
) {
  const v = dep(linkWorkspace);
  return {
    name: projectName,
    version: "0.1.0",
    private: true,
    description: `Ticidocs site (${template})`,
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
      lint: "next lint",
      typecheck: "tsc -p tsconfig.json --noEmit",
    },
    dependencies: {
      "@ticidocs/config": v,
      "@ticidocs/core": v,
      "@ticidocs/mdx": v,
      "@ticidocs/openapi": v,
      "@ticidocs/search": v,
      "@ticidocs/theme": v,
      "@ticidocs/ui": v,
      "highlight.js": "^11.12.0",
      next: "15.2.4",
      "next-mdx-remote": "^5.0.0",
      react: "19.0.0",
      "react-dom": "19.0.0",
      "rehype-highlight": "^7.0.2",
      "rehype-slug": "^6.0.0",
      "remark-gfm": "^4.0.1",
    },
    devDependencies: {
      "@types/node": "^22.13.10",
      "@types/react": "^19.0.10",
      "@types/react-dom": "^19.0.4",
      eslint: "^9.22.0",
      "eslint-config-next": "15.2.4",
      typescript: "^5.8.2",
    },
  };
}

async function writeDocsConfig(
  targetDir: string,
  projectName: string,
  template: TemplateName,
  github: boolean,
): Promise<void> {
  const displayName = toTitle(projectName);
  const navigation =
    template === "basic"
      ? `  navigation: [
    {
      group: "Guides",
      pages: ["index", "getting-started"],
    },
  ],`
      : template === "api"
        ? `  navigation: [
    {
      group: "Guides",
      pages: ["index", "getting-started"],
    },
    {
      group: "API Reference",
      openapi: "./openapi/openapi.yaml",
      basePath: "api",
    },
  ],`
        : `  navigation: [
    {
      group: "Getting Started",
      pages: ["index", "getting-started", "authentication", "advanced"],
    },
    {
      group: "API Reference",
      openapi: "./openapi/openapi.yaml",
      basePath: "api",
    },
  ],`;

  const extras: string[] = [
    `  theme: {
    primaryColor: "#00C984",
  },`,
  ];

  if (github) {
    extras.push(`  github: {
    url: "https://github.com/your-org/${projectName}",
  },`);
  }

  if (template === "api" || template === "full") {
    extras.push(`  api: {
    allowedOrigins: ["https://api.example.com"],
  },`);
  }

  const source = `import { defineConfig } from "@ticidocs/config";

export default defineConfig({
  name: ${JSON.stringify(displayName)},
  description: "Documentation powered by Ticidocs",
  siteUrl: "https://example.com",
  locales: ["en", "tr"],
  defaultLocale: "en",
${navigation}
${extras.join("\n")}
});
`;

  await fs.writeFile(path.join(targetDir, "docs.config.ts"), source, "utf8");
}

async function writeReadme(
  targetDir: string,
  projectName: string,
  template: TemplateName,
  linkWorkspace: boolean,
): Promise<void> {
  const body = `# ${toTitle(projectName)}

Ticidocs site scaffolded with the **${template}** template.

## Scripts

\`\`\`bash
pnpm install
pnpm dev
\`\`\`

## Docker

\`\`\`bash
docker compose up --build -d
\`\`\`

Or: \`docker build -t ${projectName} .\` then \`docker run --rm -p 3000:3000 ${projectName}\`.

Uses Next.js \`standalone\` output when \`DOCKER_BUILD=1\` (set in the Dockerfile).

${
  linkWorkspace
    ? "This project uses `workspace:*` dependencies. Add it to the Ticidocs monorepo `pnpm-workspace.yaml` (or run from a checkout that already includes it). Docker images need resolvable `@ticidocs/*` packages (publish or mount the monorepo)."
    : "Install published `@ticidocs/*` packages from npm, or recreate with `--link` inside the Ticidocs monorepo."
}
`;

  await fs.writeFile(path.join(targetDir, "README.md"), body, "utf8");
}

function toTitle(name: string): string {
  return name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
