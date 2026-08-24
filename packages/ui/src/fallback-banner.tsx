import styles from "./fallback-banner.module.css";

export function FallbackBanner({ locale }: { locale: string }) {
  return (
    <div className={styles.banner} role="status">
      <span className={styles.icon} aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M12 8v5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="12" cy="16.5" r="1" fill="currentColor" />
        </svg>
      </span>
      <p className={styles.text}>
        This page is not translated for <strong>{locale}</strong> yet. Showing the
        default language.
      </p>
    </div>
  );
}
