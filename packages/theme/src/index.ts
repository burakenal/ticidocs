export type ThemeMode = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "ticidocs-theme";

export function resolveTheme(
  mode: ThemeMode,
  prefersDark: boolean,
): "light" | "dark" {
  if (mode === "system") {
    return prefersDark ? "dark" : "light";
  }
  return mode;
}

/**
 * CSS variable overrides for `theme.primaryColor` in docs.config.ts.
 * Inject into <style> in the root layout.
 */
export function primaryColorCss(primaryColor: string): string {
  const c = primaryColor.trim();
  return [
    `:root{`,
    `--docs-primary:${c};`,
    `--docs-primary-strong:color-mix(in srgb,${c} 82%,#0f172a);`,
    `--docs-primary-foreground:#fff;`,
    `--docs-brand-from:${c};`,
    `--docs-brand-to:color-mix(in srgb,${c} 65%,#fff);`,
    `--docs-active:color-mix(in srgb,${c} 10%,#fff);`,
    `}`,
    `html[data-theme="dark"]{`,
    `--docs-primary:color-mix(in srgb,${c} 72%,#fff);`,
    `--docs-primary-strong:color-mix(in srgb,${c} 40%,#fff);`,
    `--docs-primary-foreground:#0b1220;`,
    `--docs-active:color-mix(in srgb,${c} 18%,#111827);`,
    `}`,
    `@media (prefers-color-scheme:dark){`,
    `html:not([data-theme="light"]){`,
    `--docs-primary:color-mix(in srgb,${c} 72%,#fff);`,
    `--docs-primary-strong:color-mix(in srgb,${c} 40%,#fff);`,
    `--docs-primary-foreground:#0b1220;`,
    `--docs-active:color-mix(in srgb,${c} 18%,#111827);`,
    `}}`,
  ].join("");
}
