"use client";

import { useState } from "react";
import type { JsonSchema } from "@ticidocs/openapi/types";
import styles from "./schema-viewer.module.css";

export function SchemaViewer({
  schema,
  name,
}: {
  schema?: JsonSchema;
  name?: string;
}) {
  if (!schema) {
    return <p className={styles.empty}>No schema</p>;
  }

  return (
    <div className={styles.viewer}>
      <SchemaNode schema={schema} name={name ?? schema.title ?? "Schema"} depth={0} />
    </div>
  );
}

function SchemaNode({
  schema,
  name,
  depth,
  required,
}: {
  schema: JsonSchema;
  name: string;
  depth: number;
  required?: boolean;
}) {
  const [open, setOpen] = useState(depth < 2);
  const typeLabel = Array.isArray(schema.type)
    ? schema.type.join(" | ")
    : schema.type ?? (schema.$ref ? "ref" : "object");
  const properties = schema.properties ?? {};
  const propertyNames = Object.keys(properties);
  const hasChildren =
    propertyNames.length > 0 || Boolean(schema.items) || Boolean(schema.additionalProperties);

  return (
    <div className={styles.node} style={{ marginLeft: depth === 0 ? 0 : 12 }}>
      <button
        type="button"
        className={styles.row}
        onClick={() => hasChildren && setOpen((value) => !value)}
        disabled={!hasChildren}
      >
        <span className={styles.toggle}>{hasChildren ? (open ? "▾" : "▸") : "•"}</span>
        <span className={styles.name}>
          {name}
          {required ? <span className={styles.required}>*</span> : null}
        </span>
        <span className={styles.type}>{typeLabel}</span>
        {schema.format ? <span className={styles.format}>{schema.format}</span> : null}
      </button>
      {schema.description ? (
        <div className={styles.description}>{schema.description}</div>
      ) : null}
      {open && propertyNames.length > 0
        ? propertyNames.map((key) => (
            <SchemaNode
              key={key}
              name={key}
              schema={properties[key]!}
              depth={depth + 1}
              required={schema.required?.includes(key)}
            />
          ))
        : null}
      {open && schema.items ? (
        <SchemaNode name="items" schema={schema.items} depth={depth + 1} />
      ) : null}
    </div>
  );
}
