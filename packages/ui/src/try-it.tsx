"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  assertAllowedOrigin,
  buildRequestUrl,
  createDefaultSampleContext,
  generateCodeSamples,
  type CodeSampleLanguage,
} from "@ticidocs/openapi/codegen";
import type {
  ApiOperation,
  ApiParameter,
  ApiSecurityScheme,
  ParsedOpenApi,
} from "@ticidocs/openapi/types";
import { apiCopy } from "./api-copy";
import { MethodBadge } from "./method-badge";
import { MarkdownBody } from "./markdown-body";
import { CodeBlock } from "./code-block";
import {
  CopyIconButton,
  LanguageMenu,
  SampleCard,
  StatusPill,
} from "./code-sample-card";
import styles from "./try-it.module.css";

export function TryItModal({
  open,
  onClose,
  operation,
  document,
  allowedOrigins,
}: {
  open: boolean;
  onClose: () => void;
  operation: ApiOperation;
  document: ParsedOpenApi;
  allowedOrigins: string[];
}) {
  const defaults = useMemo(
    () => createDefaultSampleContext(document, operation),
    [document, operation],
  );

  const [baseUrl, setBaseUrl] = useState(defaults.baseUrl);
  const [pathValues, setPathValues] = useState(defaults.pathValues ?? {});
  const [queryValues, setQueryValues] = useState(defaults.queryValues ?? {});
  const [authValues, setAuthValues] = useState<Record<string, string>>({});
  const [basicAuth, setBasicAuth] = useState<
    Record<string, { username: string; password: string }>
  >({});
  const [body, setBody] = useState(defaults.body ?? "");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    /** HTTP status when the server responded; null for network/client failures. */
    status: number | null;
    statusText: string;
    headers: string;
    body: string;
  } | null>(null);
  const [language, setLanguage] = useState<CodeSampleLanguage>("curl");

  const title = operation.summary ?? operation.operationId ?? operation.path;
  const methodUpper = operation.method.toUpperCase();
  const tryItEnabled = allowedOrigins.length > 0;

  const securityIds = useMemo(
    () => [...new Set(operation.security.flatMap((req) => Object.keys(req)))],
    [operation.security],
  );
  const pathParams = operation.parameters.filter((p) => p.in === "path");
  const queryParams = operation.parameters.filter((p) => p.in === "query");

  const resolvedAuthValues = useMemo(() => {
    const values = { ...authValues };
    for (const id of securityIds) {
      const scheme = document.securitySchemes[id];
      if (scheme?.type === "http" && scheme.scheme?.toLowerCase() === "basic") {
        const creds = basicAuth[id];
        if (creds?.username || creds?.password) {
          values[id] = encodeBasic(creds.username ?? "", creds.password ?? "");
        }
      }
    }
    return values;
  }, [authValues, basicAuth, document.securitySchemes, securityIds]);

  const samples = useMemo(
    () =>
      generateCodeSamples({
        ...defaults,
        baseUrl,
        pathValues,
        queryValues,
        body,
        authValues: resolvedAuthValues,
      }),
    [defaults, baseUrl, pathValues, queryValues, body, resolvedAuthValues],
  );

  const active =
    samples.find((sample) => sample.language === language) ?? samples[0];

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    const previous = globalThis.document.body.style.overflow;
    globalThis.document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      globalThis.document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setBaseUrl(defaults.baseUrl);
    setPathValues(defaults.pathValues ?? {});
    setQueryValues(defaults.queryValues ?? {});
    setBody(defaults.body ?? "");
    setAuthValues({});
    setBasicAuth({});
    setResult(null);
  }, [open, defaults]);

  async function onSend(): Promise<void> {
    setResult(null);
    setBusy(true);
    try {
      const ctx = {
        ...defaults,
        baseUrl,
        pathValues,
        queryValues,
        body,
        authValues: resolvedAuthValues,
      };
      const url = buildRequestUrl(ctx);
      assertAllowedOrigin(url, allowedOrigins);

      const headers: Record<string, string> = {};
      for (const id of securityIds) {
        const scheme = document.securitySchemes[id];
        const value = resolvedAuthValues[id] ?? "";
        if (!scheme || !value) {
          continue;
        }
        if (scheme.type === "http" && scheme.scheme?.toLowerCase() === "bearer") {
          headers.Authorization = `Bearer ${value}`;
        } else if (
          scheme.type === "http" &&
          scheme.scheme?.toLowerCase() === "basic"
        ) {
          headers.Authorization = `Basic ${value}`;
        } else if (
          scheme.type === "apiKey" &&
          scheme.in === "header" &&
          scheme.name
        ) {
          headers[scheme.name] = value;
        }
      }
      if (operation.requestBody?.content[0]?.contentType) {
        headers["Content-Type"] = operation.requestBody.content[0].contentType;
      }

      const init: RequestInit = {
        method: methodUpper,
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
        body: formatResponseBody(text),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setResult({
        status: null,
        statusText: "Network Error",
        headers: "",
        body: message,
      });
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return null;
  }

  const hasResult = result !== null;
  const isErrorResult =
    hasResult && (result.status === null || result.status >= 400);
  const responseStatus = hasResult
    ? result.status !== null
      ? String(result.status)
      : "—"
    : "—";
  const responseBody = result?.body ?? "";

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={styles.backdrop}
        aria-label={apiCopy.tryItClose}
        onClick={onClose}
      />
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="try-it-title"
      >
        <header className={styles.topBar}>
          <div className={styles.topLeft}>
            <MethodBadge method={operation.method} />
            <span className={styles.opTitle}>{title}</span>
          </div>
          <div className={styles.topPath}>
            <code>
              {methodUpper} {operation.path}
            </code>
          </div>
          <div className={styles.topActions}>
            <button
              type="button"
              className={styles.send}
              onClick={onSend}
              disabled={!tryItEnabled || busy}
            >
              <PlayIcon />
              {busy ? apiCopy.sending : apiCopy.send}
            </button>
            <button
              type="button"
              className={styles.close}
              onClick={onClose}
              aria-label={apiCopy.tryItClose}
            >
              <CloseIcon />
            </button>
          </div>
        </header>

        <div className={styles.body}>
          <div className={styles.left}>
            <div className={styles.intro}>
              <h2 id="try-it-title" className={styles.introTitle}>
                {title}
              </h2>
              {operation.description ? (
                <div className={styles.introDesc}>
                  <MarkdownBody source={operation.description} />
                </div>
              ) : null}
              {!tryItEnabled ? (
                <p className={styles.hint}>
                  Try It is disabled until you set{" "}
                  <code>api.allowedOrigins</code> in <code>docs.config.ts</code>
                  .
                </p>
              ) : (
                <p className={styles.hint}>
                  Requests run in your browser only against allowed origins.
                  Tokens are not stored.
                </p>
              )}
            </div>

            <TrySection title={apiCopy.baseUrl} defaultOpen>
              <ParamField
                name="baseUrl"
                type="string"
                required
                placeholder="https://api.example.com"
              >
                <input
                  value={baseUrl}
                  onChange={(event) => setBaseUrl(event.target.value)}
                  disabled={!tryItEnabled}
                  placeholder="https://api.example.com"
                />
              </ParamField>
            </TrySection>

            {securityIds.length > 0 ? (
              <TrySection title={apiCopy.authorization} defaultOpen>
                {securityIds.map((id) => (
                  <AuthFields
                    key={id}
                    id={id}
                    scheme={document.securitySchemes[id]}
                    authValue={authValues[id] ?? ""}
                    basic={basicAuth[id]}
                    disabled={!tryItEnabled}
                    onAuthChange={(value) =>
                      setAuthValues((current) => ({ ...current, [id]: value }))
                    }
                    onBasicChange={(next) =>
                      setBasicAuth((current) => ({ ...current, [id]: next }))
                    }
                  />
                ))}
              </TrySection>
            ) : null}

            {pathParams.length > 0 ? (
              <TrySection title={apiCopy.path} defaultOpen>
                {pathParams.map((param) => (
                  <ParamField
                    key={param.name}
                    name={param.name}
                    type={schemaType(param)}
                    required={param.required}
                    description={param.description}
                    placeholder={`enter ${param.name}`}
                  >
                    <input
                      value={pathValues[param.name] ?? ""}
                      onChange={(event) =>
                        setPathValues((current) => ({
                          ...current,
                          [param.name]: event.target.value,
                        }))
                      }
                      disabled={!tryItEnabled}
                      placeholder={`enter ${param.name}`}
                    />
                  </ParamField>
                ))}
              </TrySection>
            ) : null}

            {queryParams.length > 0 ? (
              <TrySection title={apiCopy.query} defaultOpen>
                {queryParams.map((param) => (
                  <ParamField
                    key={param.name}
                    name={param.name}
                    type={schemaType(param)}
                    required={param.required}
                    description={param.description}
                    placeholder={`enter ${param.name}`}
                  >
                    <input
                      value={queryValues[param.name] ?? ""}
                      onChange={(event) =>
                        setQueryValues((current) => ({
                          ...current,
                          [param.name]: event.target.value,
                        }))
                      }
                      disabled={!tryItEnabled}
                      placeholder={`enter ${param.name}`}
                    />
                  </ParamField>
                ))}
              </TrySection>
            ) : null}

            {operation.requestBody ? (
              <TrySection title={apiCopy.requestBody} defaultOpen>
                <label className={styles.bodyField}>
                  <textarea
                    rows={10}
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    disabled={!tryItEnabled}
                    spellCheck={false}
                  />
                </label>
              </TrySection>
            ) : null}
          </div>

          <div className={styles.right}>
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
              bodyClassName={styles.codeBody}
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

            <SampleCard
              title={
                <StatusPill
                  status={responseStatus}
                  className={
                    isErrorResult
                      ? styles.statusError
                      : hasResult
                        ? styles.statusOk
                        : styles.statusIdle
                  }
                />
              }
              actions={
                hasResult && responseBody ? (
                  <CopyIconButton code={responseBody} />
                ) : undefined
              }
              bodyClassName={styles.responseBody}
            >
              {hasResult ? (
                <>
                  {result.headers ? (
                    <CodeBlock bare className="language-http">
                      <code className="language-http">{result.headers}</code>
                    </CodeBlock>
                  ) : null}
                  <CodeBlock bare className="language-json">
                    <code className="language-json">
                      {responseBody || apiCopy.empty}
                    </code>
                  </CodeBlock>
                </>
              ) : (
                <div className={styles.responseEmpty}>
                  Send a request to see the response here.
                </div>
              )}
            </SampleCard>
          </div>
        </div>
      </div>
    </div>
  );
}

/** @deprecated Use TryItModal — kept for package export compatibility. */
export function TryItPanel({
  operation,
  document,
  allowedOrigins,
}: {
  operation: ApiOperation;
  document: ParsedOpenApi;
  allowedOrigins: string[];
  embedded?: boolean;
}) {
  const [open, setOpen] = useState(true);
  return (
    <TryItModal
      open={open}
      onClose={() => setOpen(false)}
      operation={operation}
      document={document}
      allowedOrigins={allowedOrigins}
    />
  );
}

function TrySection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details className={styles.section} open={defaultOpen}>
      <summary className={styles.sectionSummary}>
        <span>{title}</span>
        <Chevron />
      </summary>
      <div className={styles.sectionBody}>{children}</div>
    </details>
  );
}

function ParamField({
  name,
  type,
  required,
  description,
  children,
}: {
  name: string;
  type?: string;
  required?: boolean;
  description?: string;
  placeholder?: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.param}>
      <div className={styles.paramHead}>
        <code className={styles.paramName}>{name}</code>
        {type ? <span className={styles.paramType}>{type}</span> : null}
        {required ? (
          <span className={styles.paramRequired}>{apiCopy.required}</span>
        ) : null}
      </div>
      {description ? <p className={styles.paramDesc}>{description}</p> : null}
      <div className={styles.paramControl}>{children}</div>
    </div>
  );
}

function AuthFields({
  id,
  scheme,
  authValue,
  basic,
  disabled,
  onAuthChange,
  onBasicChange,
}: {
  id: string;
  scheme?: ApiSecurityScheme;
  authValue: string;
  basic?: { username: string; password: string };
  disabled: boolean;
  onAuthChange: (value: string) => void;
  onBasicChange: (value: { username: string; password: string }) => void;
}) {
  if (scheme?.type === "http" && scheme.scheme?.toLowerCase() === "basic") {
    return (
      <div className={styles.authBlock}>
        <p className={styles.authHint}>
          {scheme.description ??
            "Basic authentication (username:password, base64-encoded)."}
        </p>
        <ParamField
          name={`${id}.username`}
          type="string"
          required
          placeholder="enter username"
        >
          <input
            autoComplete="off"
            value={basic?.username ?? ""}
            onChange={(event) =>
              onBasicChange({
                username: event.target.value,
                password: basic?.password ?? "",
              })
            }
            disabled={disabled}
            placeholder="enter username"
          />
        </ParamField>
        <ParamField
          name={`${id}.password`}
          type="string"
          required
          placeholder="enter password"
        >
          <input
            type="password"
            autoComplete="off"
            value={basic?.password ?? ""}
            onChange={(event) =>
              onBasicChange({
                username: basic?.username ?? "",
                password: event.target.value,
              })
            }
            disabled={disabled}
            placeholder="enter password"
          />
        </ParamField>
      </div>
    );
  }

  const label =
    scheme?.type === "apiKey" && scheme.name
      ? scheme.name
      : scheme?.type === "http"
        ? "Authorization"
        : id;
  const hint =
    scheme?.description ??
    (scheme?.type === "http" && scheme.scheme?.toLowerCase() === "bearer"
      ? apiCopy.bearerAuth
      : undefined);

  return (
    <div className={styles.authBlock}>
      {hint ? <p className={styles.authHint}>{hint}</p> : null}
      <ParamField
        name={label}
        type="string"
        required
        placeholder={
          scheme?.type === "http" ? "enter bearer token" : "enter value"
        }
      >
        <input
          type="password"
          autoComplete="off"
          value={authValue}
          onChange={(event) => onAuthChange(event.target.value)}
          disabled={disabled}
          placeholder={
            scheme?.type === "http" ? "enter bearer token" : "enter value"
          }
        />
      </ParamField>
    </div>
  );
}

function schemaType(param: ApiParameter): string {
  const schema = param.schema;
  if (!schema) {
    return "string";
  }
  if (Array.isArray(schema.type)) {
    return schema.type.join(" | ");
  }
  if (schema.format) {
    return schema.type ?? "string";
  }
  return schema.type ?? "string";
}

function encodeBasic(username: string, password: string): string {
  const raw = `${username}:${password}`;
  try {
    return btoa(raw);
  } catch {
    return btoa(unescape(encodeURIComponent(raw)));
  }
}

function formatResponseBody(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return text;
  }
  try {
    return JSON.stringify(JSON.parse(trimmed), null, 2);
  } catch {
    return text;
  }
}

function PlayIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M3.5 2.2v7.6L10 6 3.5 2.2Z" fill="currentColor" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M4 4l8 8M12 4l-8 8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Chevron() {
  return (
    <svg
      className={styles.sectionChevron}
      width="14"
      height="14"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
    >
      <path
        d="M3 4.5 6 7.5 9 4.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
