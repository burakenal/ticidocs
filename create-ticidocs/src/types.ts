export type TemplateName = "basic" | "api" | "full";

export interface ScaffoldOptions {
  packageRoot: string;
  targetDir: string;
  projectName: string;
  template: TemplateName;
  github: boolean;
  linkWorkspace: boolean;
}

export interface ScaffoldResult {
  projectName: string;
  template: TemplateName;
  targetDir: string;
}

export interface PromptAnswers {
  projectName: string;
  template: TemplateName;
  github: boolean;
  useOpenApi: boolean;
  useExamples: boolean;
}
