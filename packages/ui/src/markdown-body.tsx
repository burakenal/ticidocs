import type { ReactNode } from "react";
import styles from "./markdown-body.module.css";

/** Lightweight markdown-ish renderer for Phase 1 (headings, paragraphs, lists, code). */
export function MarkdownBody({ source }: { source: string }): ReactNode {
  const blocks = source.trim().split(/\n{2,}/);
  return (
    <div className={styles.prose}>
      {blocks.map((block, index) => {
        const lines = block.split(/\n/);
        const first = lines[0] ?? "";

        if (/^###\s+/.test(first)) {
          const text = first.replace(/^###\s+/, "");
          return (
            <h3 key={index} id={slugify(text)}>
              {text}
            </h3>
          );
        }
        if (/^##\s+/.test(first)) {
          const text = first.replace(/^##\s+/, "");
          return (
            <h2 key={index} id={slugify(text)}>
              {text}
            </h2>
          );
        }
        if (/^#\s+/.test(first)) {
          const text = first.replace(/^#\s+/, "");
          return (
            <h1 key={index} id={slugify(text)}>
              {text}
            </h1>
          );
        }
        if (first.startsWith("```")) {
          const lang = first.slice(3).trim();
          const codeLines = lines.slice(1);
          if (codeLines[codeLines.length - 1]?.trim() === "```") {
            codeLines.pop();
          }
          return (
            <pre key={index} className={styles.code} data-language={lang || undefined}>
              <code>{codeLines.join("\n")}</code>
            </pre>
          );
        }
        if (lines.every((line) => /^[-*]\s+/.test(line))) {
          return (
            <ul key={index}>
              {lines.map((line, i) => (
                <li key={i}>{inline(line.replace(/^[-*]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index}>
            {lines.map((line, i) => (
              <span key={i}>
                {i > 0 ? <br /> : null}
                {inline(line)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

function inline(text: string): ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}
