import type { MDXComponents } from "mdx/types";
import { Callout } from "./callout";
import { Tabs, Tab } from "./tabs";
import { Steps, Step } from "./steps";
import { Card, CardGroup } from "./cards";
import { CodeBlock } from "./code-block";
import styles from "./markdown-body.module.css";

export const mdxComponents: MDXComponents = {
  Callout,
  Tabs,
  Tab,
  Steps,
  Step,
  Card,
  CardGroup,
  wrapper: ({ children }) => <div className={styles.prose}>{children}</div>,
  pre: (props) => <CodeBlock {...props} />,
};
