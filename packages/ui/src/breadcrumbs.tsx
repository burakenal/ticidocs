import styles from "./breadcrumbs.module.css";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav className={styles.crumbs} aria-label="Breadcrumb">
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <span key={`${item.label}-${index}`} className={styles.item}>
            {index > 0 ? <span className={styles.sep}>/</span> : null}
            {item.href && !last ? (
              <a className={styles.link} href={item.href}>
                {item.label}
              </a>
            ) : (
              <span className={styles.current}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export function breadcrumbsFromSidebar(
  sidebar: {
    type: string;
    title?: string;
    children?: { title: string; href: string }[];
  }[],
  currentPath: string,
  homeHref: string,
): BreadcrumbItem[] {
  for (const item of sidebar) {
    if (item.type !== "group" || !item.children) continue;
    const child = item.children.find((entry) => entry.href === currentPath);
    if (child) {
      return [
        { label: item.title ?? "Docs", href: homeHref },
        { label: child.title },
      ];
    }
  }
  return [];
}
