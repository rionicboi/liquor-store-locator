# Liquor Compass

Liquor Compass is a React Native mobile application that helps users locate nearby liquor stores and navigate to a selected destination using live GPS and compass data.

The application combines the Google Places API with real-time location tracking and heading information to provide live directional guidance.

## Features

- Find nearby liquor stores using the Google Places API
- Display nearby stores with distance, rating and current open/closed status
- Select a destination from the search results
- Live compass navigation towards the selected store
- Real-time GPS tracking while moving
- Live distance updates using the Haversine formula
- Human-readable navigation instructions
  - Straight Ahead
  - Turn Left
  - Turn Right
  - Turn Around
- Arrival detection when approaching the destination
- Dark mode user interface

## Tech Stack

- React Native
- Expo
- TypeScript
- Google Places API
- Expo Location
- React Navigation

## How It Works

1. The application requests location permission.
2. The user's current GPS coordinates are obtained.
3. Nearby liquor stores are fetched using the Google Places API.
4. The user selects a destination.
5. The application continuously:
   - Tracks the user's GPS position
   - Tracks the device heading
   - Calculates the bearing to the destination
   - Rotates the compass indicator
   - Updates the remaining distance
   - Displays navigation instructions until arrival

## Project Structure

```
src/
├── api/
│   └── places.ts
├── utils/
│   ├── bearing.ts
│   ├── distance.ts
│   └── navigation.ts
```

## Running the Project

### Prerequisites

- Node.js
- Expo CLI
- Expo Go (Android)
- Google Maps Places API key

### Installation

```bash
git clone https://github.com/<your-username>/liquor-compass.git
cd liquor-compass

npm install
```

Create a `.env` file in the project root.

```env
GOOGLE_MAPS_API_KEY=YOUR_API_KEY
```

Start the development server.

```bash
npx expo start
```

Scan the QR code using Expo Go.

## Future Improvements

- Animated compass needle
- Multiple compass themes
- Route navigation using Google Directions API
- Store search and filtering
- Favorites
- Offline caching
- iOS support

## Disclaimer

Project is for education purposes. Drink responsibly.
Store information is provided through the Google Places API and may vary based on data availability and user location.
