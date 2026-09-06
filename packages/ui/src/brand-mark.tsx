import styles from "./brand-mark.module.css";

export function BrandMark({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  return (
    <p className={styles.wrap}>
      <img className={styles.logo} src={src} alt={alt} />
    </p>
  );
}
