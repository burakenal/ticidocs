import type { HttpMethod } from "@ticidocs/openapi/types";
import styles from "./method-badge.module.css";

const LABELS: Record<HttpMethod, string> = {
  get: "GET",
  post: "POST",
  put: "PUT",
  patch: "PATCH",
  delete: "DELETE",
  head: "HEAD",
  options: "OPTIONS",
  trace: "TRACE",
};

const METHODS = new Set<string>(Object.keys(LABELS));

export function MethodBadge({
  method,
  compact = false,
}: {
  method: string;
  compact?: boolean;
}) {
  const key = method.toLowerCase();
  const styleKey = (METHODS.has(key) ? key : "options") as HttpMethod;
  const label = METHODS.has(key) ? LABELS[styleKey] : method.toUpperCase();

  return (
    <span
      className={`${styles.badge} ${styles[styleKey]} ${compact ? styles.compact : ""}`}
    >
      {label}
    </span>
  );
}
