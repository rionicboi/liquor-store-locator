import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import {
  fetchNearbyLiquorStores,
  type Coordinates,
  type LiquorStore,
} from './src/api/places';
import { calculateBearing, calculateRotation } from './src/utils/bearing';
import { MaterialIcons } from "@expo/vector-icons";

type RootStackParamList = {
  Home: undefined;
  Navigation: {
    store: LiquorStore;
    userCoordinates: Coordinates;
  };
};

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
type NavigationScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Navigation'
>;

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#121212',
            },
            headerTintColor: '#FFFFFF',
            headerShadowVisible: false,
            contentStyle: {
              backgroundColor: '#121212',
            },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="Navigation"
            component={NavigationScreen}
            options={{
              title: 'Navigation',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

function HomeScreen({ navigation }: HomeScreenProps) {
  const [locationMessage, setLocationMessage] = useState('');
  const [isLoadingStores, setIsLoadingStores] = useState(false);
  const [stores, setStores] = useState<LiquorStore[]>([]);
  const [userCoordinates, setUserCoordinates] = useState<Coordinates | null>(
    null
  );

  async function handleGetLocation() {
    setIsLoadingStores(true);
    setStores([]);
    setUserCoordinates(null);
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
      const searchCoordinates: Coordinates = {
        latitude,
        longitude,
      };

      setLocationMessage('Searching for nearby liquor stores...');

      const nearbyStores = await fetchNearbyLiquorStores(searchCoordinates);

      setUserCoordinates(searchCoordinates);
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
                <Pressable
                  key={store.id}
                  style={styles.storeCard}
                  onPress={() => {
                    if (!userCoordinates) {
                      return;
                    }

                    navigation.navigate('Navigation', {
                      store,
                      userCoordinates,
                    });
                  }}
                >
                  <Text style={styles.storeName}>{store.name}</Text>

                  <View style={styles.storeMetaRow}>
                    <Text style={styles.storeMetaText}>
                      {formatRating(store)}
                    </Text>
                    <Text style={styles.storeMetaDivider}>{'\u2022'}</Text>
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
                </Pressable>
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
  );
}

function NavigationScreen({ route }: NavigationScreenProps) {
  const { store, userCoordinates } = route.params;
  const [heading, setHeading] = useState(0);
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    async function startHeading() {
      subscription = await Location.watchHeadingAsync((headingData) => {
        const currentHeading =
          headingData.trueHeading >= 0
            ? headingData.trueHeading
            : headingData.magHeading;

        setHeading(currentHeading);
      });
    }

    startHeading();

    return () => {
      subscription?.remove();
    };
  }, []);
  const bearing = calculateBearing(
    userCoordinates.latitude,
    userCoordinates.longitude,
    store.latitude,
    store.longitude
  );
  const rotation = calculateRotation(bearing, heading);

  return (
    <SafeAreaView
      style={styles.container}
      edges={['bottom', 'left', 'right']}
    >
      <View style={styles.navigationContent}>
        <View style={styles.navigationCard}>
          <Text style={styles.storeName}>{store.name}</Text>
          <Text style={styles.storeDistance}>
            {formatDistance(store.distanceMeters)} away
          </Text>

          <View style={styles.detailList}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Rating</Text>
              <Text style={styles.detailValue}>{formatRating(store)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={styles.detailValue}>
                {formatOpenStatus(store.openNow)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Coordinates</Text>
              <Text style={styles.detailValue}>
                {store.latitude.toFixed(5)}, {store.longitude.toFixed(5)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.compassSection}>
          <Text style={styles.compassTitle}>Compass Navigation</Text>
          <View style={styles.arrowContainer}>
              <MaterialIcons
                  name="navigation"
                  size={90}
                  color="#3B82F6"
                  style={{
                      transform: [{ rotate: `${rotation}deg` }],
                  }}
              />
          </View>
          <View style={styles.bearingBlock}>
            <Text style={styles.detailLabel}>Bearing</Text>
            <Text style={styles.bearingValue}>{Math.round(bearing)}°</Text>
          </View>
          <View style={styles.bearingBlock}>
            <Text style={styles.detailLabel}>Heading</Text>
            <Text style={styles.bearingValue}>{Math.round(heading)}°</Text>
          </View>
          <View style={styles.bearingBlock}>
            <Text style={styles.detailLabel}>Rotation</Text>
            <Text style={styles.bearingValue}>
              {Math.round(rotation)}°
            </Text>
          </View>
          <Text style={styles.compassPlaceholder}>
            Nav screen loaded
          </Text>
        </View>
      </View>
      <StatusBar style="light" />
    </SafeAreaView>
  );
}

function formatRating(store: LiquorStore) {
  if (store.rating === undefined) {
    return 'Rating unavailable';
  }

  return `\u2B50 ${store.rating.toFixed(1)}`;
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
  navigationContent: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 24,
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
  navigationCard: {
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
  detailList: {
    marginTop: 20,
    gap: 14,
  },
  detailRow: {
    gap: 4,
  },
  detailLabel: {
    color: '#B3B3B3',
    fontSize: 13,
  },
  detailValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  compassSection: {
    marginTop: 24,
    backgroundColor: '#1B1F2A',
    borderRadius: 14,
    padding: 20,
  },
  compassTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  bearingBlock: {
    marginTop: 18,
    gap: 4,
  },
  bearingValue: {
    color: '#3B82F6',
    fontSize: 32,
    fontWeight: '700',
  },
  compassPlaceholder: {
    marginTop: 18,
    color: '#B3B3B3',
    fontSize: 15,
    lineHeight: 22,
  },
  arrowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 140,
  },
});
