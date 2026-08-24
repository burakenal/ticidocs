"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  createDefaultSampleContext,
  generateCodeSamples,
  type CodeSampleLanguage,
} from "@ticidocs/openapi/codegen";
import type {
  ApiOperation,
  JsonSchema,
  ParsedOpenApi,
} from "@ticidocs/openapi/types";
import { CodeBlock } from "./code-block";
import styles from "./api-code-rail.module.css";

const LANG_META: Record<CodeSampleLanguage, string> = {
  curl: "cURL",
  javascript: "JavaScript",
  typescript: "TypeScript",
  csharp: "C#",
  python: "Python",
};

export function ApiCodeRail({
  operation,
  document,
}: {
  operation: ApiOperation;
  document: ParsedOpenApi;
}) {
  const samples = useMemo(
    () => generateCodeSamples(createDefaultSampleContext(document, operation)),
    [document, operation],
  );
  const [language, setLanguage] = useState<CodeSampleLanguage>(
    samples[0]?.language ?? "curl",
  );
  const active =
    samples.find((sample) => sample.language === language) ?? samples[0];

  const success = operation.responses.find((response) =>
    response.status.startsWith("2"),
  );
  const responseMedia = success?.content[0];
  const responseExample = formatExample(
    responseMedia?.example ??
      responseMedia?.schema?.example ??
      synthesizeExample(responseMedia?.schema),
  );
  const responseStatus =
    success?.status ?? operation.responses[0]?.status ?? "200";
  const title = operation.summary ?? operation.operationId ?? operation.path;

  return (
    <aside className={styles.rail} aria-label="Request and response examples">
      <SampleCard
        title={title}
        actions={
          <>
            <LanguageMenu
              languages={samples.map((sample) => sample.language)}
              value={active?.language ?? "curl"}
              onChange={setLanguage}
            />
            <CopyIconButton code={active?.code ?? ""} />
          </>
        }
      >
        {active ? (
          <CodeBlock
            bare
            className={`language-${active.language === "csharp" ? "csharp" : active.language}`}
          >
            <code
              className={`language-${active.language === "csharp" ? "csharp" : active.language}`}
            >
              {active.code}
            </code>
          </CodeBlock>
        ) : null}
      </SampleCard>

      {responseExample ? (
        <SampleCard
          title={
            <span className={styles.status}>{responseStatus}</span>
          }
          actions={<CopyIconButton code={responseExample} />}
        >
          <CodeBlock bare className="language-json">
            <code className="language-json">{responseExample}</code>
          </CodeBlock>
        </SampleCard>
      ) : null}
    </aside>
  );
}

function SampleCard({
  title,
  actions,
  children,
}: {
  title: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={styles.card}>
      <div className={styles.cardHead}>
        <div className={styles.cardTitle}>{title}</div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
      <div className={styles.cardBody}>{children}</div>
    </section>
  );
}

function LanguageMenu({
  languages,
  value,
  onChange,
}: {
  languages: CodeSampleLanguage[];
  value: CodeSampleLanguage;
  onChange: (language: CodeSampleLanguage) => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(
    null,
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();

  function updatePosition() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    setMenuPos({
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right,
    });
  }

  function toggleOpen() {
    if (open) {
      setOpen(false);
      return;
    }
    updatePosition();
    setOpen(true);
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  return (
    <div className={styles.langSelect} ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.iconBtn}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        title={LANG_META[value]}
        aria-label={`Language: ${LANG_META[value]}`}
        onClick={toggleOpen}
      >
        <ChevronIcon />
      </button>
      {open && menuPos ? (
        <ul
          id={listId}
          className={styles.langMenu}
          role="listbox"
          aria-label="Language"
          style={{ top: menuPos.top, right: menuPos.right }}
        >
          {languages.map((language) => {
            const selected = language === value;
            return (
              <li key={language} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={
                    selected
                      ? `${styles.langOption} ${styles.langOptionActive}`
                      : styles.langOption
                  }
                  onClick={() => {
                    onChange(language);
                    setOpen(false);
                  }}
                >
                  {LANG_META[language]}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function CopyIconButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      className={styles.iconBtn}
      onClick={onCopy}
      title={copied ? "Copied" : "Copy"}
      aria-label={copied ? "Copied" : "Copy"}
    >
      {copied ? <CheckIcon /> : <ClipboardIcon />}
    </button>
  );
}

function ChevronIcon() {
  return (
    <svg
      className={styles.chevron}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden
    >
      <path
        d="M4.2 5.2 7 2.5l2.8 2.7M4.2 8.8 7 11.5l2.8-2.7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="9"
        y="9"
        width="11"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M7 15H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12.5 9.5 17 19 7.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatExample(value: unknown): string | null {
  if (value == null) {
    return null;
  }
  if (typeof value === "string") {
    return value;
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function synthesizeExample(schema?: JsonSchema): unknown {
  if (!schema) {
    return undefined;
  }
  if (schema.example !== undefined) {
    return schema.example;
  }
  if (schema.default !== undefined) {
    return schema.default;
  }
  if (schema.enum && schema.enum.length > 0) {
    return schema.enum[0];
  }

  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;

  if (type === "array" || schema.items) {
    const item = synthesizeExample(schema.items);
    return item === undefined ? [] : [item];
  }

  if (type === "object" || schema.properties) {
    const result: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(schema.properties ?? {})) {
      const value = synthesizeExample(child);
      if (value !== undefined) {
        result[key] = value;
      }
    }
    return result;
  }

  switch (type) {
    case "string":
      return schema.format === "date-time"
        ? "2024-01-01T00:00:00Z"
        : schema.format === "uuid"
          ? "00000000-0000-0000-0000-000000000000"
          : "string";
    case "integer":
      return 0;
    case "number":
      return 0;
    case "boolean":
      return true;
    default:
      return undefined;
  }
}
