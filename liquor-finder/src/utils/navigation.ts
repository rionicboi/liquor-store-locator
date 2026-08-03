export function getNavigationInstruction(rotation: number): string {
  const absoluteRotation = Math.abs(rotation);

  if (absoluteRotation <= 20) {
    return 'Straight Ahead';
  }

  if (absoluteRotation >= 135) {
    return 'Turn Around';
  }

  return rotation > 0 ? 'Turn Right' : 'Turn Left';
}

export function getDistanceStatus(distanceMeters: number): string {
  if (distanceMeters < 15) {
    return "\u{1F37B} You've arrived.";
  }

  if (distanceMeters <= 40) {
    return 'Almost there';
  }

  return `${Math.round(distanceMeters)} m away`;
}
