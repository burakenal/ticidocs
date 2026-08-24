import type { ReactNode } from "react";
import styles from "./cards.module.css";

export function CardGroup({ children }: { children: ReactNode }) {
  return <div className={styles.group}>{children}</div>;
}

export function Card({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
  children?: ReactNode;
}) {
  const body = (
    <>
      <div className={styles.title}>{title}</div>
      {children ? <div className={styles.body}>{children}</div> : null}
    </>
  );

  if (href) {
    return (
      <a className={styles.card} href={href}>
        {body}
      </a>
    );
  }

  return <div className={styles.card}>{body}</div>;
}
