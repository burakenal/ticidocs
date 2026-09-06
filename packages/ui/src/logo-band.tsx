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
        <img className={styles.logo} src={src} alt={clone ? "" : name} loading="lazy" />
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
  children,
}: {
  label?: string;
  children?: ReactNode;
}) {
  const items = collectItems(children);
  if (items.length === 0) return null;

  return (
    <section className={styles.band} aria-label={label ?? "Integrations"}>
      {label ? <p className={styles.label}>{label}</p> : null}
      <div className={styles.viewport}>
        <ul className={styles.track}>
          {items.map((item) => (
            <ItemFace
              key={item.name}
              name={item.name}
              src={item.src}
              badge={item.badge}
            />
          ))}
          {items.map((item) => (
            <ItemFace
              key={`clone-${item.name}`}
              name={item.name}
              src={item.src}
              badge={item.badge}
              clone
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
