import type { MDXComponents } from "mdx/types";
import { Callout } from "./callout";
import { Tabs, Tab } from "./tabs";
import { Steps, Step } from "./steps";
import { Card, CardGroup } from "./cards";
import { BrandMark } from "./brand-mark";
import { Accordion, AccordionGroup } from "./accordion";
import { CodeGroup } from "./code-group";
import { CodeBlock } from "./code-block";
import { Columns, Column } from "./columns";
import { Hero, HeroAction } from "./hero";
import { LogoBand, LogoBandItem } from "./logo-band";
import { SectionHeading } from "./section-heading";
import { RequestSample } from "./request-sample";
import styles from "./markdown-body.module.css";

export const mdxComponents: MDXComponents = {
  Callout,
  Tabs,
  Tab,
  Steps,
  Step,
  Card,
  CardGroup,
  BrandMark,
  Accordion,
  AccordionGroup,
  CodeGroup,
  RequestSample,
  Columns,
  Column,
  Hero,
  HeroAction,
  LogoBand,
  LogoBandItem,
  SectionHeading,
  wrapper: ({ children }) => <div className={styles.prose}>{children}</div>,
  pre: (props) => <CodeBlock {...props} />,
};
