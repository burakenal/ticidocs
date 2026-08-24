import type { ReactNode } from "react";
import styles from "./api-field.module.css";

export function ApiField({
  name,
  type,
  location,
  required,
  description,
  children,
}: {
  name: string;
  type?: string;
  location?: string;
  required?: boolean;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className={styles.field}>
      <div className={styles.head}>
        <code className={styles.name}>{name}</code>
        {type ? <span className={styles.type}>{type}</span> : null}
        {location ? <span className={styles.location}>{location}</span> : null}
        {required ? <span className={styles.required}>required</span> : null}
      </div>
      {description ? <p className={styles.description}>{description}</p> : null}
      {children}
    </div>
  );
}

export function ApiFieldGroup({
  title,
  id,
  children,
}: {
  title: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.group} id={id}>
      <h2 className={styles.groupTitle}>{title}</h2>
      <div className={styles.list}>{children}</div>
    </section>
  );
}
