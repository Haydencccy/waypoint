import type { Waypoint } from '../types';

export interface LatLngLiteral {
  lat: number;
  lng: number;
}

export function waypointToLatLng([latitude, longitude]: Waypoint): LatLngLiteral {
  return {
    lat: Number.parseFloat(latitude),
    lng: Number.parseFloat(longitude),
  };
}

export function waypointsToLatLng(waypoints: Waypoint[]): LatLngLiteral[] {
  return waypoints
    .map(waypointToLatLng)
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
}

export function formatMetric(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}
