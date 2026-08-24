"use client";

import type { SidebarItem, SidebarNode } from "@ticidocs/core";
import { MethodBadge } from "./method-badge";
import styles from "./sidebar.module.css";

export interface SidebarProps {
  items: SidebarItem[];
  currentPath: string;
  /** Root heading when the shell scopes the tree to one product section. */
  sectionTitle?: string;
}

export function Sidebar({ items, currentPath, sectionTitle }: SidebarProps) {
  return (
    <nav id="ticidocs-sidebar" className={styles.nav}>
      {sectionTitle ? (
        <div className={styles.sectionTitle}>{sectionTitle}</div>
      ) : null}
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

        // Scoped section: skip redundant group label (shown as sectionTitle).
        if (sectionTitle) {
          return (
            <SidebarNodeList
              key={item.title}
              nodes={item.children}
              currentPath={currentPath}
            />
          );
        }

        return (
          <div key={item.title} className={styles.group}>
            <div className={styles.groupTitle}>
              {item.icon ? (
                <span className={styles.icon} aria-hidden>
                  {item.icon}
                </span>
              ) : null}
              {item.title}
            </div>
            <SidebarNodeList nodes={item.children} currentPath={currentPath} />
          </div>
        );
      })}
    </nav>
  );
}

function SidebarNodeList({
  nodes,
  currentPath,
  depth = 0,
}: {
  nodes: SidebarNode[];
  currentPath: string;
  depth?: number;
}) {
  return (
    <ul className={styles.list} data-depth={depth}>
      {nodes.map((node) => {
        if (node.type === "group") {
          return (
            <li key={`group:${node.title}`} className={styles.subGroup}>
              <div className={styles.subGroupTitle}>
                {node.icon ? (
                  <span className={styles.icon} aria-hidden>
                    {node.icon}
                  </span>
                ) : null}
                {node.title}
              </div>
              <SidebarNodeList
                nodes={node.children}
                currentPath={currentPath}
                depth={depth + 1}
              />
            </li>
          );
        }

        const active = node.href === currentPath;
        return (
          <li key={node.href}>
            <a
              className={`${styles.link} ${node.method ? styles.apiLink : ""} ${active ? styles.active : ""}`}
              href={node.href}
              aria-current={active ? "page" : undefined}
            >
              {node.method ? (
                <MethodBadge method={node.method} compact />
              ) : node.icon ? (
                <span className={styles.icon} aria-hidden>
                  {node.icon}
                </span>
              ) : null}
              <span className={styles.linkText}>{node.title}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
