export interface AddressSuggestion {
  id: string;
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
}

interface NominatimResult {
  place_id: number;
  name?: string;
  display_name: string;
  lat: string;
  lon: string;
}

const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';

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

  return payload
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
}
