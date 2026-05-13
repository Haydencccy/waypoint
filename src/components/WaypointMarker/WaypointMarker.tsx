import styles from './WaypointMarker.module.css';

interface WaypointMarkerProps {
  index: number;
}

export function WaypointMarker({ index }: WaypointMarkerProps) {
  return (
    <span className={styles.marker} aria-hidden="true">
      <span className={styles.index}>{index + 1}</span>
    </span>
  );
}
