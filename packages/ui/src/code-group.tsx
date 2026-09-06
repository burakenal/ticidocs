"use client";

import {
  Children,
  isValidElement,
  useId,
  useMemo,
  type ReactElement,
  type ReactNode,
} from "react";
import { CodeGroupProvider } from "./code-group-context";
import { languageLabel, usePreferredCodeLanguage } from "./code-language";
import { CopyIconButton, LanguageMenu } from "./code-sample-card";
import styles from "./code-group.module.css";

type CodeTab = {
  id: string;
  language: string;
  title: string;
  content: ReactElement;
  code: string;
};

export function CodeGroup({ children }: { children: ReactNode }) {
  const panelId = useId();
  const tabs = useMemo(() => collectTabs(children), [children]);
  const languages = useMemo(() => tabs.map((tab) => tab.language), [tabs]);
  const [language, setLanguage] = usePreferredCodeLanguage(languages);

  if (tabs.length === 0) {
    return null;
  }

  const current =
    tabs.find((tab) => tab.language === language) ?? tabs[0]!;

  return (
    <div className={styles.group}>
      <div className={styles.toolbar}>
        <LanguageMenu
          languages={languages}
          value={current.language}
          onChange={setLanguage}
        />
        <CopyIconButton code={current.code} />
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${panelId}-${tab.id}`}
          hidden={tab.language !== current.language}
          className={styles.panel}
        >
          <CodeGroupProvider>{tab.content}</CodeGroupProvider>
        </div>
      ))}
    </div>
  );
}

function collectTabs(children: ReactNode): CodeTab[] {
  return Children.toArray(children).flatMap((child, index) => {
    if (!isValidElement(child)) {
      return [];
    }
    const element = child as ReactElement<{
      title?: string;
      "data-title"?: string;
      className?: string;
      children?: ReactNode;
    }>;
    const language = inferLanguage(element);
    if (!language) {
      return [];
    }
    const title =
      element.props.title ??
      element.props["data-title"] ??
      languageLabel(language);
    return [
      {
        id: `${language}-${index}`,
        language,
        title,
        content: element,
        code: extractText(element),
      },
    ];
  });
}

function inferLanguage(
  element: ReactElement<{ className?: string; children?: ReactNode }>,
): string | undefined {
  const className = element.props.className ?? "";
  const match = /language-([\w#+-]+)/.exec(className);
  if (match?.[1]) {
    return match[1];
  }

  const kids = Children.toArray(element.props.children);
  for (const kid of kids) {
    if (!isValidElement<{ className?: string }>(kid)) {
      continue;
    }
    const childMatch = /language-([\w#+-]+)/.exec(kid.props.className ?? "");
    if (childMatch?.[1]) {
      return childMatch[1];
    }
  }
  return undefined;
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
