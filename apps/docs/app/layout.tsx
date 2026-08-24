import type { Metadata } from "next";
import "@ticidocs/theme/styles.css";
import "highlight.js/styles/github-dark.min.css";
import { THEME_STORAGE_KEY } from "@ticidocs/theme";
import { getDocsConfig } from "../lib/docs";

const config = getDocsConfig();
const primaryColor = config.theme?.primaryColor;

export const metadata: Metadata = {
  metadataBase: new URL(config.siteUrl),
  title: {
    default: config.name,
    template: `%s · ${config.name}`,
  },
  description: config.description,
  icons: {
    icon: "/favicon.svg",
  },
};

const themeBootScript = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var m=localStorage.getItem(k);if(m==="light"||m==="dark"){document.documentElement.setAttribute("data-theme",m);} }catch(e){}})();`;

const primaryOverride =
  primaryColor != null
    ? `:root{--docs-primary:${primaryColor};--docs-primary-strong:color-mix(in srgb,${primaryColor} 82%,#000);--docs-brand-from:${primaryColor};}html[data-theme="dark"]{--docs-primary:color-mix(in srgb,${primaryColor} 55%,#00d2ff);--docs-primary-strong:color-mix(in srgb,${primaryColor} 35%,#fff);}@media (prefers-color-scheme:dark){html:not([data-theme="light"]){--docs-primary:color-mix(in srgb,${primaryColor} 55%,#00d2ff);--docs-primary-strong:color-mix(in srgb,${primaryColor} 35%,#fff);}}`
    : null;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={config.defaultLocale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        {primaryOverride ? (
          <style dangerouslySetInnerHTML={{ __html: primaryOverride }} />
        ) : null}
      </head>
      <body>{children}</body>
    </html>
  );
}
