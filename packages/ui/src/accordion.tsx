"use client";

import {
  Children,
  isValidElement,
  useId,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import styles from "./accordion.module.css";

export function Accordion({
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return <>{children}</>;
}

export function AccordionGroup({
  children,
  allowMultiple = false,
}: {
  children: ReactNode;
  allowMultiple?: boolean;
}) {
  const id = useId();
  const items = useMemo(() => {
    return Children.toArray(children).flatMap((child, index) => {
      if (!isValidElement(child)) {
        return [];
      }
      const element = child as ReactElement<{
        title?: string;
        defaultOpen?: boolean;
        children?: ReactNode;
      }>;
      const title = element.props.title;
      if (!title) {
        return [];
      }
      return [
        {
          key: `${title}-${index}`,
          title,
          defaultOpen: Boolean(element.props.defaultOpen),
          content: element.props.children,
        },
      ];
    });
  }, [children]);

  const [openKeys, setOpenKeys] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const item of items) {
      if (item.defaultOpen) {
        initial.add(item.key);
      }
    }
    return initial;
  });

  if (items.length === 0) {
    return null;
  }

  function toggle(key: string): void {
    setOpenKeys((prev) => {
      const next = new Set(allowMultiple ? prev : []);
      if (prev.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  return (
    <div className={styles.group}>
      {items.map((item, index) => {
        const open = openKeys.has(item.key);
        const panelId = `${id}-panel-${index}`;
        const buttonId = `${id}-button-${index}`;
        return (
          <div key={item.key} className={styles.item} data-open={open ? "true" : "false"}>
            <button
              type="button"
              id={buttonId}
              className={styles.trigger}
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => toggle(item.key)}
            >
              <span>{item.title}</span>
              <span className={styles.chevron} aria-hidden="true">
                {open ? "−" : "+"}
              </span>
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!open}
              className={styles.panel}
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
