import type { RouteOption } from '../types';

export interface RouteGeometryPoint {
  lat: number;
  lng: number;
}

interface OsrmRouteResponse {
  code: string;
  routes?: Array<{
    distance?: number;
    duration?: number;
    geometry?: {
      coordinates?: [number, number][];
    };
  }>;
}

function buildOsrmUrl(origin: RouteGeometryPoint, destination: RouteGeometryPoint): string {
  const coordinates = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const params = new URLSearchParams({
    overview: 'full',
    geometries: 'geojson',
    alternatives: 'true',
  });

  return `https://router.project-osrm.org/route/v1/driving/${coordinates}?${params.toString()}`;
}

export async function fetchRouteOptions(
  origin: RouteGeometryPoint,
  destination: RouteGeometryPoint,
  signal?: AbortSignal,
): Promise<RouteOption[]> {
  const response = await fetch(buildOsrmUrl(origin, destination), {
    method: 'GET',
    signal,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as OsrmRouteResponse;
  if (payload.code !== 'Ok') {
    return [];
  }

  return (
    payload.routes
      ?.map((route) => {
        const coordinates = route.geometry?.coordinates;
        if (!Array.isArray(coordinates) || coordinates.length < 2) {
          return null;
        }

        const geometry = coordinates
          .map(([lng, lat]) => ({ lat, lng }))
          .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
        if (geometry.length < 2) {
          return null;
        }

        return {
          geometry,
          distanceMeters: typeof route.distance === 'number' ? route.distance : 0,
          durationSeconds: typeof route.duration === 'number' ? route.duration : 0,
        } satisfies RouteOption;
      })
      .filter((option): option is RouteOption => option !== null) ?? []
  );
}

export async function fetchRouteGeometry(
  origin: RouteGeometryPoint,
  destination: RouteGeometryPoint,
  signal?: AbortSignal,
): Promise<RouteGeometryPoint[] | null> {
  const options = await fetchRouteOptions(origin, destination, signal);
  return options[0]?.geometry ?? null;
}
