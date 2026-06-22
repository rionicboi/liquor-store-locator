import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function App() {
  const [locationMessage, setLocationMessage] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  async function handleGetLocation() {
    setIsLoadingLocation(true);
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

      setLocationMessage(
        `Location found: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
      );
    } catch {
      setLocationMessage('Unable to get your location right now.');
    } finally {
      setIsLoadingLocation(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Liquor Locator</Text>
      <Text style={styles.subtitle}>
        Finding the nearest bottle, one step at a time.
      </Text>
      <Pressable
        style={[styles.button, isLoadingLocation && styles.buttonDisabled]}
        onPress={handleGetLocation}
        disabled={isLoadingLocation}
      >
        <Text style={styles.buttonText}>
          {isLoadingLocation ? 'Getting Location...' : 'Get My Location'}
        </Text>
      </Pressable>
      {locationMessage ? (
        <Text style={styles.locationMessage}>{locationMessage}</Text>
      ) : null}
      <StatusBar style="auto" />
    </View>
  );
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
});
