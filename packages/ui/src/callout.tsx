import type { ReactNode } from "react";
import styles from "./callout.module.css";

export type CalloutType = "info" | "warning" | "success" | "error" | "tip";

const LABELS: Record<CalloutType, string> = {
  info: "Info",
  warning: "Warning",
  success: "Success",
  error: "Error",
  tip: "Tip",
};

export function Callout({
  type = "info",
  title,
  children,
}: {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
}) {
  return (
    <aside className={`${styles.callout} ${styles[type]}`} data-type={type}>
      <span className={styles.icon} aria-hidden="true">
        <CalloutIcon type={type} />
      </span>
      <div className={styles.content}>
        <div className={styles.label}>{title ?? LABELS[type]}</div>
        <div className={styles.body}>{children}</div>
      </div>
    </aside>
  );
}

function CalloutIcon({ type }: { type: CalloutType }) {
  if (type === "warning" || type === "error") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3.5 2.8 19.5h18.4L12 3.5Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="M12 10v4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <circle cx="12" cy="17.2" r="1" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 11v6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="12" cy="8" r="1.1" fill="currentColor" />
    </svg>
  );
}
