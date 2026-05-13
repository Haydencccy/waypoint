import type { RouteSuccess } from '../../types';
import { formatMetric } from '../../utils/mapHelpers';
import styles from './RouteInfo.module.css';

interface RouteInfoProps {
  route: RouteSuccess | null;
  isLoading: boolean;
}

export function RouteInfo({ route, isLoading }: RouteInfoProps) {
  return (
    <section className={styles.card} aria-label="Route summary">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Route summary</p>
          <h2 className={styles.title}>{route ? 'Final path ready' : 'Awaiting a route'}</h2>
        </div>
        <span className={styles.status}>{isLoading ? 'Polling' : route ? 'Success' : 'Idle'}</span>
      </header>

      {route ? (
        <dl className={styles.metrics}>
          <div className={styles.metric}>
            <dt className={styles.term}>Distance</dt>
            <dd className={styles.value}>{formatMetric(route.total_distance)}</dd>
          </div>
          <div className={styles.metric}>
            <dt className={styles.term}>Time</dt>
            <dd className={styles.value}>{formatMetric(route.total_time)}</dd>
          </div>
          <div className={styles.metric}>
            <dt className={styles.term}>Waypoints</dt>
            <dd className={styles.value}>{formatMetric(route.path.length)}</dd>
          </div>
        </dl>
      ) : (
        <p className={styles.empty}>
          {isLoading
            ? 'Polling the mock API for terminal route data.'
            : 'Enter an origin and destination to start polling for a route.'}
        </p>
      )}
    </section>
  );
}
