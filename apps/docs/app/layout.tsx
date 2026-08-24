import type { Metadata } from "next";
import "@ticidocs/theme/styles.css";
import "highlight.js/styles/github-dark.min.css";
import { THEME_STORAGE_KEY, themeOverrideCss } from "@ticidocs/theme";
import { getDocsConfig } from "../lib/docs";

const config = getDocsConfig();
const themeOverride = themeOverrideCss(config.theme);

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={config.defaultLocale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        {themeOverride ? (
          <style dangerouslySetInnerHTML={{ __html: themeOverride }} />
        ) : null}
      </head>
      <body>{children}</body>
    </html>
  );
}
