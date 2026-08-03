import Constants from 'expo-constants';
import { calculateDistance, type Coordinates } from '../utils/distance';

export type { Coordinates } from '../utils/distance';

const GOOGLE_PLACES_URL = 'https://places.googleapis.com/v1/places:searchNearby';
const SEARCH_RADIUS_METERS = 5000;
const MAX_RESULTS = 3;

type GooglePlace = {
  id: string;
  rating?: number;
  userRatingCount?: number;
  displayName?: {
    text?: string;
  };
  currentOpeningHours?: {
    openNow?: boolean;
  };
  regularOpeningHours?: {
    openNow?: boolean;
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
  rating?: number;
  userRatingCount?: number;
  openNow?: boolean;
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
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.location,places.rating,places.userRatingCount,places.currentOpeningHours.openNow,places.regularOpeningHours.openNow',
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
    distanceMeters: calculateDistance(userCoordinates, place.location),
    rating: place.rating,
    userRatingCount: place.userRatingCount,
    openNow: place.currentOpeningHours?.openNow ?? place.regularOpeningHours?.openNow,
  };
}
