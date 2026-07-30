export function calculateBearing(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): number {
  const startLatRadians = toRadians(startLat);
  const endLatRadians = toRadians(endLat);
  const deltaLngRadians = toRadians(endLng - startLng);

  // Initial great-circle bearing, also called forward azimuth.
  const y = Math.sin(deltaLngRadians) * Math.cos(endLatRadians);
  const x =
    Math.cos(startLatRadians) * Math.sin(endLatRadians) -
    Math.sin(startLatRadians) *
      Math.cos(endLatRadians) *
      Math.cos(deltaLngRadians);

  const bearingDegrees = toDegrees(Math.atan2(y, x));

  // Normalize into 0 <= bearing < 360.
  return (bearingDegrees + 360) % 360;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}
