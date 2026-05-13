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
    osm_value?: string;
  };
  geometry: {
    coordinates: [number, number]; // [lon, lat]
  };
}

interface PhotonResponse {
  features: PhotonFeature[];
}

export async function searchAddressSuggestions(query: string, signal?: AbortSignal): Promise<AddressSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 1) {
    return [];
  }

  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=8&lat=22.3&lon=114.17`;
    const response = await fetch(url, { signal });
    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as PhotonResponse;
    const dedupe = new Set<string>();

    return data.features
      .filter(
        (feature) =>
          Boolean(feature.properties.name) &&
          Array.isArray(feature.geometry.coordinates) &&
          Number.isFinite(feature.geometry.coordinates[0]) &&
          Number.isFinite(feature.geometry.coordinates[1]),
      )
      .map((feature, index) => {
        const [longitude, latitude] = feature.geometry.coordinates;
        const name = feature.properties.name ?? 'Unknown';
        const suffix = feature.properties.city || feature.properties.street || '';
        const displayName = suffix && suffix !== name ? `${name}, ${suffix}` : name;

        return {
          id: `photon-${index}-${displayName}`,
          name,
          displayName,
          latitude,
          longitude,
          isDrivable: true,
        };
      })
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
