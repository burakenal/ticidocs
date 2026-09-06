"use client";

import { isValidElement, useMemo, type ReactNode } from "react";
import {
  generateHttpSamples,
  type CodeSampleLanguage,
} from "@ticidocs/openapi/codegen";
import { CodeBlock } from "./code-block";
import { usePreferredCodeLanguage } from "./code-language";
import { CopyIconButton, LanguageMenu } from "./code-sample-card";
import styles from "./request-sample.module.css";

const DEFAULT_LANGUAGES: CodeSampleLanguage[] = [
  "curl",
  "javascript",
  "typescript",
  "python",
  "csharp",
];

export function RequestSample({
  method,
  url,
  headers,
  body,
  title,
  languages = DEFAULT_LANGUAGES,
  children,
}: {
  method?: string;
  url: string;
  headers?: Record<string, string>;
  body?: string | Record<string, unknown> | unknown[] | number | boolean | null;
  title?: string;
  languages?: CodeSampleLanguage[];
  children?: ReactNode;
}) {
  const resolvedBody = useMemo(
    () => resolveBody(body, children),
    [body, children],
  );

  const samples = useMemo(() => {
    const all = generateHttpSamples({
      method,
      url,
      headers,
      body: resolvedBody,
    });
    const allowed = new Set(languages);
    return all.filter((sample) => allowed.has(sample.language));
  }, [method, url, headers, resolvedBody, languages]);

  const languageIds = useMemo(
    () => samples.map((sample) => sample.language),
    [samples],
  );
  const [language, setLanguage] = usePreferredCodeLanguage(languageIds);
  const active =
    samples.find((sample) => sample.language === language) ?? samples[0];

  if (!active) {
    return null;
  }

  const highlightLang =
    active.language === "csharp" ? "csharp" : active.language;

  return (
    <section className={styles.sample} aria-label={title ?? "Request example"}>
      <div className={styles.toolbar}>
        <div className={styles.meta}>
          {title ? <span className={styles.title}>{title}</span> : null}
          <span className={styles.method}>
            {methodLabel(method, Boolean(resolvedBody))}
          </span>
          <span className={styles.path}>{shortUrl(url)}</span>
        </div>
        <div className={styles.actions}>
          <LanguageMenu
            languages={languageIds}
            value={active.language}
            onChange={setLanguage}
          />
          <CopyIconButton code={active.code} />
        </div>
      </div>
      <div className={styles.body}>
        <CodeBlock bare className={`language-${highlightLang}`}>
          <code className={`language-${highlightLang}`}>{active.code}</code>
        </CodeBlock>
      </div>
    </section>
  );
}

function resolveBody(
  body:
    | string
    | Record<string, unknown>
    | unknown[]
    | number
    | boolean
    | null
    | undefined,
  children?: ReactNode,
): string | undefined {
  if (body !== undefined && body !== null) {
    if (typeof body === "string") {
      return body.trim();
    }
    try {
      return JSON.stringify(body, null, 2);
    } catch {
      return String(body);
    }
  }
  const fromChildren = extractText(children).trim();
  return fromChildren || undefined;
}

function methodLabel(method: string | undefined, hasBody: boolean): string {
  return (method ?? (hasBody ? "POST" : "GET")).toUpperCase();
}

function shortUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

function extractText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") {
    return "";
  }
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(extractText).join("");
  }
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return extractText(node.props.children);
  }
  return "";
}
