import { EARTH_RADIUS_M } from './constants.js';
import { clamp, toRadians } from './angles.js';
import { bearing } from './bearing.js';
import type { LatLng, PathDistance } from './types.js';

/**
 * Great-circle (haversine) distance between two points, in metres.
 */
export function distance(a: LatLng, b: LatLng): number {
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const dLat = lat2 - lat1;
  const dLon = toRadians(b.lon - a.lon);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(clamp(h, 0, 1)));
}

/** Total length of a polyline, in metres. Fewer than two points is 0. */
export function pathLength(points: readonly LatLng[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += distance(points[i - 1], points[i]);
  }
  return total;
}

/**
 * Signed perpendicular distance from `p` to the great circle through `a` and
 * `b`, in metres. Negative means `p` lies to the left of the a->b heading,
 * positive means to the right.
 *
 * This measures against the infinite great circle, not the segment. Use
 * {@link distanceToSegment} when the endpoints should bound the result.
 */
export function crossTrackDistance(p: LatLng, a: LatLng, b: LatLng): number {
  const angular13 = distance(a, p) / EARTH_RADIUS_M;
  const theta13 = toRadians(bearing(a, p));
  const theta12 = toRadians(bearing(a, b));

  return Math.asin(clamp(Math.sin(angular13) * Math.sin(theta13 - theta12), -1, 1)) * EARTH_RADIUS_M;
}

/**
 * Signed distance from `a` to the point on the a->b great circle closest to
 * `p`, in metres. Negative means the closest point falls behind `a`.
 */
export function alongTrackDistance(p: LatLng, a: LatLng, b: LatLng): number {
  const angular13 = distance(a, p) / EARTH_RADIUS_M;
  const theta13 = toRadians(bearing(a, p));
  const theta12 = toRadians(bearing(a, b));
  const dxt = Math.asin(clamp(Math.sin(angular13) * Math.sin(theta13 - theta12), -1, 1));

  const magnitude =
    Math.acos(clamp(Math.cos(angular13) / Math.cos(dxt), -1, 1)) * EARTH_RADIUS_M;

  return Math.cos(theta13 - theta12) < 0 ? -magnitude : magnitude;
}

/**
 * Shortest distance from `p` to the segment a->b, in metres. When the
 * perpendicular foot falls outside the segment the result is the distance to
 * the nearer endpoint, so this never under-reports the way a bare cross-track
 * distance does.
 */
export function distanceToSegment(p: LatLng, a: LatLng, b: LatLng): number {
  const segmentLength = distance(a, b);
  if (segmentLength === 0) return distance(p, a);

  const along = alongTrackDistance(p, a, b);
  if (along <= 0) return distance(p, a);
  if (along >= segmentLength) return distance(p, b);

  return Math.abs(crossTrackDistance(p, a, b));
}

/**
 * Shortest distance from `p` to a polyline, plus the index of the segment that
 * produced it. Throws on an empty path.
 */
export function distanceToPath(p: LatLng, points: readonly LatLng[]): PathDistance {
  if (points.length === 0) {
    throw new RangeError('distanceToPath requires at least one point');
  }
  if (points.length === 1) {
    return { distance: distance(p, points[0]), index: 0 };
  }

  let best = Number.POSITIVE_INFINITY;
  let bestIndex = 0;
  for (let i = 1; i < points.length; i++) {
    const d = distanceToSegment(p, points[i - 1], points[i]);
    if (d < best) {
      best = d;
      bestIndex = i - 1;
    }
  }

  return { distance: best, index: bestIndex };
}
