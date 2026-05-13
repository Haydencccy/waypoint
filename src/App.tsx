import { useCallback, useEffect, useState } from 'react';

import { resolveAddressPoint, reverseGeocodePoint } from './api/geocodeApi';
import { fetchRouteGeometry } from './api/routingApi';
import { AddressForm } from './components/AddressForm/AddressForm';
import { ErrorBanner } from './components/ErrorBanner/ErrorBanner';
import { MapView } from './components/MapView/MapView';
import { RouteInfo } from './components/RouteInfo/RouteInfo';
import { useRoutePoll } from './hooks/useRoutePoll';
import { useRouteSubmit } from './hooks/useRouteSubmit';
import type { AddressFormValues } from './types';
import styles from './App.module.css';

export function App() {
  const [token, setToken] = useState<string | null>(null);
  const [originPoint, setOriginPoint] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [destinationPoint, setDestinationPoint] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [selectedOriginText, setSelectedOriginText] = useState<string | null>(null);
  const [selectedDestinationText, setSelectedDestinationText] = useState<string | null>(null);
  const [nextMapPick, setNextMapPick] = useState<'origin' | 'destination'>('origin');
  const [routeGeometry, setRouteGeometry] = useState<Array<{ lat: number; lng: number }> | null>(null);
  const { submitRoute, isSubmitting, error: submitError } = useRouteSubmit();
  const routePoll = useRoutePoll(token);

  const handleSubmit = useCallback(
    (values: AddressFormValues) => {
      setToken(null);
      setRouteGeometry(null);

      void Promise.all([resolveAddressPoint(values.origin), resolveAddressPoint(values.destination)])
        .then(([origin, destination]) => {
          setOriginPoint(origin ? { lat: origin.latitude, lng: origin.longitude, label: origin.displayName } : null);
          setDestinationPoint(
            destination ? { lat: destination.latitude, lng: destination.longitude, label: destination.displayName } : null,
          );
          setSelectedOriginText(origin?.displayName ?? values.origin);
          setSelectedDestinationText(destination?.displayName ?? values.destination);
        })
        .catch(() => {
          setOriginPoint(null);
          setDestinationPoint(null);
          setRouteGeometry(null);
        });

      void submitRoute(values)
        .then(({ token: nextToken }) => {
          setToken(nextToken);
        })
        .catch(() => {
          setToken(null);
        });
    },
    [submitRoute],
  );

  const errorMessage = routePoll.error ?? submitError;
  const route = routePoll.route;
  const isBusy = isSubmitting || routePoll.isLoading;

  useEffect(() => {
    if (!originPoint || !destinationPoint) {
      return;
    }

    const controller = new AbortController();

    void fetchRouteGeometry(
      { lat: originPoint.lat, lng: originPoint.lng },
      { lat: destinationPoint.lat, lng: destinationPoint.lng },
      controller.signal,
    )
      .then((geometry) => {
        setRouteGeometry(geometry);
      })
      .catch(() => {
        setRouteGeometry(null);
      });

    return () => {
      controller.abort();
    };
  }, [destinationPoint, originPoint]);

  const handleMapClick = useCallback(
    async (point: { lat: number; lng: number; label: string }) => {
      const resolvedPoint = (await reverseGeocodePoint(point.lat, point.lng)) ?? point;
      const nextPoint =
        'latitude' in resolvedPoint
          ? {
              lat: resolvedPoint.latitude,
              lng: resolvedPoint.longitude,
              label: resolvedPoint.displayName,
            }
          : resolvedPoint;

      if (nextMapPick === 'origin') {
        setOriginPoint(nextPoint);
        setSelectedOriginText(nextPoint.label);
        setNextMapPick('destination');
        return;
      }

      setDestinationPoint(nextPoint);
      setSelectedDestinationText(nextPoint.label);
      setNextMapPick('origin');
    },
    [nextMapPick],
  );

  return (
    <div className={styles.page}>
      <main className={styles.shell}>
        <section className={styles.hero}>
          <p className={styles.kicker}>Route Finder</p>
          <h1 className={styles.title}>Submit a pickup and drop-off, then watch the route resolve in real time.</h1>
          <p className={styles.subtitle}>
            The app posts to the mock backend, polls every 1.5 seconds, and renders the returned waypoints on an
            OpenLayers base map once the route reaches success.
          </p>
          <div className={styles.badges} aria-label="App status highlights">
            <span className={styles.badge}>React 18</span>
            <span className={styles.badge}>Vite</span>
            <span className={styles.badge}>TypeScript</span>
            <span className={styles.badge}>OpenLayers</span>
          </div>
        </section>

        <section className={styles.grid}>
          <div className={styles.panel}>
            <AddressForm
              onSubmit={handleSubmit}
              isSubmitting={isBusy}
              selectedOrigin={selectedOriginText}
              selectedDestination={selectedDestinationText}
            />
            <div className={styles.spacer} />
            <ErrorBanner message={errorMessage} />
            <div className={styles.spacer} />
            <RouteInfo route={route} isLoading={routePoll.isLoading} />
          </div>

          <div className={styles.panel}>
            <MapView
              waypoints={route?.path ?? []}
              originPoint={originPoint}
              destinationPoint={destinationPoint}
              routeGeometry={routeGeometry}
              onMapClick={handleMapClick}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
