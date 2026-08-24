"use client";

import { useMemo, useState } from "react";
import {
  assertAllowedOrigin,
  buildRequestUrl,
  createDefaultSampleContext,
  generateCodeSamples,
} from "@ticidocs/openapi/codegen";
import type { ApiOperation, ParsedOpenApi } from "@ticidocs/openapi/types";
import { apiCopy } from "./api-copy";
import { Tabs, Tab } from "./tabs";
import { CodeBlock } from "./code-block";
import styles from "./try-it.module.css";

export function TryItPanel({
  operation,
  document,
  allowedOrigins,
  embedded = false,
}: {
  operation: ApiOperation;
  document: ParsedOpenApi;
  allowedOrigins: string[];
  /** When true, hide outer heading (used inside the Try it drawer). */
  embedded?: boolean;
}) {
  const defaults = useMemo(
    () => createDefaultSampleContext(document, operation),
    [document, operation],
  );

  const [baseUrl, setBaseUrl] = useState(defaults.baseUrl);
  const [pathValues, setPathValues] = useState(defaults.pathValues ?? {});
  const [queryValues, setQueryValues] = useState(defaults.queryValues ?? {});
  const [authValues, setAuthValues] = useState<Record<string, string>>({});
  const [body, setBody] = useState(defaults.body ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    status: number;
    statusText: string;
    headers: string;
    body: string;
  } | null>(null);

  const samples = useMemo(
    () =>
      generateCodeSamples({
        ...defaults,
        baseUrl,
        pathValues,
        queryValues,
        body,
        authValues,
      }),
    [defaults, baseUrl, pathValues, queryValues, body, authValues],
  );

  const securityIds = [
    ...new Set(operation.security.flatMap((req) => Object.keys(req))),
  ];
  const pathParams = operation.parameters.filter((p) => p.in === "path");
  const queryParams = operation.parameters.filter((p) => p.in === "query");
  const tryItEnabled = allowedOrigins.length > 0;

  async function onSend(): Promise<void> {
    setError(null);
    setResult(null);
    setBusy(true);
    try {
      const ctx = {
        ...defaults,
        baseUrl,
        pathValues,
        queryValues,
        body,
        authValues,
      };
      const url = buildRequestUrl(ctx);
      assertAllowedOrigin(url, allowedOrigins);

      const headers: Record<string, string> = {};
      for (const id of securityIds) {
        const scheme = document.securitySchemes[id];
        const value = authValues[id] ?? "";
        if (!scheme || !value) {
          continue;
        }
        if (scheme.type === "http" && scheme.scheme?.toLowerCase() === "bearer") {
          headers.Authorization = `Bearer ${value}`;
        } else if (scheme.type === "apiKey" && scheme.in === "header" && scheme.name) {
          headers[scheme.name] = value;
        }
      }
      if (operation.requestBody?.content[0]?.contentType) {
        headers["Content-Type"] = operation.requestBody.content[0].contentType;
      }

      const init: RequestInit = {
        method: operation.method.toUpperCase(),
        headers,
      };
      if (body && ["post", "put", "patch"].includes(operation.method)) {
        init.body = body;
      }

      const response = await fetch(url, init);
      const text = await response.text();
      const responseHeaders = [...response.headers.entries()]
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n");
      setResult({
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        body: text,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className={embedded ? styles.embedded : styles.panel}
      id={embedded ? undefined : "try-it"}
    >
      {!embedded ? <h2>{apiCopy.tryIt}</h2> : null}
      {!tryItEnabled ? (
        <p className={styles.hint}>
          Try It is disabled until you set <code>api.allowedOrigins</code> in{" "}
          <code>docs.config.ts</code>.
        </p>
      ) : (
        <p className={styles.hint}>
          Requests run in your browser only against allowed origins. Tokens are
          not stored.
        </p>
      )}

      <div className={styles.grid}>
        <label className={styles.field}>
          <span>{apiCopy.baseUrl}</span>
          <input
            value={baseUrl}
            onChange={(event) => setBaseUrl(event.target.value)}
            disabled={!tryItEnabled}
          />
        </label>

        {securityIds.map((id) => {
          const scheme = document.securitySchemes[id];
          const label =
            scheme?.type === "apiKey"
              ? `${id} (${scheme.name})`
              : `${id} (${apiCopy.bearerToken})`;
          return (
            <label key={id} className={styles.field}>
              <span>{label}</span>
              <input
                type="password"
                autoComplete="off"
                value={authValues[id] ?? ""}
                onChange={(event) =>
                  setAuthValues((current) => ({
                    ...current,
                    [id]: event.target.value,
                  }))
                }
                disabled={!tryItEnabled}
              />
            </label>
          );
        })}

        {pathParams.map((param) => (
          <label key={param.name} className={styles.field}>
            <span>
              Path · {param.name}
              {param.required ? " *" : ""}
            </span>
            <input
              value={pathValues[param.name] ?? ""}
              onChange={(event) =>
                setPathValues((current) => ({
                  ...current,
                  [param.name]: event.target.value,
                }))
              }
              disabled={!tryItEnabled}
            />
          </label>
        ))}

        {queryParams.map((param) => (
          <label key={param.name} className={styles.field}>
            <span>Query · {param.name}</span>
            <input
              value={queryValues[param.name] ?? ""}
              onChange={(event) =>
                setQueryValues((current) => ({
                  ...current,
                  [param.name]: event.target.value,
                }))
              }
              disabled={!tryItEnabled}
            />
          </label>
        ))}
      </div>

      {operation.requestBody ? (
        <label className={styles.field}>
          <span>{apiCopy.requestBodyLabel}</span>
          <textarea
            rows={8}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            disabled={!tryItEnabled}
          />
        </label>
      ) : null}

      <button
        type="button"
        className={styles.send}
        onClick={onSend}
        disabled={!tryItEnabled || busy}
      >
        {busy ? apiCopy.sending : apiCopy.sendRequest}
      </button>

      {error ? <div className={styles.error}>{error}</div> : null}

      {result ? (
        <div className={styles.result}>
          <div className={styles.status}>
            {result.status} {result.statusText}
          </div>
          {result.headers ? (
            <CodeBlock className="language-http">
              <code className="language-http">{result.headers}</code>
            </CodeBlock>
          ) : null}
          <CodeBlock className="language-json">
            <code className="language-json">
              {result.body || apiCopy.empty}
            </code>
          </CodeBlock>
        </div>
      ) : null}

      {!embedded ? (
        <div className={styles.examples} id="code-examples">
          <h3>Code examples</h3>
          <Tabs>
            {samples.map((sample) => (
              <Tab key={sample.language} title={sample.title}>
                <CodeBlock
                  className={`language-${sample.language === "csharp" ? "csharp" : sample.language}`}
                >
                  <code
                    className={`language-${sample.language === "csharp" ? "csharp" : sample.language}`}
                  >
                    {sample.code}
                  </code>
                </CodeBlock>
              </Tab>
            ))}
          </Tabs>
        </div>
      ) : null}
    </section>
  );
}
