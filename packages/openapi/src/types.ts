export type HttpMethod =
  | "get"
  | "post"
  | "put"
  | "patch"
  | "delete"
  | "head"
  | "options"
  | "trace";

export const HTTP_METHODS: readonly HttpMethod[] = [
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "head",
  "options",
  "trace",
] as const;

export type ParameterLocation = "path" | "query" | "header" | "cookie";

export interface ApiParameter {
  name: string;
  in: ParameterLocation;
  required: boolean;
  description?: string;
  schema?: JsonSchema;
  example?: unknown;
  deprecated?: boolean;
}

export interface JsonSchema {
  type?: string | string[];
  format?: string;
  title?: string;
  description?: string;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  enum?: unknown[];
  example?: unknown;
  default?: unknown;
  $ref?: string;
  allOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  anyOf?: JsonSchema[];
  additionalProperties?: boolean | JsonSchema;
  nullable?: boolean;
  [key: string]: unknown;
}

export interface ApiMediaType {
  contentType: string;
  schema?: JsonSchema;
  example?: unknown;
  examples?: Record<string, unknown>;
}

export interface ApiRequestBody {
  description?: string;
  required: boolean;
  content: ApiMediaType[];
}

export interface ApiResponse {
  status: string;
  description?: string;
  content: ApiMediaType[];
}

export type SecuritySchemeType =
  | "apiKey"
  | "http"
  | "oauth2"
  | "openIdConnect"
  | "mutualTLS";

export interface ApiSecurityScheme {
  id: string;
  type: SecuritySchemeType;
  description?: string;
  name?: string;
  in?: "query" | "header" | "cookie";
  scheme?: string;
  bearerFormat?: string;
  openIdConnectUrl?: string;
}

export type ApiSecurityRequirement = Record<string, string[]>;

export interface ApiServer {
  url: string;
  description?: string;
}

export interface ApiOperation {
  id: string;
  slug: string;
  method: HttpMethod;
  path: string;
  summary?: string;
  description?: string;
  operationId?: string;
  tags: string[];
  deprecated?: boolean;
  parameters: ApiParameter[];
  requestBody?: ApiRequestBody;
  responses: ApiResponse[];
  security: ApiSecurityRequirement[];
}

export interface ParsedOpenApi {
  title: string;
  version: string;
  description?: string;
  servers: ApiServer[];
  operations: ApiOperation[];
  schemas: Record<string, JsonSchema>;
  securitySchemes: Record<string, ApiSecurityScheme>;
  sourcePath?: string;
}
