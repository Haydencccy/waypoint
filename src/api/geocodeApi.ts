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
    aliases: [
      'hong kong international airport',
      'hong kong international airport terminal 1',
      'hk airport terminal 1',
      'hkg terminal 1',
      'airport',
      'hkia',
      'terminal 1',
      '香港國際機場',
      '機場',
    ],
    displayName: 'Hong Kong International Airport',
    latitude: 22.308,
    longitude: 113.9185,
  },
  {
    id: 'hk-science-park',
    aliases: ['hong kong science park', 'science park', 'hk science park', '19w', '香港科學園', '科學園', '白石角', '雲滙'],
    displayName: '19W, Hong Kong Science Park',
    latitude: 22.4262,
    longitude: 114.2113,
  },
  {
    id: 'chai-wan-mtr',
    aliases: ['chai wan mtr station', 'chai wan station', 'chai wan', '柴灣站', '港鐵柴灣站', '柴灣'],
    displayName: 'Chai Wan MTR Station',
    latitude: 22.2646,
    longitude: 114.2379,
  },
  {
    id: 'tsim-sha-tsui-ferry',
    aliases: ['tsim sha tsui star ferry pier', 'star ferry pier', 'tsim sha tsui ferry', '天星碼頭', '尖沙咀天星碼頭'],
    displayName: 'Tsim Sha Tsui Star Ferry Pier',
    latitude: 22.2938,
    longitude: 114.1686,
  },
  {
    id: 'science-park-hkust',
    aliases: ['hong kong science park phase 1', 'science park phase 1'],
    displayName: 'Hong Kong Science Park',
    latitude: 22.4262,
    longitude: 114.2113,
  },
  {
    id: 'science-park-19w',
    aliases: ['19w hong kong science park', '19w science park'],
    displayName: '19W, Hong Kong Science Park',
    latitude: 22.4262,
    longitude: 114.2113,
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

function buildLooseMatches(query: string): AddressSuggestion[] {
  const normalized = normalizeQuery(query);
  if (!normalized) {
    return [];
  }

  const uniqueById = new Set<string>();

  return KNOWN_PLACES.filter((place) => place.aliases.some((alias) => normalized.includes(alias)))
    .map((place) => ({
      id: place.id,
      name: place.displayName.split(',')[0],
      displayName: place.displayName,
      latitude: place.latitude,
      longitude: place.longitude,
    }))
    .filter((item) => {
      if (uniqueById.has(item.id)) {
        return false;
      }

      uniqueById.add(item.id);
      return true;
    });
}

export async function searchAddressSuggestions(query: string, signal?: AbortSignal): Promise<AddressSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  void signal;

  const knownPlace = resolveKnownPlace(trimmed);
  const looseMatches = buildLooseMatches(trimmed);

  if (knownPlace) {
    const filteredMatches = looseMatches.filter((item) => item.id !== knownPlace.id);
    return [knownPlace, ...filteredMatches].slice(0, 6);
  }

  return looseMatches.slice(0, 6);
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
  void signal;

  const nearestPlace = KNOWN_PLACES.reduce<KnownPlace | null>((closest, current) => {
    if (!closest) {
      return current;
    }

    const currentDistance = Math.hypot(current.latitude - latitude, current.longitude - longitude);
    const closestDistance = Math.hypot(closest.latitude - latitude, closest.longitude - longitude);

    return currentDistance < closestDistance ? current : closest;
  }, null);

  if (nearestPlace && Math.hypot(nearestPlace.latitude - latitude, nearestPlace.longitude - longitude) <= 0.05) {
    return {
      query: nearestPlace.displayName,
      latitude: nearestPlace.latitude,
      longitude: nearestPlace.longitude,
      displayName: nearestPlace.displayName,
    };
  }

  return {
    query: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
    latitude,
    longitude,
    displayName: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
  };
}
