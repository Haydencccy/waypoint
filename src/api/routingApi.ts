export interface RouteGeometryPoint {
  lat: number;
  lng: number;
}

interface OsrmRouteResponse {
  code: string;
  routes?: Array<{
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
  });

  return `https://router.project-osrm.org/route/v1/driving/${coordinates}?${params.toString()}`;
}

export async function fetchRouteGeometry(
  origin: RouteGeometryPoint,
  destination: RouteGeometryPoint,
  signal?: AbortSignal,
): Promise<RouteGeometryPoint[] | null> {
  const response = await fetch(buildOsrmUrl(origin, destination), {
    method: 'GET',
    signal,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as OsrmRouteResponse;
  if (payload.code !== 'Ok') {
    return null;
  }

  const coordinates = payload.routes?.[0]?.geometry?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return null;
  }

  return coordinates
    .map(([lng, lat]) => ({ lat, lng }))
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));
}
