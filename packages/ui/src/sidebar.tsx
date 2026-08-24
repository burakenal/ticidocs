"use client";

import { useEffect, useId, useState } from "react";
import type { SidebarGroup, SidebarItem, SidebarNode } from "@ticidocs/core";
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

function groupContainsPath(node: SidebarGroup, currentPath: string): boolean {
  return node.children.some((child) => nodeContainsPath(child, currentPath));
}

function nodeContainsPath(node: SidebarNode, currentPath: string): boolean {
  if (node.type === "page") {
    return node.href === currentPath;
  }
  return groupContainsPath(node, currentPath);
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
          if (node.collapsible === false) {
            return (
              <StaticSectionGroup
                key={`group:${node.title}`}
                node={node}
                currentPath={currentPath}
                depth={depth}
              />
            );
          }
          return (
            <CollapsibleGroup
              key={`group:${node.title}`}
              node={node}
              currentPath={currentPath}
              depth={depth}
            />
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

/** OpenAPI root label — same visual weight as the product section title. */
function StaticSectionGroup({
  node,
  currentPath,
  depth,
}: {
  node: SidebarGroup;
  currentPath: string;
  depth: number;
}) {
  return (
    <li className={styles.staticSection}>
      <div className={styles.staticSectionTitle}>
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

function CollapsibleGroup({
  node,
  currentPath,
  depth,
}: {
  node: SidebarGroup;
  currentPath: string;
  depth: number;
}) {
  const containsActive = groupContainsPath(node, currentPath);
  const [open, setOpen] = useState(containsActive);
  const panelId = useId();

  useEffect(() => {
    if (containsActive) {
      setOpen(true);
    }
  }, [containsActive]);

  return (
    <li className={styles.subGroup} data-open={open ? "true" : "false"}>
      <button
        type="button"
        className={styles.subGroupTrigger}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        {node.icon ? (
          <span className={styles.icon} aria-hidden>
            {node.icon}
          </span>
        ) : null}
        <span className={styles.subGroupLabel}>{node.title}</span>
        <span className={styles.chevron} aria-hidden="true">
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      <div id={panelId} hidden={!open} className={styles.subGroupPanel}>
        <SidebarNodeList
          nodes={node.children}
          currentPath={currentPath}
          depth={depth + 1}
        />
      </div>
    </li>
  );
}
