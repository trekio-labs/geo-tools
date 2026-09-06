import { DEG_TO_RAD, RAD_TO_DEG } from './constants.js';

export function toRadians(degrees: number): number {
  return degrees * DEG_TO_RAD;
}

export function toDegrees(radians: number): number {
  return radians * RAD_TO_DEG;
}

/** Wraps a bearing into the 0..360 range. */
export function normalizeBearing(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

/** Wraps a longitude into the -180..180 range. */
export function normalizeLongitude(degrees: number): number {
  return ((((degrees + 180) % 360) + 360) % 360) - 180;
}

/** Keeps a value inside [min, max]. Guards asin/acos against domain errors. */
export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
