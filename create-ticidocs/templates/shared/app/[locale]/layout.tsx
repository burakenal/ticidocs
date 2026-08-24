import { notFound } from "next/navigation";
import { getDocsConfig } from "../../lib/docs";
import { HtmlLang } from "../html-lang";

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const config = getDocsConfig();
  if (!config.locales.includes(locale)) {
    notFound();
  }

  return (
    <>
      <HtmlLang locale={locale} />
      {children}
    </>
  );
}
