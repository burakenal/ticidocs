import {
  localePath,
  resolveLocalized,
  type DocsFooterConfig,
  type DocsLogo,
} from "@ticidocs/core";
import styles from "./footer.module.css";

export interface FooterProps {
  name: string;
  locale: string;
  defaultLocale?: string;
  version?: string;
  logo?: DocsLogo;
  footer: DocsFooterConfig;
}

function resolveHref(href: string, locale: string, version?: string) {
  if (/^https?:\/\//i.test(href) || href.startsWith("mailto:")) {
    return href;
  }
  const trimmed = href.replace(/^\/+/, "").replace(/\/+$/, "");
  if (!trimmed || trimmed === "index") {
    return localePath(locale, "", version);
  }
  return localePath(locale, trimmed, version);
}

export function Footer({
  name,
  locale,
  defaultLocale,
  version,
  logo,
  footer,
}: FooterProps) {
  const description = resolveLocalized(
    footer.description,
    locale,
    defaultLocale,
  );
  const copyright = resolveLocalized(footer.copyright, locale, defaultLocale);
  const navGroups = footer.navGroups ?? [];
  const socials = footer.socials ?? [];

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brand}>
            {logo ? (
              <>
                <img
                  className={`${styles.logo} ${styles.logoLight}`}
                  src={logo.light}
                  alt={name}
                />
                <img
                  className={`${styles.logo} ${styles.logoDark}`}
                  src={logo.dark}
                  alt={name}
                />
              </>
            ) : (
              <div className={styles.name}>{name}</div>
            )}
            {description ? (
              <p className={styles.description}>{description}</p>
            ) : null}
          </div>

          {navGroups.map((group) => {
            const title = resolveLocalized(group.title, locale, defaultLocale);
            return (
              <nav
                key={title ?? String(group.title)}
                className={styles.group}
                aria-label={title}
              >
                {title ? <h2 className={styles.groupTitle}>{title}</h2> : null}
                <ul className={styles.links}>
                  {group.links.map((link) => {
                    const label = resolveLocalized(
                      link.label,
                      locale,
                      defaultLocale,
                    );
                    if (!label) {
                      return null;
                    }
                    const href = resolveHref(link.href, locale, version);
                    const external =
                      link.external ?? /^https?:\/\//i.test(link.href);
                    return (
                      <li key={`${label}-${href}`}>
                        <a
                          className={styles.link}
                          href={href}
                          {...(external
                            ? {
                                target: "_blank",
                                rel: "noopener noreferrer",
                              }
                            : {})}
                        >
                          {label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            );
          })}
        </div>

        {copyright || socials.length > 0 ? (
          <div className={styles.bottom}>
            {copyright ? <p className={styles.copyright}>{copyright}</p> : null}
            {socials.length > 0 ? (
              <ul className={styles.socials}>
                {socials.map((social) => (
                  <li key={social.href}>
                    <a
                      className={styles.social}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {social.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </footer>
  );
}
