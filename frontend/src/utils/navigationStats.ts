import { RideLocation, RideRoute } from "../contexts/RideContext";

export interface NavigationStats {
  speedKmh: number;
  distanceKm: number;
  distanceTotalKm: number;
  distanceTraveledKm: number;
  distanceRemainingKm: number;
  elapsedSeconds: number;
  elapsedFormatted: string;
  remainingSeconds: number | null;
  remainingFormatted: string;
  eta: string | null;
  progress: number; // 0-100
}

const EARTH_RADIUS_METERS = 6371000;

/**
 * Calculate haversine distance between two coordinates in kilometers
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceMeters = EARTH_RADIUS_METERS * c;

  return distanceMeters / 1000; // Convert to km
}

/**
 * Decode Google Maps polyline string to coordinate array
 */
export function decodePolyline(
  encoded: string
): Array<{ latitude: number; longitude: number }> {
  const points: Array<{ latitude: number; longitude: number }> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dLat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dLng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return points;
}

/**
 * Calculate total distance of polyline route in kilometers
 */
export function calculateRouteDistance(
  polyline: Array<{ latitude: number; longitude: number }>
): number {
  if (polyline.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 0; i < polyline.length - 1; i++) {
    const current = polyline[i];
    const next = polyline[i + 1];

    totalDistance += haversineDistance(
      current.latitude,
      current.longitude,
      next.latitude,
      next.longitude
    );
  }

  return totalDistance;
}

/**
 * Find closest point on polyline to current location
 */
export function findClosestPointOnRoute(
  userLat: number,
  userLon: number,
  polyline: Array<{ latitude: number; longitude: number }>
): { point: { latitude: number; longitude: number }; index: number } | null {
  if (polyline.length === 0) return null;

  let minDistance = Infinity;
  let closestPoint = polyline[0];
  let closestIndex = 0;

  for (let i = 0; i < polyline.length; i++) {
    const point = polyline[i];
    const distance = haversineDistance(
      userLat,
      userLon,
      point.latitude,
      point.longitude
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = point;
      closestIndex = i;
    }
  }

  return { point: closestPoint, index: closestIndex };
}

/**
 * Calculate distance traveled from start of route to closest point
 */
export function calculateDistanceTraveled(
  userLat: number,
  userLon: number,
  polyline: Array<{ latitude: number; longitude: number }>
): number {
  const closest = findClosestPointOnRoute(userLat, userLon, polyline);
  if (!closest) return 0;

  let distance = 0;
  for (let i = 0; i < closest.index; i++) {
    const current = polyline[i];
    const next = polyline[i + 1];
    distance += haversineDistance(
      current.latitude,
      current.longitude,
      next.latitude,
      next.longitude
    );
  }

  // Add distance from last waypoint to current position
  const lastPoint = polyline[closest.index];
  distance += haversineDistance(
    lastPoint.latitude,
    lastPoint.longitude,
    userLat,
    userLon
  );

  return distance;
}

/**
 * Format seconds to HH:MM or MM:SS format
 */
export function formatTime(seconds: number): string {
  const totalSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

/**
 * Calculate ETA based on average speed and remaining distance
 */
export function calculateETA(
  currentTime: Date,
  remainingDistanceKm: number,
  averageSpeedKmh: number
): string | null {
  if (averageSpeedKmh <= 0) return null;

  const remainingSeconds = (remainingDistanceKm / averageSpeedKmh) * 3600;
  const etaTime = new Date(currentTime.getTime() + remainingSeconds * 1000);

  const hours = String(etaTime.getHours()).padStart(2, "0");
  const minutes = String(etaTime.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

/**
 * Get current speed from ride locations (latest reported speed)
 */
export function getCurrentSpeed(locations: RideLocation[]): number {
  if (locations.length === 0) return 0;

  // Get the most recent location with valid speed
  for (let i = locations.length - 1; i >= 0; i--) {
    const location = locations[i];
    if (location.deviceSpeedKmh !== null && location.deviceSpeedKmh !== undefined) {
      return Math.max(0, location.deviceSpeedKmh);
    }
    if (location.speed !== null && location.speed !== undefined) {
      return Math.max(0, location.speed * 3.6); // Convert m/s to km/h
    }
  }

  return 0;
}

/**
 * Calculate average speed from multiple locations
 */
export function calculateAverageSpeed(locations: RideLocation[]): number {
  if (locations.length < 2) return 0;

  const validSpeeds = locations
    .map((loc) => loc.deviceSpeedKmh ?? (loc.speed ? loc.speed * 3.6 : null))
    .filter((speed): speed is number => speed !== null && speed >= 0);

  if (validSpeeds.length === 0) return 0;

  const sum = validSpeeds.reduce((a, b) => a + b, 0);
  return sum / validSpeeds.length;
}

/**
 * Calculate complete navigation stats
 */
export function calculateNavigationStats(
  userLocation: { latitude: number; longitude: number } | null,
  locations: RideLocation[],
  route: RideRoute,
  rideStartTime: number
): NavigationStats {
  const now = new Date();
  const elapsedSeconds = (now.getTime() - rideStartTime) / 1000;

  const speedKmh = getCurrentSpeed(locations);
  const averageSpeedKmh = calculateAverageSpeed(locations);

  // Calculate distances
  const totalRouteDist = calculateRouteDistance(route.routePolyline);
  let distanceTraveledKm = 0;

  if (userLocation) {
    distanceTraveledKm = calculateDistanceTraveled(
      userLocation.latitude,
      userLocation.longitude,
      route.routePolyline
    );
  }

  const distanceRemainingKm = Math.max(0, totalRouteDist - distanceTraveledKm);
  const progress = totalRouteDist > 0 ? (distanceTraveledKm / totalRouteDist) * 100 : 0;

  // Calculate remaining time and ETA
  const avgSpeed = averageSpeedKmh > 0 ? averageSpeedKmh : speedKmh > 0 ? speedKmh : 10; // Default 10 km/h
  const remainingSeconds = distanceRemainingKm > 0 ? (distanceRemainingKm / avgSpeed) * 3600 : null;
  const eta = calculateETA(now, distanceRemainingKm, avgSpeed);

  return {
    speedKmh: Math.round(speedKmh * 10) / 10, // Round to 1 decimal
    distanceKm: Math.round(distanceTraveledKm * 100) / 100,
    distanceTotalKm: Math.round(totalRouteDist * 100) / 100,
    distanceTraveledKm: Math.round(distanceTraveledKm * 100) / 100,
    distanceRemainingKm: Math.round(distanceRemainingKm * 100) / 100,
    elapsedSeconds: Math.round(elapsedSeconds),
    elapsedFormatted: formatTime(elapsedSeconds),
    remainingSeconds: remainingSeconds ? Math.round(remainingSeconds) : null,
    remainingFormatted: remainingSeconds ? formatTime(remainingSeconds) : "—",
    eta,
    progress: Math.min(100, Math.max(0, progress)),
  };
}
