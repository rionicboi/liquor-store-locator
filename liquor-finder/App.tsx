import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
    <View style={styles.container}>
      <Text style={styles.title}>Liquor Locator</Text>
      <Text style={styles.subtitle}>
        Finding the nearest bottle, one step at a time.
      </Text>
      <Pressable
        style={[styles.button, isLoadingStores && styles.buttonDisabled]}
        onPress={handleGetLocation}
        disabled={isLoadingStores}
      >
        <Text style={styles.buttonText}>
          {isLoadingStores ? 'Searching...' : 'Get My Location'}
        </Text>
      </Pressable>
      {locationMessage ? (
        <Text style={styles.locationMessage}>{locationMessage}</Text>
      ) : null}
      {stores.length ? (
        <View style={styles.storeList}>
          {stores.map((store) => (
            <View key={store.id} style={styles.storeItem}>
              <Text style={styles.storeName}>{store.name}</Text>
              <Text style={styles.storeDistance}>
                {formatDistance(store.distanceMeters)} away
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      <StatusBar style="auto" />
    </View>
  );
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
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1f2933',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 12,
    fontSize: 16,
    color: '#52606d',
    textAlign: 'center',
  },
  button: {
    marginTop: 24,
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: '#93c5fd',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  locationMessage: {
    marginTop: 16,
    fontSize: 14,
    color: '#334e68',
    textAlign: 'center',
  },
  storeList: {
    marginTop: 20,
    width: '100%',
    gap: 12,
  },
  storeItem: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#d9e2ec',
    borderRadius: 8,
    padding: 12,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#102a43',
    textAlign: 'center',
  },
  storeDistance: {
    marginTop: 4,
    fontSize: 14,
    color: '#627d98',
    textAlign: 'center',
  },
});
