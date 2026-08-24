"use client";

import type { SidebarItem } from "@ticidocs/core";
import { MethodBadge } from "./method-badge";
import styles from "./sidebar.module.css";

export interface SidebarProps {
  items: SidebarItem[];
  currentPath: string;
}

export function Sidebar({ items, currentPath }: SidebarProps) {
  return (
    <nav id="ticidocs-sidebar" className={styles.nav}>
      {items.map((item) => {
        if (item.type === "external") {
          return (
            <a
              key={item.href}
              className={styles.external}
              href={item.href}
              rel="noreferrer"
              target="_blank"
            >
              {item.title}
            </a>
          );
        }

        return (
          <div key={item.title} className={styles.group}>
            <div className={styles.groupTitle}>{item.title}</div>
            <ul className={styles.list}>
              {item.children.map((child) => {
                const active = child.href === currentPath;
                return (
                  <li key={child.href}>
                    <a
                      className={`${styles.link} ${child.method ? styles.apiLink : ""} ${active ? styles.active : ""}`}
                      href={child.href}
                      aria-current={active ? "page" : undefined}
                    >
                      {child.method ? (
                        <MethodBadge method={child.method} compact />
                      ) : null}
                      <span className={styles.linkText}>{child.title}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}
