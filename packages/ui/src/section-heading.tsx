import type { ReactNode } from "react";
import styles from "./section-heading.module.css";

export function SectionHeading({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className={styles.heading}>
      <div className={styles.copy}>
        <h2 className={styles.title}>{title}</h2>
        {description ? (
          <p className={styles.description}>{description}</p>
        ) : null}
      </div>
      {children ? <div className={styles.aside}>{children}</div> : null}
    </div>
  );
}
