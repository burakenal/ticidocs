import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import {
  HTTP_METHODS,
  type ApiMediaType,
  type ApiOperation,
  type ApiParameter,
  type ApiRequestBody,
  type ApiResponse,
  type ApiSecurityRequirement,
  type ApiSecurityScheme,
  type HttpMethod,
  type JsonSchema,
  type ParameterLocation,
  type ParsedOpenApi,
} from "./types.js";

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/\{([^}]+)\}/g, "$1")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function operationSlug(
  method: HttpMethod,
  apiPath: string,
  operationId: string | undefined,
  basePath: string,
): string {
  const leaf = operationId
    ? slugify(operationId)
    : `${method}-${slugify(apiPath)}`;
  const prefix = basePath.replace(/^\/+|\/+$/g, "");
  return prefix ? `${prefix}/${leaf}` : leaf;
}

function resolveRef(root: JsonObject, ref: string): JsonObject {
  if (!ref.startsWith("#/")) {
    throw new Error(`Only local OpenAPI refs are supported (got "${ref}")`);
  }
  const parts = ref.slice(2).split("/");
  let current: unknown = root;
  for (const part of parts) {
    if (!isObject(current) || !(part in current)) {
      throw new Error(`Unable to resolve OpenAPI ref "${ref}"`);
    }
    current = current[part];
  }
  if (!isObject(current)) {
    throw new Error(`OpenAPI ref "${ref}" did not resolve to an object`);
  }
  return current;
}

function deref(
  root: JsonObject,
  value: unknown,
  seen = new Set<string>(),
): unknown {
  if (!isObject(value)) {
    return value;
  }
  if (typeof value.$ref === "string") {
    if (seen.has(value.$ref)) {
      return { $ref: value.$ref };
    }
    seen.add(value.$ref);
    return deref(root, resolveRef(root, value.$ref), seen);
  }
  const result: JsonObject = {};
  for (const [key, child] of Object.entries(value)) {
    result[key] = Array.isArray(child)
      ? child.map((item) => deref(root, item, new Set(seen)))
      : deref(root, child, new Set(seen));
  }
  return result;
}

function parseSchema(value: unknown): JsonSchema | undefined {
  if (!isObject(value)) {
    return undefined;
  }
  return value as JsonSchema;
}

function parseMediaMap(value: unknown): ApiMediaType[] {
  if (!isObject(value)) {
    return [];
  }
  return Object.entries(value).map(([contentType, media]) => {
    const obj = isObject(media) ? media : {};
    return {
      contentType,
      schema: parseSchema(obj.schema),
      example: obj.example,
      examples: isObject(obj.examples) ? obj.examples : undefined,
    };
  });
}

function parseParameters(
  root: JsonObject,
  value: unknown,
): ApiParameter[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item) => {
    const resolved = deref(root, item);
    if (!isObject(resolved)) {
      return [];
    }
    const name = asString(resolved.name);
    const location = asString(resolved.in) as ParameterLocation | undefined;
    if (!name || !location) {
      return [];
    }
    return [
      {
        name,
        in: location,
        required: Boolean(resolved.required) || location === "path",
        description: asString(resolved.description),
        schema: parseSchema(resolved.schema),
        example: resolved.example,
        deprecated: Boolean(resolved.deprecated),
      },
    ];
  });
}

function parseRequestBody(
  root: JsonObject,
  value: unknown,
): ApiRequestBody | undefined {
  if (!value) {
    return undefined;
  }
  const resolved = deref(root, value);
  if (!isObject(resolved)) {
    return undefined;
  }
  return {
    description: asString(resolved.description),
    required: Boolean(resolved.required),
    content: parseMediaMap(resolved.content),
  };
}

function parseResponses(root: JsonObject, value: unknown): ApiResponse[] {
  if (!isObject(value)) {
    return [];
  }
  return Object.entries(value).map(([status, response]) => {
    const resolved = deref(root, response);
    const obj = isObject(resolved) ? resolved : {};
    return {
      status,
      description: asString(obj.description),
      content: parseMediaMap(obj.content),
    };
  });
}

function parseSecurity(value: unknown): ApiSecurityRequirement[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item) => {
    if (!isObject(item)) {
      return [];
    }
    const requirement: ApiSecurityRequirement = {};
    for (const [key, scopes] of Object.entries(item)) {
      requirement[key] = Array.isArray(scopes)
        ? scopes.filter((scope): scope is string => typeof scope === "string")
        : [];
    }
    return [requirement];
  });
}

function parseSecuritySchemes(root: JsonObject): Record<string, ApiSecurityScheme> {
  const components = isObject(root.components) ? root.components : {};
  const schemes = isObject(components.securitySchemes)
    ? components.securitySchemes
    : {};
  const result: Record<string, ApiSecurityScheme> = {};
  for (const [id, scheme] of Object.entries(schemes)) {
    const resolved = deref(root, scheme);
    if (!isObject(resolved)) {
      continue;
    }
    const type = asString(resolved.type) as ApiSecurityScheme["type"] | undefined;
    if (!type) {
      continue;
    }
    result[id] = {
      id,
      type,
      description: asString(resolved.description),
      name: asString(resolved.name),
      in: asString(resolved.in) as ApiSecurityScheme["in"],
      scheme: asString(resolved.scheme),
      bearerFormat: asString(resolved.bearerFormat),
      openIdConnectUrl: asString(resolved.openIdConnectUrl),
    };
  }
  return result;
}

function parseSchemas(root: JsonObject): Record<string, JsonSchema> {
  const components = isObject(root.components) ? root.components : {};
  const schemas = isObject(components.schemas) ? components.schemas : {};
  const result: Record<string, JsonSchema> = {};
  for (const [name, schema] of Object.entries(schemas)) {
    const resolved = deref(root, schema);
    const parsed = parseSchema(resolved);
    if (parsed) {
      result[name] = parsed;
    }
  }
  return result;
}

export function parseOpenApiDocument(
  document: unknown,
  options?: { basePath?: string; sourcePath?: string },
): ParsedOpenApi {
  if (!isObject(document)) {
    throw new Error("OpenAPI document must be a JSON object");
  }

  const openapi = asString(document.openapi);
  if (!openapi || !openapi.startsWith("3.")) {
    throw new Error(
      `Unsupported OpenAPI version "${openapi ?? "unknown"}". Expected 3.0 or 3.1.`,
    );
  }

  const info = isObject(document.info) ? document.info : {};
  const title = asString(info.title) ?? "API";
  const version = asString(info.version) ?? "0.0.0";
  const description = asString(info.description);
  const basePath = options?.basePath ?? "api";

  const servers = Array.isArray(document.servers)
    ? document.servers.flatMap((server) => {
        if (!isObject(server) || typeof server.url !== "string") {
          return [];
        }
        return [
          {
            url: server.url,
            description: asString(server.description),
          },
        ];
      })
    : [];

  const globalSecurity = parseSecurity(document.security);
  const paths = isObject(document.paths) ? document.paths : {};
  const operations: ApiOperation[] = [];
  const usedSlugs = new Set<string>();

  for (const [apiPath, pathItemValue] of Object.entries(paths)) {
    const pathItem = deref(document, pathItemValue);
    if (!isObject(pathItem)) {
      continue;
    }
    const pathParams = parseParameters(document, pathItem.parameters);

    for (const method of HTTP_METHODS) {
      const operationValue = pathItem[method];
      if (!operationValue) {
        continue;
      }
      const operation = deref(document, operationValue);
      if (!isObject(operation)) {
        continue;
      }

      const operationId = asString(operation.operationId);
      let slug = operationSlug(method, apiPath, operationId, basePath);
      if (usedSlugs.has(slug)) {
        slug = `${slug}-${usedSlugs.size}`;
      }
      usedSlugs.add(slug);

      const tags = Array.isArray(operation.tags)
        ? operation.tags.filter((tag): tag is string => typeof tag === "string")
        : [];

      operations.push({
        id: operationId ?? `${method}:${apiPath}`,
        slug,
        method,
        path: apiPath,
        summary: asString(operation.summary),
        description: asString(operation.description),
        operationId,
        tags,
        deprecated: Boolean(operation.deprecated),
        parameters: [
          ...pathParams,
          ...parseParameters(document, operation.parameters),
        ],
        requestBody: parseRequestBody(document, operation.requestBody),
        responses: parseResponses(document, operation.responses),
        security:
          operation.security !== undefined
            ? parseSecurity(operation.security)
            : globalSecurity,
      });
    }
  }

  return {
    title,
    version,
    description,
    servers,
    operations,
    schemas: parseSchemas(document),
    securitySchemes: parseSecuritySchemes(document),
    sourcePath: options?.sourcePath,
  };
}

export function loadOpenApiFile(
  filePath: string,
  options?: { basePath?: string },
): ParsedOpenApi {
  const absolute = path.resolve(filePath);
  if (!fs.existsSync(absolute)) {
    throw new Error(`OpenAPI file could not be found: ${absolute}`);
  }
  const raw = fs.readFileSync(absolute, "utf8");
  let document: unknown;
  try {
    if (/\.json$/i.test(absolute)) {
      document = JSON.parse(raw);
    } else {
      document = YAML.parse(raw);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`OpenAPI file could not be parsed (${absolute}): ${message}`);
  }

  return parseOpenApiDocument(document, {
    basePath: options?.basePath,
    sourcePath: absolute,
  });
}

export function findOperationBySlug(
  doc: ParsedOpenApi,
  slug: string,
): ApiOperation | undefined {
  return doc.operations.find((operation) => operation.slug === slug);
}

export * from "./types.js";
export {
  assertAllowedOrigin,
  buildRequestUrl,
  createDefaultSampleContext,
  generateCSharp,
  generateCodeSamples,
  generateCurl,
  generateJavaScript,
  generatePython,
  generateTypeScript,
  type CodeSample,
  type CodeSampleContext,
  type CodeSampleLanguage,
} from "./codegen.js";
