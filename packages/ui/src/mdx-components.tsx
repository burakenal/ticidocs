import type { MDXComponents } from "mdx/types";
import { Callout } from "./callout";
import { Tabs, Tab } from "./tabs";
import { Steps, Step } from "./steps";
import { Card, CardGroup } from "./cards";
import { Accordion, AccordionGroup } from "./accordion";
import { CodeGroup } from "./code-group";
import { CodeBlock } from "./code-block";
import { Columns, Column } from "./columns";
import { Hero, HeroAction } from "./hero";
import { SectionHeading } from "./section-heading";
import styles from "./markdown-body.module.css";

export const mdxComponents: MDXComponents = {
  Callout,
  Tabs,
  Tab,
  Steps,
  Step,
  Card,
  CardGroup,
  Accordion,
  AccordionGroup,
  CodeGroup,
  Columns,
  Column,
  Hero,
  HeroAction,
  SectionHeading,
  wrapper: ({ children }) => <div className={styles.prose}>{children}</div>,
  pre: (props) => <CodeBlock {...props} />,
};
