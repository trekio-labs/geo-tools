import type { LatLng } from './types.js';

/**
 * Type guard for a usable coordinate. Rejects NaN, Infinity and out-of-range
 * values, which is what GPS payloads and hand-edited JSON actually produce.
 *
 * The math functions do not validate their inputs — checking on every call in
 * a hot loop is wasteful. Validate at the boundary where data enters instead.
 */
export function isValidLatLng(value: unknown): value is LatLng {
  if (typeof value !== 'object' || value === null) return false;

  const candidate = value as { lat?: unknown; lon?: unknown };
  const { lat, lon } = candidate;

  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}
