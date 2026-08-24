import type { TemplateName } from "./types.js";

export interface ParsedArgs {
  projectName?: string;
  template?: TemplateName;
  github: boolean;
  link: boolean;
  yes: boolean;
  help: boolean;
}

const TEMPLATES = new Set<TemplateName>(["basic", "api", "full"]);

export function parseArgs(argv: string[]): ParsedArgs {
  const result: ParsedArgs = {
    github: false,
    link: false,
    yes: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg) continue;

    if (arg === "--help" || arg === "-h") {
      result.help = true;
      continue;
    }
    if (arg === "--yes" || arg === "-y") {
      result.yes = true;
      continue;
    }
    if (arg === "--github") {
      result.github = true;
      continue;
    }
    if (arg === "--link") {
      result.link = true;
      continue;
    }
    if (arg === "--template" || arg.startsWith("--template=")) {
      const value =
        arg === "--template" ? argv[++i] : arg.slice("--template=".length);
      if (!value || !TEMPLATES.has(value as TemplateName)) {
        throw new Error(`Invalid template "${value}". Use basic, api, or full.`);
      }
      result.template = value as TemplateName;
      continue;
    }
    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }
    if (!result.projectName) {
      result.projectName = arg;
      continue;
    }
    throw new Error(`Unexpected argument: ${arg}`);
  }

  return result;
}
