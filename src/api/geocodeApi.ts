export interface AddressSuggestion {
  id: string;
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
}

export interface ResolvedAddressPoint {
  query: string;
  latitude: number;
  longitude: number;
  displayName: string;
}

interface NominatimResult {
  place_id: number;
  name?: string;
  display_name: string;
  lat: string;
  lon: string;
}

const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';

interface KnownPlace {
  id: string;
  aliases: string[];
  displayName: string;
  latitude: number;
  longitude: number;
}

const KNOWN_PLACES: KnownPlace[] = [
  {
    id: 'hkia-t1',
    aliases: ['hong kong international airport terminal 1', 'hk airport terminal 1', 'hkg terminal 1'],
    displayName: 'Hong Kong International Airport Terminal 1, Chek Lap Kok, Hong Kong',
    latitude: 22.308,
    longitude: 113.9185,
  },
  {
    id: 'hk-science-park',
    aliases: ['hong kong science park', 'science park', 'hk science park', '19w'],
    displayName: 'Hong Kong Science Park, Pak Shek Kok, New Territories, Hong Kong',
    latitude: 22.4262,
    longitude: 114.2113,
  },
  {
    id: 'chai-wan-mtr',
    aliases: ['chai wan mtr station', 'chai wan station', 'chai wan'],
    displayName: 'Chai Wan MTR Station, Chai Wan, Hong Kong',
    latitude: 22.2646,
    longitude: 114.2379,
  },
];

function normalizeQuery(value: string): string {
  return value.trim().toLowerCase();
}

function resolveKnownPlace(query: string): AddressSuggestion | null {
  const normalized = normalizeQuery(query);
  if (!normalized) {
    return null;
  }

  const matched = KNOWN_PLACES.find((place) => place.aliases.some((alias) => normalized.includes(alias)));
  if (!matched) {
    return null;
  }

  return {
    id: matched.id,
    name: matched.displayName.split(',')[0],
    displayName: matched.displayName,
    latitude: matched.latitude,
    longitude: matched.longitude,
  };
}

function buildSearchUrl(query: string): string {
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    addressdetails: '1',
    viewbox: '113.79,22.57,114.51,22.15',
    bounded: '0',
    limit: '6',
  });

  return `${NOMINATIM_SEARCH_URL}?${params.toString()}`;
}

export async function searchAddressSuggestions(query: string, signal?: AbortSignal): Promise<AddressSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const knownPlace = resolveKnownPlace(trimmed);

  const response = await fetch(buildSearchUrl(trimmed), {
    method: 'GET',
    signal,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Unable to fetch address suggestions');
  }

  const payload = (await response.json()) as NominatimResult[];
  if (!Array.isArray(payload)) {
    return [];
  }

  const uniqueByDisplayName = new Set<string>();

  const suggestions = payload
    .map((item) => ({
      id: String(item.place_id),
      name: item.name || item.display_name.split(',')[0] || item.display_name,
      displayName: item.display_name,
      latitude: Number.parseFloat(item.lat),
      longitude: Number.parseFloat(item.lon),
    }))
    .filter((item) => {
      if (!Number.isFinite(item.latitude) || !Number.isFinite(item.longitude)) {
        return false;
      }

      const dedupeKey = item.displayName.toLowerCase();
      if (uniqueByDisplayName.has(dedupeKey)) {
        return false;
      }

      uniqueByDisplayName.add(dedupeKey);
      return true;
    });

  if (!knownPlace) {
    return suggestions;
  }

  const withoutDuplicateKnownPlace = suggestions.filter(
    (item) => item.displayName.toLowerCase() !== knownPlace.displayName.toLowerCase(),
  );

  return [knownPlace, ...withoutDuplicateKnownPlace].slice(0, 6);
}

export async function resolveAddressPoint(query: string, signal?: AbortSignal): Promise<ResolvedAddressPoint | null> {
  const trimmed = query.trim();
  if (!trimmed) {
    return null;
  }

  const knownPlace = resolveKnownPlace(trimmed);
  if (knownPlace) {
    return {
      query: trimmed,
      latitude: knownPlace.latitude,
      longitude: knownPlace.longitude,
      displayName: knownPlace.displayName,
    };
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
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    format: 'jsonv2',
  });

  const response = await fetch(`${NOMINATIM_REVERSE_URL}?${params.toString()}`, {
    method: 'GET',
    signal,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { display_name?: string; lat?: string; lon?: string };
  if (!payload.display_name || typeof payload.lat !== 'string' || typeof payload.lon !== 'string') {
    return null;
  }

  return {
    query: payload.display_name,
    latitude: Number.parseFloat(payload.lat),
    longitude: Number.parseFloat(payload.lon),
    displayName: payload.display_name,
  };
}
