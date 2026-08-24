"use client";

import { useMemo, useState } from "react";
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
import {
  CopyIconButton,
  LanguageMenu,
  SampleCard,
  StatusPill,
} from "./code-sample-card";
import styles from "./api-code-rail.module.css";

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
          title={<StatusPill status={responseStatus} />}
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
