import type {
  ApiOperation,
  ApiParameter,
  ApiSecurityScheme,
  ParsedOpenApi,
} from "./types.js";

export type CodeSampleLanguage =
  | "curl"
  | "javascript"
  | "typescript"
  | "csharp"
  | "python";

export interface CodeSampleContext {
  baseUrl: string;
  operation: ApiOperation;
  securitySchemes: Record<string, ApiSecurityScheme>;
  pathValues?: Record<string, string>;
  queryValues?: Record<string, string>;
  headerValues?: Record<string, string>;
  body?: string;
  authValues?: Record<string, string>;
}

export interface CodeSample {
  language: CodeSampleLanguage;
  title: string;
  code: string;
}

function resolvePath(pathTemplate: string, values: Record<string, string> = {}): string {
  return pathTemplate.replace(/\{([^}]+)\}/g, (_, name: string) => {
    const value = values[name];
    return value != null && value !== "" ? encodeURIComponent(value) : `{${name}}`;
  });
}

function buildUrl(ctx: CodeSampleContext): string {
  const base = ctx.baseUrl.replace(/\/+$/, "");
  const path = resolvePath(ctx.operation.path, ctx.pathValues);
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(ctx.queryValues ?? {})) {
    if (value) {
      query.set(key, value);
    }
  }
  const qs = query.toString();
  return qs ? `${base}${path}?${qs}` : `${base}${path}`;
}

export function buildRequestUrl(ctx: CodeSampleContext): string {
  return buildUrl(ctx);
}

function exampleParamValue(param: ApiParameter): string {
  if (param.example != null) {
    return String(param.example);
  }
  if (param.schema?.example != null) {
    return String(param.schema.example);
  }
  if (param.schema?.default != null) {
    return String(param.schema.default);
  }
  if (param.schema?.type === "integer" || param.schema?.type === "number") {
    return "1";
  }
  return param.name;
}

function defaultBody(operation: ApiOperation): string {
  const media = operation.requestBody?.content[0];
  if (!media) {
    return "";
  }
  if (media.example != null) {
    return typeof media.example === "string"
      ? media.example
      : JSON.stringify(media.example, null, 2);
  }
  if (media.schema?.example != null) {
    return JSON.stringify(media.schema.example, null, 2);
  }
  return '{\n  "name": "string"\n}';
}

function authHeaders(
  operation: ApiOperation,
  schemes: Record<string, ApiSecurityScheme>,
  authValues: Record<string, string> = {},
): Record<string, string> {
  const headers: Record<string, string> = {};
  const ids = operation.security.flatMap((req) => Object.keys(req));
  for (const id of ids) {
    const scheme = schemes[id];
    if (!scheme) {
      continue;
    }
    const value = authValues[id] ?? "";
    if (scheme.type === "http" && scheme.scheme?.toLowerCase() === "bearer") {
      headers.Authorization = `Bearer ${value || "<token>"}`;
    } else if (scheme.type === "apiKey" && scheme.in === "header" && scheme.name) {
      headers[scheme.name] = value || "<api-key>";
    } else if (scheme.type === "http" && scheme.scheme?.toLowerCase() === "basic") {
      headers.Authorization = `Basic ${value || "<base64>"}`;
    }
  }
  return headers;
}

function collectHeaders(ctx: CodeSampleContext): Record<string, string> {
  const headers: Record<string, string> = {
    ...authHeaders(ctx.operation, ctx.securitySchemes, ctx.authValues),
    ...(ctx.headerValues ?? {}),
  };
  if (ctx.operation.requestBody?.content[0]?.contentType) {
    headers["Content-Type"] =
      ctx.operation.requestBody.content[0].contentType;
  }
  return headers;
}

export function createDefaultSampleContext(
  document: ParsedOpenApi,
  operation: ApiOperation,
): CodeSampleContext {
  const pathValues: Record<string, string> = {};
  const queryValues: Record<string, string> = {};
  for (const param of operation.parameters) {
    const value = exampleParamValue(param);
    if (param.in === "path") {
      pathValues[param.name] = value;
    }
    if (param.in === "query") {
      queryValues[param.name] = value;
    }
  }
  return {
    baseUrl: document.servers[0]?.url ?? "https://api.example.com",
    operation,
    securitySchemes: document.securitySchemes,
    pathValues,
    queryValues,
    headerValues: {},
    body: defaultBody(operation),
    authValues: {},
  };
}

export function generateCurl(ctx: CodeSampleContext): string {
  const url = buildUrl(ctx);
  const headers = collectHeaders(ctx);
  const lines = [`curl -X ${ctx.operation.method.toUpperCase()} '${url}'`];
  for (const [key, value] of Object.entries(headers)) {
    lines.push(`  -H '${key}: ${value}'`);
  }
  if (ctx.body && ["post", "put", "patch"].includes(ctx.operation.method)) {
    lines.push(`  -d '${ctx.body.replace(/'/g, `'\\''`)}'`);
  }
  return lines.join(" \\\n");
}

export function generateJavaScript(ctx: CodeSampleContext): string {
  const url = buildUrl(ctx);
  const headers = collectHeaders(ctx);
  const hasBody =
    Boolean(ctx.body) && ["post", "put", "patch"].includes(ctx.operation.method);
  return `const response = await fetch(${JSON.stringify(url)}, {
  method: ${JSON.stringify(ctx.operation.method.toUpperCase())},
  headers: ${JSON.stringify(headers, null, 2).replace(/\n/g, "\n  ")},
${hasBody ? `  body: ${JSON.stringify(ctx.body)},\n` : ""}});

const data = await response.json();
console.log(data);`;
}

export function generateTypeScript(ctx: CodeSampleContext): string {
  return generateJavaScript(ctx).replace(
    "const response = await fetch",
    "const response: Response = await fetch",
  );
}

export function generatePython(ctx: CodeSampleContext): string {
  const url = buildUrl(ctx);
  const headers = collectHeaders(ctx);
  const hasBody =
    Boolean(ctx.body) && ["post", "put", "patch"].includes(ctx.operation.method);
  const headerLiteral = JSON.stringify(headers, null, 2)
    .replace(/true/g, "True")
    .replace(/false/g, "False")
    .replace(/null/g, "None");
  return `import requests

url = ${JSON.stringify(url)}
headers = ${headerLiteral}
${hasBody ? `payload = ${ctx.body}\n\nresponse = requests.request(${JSON.stringify(ctx.operation.method.toUpperCase())}, url, headers=headers, json=payload)` : `response = requests.request(${JSON.stringify(ctx.operation.method.toUpperCase())}, url, headers=headers)`}
print(response.status_code)
print(response.text)`;
}

export function generateCSharp(ctx: CodeSampleContext): string {
  const url = buildUrl(ctx);
  const headers = collectHeaders(ctx);
  const headerLines = Object.entries(headers)
    .filter(([key]) => key.toLowerCase() !== "content-type")
    .map(([key, value]) => `client.DefaultRequestHeaders.TryAddWithoutValidation("${key}", "${value}");`)
    .join("\n");
  const hasBody =
    Boolean(ctx.body) && ["post", "put", "patch"].includes(ctx.operation.method);
  const method = ctx.operation.method.toUpperCase();
  const contentType =
    ctx.operation.requestBody?.content[0]?.contentType ?? "application/json";

  if (hasBody) {
    return `using var client = new HttpClient();
${headerLines}
using var content = new StringContent(${JSON.stringify(ctx.body)}, System.Text.Encoding.UTF8, "${contentType}");
using var response = await client.${method === "POST" ? "PostAsync" : method === "PUT" ? "PutAsync" : "PatchAsync"}("${url}", content);
var body = await response.Content.ReadAsStringAsync();
Console.WriteLine((int)response.StatusCode);
Console.WriteLine(body);`;
  }

  return `using var client = new HttpClient();
${headerLines}
using var response = await client.${method === "DELETE" ? "DeleteAsync" : "GetAsync"}("${url}");
var body = await response.Content.ReadAsStringAsync();
Console.WriteLine((int)response.StatusCode);
Console.WriteLine(body);`;
}

export function generateCodeSamples(ctx: CodeSampleContext): CodeSample[] {
  return [
    { language: "curl", title: "cURL", code: generateCurl(ctx) },
    { language: "javascript", title: "JavaScript", code: generateJavaScript(ctx) },
    { language: "typescript", title: "TypeScript", code: generateTypeScript(ctx) },
    { language: "python", title: "Python", code: generatePython(ctx) },
    { language: "csharp", title: "C#", code: generateCSharp(ctx) },
  ];
}

/** Ensures Try It only targets explicitly allowed origins (browser-side guard). */
export function assertAllowedOrigin(
  requestUrl: string,
  allowedOrigins: readonly string[],
): void {
  let origin: string;
  try {
    origin = new URL(requestUrl).origin;
  } catch {
    throw new Error("Invalid request URL");
  }
  const normalized = allowedOrigins.map((item) => item.replace(/\/+$/, ""));
  if (!normalized.includes(origin)) {
    throw new Error(
      `Request origin "${origin}" is not in api.allowedOrigins. Configure allowed origins in docs.config.ts.`,
    );
  }
}
