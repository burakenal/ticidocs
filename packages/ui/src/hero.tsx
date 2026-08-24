import type { ReactNode } from "react";
import styles from "./hero.module.css";

export function Hero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className={styles.hero} aria-labelledby="docs-hero-title">
      <div className={styles.plane} aria-hidden />
      <div className={styles.inner}>
        {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
        <h1 id="docs-hero-title" className={styles.title}>
          {title}
        </h1>
        {description ? (
          <p className={styles.description}>{description}</p>
        ) : null}
        {children ? <div className={styles.actions}>{children}</div> : null}
      </div>
    </section>
  );
}

export function HeroAction({
  href,
  children,
  primary,
}: {
  href: string;
  children: ReactNode;
  primary?: boolean;
}) {
  return (
    <a
      className={primary ? styles.actionPrimary : styles.actionSecondary}
      href={href}
    >
      {children}
    </a>
  );
}
