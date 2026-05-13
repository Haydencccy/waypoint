import { useCallback, useState } from 'react';

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
  const { submitRoute, isSubmitting, error: submitError } = useRouteSubmit();
  const routePoll = useRoutePoll(token);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const handleSubmit = useCallback(
    (values: AddressFormValues) => {
      setToken(null);

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

  return (
    <div className={styles.page}>
      <main className={styles.shell}>
        <section className={styles.hero}>
          <p className={styles.kicker}>Route Finder</p>
          <h1 className={styles.title}>Submit a pickup and drop-off, then watch the route resolve in real time.</h1>
          <p className={styles.subtitle}>
            The app posts to the mock backend, polls every 1.5 seconds, and renders the returned waypoints with a
            Google Maps layer once the route reaches success.
          </p>
          <div className={styles.badges} aria-label="App status highlights">
            <span className={styles.badge}>React 18</span>
            <span className={styles.badge}>Vite</span>
            <span className={styles.badge}>TypeScript</span>
            <span className={styles.badge}>Mock API</span>
          </div>
        </section>

        <section className={styles.grid}>
          <div className={styles.panel}>
            <AddressForm onSubmit={handleSubmit} isSubmitting={isBusy} />
            <div className={styles.spacer} />
            <ErrorBanner message={errorMessage} />
            <div className={styles.spacer} />
            <RouteInfo route={route} isLoading={routePoll.isLoading} />
          </div>

          <div className={styles.panel}>
            <MapView waypoints={route?.path ?? []} apiKey={apiKey} />
          </div>
        </section>
      </main>
    </div>
  );
}
