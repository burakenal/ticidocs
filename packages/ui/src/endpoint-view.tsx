"use client";

import { useState } from "react";
import type {
  ApiOperation,
  ApiParameter,
  ApiSecurityScheme,
  JsonSchema,
  ParsedOpenApi,
} from "@ticidocs/openapi/types";
import { apiCopy } from "./api-copy";
import { MethodBadge } from "./method-badge";
import { SchemaViewer } from "./schema-viewer";
import { ApiCodeRail } from "./api-code-rail";
import { ApiField, ApiFieldGroup } from "./api-field";
import { TryItModal } from "./try-it";
import styles from "./endpoint-view.module.css";

export function EndpointView({
  operation,
  document,
  allowedOrigins = [],
}: {
  operation: ApiOperation;
  document: ParsedOpenApi;
  allowedOrigins?: string[];
}) {
  const [tryItOpen, setTryItOpen] = useState(false);
  const title = operation.summary ?? operation.operationId ?? operation.path;
  const pathParams = operation.parameters.filter((p) => p.in === "path");
  const queryParams = operation.parameters.filter((p) => p.in === "query");
  const headerParams = operation.parameters.filter((p) => p.in === "header");
  const cookieParams = operation.parameters.filter((p) => p.in === "cookie");
  const requestSchema = operation.requestBody?.content[0]?.schema;
  const success = operation.responses.find((response) =>
    response.status.startsWith("2"),
  );

  const category = operation.tags.find((tag) => tag.trim().length > 0)?.trim();

  return (
    <div className={styles.layout}>
      <div className={styles.content}>
        <header className={styles.header}>
          {category ? <div className={styles.category}>{category}</div> : null}
          <h1 className={styles.title}>{title}</h1>
          {operation.description ? (
            <p className={styles.description}>{operation.description}</p>
          ) : null}
          {operation.deprecated ? (
            <div className={styles.deprecated}>{apiCopy.deprecated}</div>
          ) : null}
        </header>

        <div className={styles.endpointBar}>
          <div className={styles.signature}>
            <MethodBadge method={operation.method} />
            <code className={styles.path}>{operation.path}</code>
          </div>
          <button
            type="button"
            className={styles.tryIt}
            onClick={() => setTryItOpen(true)}
          >
            {apiCopy.tryIt}
            <span className={styles.tryItIcon} aria-hidden>
              ▶
            </span>
          </button>
        </div>

        <SecuritySection
          requirements={operation.security}
          schemes={document.securitySchemes}
        />

        <ParameterSections
          pathParams={pathParams}
          queryParams={queryParams}
          headerParams={headerParams}
          cookieParams={cookieParams}
        />

        {operation.requestBody ? (
          <section className={styles.section} id="request-body">
            <h2>{apiCopy.requestBody}</h2>
            <p className={styles.meta}>
              {operation.requestBody.required
                ? apiCopy.required
                : apiCopy.optional}
              {operation.requestBody.content[0]
                ? ` · ${operation.requestBody.content[0].contentType}`
                : null}
            </p>
            {operation.requestBody.description ? (
              <p>{operation.requestBody.description}</p>
            ) : null}
            <SchemaViewer schema={requestSchema} name={apiCopy.request} />
          </section>
        ) : null}

        <section className={styles.section} id="responses">
          <h2>{apiCopy.response}</h2>
          {success ? (
            <>
              <p className={styles.responseMeta}>
                <code className={styles.statusBadge}>{success.status}</code>
                {success.content[0] ? (
                  <span>{success.content[0].contentType}</span>
                ) : null}
                {success.description ? (
                  <span className={styles.meta}>{success.description}</span>
                ) : null}
              </p>
              <SchemaPropertyList schema={success.content[0]?.schema} />
            </>
          ) : (
            <p className={styles.meta}>{apiCopy.noSuccessResponse}</p>
          )}

          {operation.responses.filter((r) => r !== success).length > 0 ? (
            <div className={styles.otherResponses}>
              <h3>{apiCopy.otherResponses}</h3>
              {operation.responses
                .filter((response) => response !== success)
                .map((response) => (
                  <div key={response.status} className={styles.response}>
                    <div className={styles.responseHead}>
                      <code className={styles.status}>{response.status}</code>
                      <span>{response.description ?? ""}</span>
                    </div>
                    {response.content[0]?.schema ? (
                      <SchemaViewer
                        schema={response.content[0].schema}
                        name={apiCopy.schema}
                      />
                    ) : null}
                  </div>
                ))}
            </div>
          ) : null}
        </section>
      </div>

      <div className={styles.rail}>
        <ApiCodeRail operation={operation} document={document} />
      </div>

      <TryItModal
        open={tryItOpen}
        onClose={() => setTryItOpen(false)}
        operation={operation}
        document={document}
        allowedOrigins={allowedOrigins}
      />
    </div>
  );
}

function SecuritySection({
  requirements,
  schemes,
}: {
  requirements: ApiOperation["security"];
  schemes: Record<string, ApiSecurityScheme>;
}) {
  if (requirements.length === 0) {
    return (
      <section className={styles.section} id="authentication">
        <h2>{apiCopy.authorization}</h2>
        <p className={styles.meta}>{apiCopy.noAuthRequired}</p>
      </section>
    );
  }

  const ids = [...new Set(requirements.flatMap((req) => Object.keys(req)))];

  return (
    <ApiFieldGroup title={apiCopy.authorization} id="authentication">
      {ids.map((id) => {
        const scheme = schemes[id];
        const typeLabel = scheme
          ? scheme.type === "http"
            ? scheme.scheme ?? "http"
            : scheme.type
          : "unknown";
        const location =
          scheme?.type === "apiKey"
            ? scheme.in
            : scheme?.type === "http"
              ? "header"
              : undefined;
        const name =
          scheme?.type === "apiKey" && scheme.name
            ? scheme.name
            : scheme?.type === "http"
              ? "Authorization"
              : id;

        return (
          <ApiField
            key={id}
            name={name}
            type={typeLabel}
            location={location}
            required
            description={
              scheme?.description ??
              (scheme?.type === "http" && scheme.scheme === "bearer"
                ? apiCopy.bearerAuth
                : undefined)
            }
          />
        );
      })}
    </ApiFieldGroup>
  );
}

function ParameterSections({
  pathParams,
  queryParams,
  headerParams,
  cookieParams,
}: {
  pathParams: ApiParameter[];
  queryParams: ApiParameter[];
  headerParams: ApiParameter[];
  cookieParams: ApiParameter[];
}) {
  const all = [...pathParams, ...queryParams, ...headerParams, ...cookieParams];
  if (all.length === 0) {
    return null;
  }

  return (
    <ApiFieldGroup title={apiCopy.parameters} id="parameters">
      {all.map((param) => (
        <ApiField
          key={`${param.in}-${param.name}`}
          name={param.name}
          type={schemaType(param.schema)}
          location={param.in}
          required={param.required}
          description={param.description}
        />
      ))}
    </ApiFieldGroup>
  );
}

function SchemaPropertyList({ schema }: { schema?: JsonSchema }) {
  const properties = flattenProperties(schema);
  if (properties.length === 0) {
    if (!schema) {
      return null;
    }
    return <SchemaViewer schema={schema} name={apiCopy.responseSchema} />;
  }

  return (
    <div className={styles.propertyList}>
      {properties.map((property) => (
        <ApiField
          key={property.name}
          name={property.name}
          type={property.type}
          required={property.required}
          description={property.description}
        />
      ))}
    </div>
  );
}

function flattenProperties(
  schema?: JsonSchema,
): Array<{
  name: string;
  type: string;
  required?: boolean;
  description?: string;
}> {
  if (!schema) {
    return [];
  }
  if (schema.type === "array" && schema.items) {
    const itemProps = flattenProperties(schema.items);
    if (itemProps.length > 0) {
      return itemProps;
    }
    return [
      {
        name: "items",
        type: `array<${schemaType(schema.items)}>`,
        description: schema.description,
      },
    ];
  }
  const properties = schema.properties ?? {};
  return Object.entries(properties).map(([name, child]) => ({
    name,
    type: schemaType(child),
    required: schema.required?.includes(name),
    description: child.description,
  }));
}

function schemaType(schema?: JsonSchema): string {
  if (!schema) {
    return "any";
  }
  if (Array.isArray(schema.type)) {
    return schema.type.join(" | ");
  }
  if (schema.type === "array" && schema.items) {
    return `array<${schemaType(schema.items)}>`;
  }
  if (schema.format) {
    return `${schema.type ?? "object"} (${schema.format})`;
  }
  return schema.type ?? (schema.$ref ? "ref" : "object");
}
