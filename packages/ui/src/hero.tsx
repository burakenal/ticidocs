import type { ReactNode } from "react";
import styles from "./hero.module.css";

function renderTitle(title: string, highlight?: string) {
  if (!highlight || !title.includes(highlight)) {
    return title;
  }
  const parts = title.split(highlight);
  return parts.map((part, index) => (
    <span key={`${part}-${index}`}>
      {part}
      {index < parts.length - 1 ? (
        <span className={styles.highlight}>{highlight}</span>
      ) : null}
    </span>
  ));
}

export function Hero({
  eyebrow,
  title,
  highlight,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  /** Substring of `title` rendered in the brand accent color. */
  highlight?: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className={styles.hero} aria-labelledby="docs-hero-title">
      <div className={styles.plane} aria-hidden />
      <div className={styles.layout}>
        <div className={styles.copy}>
          {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
          <h1 id="docs-hero-title" className={styles.title}>
            {renderTitle(title, highlight)}
          </h1>
          {description ? (
            <p className={styles.description}>{description}</p>
          ) : null}
          {children ? <div className={styles.actions}>{children}</div> : null}
        </div>
        <div className={styles.visual} aria-hidden>
          <div className={styles.visualGlow} />
          <div className={styles.panel}>
            <div className={styles.panelChrome}>
              <span className={styles.panelDot} />
              <span className={styles.panelDot} />
              <span className={styles.panelDot} />
              <span className={styles.panelLabel}>marketplace.ticiyo.com</span>
            </div>
            <div className={styles.panelBody}>
              <div className={styles.endpoint}>
                <span className={styles.method}>GET</span>
                <span className={styles.path}>/v1/marketplace/orders</span>
              </div>
              <div className={styles.meta}>
                <span className={styles.status}>200 OK</span>
                <span className={styles.latency}>38 ms</span>
              </div>
              <pre className={styles.code}>{`{
  "data": [{ "id": "ord_9f2", "status": "paid" }],
  "page": { "next": null }
}`}</pre>
            </div>
          </div>
        </div>
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
