import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "./args.js";
import { promptOptions } from "./prompts.js";
import { scaffold } from "./scaffold.js";
import type { TemplateName } from "./types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const packageRoot = path.join(__dirname, "..");

export async function run(argv: string[]): Promise<void> {
  const parsed = parseArgs(argv);

  if (parsed.help) {
    printHelp();
    return;
  }

  const interactive = !parsed.yes && process.stdin.isTTY && !parsed.template;
  const answers = interactive
    ? await promptOptions({
        projectName: parsed.projectName,
        template: parsed.template,
        github: parsed.github,
      })
    : {
        projectName: parsed.projectName ?? "my-docs",
        template: (parsed.template ?? "basic") as TemplateName,
        github: parsed.github,
        useOpenApi: parsed.template === "api" || parsed.template === "full",
        useExamples: true,
      };

  const targetDir = path.resolve(process.cwd(), answers.projectName);
  const projectName = sanitizeProjectName(path.basename(targetDir));
  const result = await scaffold({
    packageRoot,
    targetDir,
    projectName,
    template: answers.template,
    github: answers.github,
    linkWorkspace: parsed.link,
  });

  console.log(`\nCreated ${result.projectName} (${result.template}) at ${result.targetDir}\n`);
  console.log("Next steps:");
  console.log(`  cd ${path.relative(process.cwd(), targetDir) || "."}`);
  if (parsed.link) {
    console.log("  # Ensure this folder is listed in the Ticidocs pnpm-workspace");
    console.log("  pnpm install");
  } else {
    console.log("  pnpm install   # requires published @ticidocs/* packages");
  }
  console.log("  pnpm dev");
  console.log("");
}

function sanitizeProjectName(name: string): string {
  const cleaned = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || "my-docs";
}

function printHelp(): void {
  console.log(`Usage: create-ticidocs [name] [options]

Options:
  --template <basic|api|full>   Template (default: basic)
  --github                      Add a GitHub URL placeholder to docs.config.ts
  --link                        Use workspace:* deps (monorepo / local packages)
  --yes, -y                     Non-interactive (use defaults / flags)
  --help, -h                    Show help

Examples:
  npx create-ticidocs my-docs
  npx create-ticidocs my-api --template=api --yes
  pnpm --filter create-ticidocs start my-docs --template=full --link --yes
`);
}
