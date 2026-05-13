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

interface KnownPlace {
  id: string;
  aliases: string[];
  displayName: string;
  latitude: number;
  longitude: number;
  isDrivable: boolean;
}

const KNOWN_PLACES: KnownPlace[] = [
  {
    id: 'hkia-t1',
    aliases: ['hong kong international airport', 'airport', 'hkia', '香港國際機場', '機場'],
    displayName: 'Hong Kong International Airport',
    latitude: 22.308,
    longitude: 113.9185,
    isDrivable: true,
  },
  {
    id: 'hk-science-park',
    aliases: ['hong kong science park', 'science park', 'hk science park', '19w', '香港科學園', '科學園', '白石角'],
    displayName: '19W, Hong Kong Science Park',
    latitude: 22.4262,
    longitude: 114.2113,
    isDrivable: true,
  },
  {
    id: 'chai-wan-mtr',
    aliases: ['chai wan mtr', 'chai wan station', 'chai wan', '柴灣站', '港鐵柴灣', '柴灣'],
    displayName: 'Chai Wan MTR Station',
    latitude: 22.2646,
    longitude: 114.2379,
    isDrivable: true,
  },
  {
    id: 'central-pier',
    aliases: ['central pier', 'central ferry', 'pier', '中環碼頭', '中環'],
    displayName: 'Central Pier',
    latitude: 22.2869,
    longitude: 114.1552,
    isDrivable: false,
  },
  {
    id: 'tsim-sha-tsui-cultural',
    aliases: ['tsim sha tsui cultural centre', 'tst cultural centre', 'tst', '尖沙咀文化中心', '尖沙咀'],
    displayName: 'Tsim Sha Tsui Cultural Centre',
    latitude: 22.295,
    longitude: 114.1723,
    isDrivable: true,
  },
  {
    id: 'victoria-park',
    aliases: ['victoria park', 'victoria', 'park', '維多利亞公園', '維園'],
    displayName: 'Victoria Park',
    latitude: 22.2797,
    longitude: 114.1839,
    isDrivable: true,
  },
  {
    id: 'hong-kong-park',
    aliases: ['hong kong park', 'hk park', '香港公園', '公園'],
    displayName: 'Hong Kong Park',
    latitude: 22.2707,
    longitude: 114.1694,
    isDrivable: true,
  },
  {
    id: 'causeway-bay',
    aliases: ['causeway bay', 'causeway', '銅鑼灣'],
    displayName: 'Causeway Bay',
    latitude: 22.2793,
    longitude: 114.1842,
    isDrivable: true,
  },
  {
    id: 'mongkok',
    aliases: ['mong kok', 'mong', '旺角'],
    displayName: 'Mong Kok',
    latitude: 22.319,
    longitude: 114.1684,
    isDrivable: true,
  },
  {
    id: 'yau-ma-tei',
    aliases: ['yau ma tei', 'yau', 'ymt', '油麻地'],
    displayName: 'Yau Ma Tei',
    latitude: 22.3138,
    longitude: 114.1705,
    isDrivable: true,
  },
  {
    id: 'jordan',
    aliases: ['jordan', 'jordan mtr', '佐敦'],
    displayName: 'Jordan',
    latitude: 22.3118,
    longitude: 114.1728,
    isDrivable: true,
  },
  {
    id: 'sham-shui-po',
    aliases: ['sham shui po', 'ssp', '深水埗'],
    displayName: 'Sham Shui Po',
    latitude: 22.3308,
    longitude: 114.1633,
    isDrivable: true,
  },
  {
    id: 'tsuen-wan',
    aliases: ['tsuen wan', 'tsuen', '荃灣'],
    displayName: 'Tsuen Wan',
    latitude: 22.3077,
    longitude: 114.1142,
    isDrivable: true,
  },
  {
    id: 'wan-chai',
    aliases: ['wan chai', 'wan', '灣仔'],
    displayName: 'Wan Chai',
    latitude: 22.2788,
    longitude: 114.1729,
    isDrivable: true,
  },
  {
    id: 'sheung-wan',
    aliases: ['sheung wan', 'sheung', '上環'],
    displayName: 'Sheung Wan',
    latitude: 22.2858,
    longitude: 114.1498,
    isDrivable: true,
  },
  {
    id: 'central',
    aliases: ['central', 'central hk', '中環', '中'],
    displayName: 'Central',
    latitude: 22.2855,
    longitude: 114.1594,
    isDrivable: true,
  },
  {
    id: 'aberdeen',
    aliases: ['aberdeen', 'aberdeen hk', '香港仔', '香港'],
    displayName: 'Aberdeen',
    latitude: 22.2806,
    longitude: 114.1767,
    isDrivable: true,
  },
  {
    id: 'stanley',
    aliases: ['stanley', 'stanley beach', '赤柱', '赤'],
    displayName: 'Stanley',
    latitude: 22.2127,
    longitude: 114.2138,
    isDrivable: true,
  },
  {
    id: 'repulse-bay',
    aliases: ['repulse bay', 'repulse', '淺水灣'],
    displayName: 'Repulse Bay',
    latitude: 22.2336,
    longitude: 114.1796,
    isDrivable: true,
  },
  {
    id: 'sha-tin',
    aliases: ['sha tin', 'sha', '沙田'],
    displayName: 'Sha Tin',
    latitude: 22.3827,
    longitude: 114.1866,
    isDrivable: true,
  },
  {
    id: 'kowloon-tong',
    aliases: ['kowloon tong', 'kowloon', 'kt', '九龍塘'],
    displayName: 'Kowloon Tong',
    latitude: 22.3348,
    longitude: 114.1816,
    isDrivable: true,
  },
  {
    id: 'ap-lei-chau',
    aliases: ['ap lei chau', 'ap lei', '鴨脷洲'],
    displayName: 'Ap Lei Chau',
    latitude: 22.271,
    longitude: 114.1625,
    isDrivable: true,
  },
  {
    id: 'quarry-bay',
    aliases: ['quarry bay', 'quarry', '鰂魚涌'],
    displayName: 'Quarry Bay',
    latitude: 22.3033,
    longitude: 114.216,
    isDrivable: true,
  },
  {
    id: 'fortress-hill',
    aliases: ['fortress hill', 'fortress', '堡壘山', '銅鑼灣'],
    displayName: 'Fortress Hill',
    latitude: 22.2818,
    longitude: 114.1857,
    isDrivable: true,
  },
  {
    id: 'kennedy-town',
    aliases: ['kennedy town', 'kennedy', '堅尼地城'],
    displayName: 'Kennedy Town',
    latitude: 22.2887,
    longitude: 114.1369,
    isDrivable: true,
  },
  {
    id: 'sai-wan-ho',
    aliases: ['sai wan ho', 'sai', '西灣河'],
    displayName: 'Sai Wan Ho',
    latitude: 22.2946,
    longitude: 114.2071,
    isDrivable: true,
  },
  {
    id: 'heng-fa-chuen',
    aliases: ['heng fa chuen', 'heng', '杏花邨'],
    displayName: 'Heng Fa Chuen',
    latitude: 22.2957,
    longitude: 114.2209,
    isDrivable: true,
  },
  {
    id: 'tseung-kwan-o',
    aliases: ['tseung kwan o', 'tseung', 'tko', '將軍澳'],
    displayName: 'Tseung Kwan O',
    latitude: 22.3016,
    longitude: 114.2646,
    isDrivable: true,
  },
  {
    id: 'sai-kung',
    aliases: ['sai kung', 'sai', '西貢'],
    displayName: 'Sai Kung',
    latitude: 22.3863,
    longitude: 114.2753,
    isDrivable: true,
  },
  {
    id: 'lam-tin',
    aliases: ['lam tin', 'lam', '藍田'],
    displayName: 'Lam Tin',
    latitude: 22.2957,
    longitude: 114.2254,
    isDrivable: true,
  },
  {
    id: 'po-lam',
    aliases: ['po lam', 'po', '寶琳'],
    displayName: 'Po Lam',
    latitude: 22.3032,
    longitude: 114.2592,
    isDrivable: true,
  },
  {
    id: 'disneyland',
    aliases: ['disneyland', 'disney land', 'disney', '迪士尼', '迪士尼樂園'],
    displayName: 'Hong Kong Disneyland',
    latitude: 22.3135,
    longitude: 114.0425,
    isDrivable: true,
  },
  {
    id: 'ocean-park',
    aliases: ['ocean park', 'ocean', '海洋公園', '海洋'],
    displayName: 'Ocean Park Hong Kong',
    latitude: 22.2474,
    longitude: 114.1789,
    isDrivable: true,
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
    isDrivable: matched.isDrivable,
  };
}

function buildLooseMatches(query: string): AddressSuggestion[] {
  const normalized = normalizeQuery(query);
  if (!normalized) {
    return [];
  }

  const uniqueById = new Set<string>();

  const matches = KNOWN_PLACES.filter((place) => place.aliases.some((alias) => normalized.includes(alias)))
    .map((place) => ({
      id: place.id,
      name: place.displayName.split(',')[0],
      displayName: place.displayName,
      latitude: place.latitude,
      longitude: place.longitude,
      isDrivable: place.isDrivable,
    }))
    .filter((item) => {
      if (uniqueById.has(item.id)) {
        return false;
      }

      uniqueById.add(item.id);
      return true;
    });

  // Sort with drivable destinations first
  return matches.sort((a, b) => {
    if (a.isDrivable === b.isDrivable) {
      return 0;
    }
    return a.isDrivable ? -1 : 1;
  });
}

// Photon API Types
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

  const knownPlace = resolveKnownPlace(trimmed);
  const looseMatches = buildLooseMatches(trimmed);
  let localResults: AddressSuggestion[] = [];

  if (knownPlace) {
    const filteredMatches = looseMatches.filter((item) => item.id !== knownPlace.id);
    localResults = knownPlace.isDrivable
      ? [knownPlace, ...filteredMatches]
      : [...filteredMatches.filter((m) => m.isDrivable), knownPlace, ...filteredMatches.filter((m) => !m.isDrivable)];
  } else {
    localResults = looseMatches;
  }

  // Fetch from Photon API for fallback / additional results
  try {
    // Biased towards Hong Kong using lat/lon
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=5&lat=22.3&lon=114.17`;
    const response = await fetch(url, { signal });
    if (response.ok) {
      const data = (await response.json()) as PhotonResponse;
      const remoteResults: AddressSuggestion[] = data.features
        .filter((f) => f.properties.name && f.geometry.coordinates)
        .map((f, i) => {
          const lat = f.geometry.coordinates[1];
          const lon = f.geometry.coordinates[0];
          const name = f.properties.name!;
          const suffix = f.properties.city || f.properties.street || '';
          const displayName = suffix && suffix !== name ? `${name}, ${suffix}` : name;
          
          return {
            id: `photon-${i}-${Date.now()}`,
            name,
            displayName,
            latitude: lat,
            longitude: lon,
            isDrivable: true, // Optimistically allow driving for arbitrary external locations
          };
        });

      // Merge avoiding duplicate names
      const existingNames = new Set(localResults.map((r) => r.name.toLowerCase()));
      for (const remote of remoteResults) {
        if (!existingNames.has(remote.name.toLowerCase())) {
          localResults.push(remote);
          existingNames.add(remote.name.toLowerCase());
        }
      }
    }
  } catch (error) {
    // Silently continue if Photon API fails (use local matches)
    console.warn('Photon API fetch failed:', error);
  }

  return localResults.slice(0, 6);
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

  if (nearestPlace && Math.hypot(nearestPlace.latitude - latitude, nearestPlace.longitude - longitude) <= 0.01) {
    return {
      query: nearestPlace.displayName,
      latitude: nearestPlace.latitude,
      longitude: nearestPlace.longitude,
      displayName: nearestPlace.displayName,
    };
  }

  // Fallback to Photon for Reverse Geocoding
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
  } catch (error) {
    console.warn('Photon reverse geocode failed:', error);
  }

  return {
    query: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
    latitude,
    longitude,
    displayName: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
  };
}
