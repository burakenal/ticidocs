import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import styles from "./steps.module.css";

export function Step({
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return <>{children}</>;
}

export function Steps({ children }: { children: ReactNode }) {
  const steps = Children.toArray(children).flatMap((child, index) => {
    if (!isValidElement(child)) {
      return [];
    }
    const element = child as ReactElement<{ title?: string; children?: ReactNode }>;
    if (!element.props.title) {
      return [];
    }
    return [
      {
        index: index + 1,
        title: element.props.title,
        content: element.props.children,
      },
    ];
  });

  return (
    <ol className={styles.steps}>
      {steps.map((step) => (
        <li key={step.title} className={styles.step}>
          <div className={styles.marker} aria-hidden>
            {step.index}
          </div>
          <div className={styles.content}>
            <h3 className={styles.title}>{step.title}</h3>
            <div className={styles.body}>{step.content}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}
