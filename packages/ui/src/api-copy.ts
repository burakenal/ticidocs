/**
 * Shared OpenAPI / API reference UI copy.
 * Keep chrome labels here so endpoint surfaces stay consistent.
 */
export const apiCopy = {
  tryIt: "Try it",
  tryItClose: "Close",
  deprecated: "Deprecated",
  requestBody: "Request body",
  required: "Required",
  optional: "Optional",
  response: "Response",
  noSuccessResponse: "No success response documented.",
  otherResponses: "Other responses",
  authorization: "Authorization",
  noAuthRequired: "No authentication required.",
  bearerAuth: "Bearer token authentication.",
  parameters: "Parameters",
  schema: "Schema",
  request: "Request",
  responseSchema: "Response",
  sendRequest: "Send request",
  send: "Send",
  sending: "Sending…",
  baseUrl: "Base URL",
  path: "Path",
  query: "Query",
  headers: "Headers",
  requestBodyLabel: "Request body",
  codeExamples: "Code examples",
  bearerToken: "Bearer token",
  empty: "(empty)",
  paramName: "Name",
  paramType: "Type",
  paramRequired: "Required",
  paramDescription: "Description",
  yes: "Yes",
  no: "No",
  copy: "Copy",
  copied: "Copied",
} as const;

export type ApiCopyKey = keyof typeof apiCopy;
