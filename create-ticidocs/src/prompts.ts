import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import type { PromptAnswers, TemplateName } from "./types.js";

export async function promptOptions(seed: {
  projectName?: string;
  template?: TemplateName;
  github?: boolean;
}): Promise<PromptAnswers> {
  const rl = readline.createInterface({ input, output });

  try {
    const projectName =
      seed.projectName ??
      ((await ask(rl, "Project name?", "my-docs")).trim() || "my-docs");

    const useOpenApi =
      seed.template === "api" ||
      seed.template === "full" ||
      (await askYesNo(rl, "Use OpenAPI?", false));

    const useExamples = await askYesNo(rl, "Use example documentation?", true);

    const github =
      seed.github === true || (await askYesNo(rl, "Use GitHub link?", false));

    let template: TemplateName = seed.template ?? "basic";
    if (!seed.template) {
      if (useOpenApi && useExamples) template = "full";
      else if (useOpenApi) template = "api";
      else template = "basic";
    }

    return { projectName, template, github, useOpenApi, useExamples };
  } finally {
    rl.close();
  }
}

async function ask(
  rl: readline.Interface,
  question: string,
  fallback: string,
): Promise<string> {
  const answer = await rl.question(`${question} (${fallback}) `);
  return answer.trim() || fallback;
}

async function askYesNo(
  rl: readline.Interface,
  question: string,
  fallback: boolean,
): Promise<boolean> {
  const hint = fallback ? "Y/n" : "y/N";
  const answer = (await rl.question(`${question} (${hint}) `)).trim().toLowerCase();
  if (!answer) return fallback;
  return answer === "y" || answer === "yes";
}
