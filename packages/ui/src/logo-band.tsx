import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import styles from "./logo-band.module.css";

export type LogoBandItemProps = {
  name: string;
  src?: string;
  /** Optional badge, e.g. "Soon" / "Yakında". */
  badge?: string;
};

export type LogoBandVariant = "marquee" | "grid";

export function LogoBandItem(_props: LogoBandItemProps) {
  // Rendered by LogoBand via Children inspection.
  return null;
}

function ItemFace({
  name,
  src,
  badge,
  clone,
}: LogoBandItemProps & { clone?: boolean }) {
  return (
    <li className={styles.item} aria-hidden={clone || undefined}>
      {src ? (
        <span className={styles.logoSlot}>
          <img
            className={styles.logo}
            src={src}
            alt={clone ? "" : name}
            loading="lazy"
          />
        </span>
      ) : (
        <span className={styles.wordmark}>{name}</span>
      )}
      {badge ? <span className={styles.badge}>{badge}</span> : null}
    </li>
  );
}

function collectItems(children: ReactNode): LogoBandItemProps[] {
  const items: LogoBandItemProps[] = [];

  const visit = (node: ReactNode) => {
    Children.forEach(node, (child) => {
      if (!isValidElement(child)) return;
      const el = child as ReactElement<{
        name?: string;
        src?: string;
        badge?: string;
        children?: ReactNode;
      }>;
      if (typeof el.props.name === "string" && el.props.name.length > 0) {
        items.push({
          name: el.props.name,
          src: el.props.src,
          badge: el.props.badge,
        });
        return;
      }
      if (el.props.children != null) visit(el.props.children);
    });
  };

  visit(children);
  return items;
}

export function LogoBand({
  label,
  variant = "marquee",
  children,
}: {
  label?: string;
  /** `marquee` = full-bleed homepage strip; `grid` = contained content-page row. */
  variant?: LogoBandVariant;
  children?: ReactNode;
}) {
  const items = collectItems(children);
  if (items.length === 0) return null;

  const isGrid = variant === "grid";

  return (
    <section
      className={isGrid ? styles.bandGrid : styles.band}
      aria-label={label ?? "Integrations"}
    >
      {label ? <p className={styles.label}>{label}</p> : null}
      <div className={isGrid ? styles.viewportGrid : styles.viewport}>
        <ul className={isGrid ? styles.trackGrid : styles.track}>
          {items.map((item) => (
            <ItemFace
              key={item.name}
              name={item.name}
              src={item.src}
              badge={item.badge}
            />
          ))}
          {!isGrid
            ? items.map((item) => (
                <ItemFace
                  key={`clone-${item.name}`}
                  name={item.name}
                  src={item.src}
                  badge={item.badge}
                  clone
                />
              ))
            : null}
        </ul>
      </div>
    </section>
  );
}
