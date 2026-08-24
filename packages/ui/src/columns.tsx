import type { ReactNode } from "react";
import styles from "./columns.module.css";

export function Columns({ children }: { children: ReactNode }) {
  return <div className={styles.columns}>{children}</div>;
}

export function Column({ children }: { children: ReactNode }) {
  return <div className={styles.column}>{children}</div>;
}
