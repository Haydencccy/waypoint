export interface AddressSuggestion {
  id: string;
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
  isDrivable: boolean;
}

export interface ResolvedAddressPoint {
  query: string;
  latitude: number;
  longitude: number;
  displayName: string;
}

interface PhotonFeature {
  properties: {
    name?: string;
    city?: string;
    street?: string;
    country?: string;
    countrycode?: string;
    osm_value?: string;
  };
  geometry: {
    coordinates: [number, number]; // [lon, lat]
  };
}

interface PhotonResponse {
  features: PhotonFeature[];
}

const HONG_KONG_CENTER = { lat: 22.3193, lng: 114.1694 };
const HONG_KONG_BBOX = '113.82,22.13,114.52,22.58';

function distanceScore(latitude: number, longitude: number): number {
  return Math.hypot(latitude - HONG_KONG_CENTER.lat, longitude - HONG_KONG_CENTER.lng);
}

function isHongKongFeature(feature: PhotonFeature): boolean {
  const country = feature.properties.country?.toLowerCase() ?? '';
  const countryCode = feature.properties.countrycode?.toLowerCase() ?? '';
  const city = feature.properties.city?.toLowerCase() ?? '';

  return (
    countryCode === 'hk' ||
    country.includes('hong kong') ||
    country.includes('hongkong') ||
    city.includes('hong kong') ||
    city.includes('hk')
  );
}

function mapPhotonFeature(feature: PhotonFeature, index: number): AddressSuggestion | null {
  if (
    !feature.properties.name ||
    !Array.isArray(feature.geometry.coordinates) ||
    !Number.isFinite(feature.geometry.coordinates[0]) ||
    !Number.isFinite(feature.geometry.coordinates[1])
  ) {
    return null;
  }

  const [longitude, latitude] = feature.geometry.coordinates;
  const name = feature.properties.name;
  const suffix = feature.properties.city || feature.properties.street || feature.properties.country || '';
  const displayName = suffix && suffix !== name ? `${name}, ${suffix}` : name;

  return {
    id: `photon-${index}-${displayName}`,
    name,
    displayName,
    latitude,
    longitude,
    isDrivable: true,
  };
}

async function fetchPhotonSuggestions(url: string, signal?: AbortSignal): Promise<PhotonFeature[]> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as PhotonResponse;
  return Array.isArray(data.features) ? data.features : [];
}

export async function searchAddressSuggestions(query: string, signal?: AbortSignal): Promise<AddressSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 1) {
    return [];
  }

  try {
    const boundedUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=12&bbox=${HONG_KONG_BBOX}`;
    const globalUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=6&lat=22.3&lon=114.17`;
    const boundedFeatures = await fetchPhotonSuggestions(boundedUrl, signal);
    const globalFeatures = boundedFeatures.length >= 6 ? [] : await fetchPhotonSuggestions(globalUrl, signal);
    const allFeatures = [...boundedFeatures, ...globalFeatures];
    const dedupe = new Set<string>();

    return allFeatures
      .map((feature, index) => ({ feature, option: mapPhotonFeature(feature, index) }))
      .filter((entry): entry is { feature: PhotonFeature; option: AddressSuggestion } => Boolean(entry.option))
      .sort((a, b) => {
        const aIsHk = isHongKongFeature(a.feature);
        const bIsHk = isHongKongFeature(b.feature);
        if (aIsHk !== bIsHk) {
          return aIsHk ? -1 : 1;
        }

        return distanceScore(a.option.latitude, a.option.longitude) - distanceScore(b.option.latitude, b.option.longitude);
      })
      .map((entry) => entry.option)
      .filter((item) => {
        const key = `${item.displayName.toLowerCase()}-${item.latitude.toFixed(5)}-${item.longitude.toFixed(5)}`;
        if (dedupe.has(key)) {
          return false;
        }

        dedupe.add(key);
        return true;
      })
      .slice(0, 6);
  } catch {
    return [];
  }
}

export async function resolveAddressPoint(query: string, signal?: AbortSignal): Promise<ResolvedAddressPoint | null> {
  const trimmed = query.trim();
  if (!trimmed) {
    return null;
  }

  const suggestions = await searchAddressSuggestions(trimmed, signal);
  const bestMatch = suggestions[0];
  if (!bestMatch) {
    return null;
  }

  return {
    query: trimmed,
    latitude: bestMatch.latitude,
    longitude: bestMatch.longitude,
    displayName: bestMatch.displayName,
  };
}

export async function reverseGeocodePoint(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<ResolvedAddressPoint | null> {
  try {
    const url = `https://photon.komoot.io/reverse?lon=${longitude}&lat=${latitude}`;
    const response = await fetch(url, { signal });
    if (response.ok) {
      const data = (await response.json()) as PhotonResponse;
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const name = feature.properties.name || feature.properties.street || feature.properties.city || 'Unknown';
        if (name !== 'Unknown') {
          return {
            query: name,
            latitude,
            longitude,
            displayName: name,
          };
        }
      }
    }
  } catch {
    return {
      query: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
      latitude,
      longitude,
      displayName: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
    };
  }

  return {
    query: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
    latitude,
    longitude,
    displayName: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
  };
}
