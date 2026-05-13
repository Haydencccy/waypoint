import styles from './ErrorBanner.module.css';

interface ErrorBannerProps {
  message: string | null;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  if (!message) {
    return null;
  }

  return (
    <aside className={styles.banner} role="alert" aria-live="polite">
      <div className={styles.accent} aria-hidden="true" />
      <div className={styles.content}>
        <p className={styles.label}>Route error</p>
        <p className={styles.message}>{message}</p>
      </div>
    </aside>
  );
}
