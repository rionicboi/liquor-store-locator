import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import {
  fetchNearbyLiquorStores,
  type LiquorStore,
} from './src/api/places';

export default function App() {
  const [locationMessage, setLocationMessage] = useState('');
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [stores, setStores] = useState<LiquorStore[]>([]);

  async function handleGetLocation() {
    setIsLoadingStores(true);
    setStores([]);
    setLocationMessage('Requesting location permission...');

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (permission.status !== 'granted') {
        setLocationMessage('Location permission was denied.');
        return;
      }

      setLocationMessage('Getting your current location...');

      const currentLocation = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = currentLocation.coords;

      setLocationMessage('Searching for nearby liquor stores...');

      const nearbyStores = await fetchNearbyLiquorStores({
        latitude,
        longitude,
      });

      setStores(nearbyStores);
      setLocationMessage(
        nearbyStores.length
          ? 'Nearest liquor stores found.'
          : 'No nearby liquor stores found.'
      );
    } catch (error) {
      console.error(error);
      setLocationMessage(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsLoadingStores(false);
    }
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Liquor Finder</Text>
            <Text style={styles.subtitle}>Find nearby liquor stores</Text>
          </View>

          <Pressable
            style={[styles.button, isLoadingStores && styles.buttonDisabled]}
            onPress={handleGetLocation}
            disabled={isLoadingStores}
          >
            <Text style={styles.buttonText}>
              {isLoadingStores ? 'Searching...' : 'Find Nearby Stores'}
            </Text>
          </Pressable>

          {locationMessage ? (
            <Text style={styles.locationMessage}>{locationMessage}</Text>
          ) : null}

          <View style={styles.resultsSection}>
            {stores.length ? (
              <View style={styles.storeList}>
                {stores.map((store) => (
                  <View key={store.id} style={styles.storeCard}>
                    <Text style={styles.storeName}>{store.name}</Text>

                    <View style={styles.storeMetaRow}>
                      <Text style={styles.storeMetaText}>
                        {formatRating(store)}
                      </Text>
                      <Text style={styles.storeMetaDivider}>•</Text>
                      <View style={styles.statusRow}>
                        {store.openNow === undefined ? null : (
                          <View
                            style={[
                              styles.statusDot,
                              store.openNow
                                ? styles.statusDotOpen
                                : styles.statusDotClosed,
                            ]}
                          />
                        )}
                        <Text style={styles.storeMetaText}>
                          {formatOpenStatus(store.openNow)}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.storeDistance}>
                      {formatDistance(store.distanceMeters)} away
                    </Text>
                  </View>
                ))}
              </View>
            ) : !locationMessage ? (
              <Text style={styles.placeholderText}>
                Search to see the nearest liquor stores.
              </Text>
            ) : null}
          </View>
        </View>
        <StatusBar style="light" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function formatRating(store: LiquorStore) {
  if (store.rating === undefined) {
    return 'Rating unavailable';
  }

  return `⭐ ${store.rating.toFixed(1)}`;
}

function formatOpenStatus(openNow: boolean | undefined) {
  if (openNow === undefined) {
    return 'Hours unavailable';
  }

  return openNow ? 'Open' : 'Closed';
}

function formatDistance(distanceMeters: number) {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m`;
  }

  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#B3B3B3',
    textAlign: 'center',
  },
  button: {
    width: '100%',
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 14,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  locationMessage: {
    marginTop: 16,
    fontSize: 14,
    color: '#B3B3B3',
    textAlign: 'center',
  },
  resultsSection: {
    marginTop: 28,
  },
  placeholderText: {
    color: '#B3B3B3',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  storeList: {
    width: '100%',
    gap: 14,
  },
  storeCard: {
    width: '100%',
    backgroundColor: '#1B1F2A',
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 3,
  },
  storeName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  storeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
  },
  storeMetaText: {
    color: '#B3B3B3',
    fontSize: 14,
  },
  storeMetaDivider: {
    color: '#3A3A3A',
    fontSize: 14,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusDotOpen: {
    backgroundColor: '#22C55E',
  },
  statusDotClosed: {
    backgroundColor: '#EF4444',
  },
  storeDistance: {
    marginTop: 14,
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
});
