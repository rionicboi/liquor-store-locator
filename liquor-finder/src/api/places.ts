const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const SEARCH_RADIUS_METERS = 5000;
const MAX_RESULTS = 3;

type OverpassElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: {
    name?: string;
    brand?: string;
  };
};

type OverpassResponse = {
  elements: OverpassElement[];
};

export type LiquorStore = {
  id: string;
  name: string;
  distanceMeters: number;
};

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export async function fetchNearbyLiquorStores(
  coordinates: Coordinates
): Promise<LiquorStore[]> {
  const query = buildLiquorStoreQuery(coordinates);
  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error('Places request failed');
  }

  const data = (await response.json()) as OverpassResponse;

  return data.elements
    .map((element) => toLiquorStore(element, coordinates))
    .filter((store): store is LiquorStore => store !== null)
    .sort((firstStore, secondStore) => {
      return firstStore.distanceMeters - secondStore.distanceMeters;
    })
    .slice(0, MAX_RESULTS);
}

function buildLiquorStoreQuery({ latitude, longitude }: Coordinates) {
  return `
    [out:json][timeout:25];
    (
      node["shop"~"^(alcohol|wine|beverages)$"](around:${SEARCH_RADIUS_METERS},${latitude},${longitude});
      way["shop"~"^(alcohol|wine|beverages)$"](around:${SEARCH_RADIUS_METERS},${latitude},${longitude});
      relation["shop"~"^(alcohol|wine|beverages)$"](around:${SEARCH_RADIUS_METERS},${latitude},${longitude});
    );
    out center tags;
  `;
}

function toLiquorStore(
  element: OverpassElement,
  userCoordinates: Coordinates
): LiquorStore | null {
  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;

  if (latitude === undefined || longitude === undefined) {
    return null;
  }

  return {
    id: `${element.type}-${element.id}`,
    name: element.tags?.name ?? element.tags?.brand ?? 'Unnamed liquor store',
    distanceMeters: getDistanceMeters(userCoordinates, { latitude, longitude }),
  };
}

function getDistanceMeters(start: Coordinates, end: Coordinates) {
  const earthRadiusMeters = 6371000;
  const startLatitude = toRadians(start.latitude);
  const endLatitude = toRadians(end.latitude);
  const latitudeDifference = toRadians(end.latitude - start.latitude);
  const longitudeDifference = toRadians(end.longitude - start.longitude);

  const a =
    Math.sin(latitudeDifference / 2) * Math.sin(latitudeDifference / 2) +
    Math.cos(startLatitude) *
      Math.cos(endLatitude) *
      Math.sin(longitudeDifference / 2) *
      Math.sin(longitudeDifference / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMeters * c;
}

function toRadians(degrees: number) {
  return degrees * (Math.PI / 180);
}
