import { Loader } from '@googlemaps/js-api-loader';
import { useEffect, useMemo, useRef, useState } from 'react';

import { waypointToLatLng, waypointsToLatLng } from '../../utils/mapHelpers';
import type { Waypoint } from '../../types';
import { WaypointMarker } from '../WaypointMarker/WaypointMarker';
import styles from './MapView.module.css';

interface LoaderLike {
  load: () => Promise<unknown>;
}

interface MapViewProps {
  waypoints: Waypoint[];
  apiKey?: string;
  loaderFactory?: (apiKey: string) => LoaderLike;
}

type MapLoadState = 'idle' | 'loading' | 'ready' | 'error' | 'missing-key';

function createLoader(apiKey: string): LoaderLike {
  return new Loader({
    apiKey,
    version: 'weekly',
  });
}

function getOverlayMessage(state: MapLoadState): string {
  switch (state) {
    case 'missing-key':
      return 'Set VITE_GOOGLE_MAPS_API_KEY to render the map.';
    case 'loading':
      return 'Loading Google Maps and fitting the route bounds.';
    case 'error':
      return 'The map shell is unavailable. Route data is still shown below.';
    default:
      return 'Submit a route to reveal the waypoint trail.';
  }
}

export function MapView({ waypoints, apiKey, loaderFactory = createLoader }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<MapLoadState>('idle');
  const waypointList = useMemo(() => waypointsToLatLng(waypoints), [waypoints]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    if (waypointList.length === 0) {
      setState(apiKey ? 'idle' : 'missing-key');
      return;
    }

    if (!apiKey) {
      setState('missing-key');
      return;
    }

    let active = true;
    const cleanupCallbacks: Array<() => void> = [];

    setState('loading');

    void loaderFactory(apiKey)
      .load()
      .then(() => {
        if (!active || !mapRef.current || !window.google?.maps) {
          return;
        }

        const coordinates = waypoints.map(waypointToLatLng);
        const map = new window.google.maps.Map(mapRef.current, {
          center: coordinates[0],
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: false,
          gestureHandling: 'greedy',
          styles: [
            {
              elementType: 'geometry',
              stylers: [{ color: '#0f172a' }],
            },
            {
              elementType: 'labels.text.fill',
              stylers: [{ color: '#cbd5e1' }],
            },
            {
              elementType: 'labels.text.stroke',
              stylers: [{ color: '#0f172a' }],
            },
          ],
        });

        const bounds = new window.google.maps.LatLngBounds();
        const markers = coordinates.map((position, index) => {
          bounds.extend(position);
          const marker = new window.google.maps.Marker({
            map,
            position,
            label: String(index + 1),
            title: `Waypoint ${index + 1}`,
          });
          cleanupCallbacks.push(() => marker.setMap(null));
          return marker;
        });

        const polyline = new window.google.maps.Polyline({
          map,
          path: coordinates,
          strokeColor: '#f59e0b',
          strokeOpacity: 0.95,
          strokeWeight: 4,
          geodesic: true,
        });
        cleanupCallbacks.push(() => polyline.setMap(null));

        if (markers.length > 1) {
          map.fitBounds(bounds, 48);
        } else {
          map.setCenter(coordinates[0]);
          map.setZoom(14);
        }

        setState('ready');
      })
      .catch(() => {
        if (active) {
          setState('error');
        }
      });

    return () => {
      active = false;
      cleanupCallbacks.forEach((cleanup) => cleanup());
    };
  }, [apiKey, loaderFactory, waypointList, waypoints]);

  return (
    <section className={styles.card} aria-label="Map view">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Map view</p>
          <h2 className={styles.title}>Waypoint trail</h2>
        </div>
        <span className={styles.status}>{state}</span>
      </header>

      <div className={styles.canvasWrap}>
        <div ref={mapRef} className={styles.canvas} aria-hidden="true" />
        {state !== 'ready' ? (
          <div className={styles.overlay}>
            <p className={styles.overlayText}>{getOverlayMessage(state)}</p>
          </div>
        ) : null}
      </div>

      <div className={styles.list} aria-label="Waypoint list">
        {waypoints.length > 0 ? (
          waypoints.map((waypoint, index) => (
            <div key={`${waypoint[0]}-${waypoint[1]}-${index}`} className={styles.row}>
              <WaypointMarker index={index} />
              <div className={styles.rowContent}>
                <span className={styles.rowLabel}>Waypoint {index + 1}</span>
                <span className={styles.rowValue}>
                  {waypoint[0]}, {waypoint[1]}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className={styles.empty}>No route loaded yet. The map will populate after a successful poll.</p>
        )}
      </div>
    </section>
  );
}
