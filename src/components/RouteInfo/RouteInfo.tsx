import type { RouteOption, RouteSuccess } from '../../types';
import styles from './RouteInfo.module.css';

interface RouteInfoProps {
  route: RouteSuccess | null;
  isLoading: boolean;
  error?: string | null;
  fallbackMessage?: string | null;
  routeOptions?: RouteOption[];
  selectedRouteIndex?: number;
  onSelectRoute?: (index: number) => void;
}

function formatDistance(distanceMeters: number): string {
  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

function formatDuration(durationSeconds: number): string {
  const minutes = Math.round(durationSeconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
}

export function RouteInfo({
  route,
  isLoading,
  error,
  fallbackMessage,
  routeOptions = [],
  selectedRouteIndex = 0,
  onSelectRoute,
}: RouteInfoProps) {
  const hasError = Boolean(error);
  const hasFallback = Boolean(fallbackMessage) && !route && !hasError && !isLoading;
  const hasAlternatives = routeOptions.length > 1;
  const selectedOption = routeOptions[selectedRouteIndex] ?? routeOptions[0];
  const summaryDistance = selectedOption ? selectedOption.distanceMeters : route?.total_distance;
  const summaryDuration = selectedOption ? selectedOption.durationSeconds : route?.total_time;
  const waypointCount = selectedOption ? selectedOption.geometry.length : route?.path.length;
  const hasSummary = Boolean(summaryDistance && summaryDuration && waypointCount);

  return (
    <section className={styles.card} aria-label="Route summary">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Route summary</p>
          <h2 className={styles.title}>
            {route
              ? 'Final path ready'
              : hasError
                ? 'Route failed'
                : hasFallback
                  ? 'Map preview available'
                  : isLoading
                    ? 'Finding route'
                    : 'Awaiting a route'}
          </h2>
        </div>
        <span className={styles.status}>
          {route ? 'Success' : hasError ? 'Failed' : hasFallback ? 'Preview' : isLoading ? 'Polling' : 'Idle'}
        </span>
      </header>

      {hasAlternatives ? (
        <div className={styles.alternatives} aria-label="Alternative routes">
          {routeOptions.map((option, index) => {
            const isSelected = index === selectedRouteIndex;
            return (
              <button
                key={`route-option-${index}`}
                type="button"
                className={styles.option}
                data-active={isSelected}
                onClick={() => onSelectRoute?.(index)}
              >
                <span className={styles.optionTitle}>Route {index + 1}</span>
                <span className={styles.optionMeta}>
                  {formatDuration(option.durationSeconds)} · {formatDistance(option.distanceMeters)}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {hasSummary ? (
        <dl className={styles.metrics}>
          <div className={styles.metric}>
            <dt className={styles.term}>Distance</dt>
            <dd className={styles.value}>{formatDistance(summaryDistance ?? 0)}</dd>
          </div>
          <div className={styles.metric}>
            <dt className={styles.term}>Time</dt>
            <dd className={styles.value}>{formatDuration(summaryDuration ?? 0)}</dd>
          </div>
          <div className={styles.metric}>
            <dt className={styles.term}>Waypoints</dt>
            <dd className={styles.value}>{waypointCount}</dd>
          </div>
        </dl>
      ) : hasError ? (
        <div className={styles.errorState}>
          <p className={styles.empty}>The route request could not be completed.</p>
          <p className={styles.errorMessage}>{error}</p>
        </div>
      ) : hasFallback ? (
        <p className={styles.empty}>{fallbackMessage}</p>
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
