import { EARTH_RADIUS_M, RAD_TO_DEG } from './constants.js';
import { clamp, toRadians } from './angles.js';
import type { BoundingBox, LatLng } from './types.js';

/**
 * Smallest axis-aligned box containing every point. Throws on an empty list.
 *
 * The box does not wrap the antimeridian: a set of points straddling +/-180
 * produces a box spanning almost the whole globe rather than a narrow band.
 */
export function boundingBox(points: readonly LatLng[]): BoundingBox {
  if (points.length === 0) {
    throw new RangeError('boundingBox requires at least one point');
  }

  let minLat = Number.POSITIVE_INFINITY;
  let minLon = Number.POSITIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  let maxLon = Number.NEGATIVE_INFINITY;

  for (const point of points) {
    if (point.lat < minLat) minLat = point.lat;
    if (point.lat > maxLat) maxLat = point.lat;
    if (point.lon < minLon) minLon = point.lon;
    if (point.lon > maxLon) maxLon = point.lon;
  }

  return { minLat, minLon, maxLat, maxLon };
}

/** True when the point lies inside the box, edges included. */
export function bboxContains(box: BoundingBox, point: LatLng): boolean {
  return (
    point.lat >= box.minLat &&
    point.lat <= box.maxLat &&
    point.lon >= box.minLon &&
    point.lon <= box.maxLon
  );
}

/** True when the two boxes share any area, edges included. */
export function bboxIntersects(a: BoundingBox, b: BoundingBox): boolean {
  return (
    a.minLat <= b.maxLat && a.maxLat >= b.minLat && a.minLon <= b.maxLon && a.maxLon >= b.minLon
  );
}

/** Centre of the box. */
export function bboxCenter(box: BoundingBox): LatLng {
  return {
    lat: (box.minLat + box.maxLat) / 2,
    lon: (box.minLon + box.maxLon) / 2,
  };
}

/**
 * Grows the box by `metres` on every side.
 *
 * A degree of longitude shrinks towards the poles, so the longitude padding is
 * scaled at whichever box edge is nearest a pole: the result is at least as
 * wide as scaling at any latitude inside the box would give. Latitude is
 * clamped to +/-90 and longitude to +/-180.
 */
export function padBoundingBox(box: BoundingBox, metres: number): BoundingBox {
  if (!Number.isFinite(metres)) {
    throw new RangeError('padBoundingBox requires a finite distance');
  }

  const latPad = (metres / EARTH_RADIUS_M) * RAD_TO_DEG;
  const worstLat = Math.max(Math.abs(box.minLat), Math.abs(box.maxLat));
  const cosLat = Math.cos(toRadians(clamp(worstLat, -89.9, 89.9)));
  const lonPad = latPad / cosLat;

  return {
    minLat: clamp(box.minLat - latPad, -90, 90),
    maxLat: clamp(box.maxLat + latPad, -90, 90),
    minLon: clamp(box.minLon - lonPad, -180, 180),
    maxLon: clamp(box.maxLon + lonPad, -180, 180),
  };
}
