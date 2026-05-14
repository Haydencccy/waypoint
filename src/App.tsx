import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';

import { resolveAddressPoint, reverseGeocodePoint } from './api/geocodeApi';
import { fetchRouteOptions } from './api/routingApi';
import { AddressForm } from './components/AddressForm/AddressForm';
import { ErrorBanner } from './components/ErrorBanner/ErrorBanner';
import { RouteInfo } from './components/RouteInfo/RouteInfo';
import { useRoutePoll } from './hooks/useRoutePoll';
import { useRouteSubmit } from './hooks/useRouteSubmit';
import type { AddressFormValues, RouteOption } from './types';
import styles from './App.module.css';

const MapView = lazy(async () => {
  const module = await import('./components/MapView/MapView');
  return { default: module.MapView };
});

export function App() {
  const [token, setToken] = useState<string | null>(null);
  const [originPoint, setOriginPoint] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [destinationPoint, setDestinationPoint] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [draftValues, setDraftValues] = useState<AddressFormValues>({ origin: '', destination: '' });
  const [activeField, setActiveField] = useState<keyof AddressFormValues | null>(null);
  const activeFieldRef = useRef<keyof AddressFormValues | null>(null);
  const [selectedOriginText, setSelectedOriginText] = useState<string | null>(null);
  const [selectedDestinationText, setSelectedDestinationText] = useState<string | null>(null);
  const [selectedSuggestionPoints, setSelectedSuggestionPoints] = useState<{
    origin: { text: string; lat: number; lng: number } | null;
    destination: { text: string; lat: number; lng: number } | null;
  }>({
    origin: null,
    destination: null,
  });
  const [nextMapPick, setNextMapPick] = useState<'origin' | 'destination'>('origin');
  const nextMapPickRef = useRef<'origin' | 'destination'>('origin');
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const { submitRoute, isSubmitting, error: submitError } = useRouteSubmit();
  const routePoll = useRoutePoll(token);

  const handleSubmit = useCallback(
    (values: AddressFormValues) => {
      setToken(null);
      setRouteOptions([]);
      setSelectedRouteIndex(0);
      setDraftValues(values);

      void Promise.all([resolveAddressPoint(values.origin), resolveAddressPoint(values.destination)])
        .then(([origin, destination]) => {
          setOriginPoint(origin ? { lat: origin.latitude, lng: origin.longitude, label: values.origin } : null);
          setDestinationPoint(
            destination ? { lat: destination.latitude, lng: destination.longitude, label: values.destination } : null,
          );
          setSelectedOriginText(values.origin);
          setSelectedDestinationText(values.destination);
        })
        .catch(() => {
          setOriginPoint(null);
          setDestinationPoint(null);
          setRouteOptions([]);
          setSelectedRouteIndex(0);
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
  const selectedRouteOption = routeOptions[selectedRouteIndex] ?? null;
  const hasMapPreview = Boolean(selectedRouteOption && selectedRouteOption.geometry.length > 1);
  const shouldUsePreviewFallback = Boolean((routePoll.error || submitError) && hasMapPreview && !route);
  const fallbackMessage = shouldUsePreviewFallback
    ? 'Mock API could not return a final route status for this pair, but a drivable map preview is shown.'
    : null;
  const uiErrorMessage = shouldUsePreviewFallback ? null : errorMessage;

  useEffect(() => {
    if (!originPoint || !destinationPoint) {
      setRouteOptions([]);
      setSelectedRouteIndex(0);
      return;
    }

    const controller = new AbortController();

    void fetchRouteOptions(
      { lat: originPoint.lat, lng: originPoint.lng },
      { lat: destinationPoint.lat, lng: destinationPoint.lng },
      controller.signal,
    )
      .then((nextRouteOptions) => {
        setRouteOptions(nextRouteOptions);
        setSelectedRouteIndex(0);
      })
      .catch(() => {
        setRouteOptions([]);
        setSelectedRouteIndex(0);
      });

    return () => {
      controller.abort();
    };
  }, [destinationPoint, originPoint]);

  useEffect(() => {
    const originQuery = draftValues.origin.trim();
    const destinationQuery = draftValues.destination.trim();
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      if (!originQuery) {
        setOriginPoint(null);
      } else if (selectedSuggestionPoints.origin && selectedSuggestionPoints.origin.text === originQuery) {
        setOriginPoint({
          lat: selectedSuggestionPoints.origin.lat,
          lng: selectedSuggestionPoints.origin.lng,
          label: draftValues.origin,
        });
      } else {
        void resolveAddressPoint(originQuery, controller.signal)
          .then((origin) => {
            if (!origin) {
              return;
            }

            setOriginPoint({
              lat: origin.latitude,
              lng: origin.longitude,
              label: draftValues.origin,
            });
          })
          .catch(() => undefined);
      }

      if (!destinationQuery) {
        setDestinationPoint(null);
      } else if (selectedSuggestionPoints.destination && selectedSuggestionPoints.destination.text === destinationQuery) {
        setDestinationPoint({
          lat: selectedSuggestionPoints.destination.lat,
          lng: selectedSuggestionPoints.destination.lng,
          label: draftValues.destination,
        });
      } else {
        void resolveAddressPoint(destinationQuery, controller.signal)
          .then((destination) => {
            if (!destination) {
              return;
            }

            setDestinationPoint({
              lat: destination.latitude,
              lng: destination.longitude,
              label: draftValues.destination,
            });
          })
          .catch(() => undefined);
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [draftValues, selectedSuggestionPoints.destination, selectedSuggestionPoints.origin]);

  useEffect(() => {
    const originText = draftValues.origin.trim();
    const destinationText = draftValues.destination.trim();

    setSelectedSuggestionPoints((current) => ({
      origin: current.origin && current.origin.text === originText ? current.origin : null,
      destination: current.destination && current.destination.text === destinationText ? current.destination : null,
    }));
  }, [draftValues.destination, draftValues.origin]);

  const handleActiveFieldChange = useCallback((field: keyof AddressFormValues | null) => {
    activeFieldRef.current = field;
    setActiveField(field);
    if (field) {
      nextMapPickRef.current = field;
      setNextMapPick(field);
    }
  }, []);

  const handleMapClick = useCallback(
    async (point: { lat: number; lng: number; label: string }) => {
      const target = activeFieldRef.current ?? nextMapPickRef.current;
      const resolvedPoint = (await reverseGeocodePoint(point.lat, point.lng)) ?? point;
      const nextPoint =
        'latitude' in resolvedPoint
          ? {
              lat: resolvedPoint.latitude,
              lng: resolvedPoint.longitude,
              label: resolvedPoint.displayName,
            }
          : resolvedPoint;

      if (target === 'origin') {
        setOriginPoint(nextPoint);
        setSelectedOriginText(nextPoint.label);
        setSelectedSuggestionPoints((current) => ({
          ...current,
          origin: {
            text: nextPoint.label,
            lat: nextPoint.lat,
            lng: nextPoint.lng,
          },
        }));
        setDraftValues((current) => ({
          ...current,
          origin: nextPoint.label,
        }));
        nextMapPickRef.current = 'destination';
        setNextMapPick('destination');
        return;
      }

      setDestinationPoint(nextPoint);
      setSelectedDestinationText(nextPoint.label);
      setSelectedSuggestionPoints((current) => ({
        ...current,
        destination: {
          text: nextPoint.label,
          lat: nextPoint.lat,
          lng: nextPoint.lng,
        },
      }));
      setDraftValues((current) => ({
        ...current,
        destination: nextPoint.label,
      }));
      nextMapPickRef.current = 'origin';
      setNextMapPick('origin');
    },
    [],
  );

  return (
    <div className={styles.page}>
      <main className={styles.shell}>
        <section className={styles.hero}>
          <p className={styles.kicker}>Route Finder</p>
          <h1 className={styles.title}>Submit a pickup and drop-off, then watch the route resolve in real time.</h1>
          <p className={styles.subtitle}>
            The app posts to the mock backend for status polling while route lines, alternatives, and live travel
            estimates are calculated from OSRM for map-style navigation feedback.
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
              onActiveFieldChange={handleActiveFieldChange}
              onSubmit={handleSubmit}
              onValuesChange={setDraftValues}
              onSuggestionSelect={(field, suggestion) => {
                const trimmedName = suggestion.displayName.trim();
                setSelectedSuggestionPoints((current) => ({
                  ...current,
                  [field]: {
                    text: trimmedName,
                    lat: suggestion.lat,
                    lng: suggestion.lng,
                  },
                }));
                // Immediately update map without waiting for debounce
                if (field === 'origin') {
                  setOriginPoint({
                    lat: suggestion.lat,
                    lng: suggestion.lng,
                    label: trimmedName,
                  });
                  setSelectedOriginText(trimmedName);
                } else {
                  setDestinationPoint({
                    lat: suggestion.lat,
                    lng: suggestion.lng,
                    label: trimmedName,
                  });
                  setSelectedDestinationText(trimmedName);
                }
              }}
              isSubmitting={isBusy}
              selectedOrigin={selectedOriginText}
              selectedDestination={selectedDestinationText}
            />
            <div className={styles.spacer} />
            <ErrorBanner message={uiErrorMessage} />
            <div className={styles.spacer} />
            <RouteInfo
              route={route}
              isLoading={routePoll.isLoading}
              error={uiErrorMessage}
              fallbackMessage={fallbackMessage}
              routeOptions={routeOptions}
              selectedRouteIndex={selectedRouteIndex}
              onSelectRoute={setSelectedRouteIndex}
            />
          </div>

          <div className={styles.panel}>
            <Suspense fallback={<div className={styles.mapLoading}>Loading map…</div>}>
              <MapView
                waypoints={route?.path ?? []}
                originPoint={originPoint}
                destinationPoint={destinationPoint}
                routeOptions={routeOptions}
                selectedRouteIndex={selectedRouteIndex}
                onMapClick={handleMapClick}
              />
            </Suspense>
          </div>
        </section>
      </main>
    </div>
  );
}
