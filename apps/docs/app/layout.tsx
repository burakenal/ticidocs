import type { Metadata } from "next";
import "@ticidocs/theme/styles.css";
import "highlight.js/styles/github-dark.min.css";
import { THEME_STORAGE_KEY, primaryColorCss } from "@ticidocs/theme";
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
  primaryColor != null ? primaryColorCss(primaryColor) : null;

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
