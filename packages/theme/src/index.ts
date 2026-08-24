import type { DocsThemeConfig, DocsThemeFonts, DocsThemeLayout } from "@ticidocs/core";

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

const FALLBACK_SANS =
  'ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif';
const FALLBACK_DISPLAY = "ui-sans-serif,system-ui,sans-serif";
const FALLBACK_MONO =
  'ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace';

function quoteFontFamily(name: string): string {
  const trimmed = name.trim().replace(/["']/g, "");
  if (!trimmed) {
    return trimmed;
  }
  return /\s/.test(trimmed) ? `"${trimmed}"` : trimmed;
}

function googleFontsFamilyParam(family: string): string {
  return family.trim().replace(/\s+/g, "+");
}

/**
 * Build a Google Fonts CSS2 URL for the given family names.
 */
export function buildGoogleFontsUrl(families: string[]): string | null {
  const unique = [...new Set(families.map((f) => f.trim()).filter(Boolean))];
  if (unique.length === 0) {
    return null;
  }
  const params = unique
    .map(
      (family) =>
        `family=${googleFontsFamilyParam(family)}:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500`,
    )
    .join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

/**
 * Font CSS variable overrides (+ optional @import) for `theme.fonts`.
 */
export function fontsCss(fonts: DocsThemeFonts): string {
  const sans = fonts.sans?.trim();
  const display = fonts.display?.trim() || sans;
  const mono = fonts.mono?.trim();

  const familiesForImport = [sans, display, mono].filter(
    (name): name is string => Boolean(name),
  );
  const importUrl =
    fonts.googleFontsUrl?.trim() ||
    (familiesForImport.length > 0
      ? buildGoogleFontsUrl(familiesForImport)
      : null);

  const parts: string[] = [];
  if (importUrl) {
    parts.push(`@import url("${importUrl}");`);
  }

  const vars: string[] = [];
  if (sans) {
    vars.push(`--docs-font-sans:${quoteFontFamily(sans)},${FALLBACK_SANS};`);
  }
  if (display) {
    vars.push(
      `--docs-font-display:${quoteFontFamily(display)},${FALLBACK_DISPLAY};`,
    );
  }
  if (mono) {
    vars.push(`--docs-font-mono:${quoteFontFamily(mono)},${FALLBACK_MONO};`);
  }

  if (vars.length > 0) {
    parts.push(`:root{${vars.join("")}}`);
  }

  return parts.join("");
}

/**
 * Layout width token overrides for `theme.layout`.
 */
export function layoutCss(layout: DocsThemeLayout): string {
  const vars: string[] = [];
  if (layout.shellMaxWidth) {
    vars.push(`--docs-shell-max-width:${layout.shellMaxWidth.trim()};`);
  }
  if (layout.maxContent) {
    vars.push(`--docs-max-content:${layout.maxContent.trim()};`);
  }
  if (layout.sidebarWidth) {
    vars.push(`--docs-sidebar-width:${layout.sidebarWidth.trim()};`);
  }
  if (layout.tocWidth) {
    vars.push(`--docs-toc-width:${layout.tocWidth.trim()};`);
  }
  if (layout.apiRailWidth) {
    vars.push(`--docs-api-rail-width:${layout.apiRailWidth.trim()};`);
  }
  if (vars.length === 0) {
    return "";
  }
  return `:root{${vars.join("")}}`;
}

/**
 * Combined theme override CSS for root layout injection.
 */
export function themeOverrideCss(theme?: DocsThemeConfig): string | null {
  if (!theme) {
    return null;
  }
  const parts: string[] = [];
  if (theme.primaryColor) {
    parts.push(primaryColorCss(theme.primaryColor));
  }
  if (theme.fonts) {
    const css = fontsCss(theme.fonts);
    if (css) {
      parts.push(css);
    }
  }
  if (theme.layout) {
    const css = layoutCss(theme.layout);
    if (css) {
      parts.push(css);
    }
  }
  return parts.length > 0 ? parts.join("") : null;
}
