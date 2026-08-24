import type { ReactNode } from "react";
import styles from "./markdown-body.module.css";

/** Lightweight markdown renderer for OpenAPI descriptions and MDX-adjacent prose. */
export function MarkdownBody({ source }: { source: string }): ReactNode {
  const lines = source.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const nodes: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";

    if (line.trim() === "") {
      i += 1;
      continue;
    }

    if (/^###\s+/.test(line)) {
      const text = line.replace(/^###\s+/, "").trim();
      nodes.push(
        <h3 key={key++} id={slugify(text)}>
          {inline(text)}
        </h3>,
      );
      i += 1;
      continue;
    }
    if (/^##\s+/.test(line)) {
      const text = line.replace(/^##\s+/, "").trim();
      nodes.push(
        <h2 key={key++} id={slugify(text)}>
          {inline(text)}
        </h2>,
      );
      i += 1;
      continue;
    }
    if (/^#\s+/.test(line)) {
      const text = line.replace(/^#\s+/, "").trim();
      nodes.push(
        <h1 key={key++} id={slugify(text)}>
          {inline(text)}
        </h1>,
      );
      i += 1;
      continue;
    }

    if (line.trimStart().startsWith("```")) {
      const lang = line.trimStart().slice(3).trim();
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i]!.trimStart().startsWith("```")) {
        codeLines.push(lines[i]!);
        i += 1;
      }
      if (i < lines.length) i += 1;
      nodes.push(
        <pre key={key++} className={styles.code} data-language={lang || undefined}>
          <code>{codeLines.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^[-*]\s+/, ""));
        i += 1;
      }
      nodes.push(
        <ul key={key++}>
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{inline(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      (lines[i] ?? "").trim() !== "" &&
      !/^#{1,3}\s+/.test(lines[i] ?? "") &&
      !(lines[i] ?? "").trimStart().startsWith("```") &&
      !/^[-*]\s+/.test(lines[i] ?? "")
    ) {
      paragraphLines.push(lines[i] ?? "");
      i += 1;
    }
    nodes.push(
      <p key={key++}>
        {paragraphLines.map((paragraphLine, lineIndex) => (
          <span key={lineIndex}>
            {lineIndex > 0 ? <br /> : null}
            {inline(paragraphLine)}
          </span>
        ))}
      </p>,
    );
  }

  return <div className={styles.prose}>{nodes}</div>;
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
