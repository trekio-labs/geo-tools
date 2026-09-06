import { EARTH_RADIUS_M } from './constants.js';
import { clamp, normalizeBearing, normalizeLongitude, toDegrees, toRadians } from './angles.js';
import type { LatLng } from './types.js';

/**
 * Initial bearing (forward azimuth) from `a` to `b`, in degrees clockwise from
 * true north, normalized to 0..360.
 *
 * On a sphere the bearing changes along a great circle, so this is the bearing
 * at the start of the path, not an average.
 */
export function bearing(a: LatLng, b: LatLng): number {
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const dLon = toRadians(b.lon - a.lon);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  return normalizeBearing(toDegrees(Math.atan2(y, x)));
}

/**
 * Final bearing when arriving at `b` from `a`, in degrees 0..360.
 */
export function finalBearing(a: LatLng, b: LatLng): number {
  return normalizeBearing(bearing(b, a) + 180);
}

/**
 * The point reached by travelling `distanceM` metres from `from` along a great
 * circle on the given initial `bearingDeg`.
 */
export function destination(from: LatLng, bearingDeg: number, distanceM: number): LatLng {
  const angular = distanceM / EARTH_RADIUS_M;
  const theta = toRadians(bearingDeg);
  const lat1 = toRadians(from.lat);
  const lon1 = toRadians(from.lon);

  const sinLat2 = clamp(
    Math.sin(lat1) * Math.cos(angular) + Math.cos(lat1) * Math.sin(angular) * Math.cos(theta),
    -1,
    1,
  );
  const lat2 = Math.asin(sinLat2);
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(theta) * Math.sin(angular) * Math.cos(lat1),
      Math.cos(angular) - Math.sin(lat1) * sinLat2,
    );

  return { lat: toDegrees(lat2), lon: normalizeLongitude(toDegrees(lon2)) };
}

/** Midpoint of the great-circle path between `a` and `b`. */
export function midpoint(a: LatLng, b: LatLng): LatLng {
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const lon1 = toRadians(a.lon);
  const dLon = toRadians(b.lon - a.lon);

  const bx = Math.cos(lat2) * Math.cos(dLon);
  const by = Math.cos(lat2) * Math.sin(dLon);

  const lat3 = Math.atan2(
    Math.sin(lat1) + Math.sin(lat2),
    Math.sqrt((Math.cos(lat1) + bx) * (Math.cos(lat1) + bx) + by * by),
  );
  const lon3 = lon1 + Math.atan2(by, Math.cos(lat1) + bx);

  return { lat: toDegrees(lat3), lon: normalizeLongitude(toDegrees(lon3)) };
}
