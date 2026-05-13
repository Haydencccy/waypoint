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
import { fromLonLat } from 'ol/proj';
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style';
import 'ol/ol.css';

import { waypointsToLatLng } from '../../utils/mapHelpers';
import type { Waypoint } from '../../types';
import { WaypointMarker } from '../WaypointMarker/WaypointMarker';
import styles from './MapView.module.css';

interface MapViewProps {
  waypoints: Waypoint[];
}

type MapLoadState = 'empty' | 'ready' | 'error';

const DEFAULT_CENTER = fromLonLat([114.1694, 22.3193]);
const BASE_MAP_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

function createRouteStyle() {
  return new Style({
    stroke: new Stroke({
      color: '#f59e0b',
      width: 4,
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

function getOverlayMessage(state: MapLoadState): string {
  switch (state) {
    case 'error':
      return 'The OpenLayers base map could not be created. Route data is still shown below.';
    case 'empty':
      return 'Submit a route to render the waypoints on the OpenLayers base map.';
    default:
      return 'Route rendered on the OpenLayers base map.';
  }
}

export function MapView({ waypoints }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const vectorSourceRef = useRef<VectorSource | null>(null);
  const [state, setState] = useState<MapLoadState>('empty');
  const coordinates = useMemo<Coordinate[]>(() => {
    return waypointsToLatLng(waypoints).map(({ lat, lng }) => fromLonLat([lng, lat]));
  }, [waypoints]);

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
        controls: defaultControls({ attribution: true, rotate: false, zoom: true }),
        layers: [baseLayer, new VectorLayer({ source: vectorSource })],
        view: new View({
          center: DEFAULT_CENTER,
          zoom: 12,
          minZoom: 3,
          maxZoom: 19,
        }),
      });

      mapInstanceRef.current = map;

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

    if (coordinates.length === 0) {
      setState('empty');
      return;
    }

    if (coordinates.length > 1) {
      const routeFeature = new Feature({
        geometry: new LineString(coordinates),
      });
      routeFeature.setStyle(createRouteStyle());
      source.addFeature(routeFeature);
    }

    coordinates.forEach((coordinate, index) => {
      const waypointFeature = new Feature({
        geometry: new Point(coordinate),
      });
      waypointFeature.setStyle(createWaypointStyle(index, coordinates.length));
      source.addFeature(waypointFeature);
    });

    const view = map.getView();

    if (coordinates.length === 1) {
      view.setCenter(coordinates[0]);
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
        view.setCenter(coordinates[0]);
        view.setZoom(14);
      }
    }

    setState('ready');
  }, [coordinates]);

  return (
    <section className={styles.card} aria-label="Map view">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Map view</p>
          <h2 className={styles.title}>Waypoint trail</h2>
        </div>
        <span className={styles.status}>OpenLayers</span>
      </header>

      <div className={styles.canvasWrap}>
        <div ref={mapRef} className={styles.canvas} aria-hidden="true" />
        <div ref={overlayRef} className={styles.overlay} style={{ display: state === 'ready' ? 'none' : 'flex' }}>
          <p className={styles.overlayText}>{getOverlayMessage(state)}</p>
        </div>
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
