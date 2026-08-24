import type { ReactNode } from "react";
import styles from "./cards.module.css";

const ICON_PATHS: Record<string, string> = {
  store: "M3 9l1-5h16l1 5M4 9v10a1 1 0 001 1h4v-5h6v5h4a1 1 0 001-1V9M3 9h18",
  hub: "M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83",
  rocket: "M5 13l4 4L19 7M12 3c4 2 7 5 9 9-2 1-5 2-9 2s-7-1-9-2c2-4 5-7 9-9z",
  book: "M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 016.5 22H20V2H6.5A2.5 2.5 0 004 4.5v15z",
  key: "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4",
  plug: "M12 22v-5M9 8V2m6 6V2M7 8h10v5a5 5 0 01-10 0V8z",
};

function CardIcon({ name }: { name: string }) {
  const d = ICON_PATHS[name] ?? ICON_PATHS.book;
  return (
    <svg
      className={styles.iconSvg}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}

export function CardGroup({ children }: { children: ReactNode }) {
  return <div className={styles.group}>{children}</div>;
}

export function Card({
  title,
  href,
  icon,
  badge,
  tone = "primary",
  tags,
  actionLabel,
  children,
}: {
  title: string;
  href?: string;
  /** Named icon: store | hub | rocket | book | key | plug */
  icon?: string;
  badge?: string;
  tone?: "primary" | "green" | "blue" | "orange" | "violet";
  tags?: string | string[];
  actionLabel?: string;
  children?: ReactNode;
}) {
  const tagList = Array.isArray(tags)
    ? tags
    : typeof tags === "string"
      ? tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];

  const body = (
    <>
      <div className={styles.top}>
        {icon ? (
          <span className={`${styles.icon} ${styles[`tone_${tone}`]}`}>
            <CardIcon name={icon} />
          </span>
        ) : (
          <span />
        )}
        {badge ? (
          <span className={`${styles.badge} ${styles[`tone_${tone}`]}`}>
            {badge}
          </span>
        ) : null}
      </div>
      <div className={styles.title}>{title}</div>
      {children ? <div className={styles.body}>{children}</div> : null}
      {tagList.length > 0 ? (
        <ul className={styles.tags}>
          {tagList.map((tag) => (
            <li key={tag} className={styles.tag}>
              {tag}
            </li>
          ))}
        </ul>
      ) : null}
      {href && actionLabel ? (
        <span className={`${styles.action} ${styles[`tone_${tone}`]}`}>
          {actionLabel}
          <span aria-hidden> →</span>
        </span>
      ) : null}
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
