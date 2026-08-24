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

type SidebarCrumbNode = {
  type: string;
  title?: string;
  href?: string;
  children?: SidebarCrumbNode[];
};

function findSidebarTrail(
  nodes: SidebarCrumbNode[],
  currentPath: string,
  trail: BreadcrumbItem[] = [],
): BreadcrumbItem[] | undefined {
  for (const node of nodes) {
    if (node.type === "group" && node.children) {
      const nested = findSidebarTrail(node.children, currentPath, [
        ...trail,
        { label: node.title ?? "Docs" },
      ]);
      if (nested) return nested;
      continue;
    }
    if (node.href === currentPath) {
      return [...trail, { label: node.title ?? currentPath }];
    }
  }
  return undefined;
}

export function breadcrumbsFromSidebar(
  sidebar: SidebarCrumbNode[],
  currentPath: string,
  homeHref: string,
): BreadcrumbItem[] {
  for (const item of sidebar) {
    if (item.type !== "group" || !item.children) continue;
    const found = findSidebarTrail(item.children, currentPath, [
      { label: item.title ?? "Docs", href: homeHref },
    ]);
    if (found) return found;
  }
  return [];
}
