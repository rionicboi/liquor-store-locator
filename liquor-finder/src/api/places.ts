import Constants from 'expo-constants';

const GOOGLE_PLACES_URL = 'https://places.googleapis.com/v1/places:searchNearby';
const SEARCH_RADIUS_METERS = 5000;
const MAX_RESULTS = 3;

type GooglePlace = {
  id: string;
  displayName?: {
    text?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
};

type GooglePlacesResponse = {
  places?: GooglePlace[];
};

export type LiquorStore = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
};

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export async function fetchNearbyLiquorStores(
  coordinates: Coordinates
): Promise<LiquorStore[]> {
  const apiKey = getGoogleMapsApiKey();
  const response = await fetch(GOOGLE_PLACES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.location',
    },
    body: JSON.stringify({
      includedTypes: ['liquor_store'],
      maxResultCount: MAX_RESULTS,
      rankPreference: 'DISTANCE',
      locationRestriction: {
        circle: {
          center: coordinates,
          radius: SEARCH_RADIUS_METERS,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Places request failed');
  }

  const data = (await response.json()) as GooglePlacesResponse;

  return (data.places ?? [])
    .map((place) => toLiquorStore(place, coordinates))
    .filter((store): store is LiquorStore => store !== null)
    .sort((firstStore, secondStore) => {
      return firstStore.distanceMeters - secondStore.distanceMeters;
    })
    .slice(0, MAX_RESULTS);
}

function getGoogleMapsApiKey() {
  const apiKey = Constants.expoConfig?.extra?.googleMapsApiKey;

  if (typeof apiKey !== 'string' || !apiKey) {
    throw new Error('Missing Google Maps API key.');
  }

  return apiKey;
}

function toLiquorStore(
  place: GooglePlace,
  userCoordinates: Coordinates
): LiquorStore | null {
  if (!place.location) {
    return null;
  }

  return {
    id: place.id,
    name: place.displayName?.text ?? 'Unnamed liquor store',
    latitude: place.location.latitude,
    longitude: place.location.longitude,
    distanceMeters: getDistanceMeters(userCoordinates, place.location),
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
