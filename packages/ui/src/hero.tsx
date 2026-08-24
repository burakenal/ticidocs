import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
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
  arrow,
}: {
  href: string;
  children: ReactNode;
  primary?: boolean;
  /** Renders a trailing arrow icon (preferred over embedding → in label text). */
  arrow?: boolean;
}) {
  const label = normalizeActionLabel(children);

  return (
    <a
      className={primary ? styles.actionPrimary : styles.actionSecondary}
      href={href}
    >
      <span className={styles.actionLabel}>{label}</span>
      {arrow ? (
        <svg
          className={styles.actionArrow}
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3.5 8h8.2M8.2 4.5 11.7 8 8.2 11.5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </a>
  );
}

function cleanLabelText(value: string): string {
  return value.replace(/\s*→\s*$/u, "").replace(/\s+/g, " ").trim();
}

/** MDX often wraps multiline JSX children in a `<p>`; flatten to plain text. */
function normalizeActionLabel(children: ReactNode): ReactNode {
  if (typeof children === "string" || typeof children === "number") {
    return cleanLabelText(String(children));
  }

  if (isValidElement(children)) {
    const el = children as ReactElement<{ children?: ReactNode }>;
    if (el.type === "p" || el.type === "span") {
      return normalizeActionLabel(el.props.children);
    }
  }

  const parts = Children.toArray(children).filter((child) => {
    if (typeof child === "string") return child.trim().length > 0;
    return child != null && child !== false && child !== true;
  });

  if (parts.length === 0) return "";
  if (parts.length === 1) {
    const only = parts[0];
    if (only !== children) return normalizeActionLabel(only);
    if (isValidElement(only)) {
      const nested = (only as ReactElement<{ children?: ReactNode }>).props
        .children;
      if (nested != null) return normalizeActionLabel(nested);
    }
    return children;
  }

  const text = parts
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }
      if (isValidElement(child)) {
        const nested = normalizeActionLabel(
          (child as ReactElement<{ children?: ReactNode }>).props.children,
        );
        return typeof nested === "string" || typeof nested === "number"
          ? String(nested)
          : "";
      }
      return "";
    })
    .join("");

  const cleaned = cleanLabelText(text);
  return cleaned || children;
}
