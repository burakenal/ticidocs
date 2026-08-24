"use client";

import {
  Children,
  isValidElement,
  useMemo,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import styles from "./code-block.module.css";

type PreProps = ComponentPropsWithoutRef<"pre"> & {
  /** Hide language/copy chrome (used inside API sample cards). */
  bare?: boolean;
};

export function CodeBlock({
  children,
  className,
  bare = false,
  ...rest
}: PreProps) {
  const [copied, setCopied] = useState(false);

  const { code, language } = useMemo(() => {
    let text = "";
    let lang = "";

    Children.forEach(children, (child) => {
      if (typeof child === "string") {
        text += child;
        return;
      }
      if (!isValidElement<{ className?: string; children?: ReactNode }>(child)) {
        return;
      }
      const childClass = child.props.className ?? "";
      const match = /language-([\w-]+)/.exec(childClass);
      if (match?.[1]) {
        lang = match[1];
      }
      text += extractText(child.props.children);
    });

    if (!lang && className) {
      const match = /language-([\w-]+)/.exec(className);
      if (match?.[1]) {
        lang = match[1];
      }
    }

    return { code: text.replace(/\n$/, ""), language: lang };
  }, [children, className]);

  async function onCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  if (bare) {
    return (
      <pre
        {...rest}
        className={`${styles.pre} ${styles.barePre} ${className ?? ""}`.trim()}
        data-language={language || undefined}
      >
        {children}
      </pre>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <span className={styles.lang}>{language || "text"}</span>
        <button type="button" className={styles.copy} onClick={onCopy}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre
        {...rest}
        className={`${styles.pre} ${className ?? ""}`.trim()}
        data-language={language || undefined}
      >
        {children}
      </pre>
    </div>
  );
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
