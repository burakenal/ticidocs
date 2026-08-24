import { z } from "zod";
import type { DocsConfig } from "@ticidocs/core";

const localizedStringSchema = z.union([
  z.string().min(1),
  z.record(z.string().min(1), z.string().min(1)),
]);

const navPageRefSchema = z.object({
  title: z.string().optional(),
  path: z.string().min(1),
});

const navOpenApiSchema = z.object({
  group: localizedStringSchema,
  openapi: z.string().min(1),
  basePath: z.string().optional(),
  icon: z.string().optional(),
  tagLabels: z.record(z.string().min(1), localizedStringSchema).optional(),
});

/** MDX page, titled page ref, or nested OpenAPI group (same shape as top-level). */
const navPageEntrySchema = z.union([
  z.string().min(1),
  navPageRefSchema,
  navOpenApiSchema,
]);

const navGroupSchema = z.object({
  group: localizedStringSchema,
  pages: z.array(navPageEntrySchema).min(1),
  icon: z.string().optional(),
});

const navExternalSchema = z.object({
  title: localizedStringSchema,
  href: z.string().url(),
  external: z.literal(true).optional(),
});

const footerLinkSchema = z.object({
  label: localizedStringSchema,
  href: z.string().min(1),
  external: z.boolean().optional(),
});

const footerNavGroupSchema = z.object({
  title: localizedStringSchema,
  links: z.array(footerLinkSchema).min(1),
});

const footerSocialSchema = z.object({
  label: z.string().min(1),
  href: z.string().url(),
});

const footerSchema = z.object({
  description: localizedStringSchema.optional(),
  navGroups: z.array(footerNavGroupSchema).optional(),
  copyright: localizedStringSchema.optional(),
  socials: z.array(footerSocialSchema).optional(),
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
    footer: footerSchema.optional(),
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
