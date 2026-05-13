import { useEffect, useMemo, useRef, useState } from 'react';

import Feature from 'ol/Feature';
import Map from 'ol/Map';
import Overlay from 'ol/Overlay';
import View from 'ol/View';
import { LineString, Point } from 'ol/geom';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { defaults as defaultControls } from 'ol/control';
import type { Coordinate } from 'ol/coordinate';
import XYZ from 'ol/source/XYZ';
import VectorSource from 'ol/source/Vector';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';
import 'ol/ol.css';

import { waypointsToLatLng } from '../../utils/mapHelpers';
import type { RouteOption, Waypoint } from '../../types';
import { WaypointMarker } from '../WaypointMarker/WaypointMarker';
import styles from './MapView.module.css';

interface MapViewProps {
  waypoints: Waypoint[];
  originPoint?: { lat: number; lng: number; label: string } | null;
  destinationPoint?: { lat: number; lng: number; label: string } | null;
  routeOptions?: RouteOption[];
  selectedRouteIndex?: number;
  onMapClick?: (point: { lat: number; lng: number; label: string }) => void;
}

type MapLoadState = 'empty' | 'ready' | 'error';

const DEFAULT_CENTER = fromLonLat([114.1694, 22.3193]);
const BASE_MAP_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const DISCLAIMER_URL = 'https://api.portal.hkmapservice.gov.hk/disclaimer';
const LANDSD_LOGO_URL = 'https://api.hkmapservice.gov.hk/mapapi/landsdlogo.jpg';

function createRouteStyle(isPrimary: boolean) {
  return new Style({
    stroke: new Stroke({
      color: isPrimary ? '#4f46e5' : 'rgba(99, 102, 241, 0.55)',
      width: isPrimary ? 6 : 4,
      lineDash: isPrimary ? undefined : [8, 10],
    }),
  });
}

function waypointColor(index: number, total: number): string {
  if (total === 1) {
    return '#f59e0b';
  }

  if (index === 0) {
    return '#0ea5e9';
  }

  if (index === total - 1) {
    return '#22c55e';
  }

  return '#f97316';
}

function createWaypointStyle(index: number, total: number) {
  const color = waypointColor(index, total);

  return new Style({
    image: new CircleStyle({
      radius: 16,
      stroke: new Stroke({ color: '#f8fafc', width: 2 }),
      fill: new Fill({ color }),
    }),
    text: new Text({
      text: String(index + 1),
      font: '700 12px "IBM Plex Mono", monospace',
      fill: new Fill({ color: '#0f172a' }),
      stroke: new Stroke({ color: '#f8fafc', width: 1 }),
    }),
  });
}

function createEndpointStyle(label: string, color: string) {
  return new Style({
    image: new CircleStyle({
      radius: 17,
      stroke: new Stroke({ color: '#f8fafc', width: 2 }),
      fill: new Fill({ color }),
    }),
    text: new Text({
      text: label,
      font: '800 12px "IBM Plex Mono", monospace',
      fill: new Fill({ color: '#0f172a' }),
      stroke: new Stroke({ color: '#f8fafc', width: 1 }),
    }),
  });
}

function getOverlayMessage(state: MapLoadState): string {
  switch (state) {
    case 'error':
      return 'The map could not be created. Route data is still shown below.';
    case 'empty':
      return 'Submit a route to render the waypoints on the map.';
    default:
      return 'Route rendered on the map.';
  }
}

function formatClickedPoint(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export function MapView({
  waypoints,
  originPoint,
  destinationPoint,
  routeOptions = [],
  selectedRouteIndex = 0,
  onMapClick,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const vectorSourceRef = useRef<VectorSource | null>(null);
  const [state, setState] = useState<MapLoadState>('empty');
  const coordinates = useMemo<Coordinate[]>(() => {
    return waypointsToLatLng(waypoints).map(({ lat, lng }) => fromLonLat([lng, lat]));
  }, [waypoints]);
  const routeGeometryCoordinates = useMemo<Coordinate[][]>(() => {
    return routeOptions
      .map((option) => option.geometry.map(({ lat, lng }) => fromLonLat([lng, lat])))
      .filter((option) => option.length > 1);
  }, [routeOptions]);
  const originCoordinate = useMemo<Coordinate | null>(() => {
    if (!originPoint) {
      return null;
    }

    return fromLonLat([originPoint.lng, originPoint.lat]);
  }, [originPoint]);
  const destinationCoordinate = useMemo<Coordinate | null>(() => {
    if (!destinationPoint) {
      return null;
    }

    return fromLonLat([destinationPoint.lng, destinationPoint.lat]);
  }, [destinationPoint]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) {
      return;
    }

    try {
      const vectorSource = new VectorSource();
      vectorSourceRef.current = vectorSource;

      const baseLayer = new TileLayer({
        source: new XYZ({
          url: BASE_MAP_URL,
          crossOrigin: 'anonymous',
          attributions: '© OpenStreetMap contributors',
          maxZoom: 19,
        }),
      });

      const map = new Map({
        target: mapRef.current,
        controls: defaultControls({ attribution: false, rotate: false, zoom: true }),
        layers: [baseLayer, new VectorLayer({ source: vectorSource })],
        view: new View({
          center: DEFAULT_CENTER,
          zoom: 11,
          minZoom: 10,
          maxZoom: 20,
        }),
      });

      mapInstanceRef.current = map;

      map.on('singleclick', (event) => {
        const [lng, lat] = toLonLat(event.coordinate);
        onMapClick?.({
          lat,
          lng,
          label: formatClickedPoint(lat, lng),
        });
      });

      if (overlayRef.current) {
        const overlay = new Overlay({
          element: overlayRef.current,
          positioning: 'bottom-center',
          stopEvent: false,
          offset: [0, -12],
        });
        map.addOverlay(overlay);
      }
    } catch {
      setState('error');
    }

    return () => {
      mapInstanceRef.current?.setTarget(undefined);
      mapInstanceRef.current = null;
      vectorSourceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const source = vectorSourceRef.current;
    const map = mapInstanceRef.current;

    if (!source || !map) {
      return;
    }

    source.clear();

    const selectedCoordinates = routeGeometryCoordinates[selectedRouteIndex] ?? routeGeometryCoordinates[0] ?? [];
    const lineCoordinates = selectedCoordinates.length > 1 ? selectedCoordinates : coordinates;
    const fitCoordinates = [
      ...lineCoordinates,
      ...(originCoordinate ? [originCoordinate] : []),
      ...(destinationCoordinate ? [destinationCoordinate] : []),
    ];

    if (lineCoordinates.length === 0 && fitCoordinates.length === 0) {
      setState('empty');
      return;
    }

    if (lineCoordinates.length > 1) {
      routeGeometryCoordinates.forEach((routeOptionCoordinates, index) => {
        const routeFeature = new Feature({
          geometry: new LineString(routeOptionCoordinates),
        });
        routeFeature.setStyle(createRouteStyle(index === selectedRouteIndex));
        source.addFeature(routeFeature);
      });

      // keep selected route on top by adding it last again
      const routeFeature = new Feature({
        geometry: new LineString(lineCoordinates),
      });
      routeFeature.setStyle(createRouteStyle(true));
      source.addFeature(routeFeature);
    }

    const shouldRenderCheckpointMarkers = !originCoordinate && !destinationCoordinate;

    if (shouldRenderCheckpointMarkers) {
      coordinates.forEach((coordinate, index) => {
        const waypointFeature = new Feature({
          geometry: new Point(coordinate),
        });
        waypointFeature.setStyle(createWaypointStyle(index, coordinates.length));
        source.addFeature(waypointFeature);
      });
    }

    if (originCoordinate) {
      const originFeature = new Feature({
        geometry: new Point(originCoordinate),
      });
      originFeature.setStyle(createEndpointStyle('A', '#38bdf8'));
      source.addFeature(originFeature);
    }

    if (destinationCoordinate) {
      const destinationFeature = new Feature({
        geometry: new Point(destinationCoordinate),
      });
      destinationFeature.setStyle(createEndpointStyle('B', '#4ade80'));
      source.addFeature(destinationFeature);
    }

    const view = map.getView();

    if (fitCoordinates.length === 1) {
      view.setCenter(fitCoordinates[0]);
      view.setZoom(14);
    } else {
      const extent = source.getExtent();

      if (extent) {
        view.fit(extent, {
          padding: [48, 48, 48, 48],
          maxZoom: 15,
          duration: 250,
        });
      } else {
        view.setCenter(fitCoordinates[0]);
        view.setZoom(14);
      }
    }

    setState('ready');
  }, [coordinates, destinationCoordinate, originCoordinate, routeGeometryCoordinates, selectedRouteIndex]);

  const shouldShowEndpointList = Boolean(originPoint || destinationPoint);

  return (
    <section className={styles.card} aria-label="Map view">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Map view</p>
          <h2 className={styles.title}>Waypoint trail</h2>
        </div>
        <span className={styles.status}>CSDI Lands Department</span>
      </header>

      <div className={styles.canvasWrap}>
        <div ref={mapRef} className={styles.canvas} aria-hidden="true" />
        <div ref={overlayRef} className={styles.overlay} style={{ display: state === 'ready' ? 'none' : 'flex' }}>
          <p className={styles.overlayText}>{getOverlayMessage(state)}</p>
        </div>
        <a
          href={DISCLAIMER_URL}
          target="_blank"
          rel="noreferrer"
          className={styles.disclaimer}
        >
          © Map information from Lands Department
        </a>
        <img
          src={LANDSD_LOGO_URL}
          alt="LandsD logo"
          className={styles.logo}
        />
      </div>

      <div className={styles.list} aria-label="Waypoint list">
        {shouldShowEndpointList ? (
          <>
            {originPoint ? (
              <div className={styles.row}>
                <span className={styles.endpointBadge}>A</span>
                <div className={styles.rowContent}>
                  <span className={styles.rowLabel}>Origin</span>
                  <span className={styles.rowValue}>
                    {originPoint.lat.toFixed(6)}, {originPoint.lng.toFixed(6)}
                  </span>
                  <span className={styles.rowHint}>{originPoint.label}</span>
                </div>
              </div>
            ) : null}
            {destinationPoint ? (
              <div className={styles.row}>
                <span className={styles.endpointBadge}>B</span>
                <div className={styles.rowContent}>
                  <span className={styles.rowLabel}>Destination</span>
                  <span className={styles.rowValue}>
                    {destinationPoint.lat.toFixed(6)}, {destinationPoint.lng.toFixed(6)}
                  </span>
                  <span className={styles.rowHint}>{destinationPoint.label}</span>
                </div>
              </div>
            ) : null}
          </>
        ) : waypoints.length > 0 ? (
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
