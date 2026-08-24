import { z } from "zod";
import type { DocsConfig } from "@ticidocs/core";

const navPageRefSchema = z.object({
  title: z.string().optional(),
  path: z.string().min(1),
});

const navOpenApiSchema = z.object({
  group: z.string().min(1),
  openapi: z.string().min(1),
  basePath: z.string().optional(),
  icon: z.string().optional(),
});

/** MDX page, titled page ref, or nested OpenAPI group (same shape as top-level). */
const navPageEntrySchema = z.union([
  z.string().min(1),
  navPageRefSchema,
  navOpenApiSchema,
]);

const navGroupSchema = z.object({
  group: z.string().min(1),
  pages: z.array(navPageEntrySchema).min(1),
  icon: z.string().optional(),
});

const navExternalSchema = z.object({
  title: z.string().min(1),
  href: z.string().url(),
  external: z.literal(true).optional(),
});

const docsConfigSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().optional(),
    siteUrl: z.string().url(),
    locales: z.array(z.string().min(1)).min(1),
    defaultLocale: z.string().min(1),
    versions: z.array(z.string().min(1)).min(1).optional(),
    defaultVersion: z.string().min(1).optional(),
    logo: z
      .object({
        light: z.string().min(1),
        dark: z.string().min(1),
      })
      .optional(),
    navigation: z
      .array(z.union([navGroupSchema, navOpenApiSchema, navExternalSchema]))
      .min(1),
    theme: z
      .object({
        primaryColor: z.string().optional(),
        fonts: z
          .object({
            sans: z.string().min(1).optional(),
            display: z.string().min(1).optional(),
            mono: z.string().min(1).optional(),
            googleFontsUrl: z.string().url().optional(),
          })
          .optional(),
        layout: z
          .object({
            shellMaxWidth: z.string().min(1).optional(),
            maxContent: z.string().min(1).optional(),
            sidebarWidth: z.string().min(1).optional(),
            tocWidth: z.string().min(1).optional(),
            apiRailWidth: z.string().min(1).optional(),
          })
          .optional(),
      })
      .optional(),
    github: z
      .object({
        url: z.string().url(),
      })
      .optional(),
    api: z
      .object({
        allowedOrigins: z.array(z.string().url()).min(1),
      })
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.locales.includes(value.defaultLocale)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `defaultLocale "${value.defaultLocale}" must be included in locales`,
        path: ["defaultLocale"],
      });
    }
    if (value.defaultVersion && !value.versions?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `defaultVersion requires versions`,
        path: ["defaultVersion"],
      });
    }
    if (
      value.defaultVersion &&
      value.versions &&
      !value.versions.includes(value.defaultVersion)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `defaultVersion "${value.defaultVersion}" must be included in versions`,
        path: ["defaultVersion"],
      });
    }
  });

export type DefineConfigInput = z.input<typeof docsConfigSchema>;

export function defineConfig(config: DefineConfigInput): DocsConfig {
  const parsed = docsConfigSchema.safeParse(config);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid docs.config.ts\n${details}`);
  }
  return parsed.data;
}

export function validateDocsConfig(config: unknown): DocsConfig {
  return defineConfig(config as DefineConfigInput);
}

export { docsConfigSchema };
